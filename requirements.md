# Requirements — Zara Social Data Intelligence

## Project Context

**Program:** Eugenia School × Licter — Social Data Intelligence 2026
**Company:** Zara (Inditex Group)
**Competitor Benchmark:** H&M

---

## Objective

Build a full-stack data intelligence platform that scrapes, cleans, analyses, and visualises data from multiple channels to:

- Monitor **brand health** (Zara) in real time
- Detect **crises** and **product issues** early
- Identify **trends** and consumer sentiment shifts
- **Benchmark against H&M** across all dimensions
- Transform raw data into **actionable business plans**
- Generate **investor-ready reports** (magazine format)

---

## Data Sources

### 1. Reviews & Reputation
| Source | Data Type | Granularity |
|--------|-----------|-------------|
| Google Reviews | Store reviews, ratings | Per store |
| Google Merchant | Product reviews, ratings | Per product |
| Trustpilot | Brand reviews, scores | Brand level |
| Other review platforms | Third-party reviews | Brand / product level |

### 2. Social Media & UGC
| Source | Data Type |
|--------|-----------|
| Instagram | Posts, stories, mentions, hashtags, UGC |
| Facebook | Page reviews, comments, mentions |
| YouTube | Video mentions, comments |
| Reddit | Threads, discussions, mentions |
| LinkedIn | Brand perception, employer branding |
| UGC (cross-platform) | User-generated content aggregation |

### 3. Operational Data
| Source | Data Type | Granularity |
|--------|-----------|-------------|
| Transporters | Delivery performance, logistics | Per carrier / region |
| Product Returns | Return rates, reasons | Per store, per product |

### 4. Competitive Data (H&M)
All of the above sources replicated for H&M to enable side-by-side comparison.

---

## Functional Requirements

### FR-1: Data Extraction (Scrapers)
- **FR-1.1** — Scrape Google Reviews for all Zara and H&M stores
- **FR-1.2** — Scrape Google Merchant product reviews for both brands
- **FR-1.3** — Scrape Trustpilot reviews and scores
- **FR-1.4** — Scrape social media platforms (Instagram, Facebook, YouTube, Reddit, LinkedIn)
- **FR-1.5** — Collect UGC content across platforms
- **FR-1.6** — Integrate operational data (transporters, product returns)
- **FR-1.7** — Scrapers must run on a scheduled basis (daily/weekly depending on source)
- **FR-1.8** — Use Python (Scrapy, BeautifulSoup, Selenium) and Apify actors

### FR-2: Data Cleaning
- **FR-2.1** — Build a Python data cleaning pipeline
- **FR-2.2** — Train/calibrate the pipeline on the provided database
- **FR-2.3** — Handle deduplication, normalisation, encoding, missing values
- **FR-2.4** — Output clean, structured data ready for analysis
- **FR-2.5** — Pipeline must be reusable for all incoming scraped data

### FR-3: Data Analysis (Agents & Workflows)
- **FR-3.1** — Sentiment analysis across all text-based sources
- **FR-3.2** — Crisis detection (spike detection in negative sentiment / volume)
- **FR-3.3** — Product health scoring (correlating reviews, returns, social signals)
- **FR-3.4** — Trend identification across all channels
- **FR-3.5** — Competitive benchmarking (Zara vs H&M on all KPIs)
- **FR-3.6** — Transform raw analysis into structured, actionable insights
- **FR-3.7** — Alerting system for crisis situations

### FR-4: Dashboard
- **FR-4.1** — Interactive data visualisation (charts, maps, timelines)
- **FR-4.2** — Drill-down and filtering capabilities
- **FR-4.3** — Competitive positioning view (Zara vs H&M)
- **FR-4.4** — Investor magazine generator (automated brand health summary)
- **FR-4.5** — Export capabilities (PDF, CSV)
- **FR-4.6** — Role-based access (analysts, managers, investors)

---

## Non-Functional Requirements

- **NFR-1** — Scrapers must handle rate limiting and anti-bot measures gracefully
- **NFR-2** — Data pipeline must process the provided database without data loss
- **NFR-3** — Dashboard must load within 3 seconds for standard queries
- **NFR-4** — System must be modular (each component independently deployable)
- **NFR-5** — All code in Python (scrapers, cleaning, agents); dashboard TBD
- **NFR-6** — Crisis alerts must trigger within 1 hour of detection

---

## Deliverables

### Deliverable 1 — Cartographie du Projet (Mapping)
- Visual schema (Miro / FigJam) modeling the full data journey:
  - **Sources ciblées** — all targeted data sources
  - **Outils d'extraction et d'automatisation** — scraping tools and automation workflows
  - **Stockage** — how data is stored before exploitation
  - **Exploitation** — how data flows into analysis and dashboard

### Deliverable 2 — Data Cleaning Pipeline
- Python module trained on the provided database
- Documentation and validation report

### Deliverable 3 — Scrapers
- All scrapers operational (Python + Apify)
- Scheduling and monitoring setup

### Deliverable 4 — Analysis Agents & Workflows
- All agents deployed (sentiment, crisis, product health, trends, competitive)
- Alerting system configured

### Deliverable 5 — Dashboard
- Full dashboard with all modules
- Investor magazine template
- User documentation

---

## Data Flow Summary

```
[Data Sources] → [Scrapers (Python/Apify)] → [Raw Storage (DB/S3)]
        ↓
[Data Cleaning Pipeline (Python)] → [Clean Storage]
        ↓
[Analysis Agents & Workflows] → [Structured Insights]
        ↓
[Dashboard + Investor Magazine + Alerts]
```
