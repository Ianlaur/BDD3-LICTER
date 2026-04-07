# src/zara/config/

Configuration and environment variable management for BDD3-LICTER.

## Setup

```bash
cp src/zara/config/.env.example src/zara/config/.env
```

Then open `src/zara/config/.env` and fill in each value:

| Variable             | Where to find it                                               |
|----------------------|----------------------------------------------------------------|
| `OPENAI_API_KEY`     | https://platform.openai.com/api-keys                          |
| `SUPABASE_URL`       | Supabase Dashboard → Settings → API → Project URL             |
| `SUPABASE_KEY`       | Supabase Dashboard → Settings → API → anon / public key       |
| `SUPABASE_DB_URL`    | Supabase Dashboard → Settings → Database → Connection string  |
| `APIFY_TOKEN`        | https://console.apify.com/account/integrations                |
| `N8N_WEBHOOK_URL`    | Your N8N instance URL + /webhook                              |
| `SLACK_WEBHOOK_URL`  | Slack App settings → Incoming Webhooks (optional)             |

## Loading in Python

```python
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path="src/zara/config/.env")

openai_key = os.environ["OPENAI_API_KEY"]
supabase_url = os.environ["SUPABASE_URL"]
```

## Security Rules

- `src/zara/config/.env` is listed in `.gitignore` — it will never be committed.
- Only `src/zara/config/.env.example` (with placeholder values) is committed.
- Never hardcode secrets in Python files or N8N workflow JSON.
- In production, inject secrets via environment variables (not the .env file).
