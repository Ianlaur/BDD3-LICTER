# src/zara/magazine/

COMEX executive magazine generator for BDD3-LICTER.

## Purpose

The magazine is one of the 4 final deliverables of the project. It is a
**5-page maximum PDF** designed for senior executives (COMEX) who have at most
2 minutes to understand Zara's reputation landscape and act on it.

## Format Requirements

- **Max 5 pages**
- Visual-first (charts > tables > text)
- Each page answers one strategic question
- Language: French (or English — TBD with Licter)
- Font: Clean, professional (e.g. Inter, Helvetica)
- Colours: Align with Zara brand identity (black, white, minimal accent)

## Suggested Page Structure

| Page | Title                          | Content                                              |
|------|--------------------------------|------------------------------------------------------|
| 1    | Executive Summary              | 5-bullet brief from `kpis.executive_brief` + key KPIs |
| 2    | Réputation & Sentiment         | Sentiment trend chart, source breakdown, top themes  |
| 3    | Alertes & Crises               | Open alerts, severity, recommended actions           |
| 4    | Santé Produit & Tendances      | Product Health radar, trend word cloud               |
| 5    | Positionnement Concurrentiel   | Competitive bar chart, Share of Voice, recommendation |

## Templates

Place chart exports and design assets in `src/zara/magazine/templates/`:

```
src/zara/magazine/templates/
├── page1_executive_summary.png    ← Antigravity export
├── page2_sentiment.png
├── page3_alerts.png
├── page4_product_trends.png
├── page5_competitive.png
├── zara_logo.png
└── brand_colors.json
```

## Generation

The magazine is generated from Antigravity dashboard exports + the COMEX brief.

Planned automation (WF-04 in N8N):
1. COMEX synthesizer runs → `kpis` table updated
2. N8N fetches the `executive_brief` text
3. N8N triggers an HTTP call to a PDF generator (e.g. Puppeteer / WeasyPrint)
4. PDF is emailed to the COMEX distribution list

Manual generation for the pitch:
1. Export charts from Antigravity as PNG (place in `src/zara/magazine/templates/`)
2. Assemble in Canva / Figma / PowerPoint using the 5-page structure above
3. Export as PDF — 5 pages max
