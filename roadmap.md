# ZARA - Competitive Intelligence & Brand Monitoring Dashboard

## Project Overview

Build a comprehensive dashboard with automated workflows and scrapers to collect, clean, analyse, and visualise data from multiple sources for **Zara** and **H&M** (competitive benchmarking). The platform enables teams to understand brand health, detect crises early, identify product issues, track trends, and turn raw data into actionable business plans.

---

## Data Sources

### Reviews & Reputation
- **Google Reviews** — by store (geolocalised insights)
- **Google Merchant** — product-level reviews
- **Trustpilot** — brand reputation scoring
- **Other external review platforms** — additional third-party review aggregators

### Social Media & UGC
- **Instagram** — posts, stories, mentions, hashtags, UGC
- **Facebook** — page reviews, comments, mentions
- **YouTube** — video mentions, comments, sentiment
- **Reddit** — threads, mentions, sentiment analysis
- **LinkedIn** — brand perception, employer branding signals
- **UGC Content** — user-generated content across all platforms

### Operational Data
- **Transporters** — logistics and delivery performance
- **Product Returns** — by store and by product (trend detection)

### Competitive Intelligence
- All of the above replicated for **H&M** to enable direct competitive positioning

---

## Roadmap

### Phase 1 — Data Foundation (parallel tracks)

> Both tracks run simultaneously.

#### Track A: Data Cleaning Algorithm
| Item | Detail |
|------|--------|
| **Objective** | Build a Python-based data cleaning pipeline trained on the provided database |
| **Tasks** | |
| | 1. Audit and profile the existing database (schema, quality, gaps) |
| | 2. Define cleaning rules (deduplication, normalisation, missing values, encoding) |
| | 3. Build the cleaning pipeline in Python (pandas / polars) |
| | 4. Train / fine-tune the algorithm on the provided dataset |
| | 5. Validate output quality with test cases and metrics |
| | 6. Document the pipeline and make it reusable for incoming scraped data |
| **Output** | A production-ready, reusable data cleaning module |

#### Track B: Scrapers Development
| Item | Detail |
|------|--------|
| **Objective** | Develop scrapers to extract data from all target sources for Zara & H&M |
| **Tasks** | |
| | 1. Map out every data source, endpoint, and access method |
| | 2. Build Python scrapers (BeautifulSoup / Scrapy / Selenium) for direct sources |
| | 3. Configure Apify actors for platforms better suited to managed scraping |
| | 4. Implement rate limiting, proxy rotation, and error handling |
| | 5. Set up scheduling (cron / orchestrator) for recurring data collection |
| | 6. Store raw data in a structured data lake (S3 / PostgreSQL / BigQuery) |
| | 7. Replicate all scrapers for H&M sources |
| **Output** | A fully operational scraping infrastructure feeding clean raw data into storage |

#### Phase 1 — Deliverables
- [ ] Data cleaning pipeline validated on the provided database
- [ ] All scrapers operational and scheduled
- [ ] Raw data flowing into centralised storage
- [ ] Documentation for both tracks

---

### Phase 2 — Analysis & Intelligence

> Starts once Phase 1 tracks are complete and pipelines are stable.

| Item | Detail |
|------|--------|
| **Objective** | Build AI agents and workflows that analyse cleaned data and produce actionable insights |
| **Tasks** | |
| | 1. Design analysis workflows (sentiment, trends, anomaly detection, crisis signals) |
| | 2. Build specialised agents: |
| | — **Sentiment Agent**: analyses reviews & social media tone |
| | — **Crisis Detection Agent**: flags spikes in negative sentiment or volume |
| | — **Product Health Agent**: correlates returns, reviews, and social mentions per product |
| | — **Trend Agent**: identifies emerging patterns across all channels |
| | — **Competitive Agent**: benchmarks Zara vs H&M on all KPIs |
| | 3. Create transformation pipelines to convert raw analysis into structured, understandable data |
| | 4. Define alerting rules (crisis thresholds, anomaly triggers) |
| | 5. Validate agent outputs with historical data and known events |
| **Output** | A suite of agents and workflows producing structured, actionable intelligence |

#### Phase 2 — Deliverables
- [ ] All agents deployed and producing validated outputs
- [ ] Alerting system operational (crisis, product issues, sentiment shifts)
- [ ] Actionable data models ready for dashboard consumption
- [ ] Competitive benchmark reports (Zara vs H&M)

---

### Phase 3 — Dashboard & Reporting

> Starts once Phase 2 outputs are stable and validated.

| Item | Detail |
|------|--------|
| **Objective** | Build the end-user dashboard for data visualisation, analysis, and investor reporting |
| **Tasks** | |
| | 1. Design UI/UX (wireframes, user flows) |
| | 2. Build the dashboard (Streamlit / Dash / custom React app) |
| | 3. **Data Visualisation Module** — interactive charts, maps, timelines per data source |
| | 4. **Analysis Module** — allow users to drill down, filter, and explore data |
| | 5. **Investor Magazine Generator** — automated report/magazine summarising brand health, KPIs, and strategic position |
| | 6. **Competitive Positioning View** — side-by-side Zara vs H&M across all dimensions |
| | 7. Role-based access (analysts, managers, investors) |
| | 8. Export capabilities (PDF, CSV, automated email reports) |
| **Output** | A production dashboard serving all stakeholders |

#### Phase 3 — Deliverables
- [ ] Dashboard live with all modules
- [ ] Investor magazine template auto-generated from live data
- [ ] Competitive positioning view operational
- [ ] User documentation and onboarding guide

---

## Key Capabilities Summary

| Capability | Description |
|------------|-------------|
| **Brand Monitoring** | Real-time tracking of brand perception across all channels |
| **Crisis Detection** | Early warning system for negative spikes, viral issues, PR crises |
| **Product Intelligence** | Per-product health score combining reviews, returns, and social signals |
| **Trend Analysis** | Identify emerging consumer trends before they peak |
| **Competitive Benchmarking** | Zara vs H&M positioning across every data dimension |
| **Actionable Insights** | Transform raw data into concrete business recommendations |
| **Investor Reporting** | Auto-generated magazine with brand health overview |

---

## Tech Stack (Planned)

| Layer | Tools |
|-------|-------|
| **Scraping** | Python (Scrapy, BeautifulSoup, Selenium), Apify |
| **Data Cleaning** | Python (pandas, polars), custom ML pipeline |
| **Storage** | PostgreSQL / BigQuery / S3 |
| **Analysis & Agents** | Python, LLM-based agents, workflow orchestrator |
| **Dashboard** | Antigravity |
| **Orchestration** | N8N (OBLIGATOIRE) |
| **Alerting** | Slack / Email / Webhook integrations |
