# Agents & Workflows — Zara Social Data Intelligence

## Architecture Overview

The platform follows the imposed pipeline: data flows from the Excel base through Apify extraction, Make orchestration, OpenAI analysis, Supabase storage, and Antigravity dashboard.

```
[Excel 3 onglets] → [Apify] → [N8N] → [OpenAI API] → [Supabase] → [Antigravity]
   Base historique    Scraping   Orchestration   IA/Analyse    Storage     Dashboard
```

---

## 1. Data Extraction — Apify Actors

> "Apify ne sert qu'à automatiser le flux de nouvelles données. Ne scrapez pas 10 ans d'historique."

### 1.1 Google Reviews Actor
| Field | Detail |
|-------|--------|
| **Purpose** | Extract store-level reviews for Zara |
| **Input** | Store Place IDs / URLs |
| **Output** | Reviews (rating, text, date, store, location) |
| **Tool** | Apify Google Maps Scraper |
| **Frequency** | Automated via Make scenario |

### 1.2 Trustpilot Actor
| Field | Detail |
|-------|--------|
| **Purpose** | Extract brand reputation reviews and scores |
| **Input** | Zara Trustpilot URL |
| **Output** | Reviews (rating, text, date), trust score |
| **Tool** | Apify Trustpilot Scraper |

### 1.3 Instagram Actor
| Field | Detail |
|-------|--------|
| **Purpose** | Collect posts, comments, mentions, hashtags, UGC |
| **Input** | @zara handle, relevant hashtags |
| **Output** | Posts (text, likes, comments, date, media type) |
| **Tool** | Apify Instagram Scraper |

### 1.4 TikTok Actor
| Field | Detail |
|-------|--------|
| **Purpose** | Collect TikTok videos, comments, mentions |
| **Input** | #zara, brand mentions |
| **Output** | Videos (description, views, likes, comments) |
| **Tool** | Apify TikTok Scraper |

### 1.5 Reddit Actor
| Field | Detail |
|-------|--------|
| **Purpose** | Collect threads and discussions mentioning Zara |
| **Input** | Subreddits (r/fashion, r/zara), search queries |
| **Output** | Threads (title, body, comments, upvotes) |
| **Tool** | Apify Reddit Scraper |

### 1.6 LinkedIn Actor
| Field | Detail |
|-------|--------|
| **Purpose** | Monitor brand perception and employer signals |
| **Input** | Zara company page, search terms |
| **Output** | Posts, engagement metrics |
| **Tool** | Apify LinkedIn Scraper |

### 1.7 Glassdoor Actor
| Field | Detail |
|-------|--------|
| **Purpose** | Extract employee reviews and employer perception |
| **Input** | Zara Glassdoor page |
| **Output** | Reviews (rating, pros, cons, date, role) |
| **Tool** | Apify Glassdoor Scraper |

---

## 2. Orchestration — N8N (OBLIGATOIRE)

> N8N is the chosen orchestration layer. All workflows pass through N8N workflows.

### 2.1 Data Collection Workflow
```
Cron Trigger (scheduled) → Run Apify Actors → Collect results → Route to cleaning
```
- Triggers Apify actors on schedule
- Collects raw output from each actor
- Routes data to the cleaning workflow

### 2.2 Data Cleaning & Enrichment Workflow
```
Receive raw data → Deduplicate → Normalize → Detect language → Send to OpenAI
```
- Deduplication of entries
- Text normalization (encoding, dates, formats)
- Language detection
- Routes cleaned data to OpenAI for analysis

### 2.3 AI Analysis Workflow
```
Receive cleaned data → OpenAI API calls → Structure results → Store in Supabase
```
- Sends cleaned text to OpenAI for sentiment analysis
- Receives structured insights
- Formats and stores in Supabase

### 2.4 Dashboard Update Workflow
```
New data in Supabase → Trigger → Update Antigravity dashboard → Notify
```
- Watches for new analysed data in Supabase
- Updates dashboard KPIs and visualizations
- Sends notifications if alerts triggered

### 2.5 Crisis Alert Workflow
```
Sentiment spike detected → Evaluate severity → Route alert (Slack/Email)
```
- Monitors sentiment scores for anomalies
- Classifies severity (low → critical)
- Dispatches alerts to appropriate channels

---

## 3. AI Analysis — OpenAI API Agents

### 3.1 Sentiment Analysis Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Analyse tone and sentiment across all text data |
| **Input** | Cleaned reviews, social posts, comments |
| **Processing** | Classify positive/negative/neutral, detect emotions, aspect-based sentiment |
| **Output** | Sentiment scores per source, product, store, over time |
| **Tool** | OpenAI API (GPT-4) via N8N |
| **KPIs** | Overall sentiment score, sentiment trend, sentiment by channel |

### 3.2 Crisis Detection Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Detect potential brand crises from signal spikes |
| **Input** | Sentiment scores, volume metrics, social mentions |
| **Processing** | Anomaly detection, keyword monitoring (recall, scandal, boycott) |
| **Output** | Crisis alerts with severity level |
| **Thresholds** | |
| | - **Low**: 10% increase in negative sentiment over 24h |
| | - **Medium**: 25% increase or viral negative post |
| | - **High**: 50% increase or media pickup |
| | - **Critical**: Trending topic + sustained negative spike |

### 3.3 Product Health Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Score individual products by correlating review signals |
| **Input** | Product reviews, social mentions, sentiment scores |
| **Processing** | Multi-signal correlation → health score |
| **Output** | Per-product health score (0-100), flagged products |

### 3.4 Trend Detection Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Identify emerging consumer trends |
| **Input** | Social posts, UGC, review themes, hashtags |
| **Processing** | Topic extraction, keyword velocity, cross-platform signals |
| **Output** | Emerging trends with confidence score |

### 3.5 Competitive Benchmarking Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Position Zara vs competitors on all dimensions |
| **Input** | All analysed data for Zara + competitor signals |
| **Processing** | Side-by-side KPI comparison, gap analysis |
| **Output** | Competitive scorecard, positioning insights |

### 3.6 COMEX Insight Synthesizer
| Field | Detail |
|-------|--------|
| **Purpose** | Transform raw analysis into COMEX-ready insights |
| **Input** | All agent outputs |
| **Processing** | Reduce 1500 lines of verbatims → 3 actionable insights |
| **Output** | Executive summary, recommendations, key signals |
| **Target** | "Si un membre du COMEX n'a que 2 minutes..." |

---

## 4. Storage — Supabase

### Database Schema (planned)

| Table | Description |
|-------|-------------|
| `raw_reviews` | Raw scraped reviews from all sources |
| `raw_social` | Raw social media posts and mentions |
| `clean_data` | Cleaned and normalised data |
| `sentiment_scores` | Sentiment analysis results |
| `product_health` | Product health scores |
| `trends` | Detected trends |
| `alerts` | Crisis alerts and notifications |
| `kpis` | Aggregated KPIs for dashboard |
| `competitive` | Competitive benchmark data |

---

## 5. Dashboard — Antigravity

### Dashboard Views

| View | Content |
|------|---------|
| **Overview** | Brand health score, key KPIs, alert status |
| **Sentiment** | Sentiment over time, by channel, by product |
| **Product Performance** | Product health scores, flagged items |
| **Social Listening** | Real-time social mentions, trending topics |
| **Crisis Monitor** | Active alerts, severity, response status |
| **Competitive** | Zara vs competitors positioning |
| **Trends** | Emerging trends, growth trajectories |

### KPI Selection Criteria
> "Documentez vos choix : pourquoi ces KPIs ? Pourquoi ces sources ?"
- Every chart must answer a specific business question
- No vanity metrics — only actionable KPIs
- Designed for a COMEX member with 2 minutes

---

## 6. Magazine Exécutif (PDF, 5 pages max)

| Page | Content |
|------|---------|
| 1 | Executive Summary — brand health at a glance |
| 2 | Sentiment & Reputation — key signals and trends |
| 3 | Product Intelligence — top/bottom performers, issues |
| 4 | Competitive Position — Zara vs market |
| 5 | Recommendations — 3 actionable next steps |

---

## Full Workflow Orchestration (N8N)

```
SCHEDULED TRIGGER
│
├─→ Apify Actors (parallel)
│   ├── Google Reviews
│   ├── Trustpilot
│   ├── Instagram
│   ├── TikTok
│   ├── Reddit
│   ├── LinkedIn
│   └── Glassdoor
│
├─→ Data Cleaning Module
│   ├── Deduplicate
│   ├── Normalize
│   └── Validate
│
├─→ OpenAI Analysis (parallel)
│   ├── Sentiment Agent
│   ├── Crisis Detection Agent
│   ├── Product Health Agent
│   ├── Trend Agent
│   ├── Competitive Agent
│   └── COMEX Synthesizer
│
├─→ Supabase Storage
│   └── Append to relevant tables
│
├─→ Antigravity Dashboard
│   └── Auto-refresh KPIs and views
│
└─→ Alerts (if triggered)
    ├── Slack notification
    └── Email notification
```

---

## Agent Summary

| # | Agent | Layer | Tool |
|---|-------|-------|------|
| 1.1–1.7 | Scraper Actors (7) | Extraction | Apify |
| 2.1–2.5 | Orchestration Workflows (5) | Orchestration | N8N |
| 3.1 | Sentiment Analysis | Analysis | OpenAI API |
| 3.2 | Crisis Detection | Analysis | OpenAI API |
| 3.3 | Product Health | Analysis | OpenAI API |
| 3.4 | Trend Detection | Analysis | OpenAI API |
| 3.5 | Competitive Benchmarking | Analysis | OpenAI API |
| 3.6 | COMEX Synthesizer | Analysis | OpenAI API |
| 4 | Supabase Storage | Storage | Supabase |
| 5 | Dashboard | Visualisation | Antigravity |
