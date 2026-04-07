# Product Requirements Document — Zara Social Data Intelligence

| Field | Value |
|-------|-------|
| **Project** | BDD3-LICTER — Zara Social Data Intelligence |
| **Program** | Eugenia School × Licter — Social Data Intelligence 2026 |
| **Brand assigned** | Zara (Inditex Group) |
| **Format** | 5-day hackathon (J1 → J5) |
| **Document version** | 1.0 |
| **Last updated** | 2026-04-01 |
| **Status** | Approved baseline |

---

## 1. Context & Problem Statement

### 1.1 Context

A modern brand generates hundreds of signals every day: customer reviews, social mentions, competitive benchmarks, employer signals, post-sale data. Most of this data is unstructured, multilingual, and scattered across a dozen platforms. Brand teams are drowning in dashboards and starving for insight.

For this hackathon, our team has been assigned **Zara**. We have 5 days to prove that a Data/Business Analyst armed with the right tools can extract gold-grade strategic insights from social data — and turn them into decisions a COMEX member can act on in 2 minutes.

### 1.2 Problem Statement

> "A brand generates hundreds of signals every day: customer reviews, social mentions, competitive benchmarks. How do we structure, analyse, and synthesise these signals so that they become a strategic weapon for its decision-makers?"

### 1.3 The 2-Minute Test

> "If a COMEX member only has 2 minutes, does my dashboard and my magazine allow them to make a decision?"

This is the single test that every product decision must pass.

---

## 2. Goals & Non-Goals

### 2.1 Goals

1. **Build an autonomous social data pipeline** that ingests, cleans, analyses, and visualises signals about Zara without manual intervention.
2. **Produce actionable, COMEX-grade insights** — not academic analysis.
3. **Benchmark Zara against H&M** (and Inditex sister brands where relevant) on every measured dimension.
4. **Deliver four polished artefacts**: cartography, dashboard, magazine, pitch presentation.
5. **Pass the 2-minute test** on both the dashboard and the magazine.

### 2.2 Non-Goals

- ❌ Scraping 10 years of historical data (the Excel dataset is the historical baseline; Apify is for new data only).
- ❌ Building a "Christmas tree" dashboard with 30 charts that answer no question.
- ❌ Reaching 50,000 unfiltered reviews when 500 high-relevance reviews is enough.
- ❌ Replacing the imposed tech stack with our own preferences.
- ❌ Shipping pretty static dashboards before the autonomous pipeline works.

---

## 3. Target Users & Personas

| Persona | Role | Needs | Decision they make |
|---------|------|-------|--------------------|
| **COMEX Member** | C-level (CEO, CMO, CCO) | A 2-minute briefing, top 3 risks, top 3 opportunities, clear recommendations | Greenlight strategic action, allocate budget, escalate crisis |
| **Brand Manager** | Marketing / Brand team | Real-time sentiment, crisis alerts, top complaints/praise | Adjust campaigns, brief PR, respond to customers |
| **Product Manager** | Merchandising | Per-category and per-product health scores, return signals | Re-stock, withdraw, redesign, reprice |
| **Data Analyst** | Internal BI team | Drill-down access, raw data exports, methodology notes | Dig deeper into anomalies, validate findings |
| **Jury (this hackathon)** | 4 industry professionals | Evidence of pipeline mastery, insight quality, storytelling | Score the project against 5 weighted criteria |

---

## 4. Scope

### 4.1 In Scope

| Area | Detail |
|------|--------|
| **Primary brand** | Zara (Inditex Group) |
| **Competitive benchmark** | H&M (mandatory), Mango, Uniqlo, Bershka, Pull&Bear (best-effort) |
| **Geographic scope** | Worldwide (no geographic filter at MVP) |
| **Languages** | English, French, Spanish (auto-detected, multi-language sentiment) |
| **Data window** | Excel historical baseline + last 30 days of fresh signals |
| **Sources** | Google Reviews, Trustpilot, Instagram, TikTok, Reddit, LinkedIn, Glassdoor |

### 4.2 Out of Scope (deferred / explicit non-goals)

- Mobile app or native client (web dashboard only)
- Real-time streaming below 30-minute granularity
- Customer-facing features (this is an internal tool)
- Multi-tenant or multi-brand UI (single-brand build for the hackathon)
- Historical scraping deeper than the provided Excel dataset

---

## 5. Functional Requirements

### 5.1 Pipeline Stages

```
[Excel 3 tabs] → [Apify] → [N8N] → [OpenAI API] → [Supabase] → [Antigravity]
  Historical    Extraction Orchestration AI/Analyse  Storage     Dashboard
```

| # | Stage | Tool (imposed) | Responsibility |
|---|-------|----------------|----------------|
| 1 | Historical baseline | Excel (3 tabs) | Seed dataset — load once, do not re-scrape |
| 2 | Extraction | Apify actors | Pull only new data on a schedule |
| 3 | Orchestration | **N8N (OBLIGATOIRE)** | Trigger every step, route data, handle errors |
| 4 | Cleaning | Python (in `src/zara/cleaning/`) | Deduplicate, normalise, language-detect |
| 5 | AI analysis | OpenAI API agents | Sentiment, crises, trends, product health, competitive |
| 6 | Storage | Supabase | Structured tables (raw + clean + analysed) |
| 7 | Visualisation | Antigravity | Interactive dashboard for daily use |
| 8 | Reporting | Magazine generator | Auto-built 5-page COMEX PDF |

### 5.2 Required Features

#### F1 — Continuous data extraction (Apify)
- 7 source-specific actors (Google Reviews, Trustpilot, Instagram, TikTok, Reddit, LinkedIn, Glassdoor)
- Configured for **new data only** (no historical re-scrapes)
- Scheduled and triggered by N8N — no human run buttons

#### F2 — Workflow orchestration (N8N — OBLIGATOIRE)
- WF-01: Daily scrape + clean (02:00 CET)
- WF-02: Sentiment / product / trend / competitive analysis chain
- WF-03: 30-minute crisis monitor
- WF-04: Weekly COMEX brief (Monday 07:00 CET)
- Error handling and Slack/email notifications

#### F3 — Cleaning pipeline
- Deduplicate by `(source, external_id)`
- Normalise text (encoding, HTML stripping, emoji handling)
- Detect language and tag records
- Standardise dates to UTC ISO
- Idempotent (safe to re-run)

#### F4 — AI analysis agents (OpenAI)
| Agent | Output | Frequency |
|-------|--------|-----------|
| Sentiment | `sentiment_scores` (label, score, confidence, themes) | After each scrape |
| Crisis detection | `alerts` (severity low → critical) | Every 30 minutes |
| Product health | `product_health` (PHS 0-100 per category) | Daily |
| Trend detection | `trends` (term, velocity, narrative) | Daily |
| Competitive benchmark | `competitive` (Zara vs competitors deltas) | Daily |
| COMEX synthesizer | `kpis` (5-bullet executive brief) | Weekly |

#### F5 — Supabase storage
- 9 tables: `raw_reviews`, `raw_social`, `clean_data`, `sentiment_scores`, `product_health`, `trends`, `alerts`, `kpis`, `competitive`
- UUIDs as primary keys, append-only raw tables
- RLS stubs ready for production

#### F6 — Antigravity dashboard
- 8 sections, each answering one specific business question:
  1. Sentiment Overview — *Is Zara's reputation improving or declining?*
  2. Crisis Radar — *Are there active reputation crises to act on?*
  3. Product Health — *Which product categories need attention?*
  4. Trend Radar — *What are customers talking about most this week?*
  5. Source Breakdown — *Where are negative signals coming from?*
  6. Competitive Position — *How does Zara compare to H&M, Mango, Uniqlo?*
  7. COMEX KPIs — *What are the top 5 actions for COMEX this week?*
  8. Volume Monitor — *Is the pipeline healthy and ingesting data?*
- Auto-refresh: 5 minutes for crisis radar, daily for analysis tables

#### F7 — Executive magazine (PDF, 5 pages max)
| Page | Title | Content |
|------|-------|---------|
| 1 | Executive Summary | 5-bullet brief from `kpis.executive_brief` + KPIs |
| 2 | Reputation & Sentiment | Trend chart, source breakdown, top themes |
| 3 | Alerts & Crises | Open alerts, severity, recommended actions |
| 4 | Product Health & Trends | Radar chart + trend word cloud |
| 5 | Competitive Positioning | Bar chart + recommendation |

#### F8 — Crisis alerts
- Severity levels: low (≥10% neg spike), medium (≥25% or viral post), high (≥50% or media), critical (sustained + trending)
- Slack / email dispatch via N8N
- Stored in `alerts` table with `resolved_at` lifecycle

---

## 6. Tech Stack & Constraints

### 6.1 Imposed Stack (non-negotiable)

| Layer | Tool | Imposed? |
|-------|------|----------|
| Historical data | Excel (3 tabs) | ✅ Yes |
| Extraction | Apify | ✅ Yes |
| Orchestration | **N8N** | ✅ **OBLIGATOIRE** (chosen over Make) |
| AI / Analysis | OpenAI API | ✅ Yes |
| Storage | Supabase | ✅ Yes |
| Dashboard | Antigravity | ✅ Yes |
| Other tools | Free choice | ⬜ Optional |

### 6.2 Stack Additions (our choices)

| Tool | Purpose | Justification |
|------|---------|---------------|
| Python (pandas, openpyxl) | Cleaning pipeline | Standard data tooling |
| python-dotenv | Local secrets | Standard practice |
| Slack webhooks | Crisis notifications | Free, fast |
| WeasyPrint / Puppeteer | Magazine PDF generation | Open-source PDF rendering |

### 6.3 Constraints

- **All API keys** live in `src/zara/config/.env` (gitignored). Never committed.
- **All data files** live in `data/` (gitignored).
- **Branch naming**: `feature/<name>`, `fix/<name>`.
- **Code style**: PEP 8, English commit messages, English code comments.
- **No manual intervention** in the daily pipeline once it is live (J4 deliverable).

---

## 7. Success Metrics

### 7.1 Jury Evaluation Criteria (the only metrics that matter for J5)

| Criterion | Weight | How we win it |
|-----------|--------|----------------|
| **Insight relevance** | 30% | Every chart and KPI answers a documented business question; magazine = 5 actionable takeaways |
| **Pipeline technical mastery** | 25% | Loom video shows fully autonomous flow Apify → N8N → OpenAI → Supabase → Antigravity |
| **Dashboard quality** | 20% | 8 focused sections, no vanity metrics, decision-first layout, mobile-readable |
| **Storytelling & recommendations** | 15% | Magazine and pitch deliver narrative, not data dump; 3 concrete recommendations per section |
| **Magazine quality** | 10% | 5 pages max, visual-first, COMEX-tone, autonomous PDF generation |

### 7.2 Internal Quality Gates (must pass before each daily delivery)

| Gate | Check |
|------|-------|
| 2-minute test | Can a non-technical reader of the magazine name 3 actions in 2 minutes? |
| Pipeline test | Does the J4 Loom video show an end-to-end run with no manual steps? |
| Insight test | Can every dashboard chart be traced back to a written business question? |
| Source test | Can we justify each source we kept and each we dropped? |

---

## 8. Data Sources & KPIs

### 8.1 Sources Kept (and why)

| Source | Why we kept it | Why a COMEX member cares |
|--------|----------------|--------------------------|
| Google Reviews | Per-store reputation, geographic granularity | Pinpoint underperforming stores |
| Trustpilot | Authoritative brand-level review hub | Single trust score over time |
| Instagram | Highest brand engagement channel for Zara | UGC, influencer alignment |
| TikTok | Where fashion virality starts | Early-warning trend signal |
| Reddit | Unfiltered, long-form opinions | Detect emerging crises before they hit press |
| LinkedIn | Employer brand and B2B perception | Talent and corporate reputation |
| Glassdoor | Employee sentiment | Internal culture risk |

### 8.2 KPIs (each tied to a business question)

| KPI | Question it answers | Source table |
|-----|---------------------|--------------|
| Average sentiment | Is reputation improving or declining? | `sentiment_scores` |
| Sentiment by source | Where is the negativity coming from? | `sentiment_scores` |
| Crisis count (open) | Are there active fires to put out? | `alerts` |
| Product Health Score | Which categories need attention? | `product_health` |
| Trend velocity | What's blowing up this week? | `trends` |
| Zara vs H&M delta | Are we leading or trailing? | `competitive` |
| Share of Voice | Are we more talked about than competitors? | `clean_data` aggregated |

---

## 9. Daily Milestones (J1 → J5)

| Day | Deliverable | Format | Owner | Acceptance criteria |
|-----|-------------|--------|-------|---------------------|
| **J1** | Roadmap & project setup | Project plan | Project Lead | Roadmap committed, tasks split, daily objectives written |
| **J2** | Data cartography | Visual schema (Miro / FigJam) + `cartographie.md` | Data Lead | All sources, tools, and storage layers visualised |
| **J3** | Dashboard V1 | Antigravity dashboard | Dashboard Lead | First version live with cleaned data and core KPIs |
| **J4** | Automation proof | Loom video | Pipeline Lead | End-to-end run with zero manual steps; new data lands on dashboard |
| **J5** | Pitch & COMEX presentation | PPT + magazine + dashboard | Whole team | 4 deliverables presented to jury; 2-minute test passes |

---

## 10. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | Scope creep — trying to scrape too many sources | High | High | Lock the 7-source list; reject extras until V2 |
| R2 | "Christmas tree" dashboard | High | High | Each chart must reference a business question; reject the rest |
| R3 | Magazine deprioritised (10% weight, easy to skip) | Medium | High | Magazine is committed in J3, not J5 — and reviewed daily |
| R4 | N8N learning curve burns 1 day | Medium | High | Start N8N on J1; pair-program first workflow |
| R5 | Apify rate limits / token exhaustion | Medium | Medium | Set hard limits in actor configs (e.g. max 500 reviews/run) |
| R6 | OpenAI cost overrun | Low | Medium | Use `gpt-4o-mini` for batch agents; reserve `gpt-4o` for COMEX synth only |
| R7 | Multilingual quality (FR/EN/ES sentiment) | Medium | Medium | Validate against a 50-record manual review set |
| R8 | Supabase schema churn | Medium | Low | Use migrations folder; never edit `schema.sql` after J3 |
| R9 | Loom video forgotten | Low | Critical | Loom recording is a hard checklist item on J4 morning |
| R10 | "Beautiful but broken" — pretty dashboard with no live data | Medium | Critical | Pipeline must work before any visual polish |

---

## 11. Open Questions

| # | Question | Owner | Deadline |
|---|----------|-------|----------|
| Q1 | Magazine language: French or English (or both)? | Team + Licter | J2 |
| Q2 | Antigravity self-hosting vs. managed plan? | Dashboard Lead | J2 |
| Q3 | Which Inditex sister brands fit in the competitive view? | Brand Lead | J3 |
| Q4 | Slack workspace for crisis alerts: dedicated or existing? | Pipeline Lead | J3 |

---

## 12. Glossary

| Term | Definition |
|------|------------|
| **COMEX** | Comité Exécutif — the executive committee a project must serve |
| **PHS** | Product Health Score — composite 0-100 health indicator per product category |
| **Share of Voice (SoV)** | Brand's share of total mentions vs. competitors over a period |
| **Crisis** | A sustained, abnormal spike in negative signal that requires action |
| **Insight** | An actionable signal a decision-maker can act on in under 2 minutes |
| **2-minute test** | "Can a COMEX member with 2 minutes make a decision from this artefact?" |

---

## 13. References

- `CLAUDE.md` — project conventions and tech stack quick reference
- `requirements.md` — original hackathon brief from Eugenia × Licter
- `roadmap.md` — phased delivery plan
- `cartographie.md` — full data flow mapping document
- `agents.md` — agent and workflow specifications
- `src/zara/*/README.md` — module-level documentation
