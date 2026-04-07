# src/zara/scrapers/

This directory contains all data extraction configurations and scripts for the BDD3-LICTER pipeline.

## Structure

```
src/zara/scrapers/
└── apify/
    ├── google_reviews/   # Apify actor config for Google Reviews
    ├── trustpilot/       # Apify actor config for Trustpilot
    ├── instagram/        # Apify actor config for Instagram
    ├── tiktok/           # Apify actor config for TikTok
    ├── reddit/           # Apify actor config for Reddit
    ├── linkedin/         # Apify actor config for LinkedIn
    └── glassdoor/        # Apify actor config for Glassdoor
```

## Apify Actors Used

| Source        | Actor                                      | Trigger        |
|---------------|--------------------------------------------|----------------|
| Google Reviews | `compass/google-maps-reviews-scraper`     | N8N schedule   |
| Trustpilot    | `novi/trustpilot-reviews-scraper`          | N8N schedule   |
| Instagram     | `apify/instagram-scraper`                  | N8N schedule   |
| TikTok        | `clockworks/tiktok-scraper`                | N8N schedule   |
| Reddit        | `trudax/reddit-scraper`                    | N8N schedule   |
| LinkedIn      | `anchor/linkedin-company-scraper`          | N8N schedule   |
| Glassdoor     | `bebity/glassdoor-jobs-scraper`            | N8N schedule   |

## Usage

Apify actors are triggered via N8N workflows (see `src/zara/workflows/n8n/`). Each actor folder
contains:
- `input.json` — actor input configuration (search terms, filters, limits)
- `README.md` — actor-specific notes and field mapping

## Important Notes

- Apify is used for **new data only** — do not re-scrape historical data already in the Excel dataset.
- Target: 500 high-relevance reviews per source, not 50,000 unfiltered.
- All scraped data lands in `data/raw/` and is immediately pushed to Supabase `raw_reviews` / `raw_social` tables.
- API token: set `APIFY_TOKEN` in `src/zara/config/.env`.
