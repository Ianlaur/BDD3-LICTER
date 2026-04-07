# src/zara/workflows/

Orchestration layer for BDD3-LICTER.

## Tool: N8N (OBLIGATOIRE)

N8N is the mandatory workflow orchestration tool for this project.
All automation — from scraping triggers to analysis agent calls — runs through N8N.

## Structure

```
src/zara/workflows/
└── n8n/
    ├── README.md                    ← Full N8N setup guide (start here)
    ├── WF-01_scrape_and_clean.json  ← Daily scrape + clean workflow
    ├── WF-02_sentiment_trigger.json ← Analysis chain trigger
    ├── WF-03_crisis_monitor.json    ← 30-min crisis check
    └── WF-04_weekly_comex.json      ← Monday COMEX brief generator
```

See `src/zara/workflows/n8n/README.md` for detailed setup instructions.
