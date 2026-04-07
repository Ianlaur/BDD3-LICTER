# src/zara/cleaning/

Data cleaning and normalisation pipeline for BDD3-LICTER.

## Purpose

Takes raw scraped data (from Apify via Supabase `raw_reviews` / `raw_social`)
and produces normalised, deduplicated records in the `clean_data` table ready
for analysis agents.

## Files

| File          | Purpose                                                   |
|---------------|-----------------------------------------------------------|
| `pipeline.py` | Main entry-point — run to process one or all sources      |
| `utils.py`    | Shared helpers: text normalisation, deduplication, dates  |
| `__init__.py` | Package initialiser with module docstring                 |

## Usage

```bash
# Install dependencies first
pip install -r requirements.txt

# Copy and fill in secrets
cp src/zara/config/.env.example src/zara/config/.env

# Clean a single source
python -m zara.cleaning.pipeline --source trustpilot

# Clean all sources
python -m zara.cleaning.pipeline --source all
```

## Data Flow

```
Supabase raw_reviews / raw_social
        ↓
  src/zara/cleaning/pipeline.py
        ↓  (normalise, deduplicate, enrich)
  Supabase clean_data
        ↓
  src/zara/analysis/agents/
```

## Adding a New Source

1. Add the source name to `SOURCES` in `pipeline.py`.
2. Implement field mapping inside `clean_review_record()` or `clean_social_record()`.
3. Add a corresponding Apify actor config under `src/zara/scrapers/apify/<source>/`.
4. Update `src/zara/workflows/n8n/` to trigger the new actor and re-run the pipeline.
