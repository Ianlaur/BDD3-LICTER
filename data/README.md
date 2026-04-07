# data/

Local data storage directory. All contents are gitignored.

## Structure

```
data/
├── raw/     ← Raw JSON output from Apify actors (before cleaning)
├── clean/   ← Cleaned/normalised data exported for local inspection
└── excel/   ← Initial Excel dataset provided by Licter (3 tabs)
```

## Important Notes

- **Do not commit any data files.** All subdirectories are listed in `.gitignore`.
- The `excel/` folder holds the initial dataset provided at the start of the project.
  It is the foundation — understand its structure before building the pipeline.
- `raw/` and `clean/` are populated automatically by the N8N workflows and
  `cleaning/pipeline.py`. They are available locally for debugging.
- For production data, use Supabase (the single source of truth).

## Excel Dataset (Initial)

Place the Excel file provided by Licter here:
```
data/excel/zara_initial_dataset.xlsx
```

Tab structure (expected):
- Tab 1: Customer reviews (Trustpilot / Google Reviews)
- Tab 2: Social media posts (TikTok / Instagram)
- Tab 3: HR / employer data (Glassdoor / LinkedIn)

Run the import script (to be implemented) to load it into Supabase:
```bash
# TODO: python scripts/import_excel.py data/excel/zara_initial_dataset.xlsx
```
