# BDD3-LICTER — Zara Social Data Intelligence

> Automated COMEX-grade brand intelligence pipeline for Zara — transforming social signals into strategic decisions in under 2 minutes.

Built for the **Eugenia School × Licter — Social Data Intelligence 2026** hackathon.

---

## What this project does

A brand generates hundreds of signals every day: customer reviews, social mentions, competitive benchmarks, employer data. Most of it is noise.

This project ingests those signals, cleans them, runs them through AI analysis agents, and surfaces **5 actionable insights** that a COMEX member can read in 2 minutes — through an interactive dashboard and an auto-generated executive magazine.

**Brand assigned:** Zara (Inditex Group)
**Competitive benchmark:** H&M (and Inditex sister brands where relevant)

---

## Tech Stack

| Layer | Tool | Status |
|-------|------|--------|
| Historical data | Excel (3 tabs) | Imposed |
| Extraction | Apify | Imposed |
| Orchestration | **N8N** | **OBLIGATOIRE** |
| AI / Analysis | OpenAI API | Imposed |
| Storage | Supabase | Imposed |
| Dashboard | Antigravity | Imposed |
| Cleaning pipeline | Python (pandas) | Our choice |
| Magazine PDF | WeasyPrint / Puppeteer | Our choice |

---

## The Pipeline

```
[Excel 3 tabs] → [Apify] → [N8N] → [OpenAI API] → [Supabase] → [Antigravity]
  Historical    Extraction Orchestration  AI/Analyse  Storage    Dashboard
                              ↓
                         [Magazine PDF]
                          (5 pages, COMEX)
```

Every step runs unattended once N8N workflows are deployed — that's the J4 deliverable.

---

## Folder Structure

```
BDD3-LICTER/
├── README.md              ← You are here
├── CLAUDE.md              ← Project conventions for Claude Code
├── requirements.txt       ← Python dependencies
├── docs/
│   └── PRD.md             ← Product Requirements Document
├── roadmap.md             ← Phased delivery plan
├── requirements.md        ← Original hackathon brief
├── agents.md              ← Agent and workflow specs
├── cartographie.md        ← Data flow mapping
├── assets/                ← Images, diagrams, exports
├── data/                  ← Local data (gitignored)
└── src/
    └── zara/              ← Top-level Python package
        ├── scrapers/      ← Apify actor configs
        ├── cleaning/      ← Data cleaning pipeline
        ├── analysis/      ← OpenAI-powered analysis agents
        │   └── agents/    ← One agent per domain
        ├── database/      ← Supabase schema and migrations
        ├── workflows/     ← N8N workflow exports
        ├── dashboard/     ← Antigravity dashboard config
        ├── magazine/      ← Executive magazine generator
        └── config/        ← Shared config and .env templates
```

Each `src/zara/<module>/` folder has its own README explaining what's inside.

---

## Quick Start

### 1. Clone and set up Python

```bash
git clone <repo-url> BDD3-LICTER
cd BDD3-LICTER

python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

pip install -r requirements.txt
```

### 2. Configure secrets

```bash
cp src/zara/config/.env.example src/zara/config/.env
```

Then open `src/zara/config/.env` and fill in the values for:

| Variable | Where to find it |
|----------|------------------|
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| `SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `SUPABASE_KEY` | Supabase Dashboard → Settings → API → anon key |
| `SUPABASE_DB_URL` | Supabase Dashboard → Settings → Database → Connection string |
| `APIFY_TOKEN` | https://console.apify.com/account/integrations |
| `SLACK_WEBHOOK_URL` | (optional) Slack → Incoming Webhooks |

> The `.env` file is gitignored. Never commit it.

### 3. Apply the Supabase schema

```bash
psql "$SUPABASE_DB_URL" -f src/zara/database/schema.sql
```

(Or paste it into the Supabase SQL Editor.)

### 4. Run the pipeline locally

Run from the repo root with `src/` on `PYTHONPATH`:

```bash
export PYTHONPATH=src

# Cleaning
python -m zara.cleaning.pipeline --source all

# Analysis agents
python -m zara.analysis.agents.sentiment
python -m zara.analysis.agents.crisis
python -m zara.analysis.agents.product_health
python -m zara.analysis.agents.trends
python -m zara.analysis.agents.competitive
python -m zara.analysis.agents.comex_synthesizer
```

### 5. Boot N8N (orchestration — OBLIGATOIRE)

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

Open <http://localhost:5678> and import workflows from `src/zara/workflows/n8n/`.

---

## How to Run Each Module

| Module | Command | Purpose |
|--------|---------|---------|
| **scrapers** | Triggered by N8N → Apify | Extract new data from social sources |
| **cleaning** | `python -m zara.cleaning.pipeline --source all` | Normalise + deduplicate raw data |
| **analysis** | `python -m zara.analysis.agents.<name>` | Run a specific AI agent |
| **database** | `psql "$SUPABASE_DB_URL" -f src/zara/database/schema.sql` | Apply schema |
| **workflows** | Import JSON files into N8N UI | Schedule the autonomous pipeline |
| **dashboard** | Antigravity web app | Visualise live KPIs |
| **magazine** | (See `src/zara/magazine/README.md`) | Generate the 5-page COMEX PDF |

---

## Deliverables

The hackathon is graded on **5 weighted criteria**:

| Criterion | Weight |
|-----------|-------|
| Insight relevance | 30% |
| Pipeline technical mastery | 25% |
| Dashboard quality | 20% |
| Storytelling & recommendations | 15% |
| Magazine quality | 10% |

There are **4 final deliverables**:

1. **Cartographie du projet** — visual data flow schema (Miro / FigJam)
2. **Antigravity dashboard** — interactive, decision-first
3. **Magazine exécutif** — 5-page PDF for COMEX
4. **Pitch presentation** — defended in front of a 4-person jury

And **5 daily milestones** (J1 → J5):

| Day | Deliverable |
|-----|-------------|
| J1 | Roadmap & project setup |
| J2 | Data cartography (visual mapping) |
| J3 | Dashboard V1 |
| J4 | Loom video proving full automation |
| J5 | Final pitch & COMEX presentation |

See `docs/PRD.md` for full requirements and `roadmap.md` for the phased plan.

---

## Documentation

| Document | Purpose |
|----------|---------|
| `docs/PRD.md` | Full Product Requirements Document |
| `CLAUDE.md` | Project conventions and quick reference |
| `roadmap.md` | Phased delivery plan |
| `requirements.md` | Original hackathon brief from Eugenia × Licter |
| `agents.md` | Agent and workflow specifications |
| `cartographie.md` | Data flow mapping |
| `src/zara/<module>/README.md` | Module-level docs |

---

## Conventions

- Code in **Python** unless tool-specific (N8N JSON, Apify input.json)
- **PEP 8**, English commit messages, English code comments
- API keys live **only** in `src/zara/config/.env` (gitignored)
- Data files live **only** in `data/` (gitignored)
- Branches: `feature/<name>`, `fix/<name>`

---

## The Test That Matters

> "If a COMEX member only has 2 minutes, does the dashboard and the magazine let them make a decision?"

If the answer is no, we ship something else.

---

## Program

**Eugenia School × Licter — Social Data Intelligence 2026**
Hackathon-style project, evaluated by a jury of 4 industry professionals.
