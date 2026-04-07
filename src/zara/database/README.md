# src/zara/database/

Supabase schema definitions and migration files for BDD3-LICTER.

## Applying the Schema

### Via Supabase Dashboard (quickest)

1. Open your Supabase project → SQL Editor
2. Click **New query**
3. Paste the contents of `schema.sql`
4. Click **Run**

### Via psql CLI

```bash
psql "$SUPABASE_DB_URL" -f src/zara/database/schema.sql
```

`SUPABASE_DB_URL` is available in your Supabase project settings under
**Settings → Database → Connection string → URI**.

## Tables

| Table            | Written by                    | Read by                        |
|------------------|-------------------------------|--------------------------------|
| raw_reviews      | N8N (Apify actor output)      | zara.cleaning.pipeline         |
| raw_social       | N8N (Apify actor output)      | zara.cleaning.pipeline         |
| clean_data       | zara.cleaning.pipeline        | All analysis agents            |
| sentiment_scores | zara.analysis.agents.sentiment | product_health, comex, dashboard |
| product_health   | zara.analysis.agents.product_health | Antigravity dashboard    |
| trends           | zara.analysis.agents.trends   | Antigravity dashboard, COMEX   |
| alerts           | zara.analysis.agents.crisis   | N8N crisis monitor, dashboard  |
| kpis             | zara.analysis.agents.comex_synthesizer | Dashboard, magazine  |
| competitive      | zara.analysis.agents.competitive | Dashboard, COMEX            |

## Migrations

Future schema changes go in `migrations/` as numbered SQL files:
```
migrations/
├── 001_add_language_index.sql
├── 002_add_brand_column_clean_data.sql
└── ...
```

Apply in order:
```bash
for f in src/zara/database/migrations/*.sql; do psql "$SUPABASE_DB_URL" -f "$f"; done
```

## Key Design Decisions

- All primary keys are UUIDs generated server-side (`gen_random_uuid()`).
- `raw_reviews` and `raw_social` are append-only (never updated after insert).
- Deduplication uses `UNIQUE (source, external_id)` on raw and clean tables.
- `processed` flag on raw tables allows the cleaning pipeline to filter unprocessed rows.
- RLS (Row-Level Security) stubs are in `schema.sql` — enable before going to production.
