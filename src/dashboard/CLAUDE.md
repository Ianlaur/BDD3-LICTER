@AGENTS.md

# CLAUDE.md — `src/dashboard/`

This file gives Claude (and any other AI coding agent) the rules of engagement when editing the Zara Social Data Intelligence dashboard. The `@AGENTS.md` import above is required by Next.js 16 — it tells you to read the version-matched docs in `node_modules/next/dist/docs/` before writing any Next.js code, because the framework has breaking changes from your training data.

## What this app is

A Next.js 16 dashboard that visualises the output of the Zara analysis pipeline (`src/zara/` at the repo root). It is the **J3 deliverable** of the BDD3 × Licter hackathon: an interactive dashboard a COMEX member can read in 2 minutes to understand brand health, geographic signals, sentiment, trends, alerts, and competitive position.

The data the dashboard renders is produced by:
1. Scrapers (`src/zara/scrapers/`)
2. Cleaning (`src/zara/cleaning/`)
3. Analysis agents (`src/zara/analysis/agents/`)
4. Persisted into Postgres (Neon) via Prisma

## Tech stack

- **Next.js 16.2** App Router (Server Components by default)
- **React 19**
- **TypeScript** strict mode
- **Tailwind CSS v4** (PostCSS, no separate config file)
- **Prisma 7** + `@prisma/adapter-pg` against Neon Postgres
- **Recharts** for charts
- **d3-geo** + **topojson-client** for the world map (no react-simple-maps — peer-dep conflict with React 19)
- **lucide-react** for icons
- **date-fns** for date formatting

## Folder layout

```
src/dashboard/
├── prisma/
│   ├── schema.prisma          # 8 models: Store, Review, SentimentScore, …
│   └── seed.ts                # synthetic data for local dev
├── prisma.config.ts           # Prisma 7 config (DATABASE_URL lives here)
├── src/
│   ├── app/                   # App Router pages (each route = a page.tsx)
│   │   ├── layout.tsx         # Root layout, sidebar, fonts, dark mode
│   │   ├── page.tsx           # Overview (KPIs, sentiment, alerts, recent)
│   │   ├── map/page.tsx       # World map of stores
│   │   ├── stores/page.tsx    # Store ranking table
│   │   ├── sentiment/page.tsx # Sentiment deep-dive
│   │   ├── trends/page.tsx    # Topic trends over 8 weeks
│   │   ├── alerts/page.tsx    # Crisis alerts (open + resolved)
│   │   └── competitive/page.tsx
│   ├── components/
│   │   ├── sidebar.tsx        # Client component — uses usePathname
│   │   ├── kpi-tile.tsx       # KPI card primitive
│   │   ├── ui/                # Card, Badge — design-system primitives
│   │   └── charts/            # All chart components (all Client Components)
│   ├── lib/
│   │   ├── prisma.ts          # PrismaClient singleton (server-only)
│   │   ├── data.ts            # All DB query functions (cache-wrapped)
│   │   ├── utils.ts           # cn(), formatters
│   │   └── world-110m.json    # ~107 KB topojson world map
│   └── generated/prisma/      # Prisma client output (gitignored)
└── .env                       # DATABASE_URL, DIRECT_URL (gitignored)
```

## Running locally

```bash
# from src/dashboard/
npm install                    # already done
cp .env.example .env           # then edit with your real Neon URLs
npm run db:generate            # generate the Prisma client
npm run db:migrate             # create migrations and apply them
npm run db:seed                # populate ~20 stores + ~500 reviews
npm run dev                    # http://localhost:3000
```

The first thing to do in a fresh checkout is **edit `.env`** with the real Neon connection strings. Without them, the app will throw `DATABASE_URL is not set` on first request.

## Data access rules

- **Server Components are the default.** Pages are `async function`s that call helpers from `@/lib/data` and pass plain objects to Client Components for charts.
- **Never import `@/lib/prisma` from a Client Component.** It uses `import "server-only"` and will throw at build time if you try.
- **All DB queries live in `src/lib/data.ts`.** Wrap them in `cache()` from `react` so multiple Server Components in the same render pass deduplicate calls.
- **Client Components are only for interactivity.** Charts (recharts), the sidebar (uses `usePathname`), and anything with `onClick`/`useState` get `"use client"` at the top.
- **Pass serialisable data across the boundary.** Don't pass Date objects with methods, Prisma Decimal types, or class instances into Client Components — convert to plain numbers/strings/ISO strings on the server.

## Styling conventions

- Tailwind v4 — utility classes only, no separate stylesheet for components.
- Use the `cn()` helper from `@/lib/utils` to merge conditional classes.
- Dark mode is automatic via `prefers-color-scheme` and the `dark:` variants.
- Cards: `rounded-2xl border bg-white shadow-sm` (use the `<Card>` primitive).
- Typography: `tracking-tight` for headings, `text-neutral-600` for secondary text.
- Colors:
  - emerald-500 = positive
  - amber-500 = neutral
  - red-500 = negative
  - sky / blue = informational
- Don't add new fonts. The Geist family is already loaded in `layout.tsx`.

## Adding a new page

1. Create `src/app/<route>/page.tsx` as an `async function` Server Component.
2. Import data fetchers from `@/lib/data`. If you need a new query, add it there (always wrapped in `cache()`).
3. Compose `<Card>`, `<KpiTile>`, `<Badge>` from `@/components/ui` and `@/components/`.
4. Add the route to the `NAV` array in `src/components/sidebar.tsx`.
5. Run `npm run dev` and verify; the route will hot-reload.

## Adding a new model

1. Edit `prisma/schema.prisma` and add the model with explicit `@@index`es on filtered/joined columns.
2. Run `npm run db:migrate` (it will prompt for a migration name).
3. Add seed data in `prisma/seed.ts`.
4. Add a fetcher in `src/lib/data.ts` wrapped in `cache()`.
5. Build the page or chart that consumes it.

## Environment variables

| Var            | Required | Used by                     |
| -------------- | -------- | --------------------------- |
| `DATABASE_URL` | yes      | `lib/prisma.ts`, `prisma.config.ts`, seed |
| `DIRECT_URL`   | for migrations on Neon | `prisma.config.ts` (optional but recommended) |

`.env` is gitignored. Never commit it. Use `.env.example` as the template.

## Don'ts

- Don't reach for `react-simple-maps` — it doesn't support React 19. Use the existing `<StoreMap>` (d3-geo + topojson).
- Don't import the Prisma client from a Client Component, an Edge route, or middleware. Use a Server Component or a Route Handler.
- Don't make `fetch` calls in Server Components for data already in Postgres — query Prisma directly.
- Don't add a global state manager (Redux, Zustand) unless there's a Client-side feature that genuinely needs it. Server Components handle most of this.
- Don't hardcode the connection string anywhere. It only lives in `.env` / `process.env`.
- Don't bypass `cache()` in `src/lib/data.ts`. Skipping it will trigger duplicate DB queries on every render.
- Don't move `world-110m.json` into `public/`. It's imported as a JSON module so Webpack tree-shakes and inlines what's used.
- Don't commit the contents of `src/generated/prisma/` (already gitignored).

## When you're stuck

1. Read `node_modules/next/dist/docs/01-app/01-getting-started/` for the basics — Next.js 16 has breaking changes from your training data.
2. Run `npx tsc --noEmit` to see the real type errors before guessing.
3. The Prisma client is generated to `src/generated/prisma/client` — import types from there, not from `@prisma/client`.

## Stack deviation note

The original hackathon brief mandates **Antigravity** for the dashboard and **Supabase** for the database. We are using **Next.js + Neon + Prisma** instead. This is a deliberate trade-off (better DX, faster iteration, cleaner separation between data layer and UI) and the team owes the jury a one-slide justification at J5.
