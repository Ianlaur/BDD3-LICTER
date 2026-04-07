# src/zara/analysis/

AI-powered analysis layer for BDD3-LICTER (Zara Social Data Intelligence).

## Architecture

Each agent is an independent Python module triggered by N8N after the cleaning
pipeline completes. Agents read from `clean_data` / `sentiment_scores` and write
results to dedicated Supabase tables.

```
Supabase clean_data
        ↓
┌───────────────────────────────────────┐
│  src/zara/analysis/agents/            │
│  ┌──────────┐  ┌───────────────────┐  │
│  │sentiment │  │product_health     │  │
│  └──────────┘  └───────────────────┘  │
│  ┌──────────┐  ┌───────────────────┐  │
│  │crisis    │  │trends             │  │
│  └──────────┘  └───────────────────┘  │
│  ┌──────────┐  ┌───────────────────┐  │
│  │competitive│ │comex_synthesizer  │  │
│  └──────────┘  └───────────────────┘  │
└───────────────────────────────────────┘
        ↓
Supabase (sentiment_scores, product_health,
          alerts, trends, competitive, kpis)
        ↓
Antigravity Dashboard
```

## Agents

| Agent                 | Output Table      | Run Frequency  |
|-----------------------|-------------------|----------------|
| `sentiment.py`        | sentiment_scores  | After each scrape |
| `crisis.py`           | alerts            | Every 30 min   |
| `product_health.py`   | product_health    | Daily          |
| `trends.py`           | trends            | Daily          |
| `competitive.py`      | competitive       | Daily          |
| `comex_synthesizer.py`| kpis              | Weekly (Mon 07:00) |

## Running Agents Manually

```bash
pip install -r requirements.txt
cp src/zara/config/.env.example src/zara/config/.env  # fill in your keys

python -m zara.analysis.agents.sentiment
python -m zara.analysis.agents.crisis
python -m zara.analysis.agents.product_health
python -m zara.analysis.agents.trends
python -m zara.analysis.agents.competitive
python -m zara.analysis.agents.comex_synthesizer
```

## N8N Integration

All agents are invoked via N8N HTTP Request nodes that call:
```
POST /execute-agent
body: { "agent": "sentiment" }
```

See `src/zara/workflows/n8n/README.md` for full workflow setup.
