# Agents & Workflows — Zara Social Data Intelligence

## Architecture Overview

The platform relies on specialised AI agents, each responsible for a specific domain of analysis. Agents consume cleaned data, run their analysis, and output structured insights to the dashboard and alerting system.

```
                    ┌─────────────────────┐
                    │   Clean Data Store   │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
          ▼                    ▼                     ▼
  ┌───────────────┐  ┌────────────────┐  ┌──────────────────┐
  │  Scraper Agents│  │ Analysis Agents│  │ Reporting Agents │
  └───────────────┘  └────────────────┘  └──────────────────┘
```

---

## 1. Scraper Agents

### 1.1 Google Reviews Scraper Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Extract store-level reviews for Zara and H&M |
| **Input** | List of store URLs / Place IDs |
| **Output** | Structured review data (rating, text, date, store, location) |
| **Tools** | Python (Selenium / Playwright), Apify Google Maps Scraper |
| **Schedule** | Weekly |
| **Storage** | Raw reviews table in database |

### 1.2 Google Merchant Scraper Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Extract product-level reviews from Google Shopping |
| **Input** | Product identifiers / merchant feed |
| **Output** | Product reviews (rating, text, date, product name, SKU) |
| **Tools** | Python (requests, BeautifulSoup), Apify |
| **Schedule** | Weekly |

### 1.3 Trustpilot Scraper Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Extract brand-level reviews and trust scores |
| **Input** | Zara and H&M Trustpilot URLs |
| **Output** | Reviews (rating, text, date, category), overall trust score |
| **Tools** | Python (Scrapy), Apify Trustpilot Scraper |
| **Schedule** | Weekly |

### 1.4 Instagram Scraper Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Collect posts, comments, mentions, hashtags, UGC |
| **Input** | Brand handles, relevant hashtags |
| **Output** | Posts (text, likes, comments, date, media type, hashtags) |
| **Tools** | Apify Instagram Scraper, Instaloader |
| **Schedule** | Daily |

### 1.5 Facebook Scraper Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Collect page reviews, comments, post mentions |
| **Input** | Brand page URLs |
| **Output** | Reviews, comments, post interactions |
| **Tools** | Apify Facebook Scraper |
| **Schedule** | Weekly |

### 1.6 YouTube Scraper Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Collect video mentions, comments, engagement |
| **Input** | Search queries (brand name, product names) |
| **Output** | Videos (title, views, comments, sentiment indicators) |
| **Tools** | YouTube Data API, Apify YouTube Scraper |
| **Schedule** | Weekly |

### 1.7 Reddit Scraper Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Collect threads, comments, discussions mentioning brands |
| **Input** | Subreddits (r/fashion, r/zara, etc.), search queries |
| **Output** | Threads (title, body, comments, upvotes, date, subreddit) |
| **Tools** | Reddit API (PRAW), Apify Reddit Scraper |
| **Schedule** | Daily |

### 1.8 LinkedIn Scraper Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Monitor brand perception and employer branding signals |
| **Input** | Company pages, relevant search terms |
| **Output** | Posts, engagement metrics, employer review signals |
| **Tools** | Apify LinkedIn Scraper |
| **Schedule** | Weekly |

### 1.9 External Reviews Scraper Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Aggregate reviews from other third-party platforms |
| **Input** | Platform-specific URLs |
| **Output** | Normalised review data |
| **Tools** | Python (Scrapy), platform-specific Apify actors |
| **Schedule** | Weekly |

---

## 2. Data Processing Agents

### 2.1 Data Cleaning Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Clean and normalise all incoming raw data |
| **Input** | Raw scraped data from all sources |
| **Processing** | Deduplication, text normalisation, encoding fixes, missing value handling, language detection |
| **Output** | Clean, structured data in standardised schema |
| **Tools** | Python (pandas, polars, regex, langdetect) |
| **Trigger** | Runs after each scraper completes |

### 2.2 Data Enrichment Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Enrich cleaned data with metadata |
| **Input** | Cleaned data |
| **Processing** | Geolocation tagging, language tagging, category classification, entity extraction |
| **Output** | Enriched data ready for analysis |
| **Tools** | Python, NLP models (spaCy, transformers) |
| **Trigger** | Runs after cleaning agent completes |

---

## 3. Analysis Agents

### 3.1 Sentiment Analysis Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Analyse tone and sentiment across all text-based data |
| **Input** | Cleaned reviews, social media posts, comments |
| **Processing** | NLP sentiment classification (positive, negative, neutral), emotion detection, aspect-based sentiment |
| **Output** | Sentiment scores per source, per product, per store, over time |
| **Tools** | Python, transformers (BERT/RoBERTa fine-tuned), TextBlob, VADER |
| **KPIs** | Overall sentiment score, sentiment trend, sentiment by channel |

### 3.2 Crisis Detection Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Detect and flag potential brand crises in real time |
| **Input** | Sentiment scores, volume metrics, social media mentions |
| **Processing** | Anomaly detection (spike in negative sentiment, unusual volume), keyword monitoring (recall, scandal, lawsuit, boycott) |
| **Output** | Crisis alerts with severity level (low, medium, high, critical) |
| **Tools** | Python, statistical anomaly detection, LLM-based classification |
| **Trigger** | Continuous monitoring (runs every scraping cycle) |
| **Alert channels** | Slack, email, dashboard notification |
| **Thresholds** | |
| | - **Low**: 10% increase in negative sentiment over 24h |
| | - **Medium**: 25% increase or negative viral post (>10K engagements) |
| | - **High**: 50% increase or mainstream media pickup |
| | - **Critical**: Trending topic + sustained negative spike |

### 3.3 Product Health Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Score individual products by correlating multiple data signals |
| **Input** | Product reviews, return rates, social mentions, sentiment scores |
| **Processing** | Multi-signal correlation: review rating + return rate + social sentiment → health score |
| **Output** | Per-product health score (0-100), flagged products, trend direction |
| **Tools** | Python, scikit-learn, custom scoring model |
| **Use cases** | Identify defective products, underperformers, rising stars |

### 3.4 Trend Detection Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Identify emerging consumer trends before they peak |
| **Input** | Social media posts, search trends, UGC content, review themes |
| **Processing** | Topic modeling, keyword velocity tracking, hashtag analysis, cross-platform signal correlation |
| **Output** | Emerging trends with confidence score, growth trajectory |
| **Tools** | Python, LDA/BERTopic, time-series analysis |
| **Use cases** | Spot fashion trends, anticipate demand shifts, inform merchandising |

### 3.5 Competitive Benchmarking Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Compare Zara vs H&M across all collected dimensions |
| **Input** | All cleaned and analysed data for both brands |
| **Processing** | Side-by-side KPI comparison, gap analysis, relative positioning |
| **Output** | Competitive scorecard, positioning matrix, gap reports |
| **Metrics compared** | |
| | - Overall sentiment (per channel) |
| | - Review ratings (stores + products) |
| | - Social media engagement |
| | - Crisis frequency and response time |
| | - Product return rates |
| | - Trend adoption speed |
| **Tools** | Python, custom comparison framework |

---

## 4. Reporting Agents

### 4.1 Dashboard Feed Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Prepare and push structured data to the dashboard |
| **Input** | All agent outputs (sentiment, crisis, product health, trends, competitive) |
| **Processing** | Aggregation, formatting, caching for fast dashboard queries |
| **Output** | Dashboard-ready data endpoints (API / database views) |
| **Tools** | Python, FastAPI / database views |
| **Trigger** | After each analysis cycle |

### 4.2 Investor Magazine Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Auto-generate a periodic brand health report for investors |
| **Input** | Aggregated KPIs, trend summaries, competitive position |
| **Processing** | LLM-based narrative generation, chart/table generation, layout formatting |
| **Output** | PDF magazine with executive summary, KPIs, charts, insights |
| **Tools** | Python, LLM (GPT/Claude), matplotlib/plotly, reportlab/weasyprint |
| **Schedule** | Monthly (configurable) |
| **Sections** | |
| | 1. Executive Summary |
| | 2. Brand Health Score |
| | 3. Sentiment Overview |
| | 4. Product Performance |
| | 5. Crisis Log |
| | 6. Competitive Position (vs H&M) |
| | 7. Emerging Trends |
| | 8. Recommendations |

### 4.3 Alert Dispatch Agent
| Field | Detail |
|-------|--------|
| **Purpose** | Route alerts from crisis detection to appropriate channels |
| **Input** | Crisis alerts from Crisis Detection Agent |
| **Processing** | Severity-based routing, deduplication, escalation logic |
| **Output** | Notifications via Slack, email, dashboard |
| **Tools** | Python, Slack API, SMTP, webhook integrations |
| **Trigger** | Real-time (on alert creation) |

---

## Workflow Orchestration

### Execution Order

```
Step 1 (Scheduled)
├── All Scraper Agents run in parallel
│   ├── Google Reviews Scraper
│   ├── Google Merchant Scraper
│   ├── Trustpilot Scraper
│   ├── Instagram Scraper
│   ├── Facebook Scraper
│   ├── YouTube Scraper
│   ├── Reddit Scraper
│   ├── LinkedIn Scraper
│   └── External Reviews Scraper
│
Step 2 (Triggered by Step 1 completion)
├── Data Cleaning Agent
└── Data Enrichment Agent
│
Step 3 (Triggered by Step 2 completion)
├── All Analysis Agents run in parallel
│   ├── Sentiment Analysis Agent
│   ├── Crisis Detection Agent
│   ├── Product Health Agent
│   ├── Trend Detection Agent
│   └── Competitive Benchmarking Agent
│
Step 4 (Triggered by Step 3 completion)
├── Dashboard Feed Agent
├── Alert Dispatch Agent (also triggered in real-time by Crisis Agent)
└── Investor Magazine Agent (monthly)
```

### Orchestration Tools
- **Airflow** or **Prefect** for DAG-based workflow scheduling
- **Celery** for async task execution
- **Cron** as fallback for simple scheduling

---

## Agent Summary Table

| # | Agent | Type | Schedule | Priority |
|---|-------|------|----------|----------|
| 1.1 | Google Reviews Scraper | Scraper | Weekly | High |
| 1.2 | Google Merchant Scraper | Scraper | Weekly | High |
| 1.3 | Trustpilot Scraper | Scraper | Weekly | Medium |
| 1.4 | Instagram Scraper | Scraper | Daily | High |
| 1.5 | Facebook Scraper | Scraper | Weekly | Medium |
| 1.6 | YouTube Scraper | Scraper | Weekly | Medium |
| 1.7 | Reddit Scraper | Scraper | Daily | Medium |
| 1.8 | LinkedIn Scraper | Scraper | Weekly | Low |
| 1.9 | External Reviews Scraper | Scraper | Weekly | Medium |
| 2.1 | Data Cleaning Agent | Processing | On trigger | Critical |
| 2.2 | Data Enrichment Agent | Processing | On trigger | High |
| 3.1 | Sentiment Analysis Agent | Analysis | On trigger | Critical |
| 3.2 | Crisis Detection Agent | Analysis | Continuous | Critical |
| 3.3 | Product Health Agent | Analysis | On trigger | High |
| 3.4 | Trend Detection Agent | Analysis | On trigger | Medium |
| 3.5 | Competitive Benchmarking Agent | Analysis | On trigger | High |
| 4.1 | Dashboard Feed Agent | Reporting | On trigger | High |
| 4.2 | Investor Magazine Agent | Reporting | Monthly | Medium |
| 4.3 | Alert Dispatch Agent | Reporting | Real-time | Critical |
