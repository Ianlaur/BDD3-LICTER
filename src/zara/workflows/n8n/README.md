# src/zara/workflows/n8n/

N8N workflow definitions and setup instructions for BDD3-LICTER.

N8N is the **mandatory orchestration layer** (OBLIGATOIRE) that connects every
step of the pipeline: Apify scraping → data cleaning → AI analysis → dashboard refresh.

## Getting Started

### 1. Self-hosted N8N (recommended for this project)

```bash
# Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

Access the UI at: http://localhost:5678

### 2. N8N Cloud (alternative)

Sign up at https://app.n8n.cloud — free tier includes 5 active workflows.

## Credentials to Configure in N8N

| Service  | N8N Credential Type         | Required Variables              |
|----------|-----------------------------|---------------------------------|
| Apify    | HTTP Header Auth            | `Authorization: Bearer <token>` |
| Supabase | Postgres / HTTP             | URL + anon key                  |
| OpenAI   | OpenAI API                  | API key                         |
| Slack    | Slack OAuth2 (optional)     | For crisis notifications        |

## Core Workflows

### WF-01 — Scheduled Scrape & Clean

**Trigger:** Cron — every day at 02:00 CET

**Steps:**
1. For each source (Google Reviews, Trustpilot, Instagram, TikTok, Reddit, LinkedIn, Glassdoor):
   a. **Apify** — Start actor run with `input.json` from `src/zara/scrapers/apify/<source>/`
   b. **Wait** — Poll Apify API until actor run status = `SUCCEEDED`
   c. **Apify** — Fetch dataset items (JSON)
   d. **Supabase** — Upsert raw records into `raw_reviews` or `raw_social`
2. **HTTP Request** — Call `python -m zara.cleaning.pipeline --source all` (via webhook or SSH)
3. **Slack** — Notify on completion or error (optional)

### WF-02 — Sentiment Analysis Trigger

**Trigger:** Webhook from WF-01 on clean pipeline success

**Steps:**
1. **HTTP Request** — `python -m zara.analysis.agents.sentiment`
2. **HTTP Request** — `python -m zara.analysis.agents.product_health`
3. **HTTP Request** — `python -m zara.analysis.agents.trends`
4. **HTTP Request** — `python -m zara.analysis.agents.competitive`
5. **Supabase** — Update `kpis` with latest computed_at timestamp
6. **Antigravity** — Trigger dashboard refresh (if webhook available)

### WF-03 — Crisis Monitor

**Trigger:** Cron — every 30 minutes

**Steps:**
1. **HTTP Request** — `python -m zara.analysis.agents.crisis`
2. **IF** node — check if any `alerts` row has `resolved_at IS NULL AND severity IN ('high','critical')`
3. **Slack / Email** — Send crisis notification to stakeholders

### WF-04 — Weekly COMEX Brief

**Trigger:** Cron — every Monday at 07:00 CET

**Steps:**
1. **HTTP Request** — `python -m zara.analysis.agents.comex_synthesizer`
2. **Supabase** — Fetch the generated `kpis.executive_brief`
3. **HTTP Request** — Call magazine PDF generator (see `src/zara/magazine/`)
4. **Slack / Email** — Distribute brief to COMEX distribution list

## Importing Workflows

Workflow JSON exports will be placed in this directory:

```
src/zara/workflows/n8n/
├── WF-01_scrape_and_clean.json
├── WF-02_sentiment_trigger.json
├── WF-03_crisis_monitor.json
└── WF-04_weekly_comex.json
```

To import: N8N UI → Workflows → Import from file → select JSON.

## Error Handling Best Practices

- Add **Error Trigger** nodes to all workflows to catch failures.
- Use N8N's built-in **Wait** node (not HTTP polling loops) for Apify run completion.
- Set **Continue on Fail = false** for critical path nodes (Supabase upserts).
- Keep sensitive credentials in N8N's credential store — never hardcode in nodes.
