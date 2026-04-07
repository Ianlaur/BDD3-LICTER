# CLAUDE.md — BDD3-LICTER (Zara Social Data Intelligence)

## Project Overview

**Program:** Eugenia School × Licter — Social Data Intelligence 2026 (Hackathon/BDD)
**Company:** Zara (assigned by draw — each group works on a different brand from the provided dataset)
**Format:** Hackathon-style project over 5 days (J1–J5), evaluated by a jury of 4 professionals

## Central Problem

> "Une marque génère chaque jour des centaines de signaux : avis clients, mentions sociales, comparatifs concurrentiels. Comment les structurer, les analyser et les synthétiser pour qu'ils deviennent une arme stratégique pour ses décideurs ?"

Transform social data (reviews, social mentions, competitive benchmarks) into actionable business intelligence for a COMEX.

## Imposed Tech Stack (Pipeline)

```
Jeu de données (Excel) → Apify (extraction) → N8N (orchestration, OBLIGATOIRE) → OpenAI API (IA/analyse) → Supabase (base de données) → Antigravity (dashboard)
```

- **N8N** — OBLIGATOIRE for orchestration (chosen over Make)
- **Apify** — for continuous data extraction (scraping actors)
- **OpenAI API** — for AI/analysis
- **Supabase** — for database storage
- **Antigravity** — for dashboard
- **Initial dataset** — Excel file provided (3 tabs), use as base — do NOT spend 2 days scraping 10 years of history
- Free to add other tools on top of these

## Daily Deliverables (J1–J5)

| Day | Title | Format | Description |
|-----|-------|--------|-------------|
| J1 | Feuille de route | Gestion de projet | Chef de projet nomination, roadmap with tasks, daily objectives |
| J2 | Cartographie du projet (Mapping) | Schéma visuel (Miro, FigJam…) | Data journey schema: sources, extraction tools, storage |
| J3 | V1 du Dashboard | Dashboard interactif | First working version of the dashboard |
| J4 | Preuve d'automatisation | Vidéo Loom | Proof: content scraped, processed by automation, updated on Dashboard automatically |
| J5 | Pitch & Présentation COMEX | Soutenance finale | Strategic insights presentation to 4-professional jury |

## Final Deliverables (4)

1. **Cartographie du projet** — Schéma visuel (Miro/FigJam) — full data pipeline from extraction to storage
2. **Dashboard Antigravity** — Dashboard interactif — interactive dashboard with KPIs
3. **Magazine exécutif** — PDF (5 pages max) — autonomous visual document for Direction/COMEX
4. **Présentation PPT** — Support de soutenance — project defense, strategic insights, demo

## Evaluation Criteria

| Criteria | Weight |
|----------|--------|
| Pertinence des insights | 30% |
| Maîtrise technique du pipeline | 25% |
| Qualité du dashboard | 20% |
| Storytelling & recommandations | 15% |
| Qualité du magazine | 10% |

## Key Tips from Licter

- Don't scrape everything from scratch — Apify is only for automating NEW data flow
- Don't scrape blindly: 500 relevant reviews > 50,000 unfiltered
- No "Christmas tree" dashboard: every chart must answer a question
- Don't neglect the magazine: it's the "COMEX" deliverable
- Don't forget the Loom video: essential for technical validation
- Think "COMEX": insights must be actionable, not academic
- Automate first, beautify later: autonomous pipeline > pretty static dashboard
- Start from the Excel file: don't waste 2 days scraping 10 years of history
- Document your choices: why these KPIs? Why these sources?
- Goal: automate append of new data flows to existing base

## Cas Pratique

**BRAND & MARKET INTELLIGENCE** — Analyse 360° : Réputation, Concurrence et Expérience Client

Data sources: TikTok, Instagram, LinkedIn, Reddit, Trustpilot, Glassdoor, Google Reviews

## Repository Structure

```
BDD3-LICTER/
├── README.md              # Developer-facing project overview
├── CLAUDE.md              # This file
├── roadmap.md             # Project phases and timeline
├── requirements.md        # Full requirements spec
├── agents.md              # Agent definitions and workflows
├── cartographie.md        # Data flow mapping document
├── requirements.txt       # Python dependencies
├── docs/
│   └── PRD.md             # Product Requirements Document
├── assets/                # Images, diagrams, exports
├── data/                  # Local data (gitignored)
└── src/
    └── zara/              # Top-level Python package
        ├── __init__.py
        ├── scrapers/      # Apify configs + Python scrapers
        ├── cleaning/      # Data cleaning pipeline
        ├── analysis/      # AI analysis agents
        ├── database/      # Supabase schema and migrations
        ├── workflows/     # N8N workflow exports
        ├── dashboard/     # Antigravity dashboard config
        ├── magazine/      # Executive magazine generator
        └── config/        # Shared config and .env templates
```

## Conventions

- All code in Python unless tool-specific (N8N workflows, Apify actors)
- Follow PEP 8
- Never commit API keys — use `.env` (gitignored)
- Data files are gitignored
- Commit messages in English, concise
- Branch naming: `feature/<name>`, `fix/<name>`

## Important Reminders

- The company is **Zara** (Inditex Group)
- The Excel dataset (3 tabs) is the foundation — understand its structure first
- **N8N** is the chosen orchestration tool (mandatory requirement)
- The pipeline must be **autonomous**: scrape → clean → analyse → dashboard (no manual intervention)
- The magazine is for COMEX — 5 pages max, visual, actionable
- "Si un membre du COMEX n'a que 2 minutes, est-ce que mon dashboard et mon magazine lui permettent de prendre une décision ?"
