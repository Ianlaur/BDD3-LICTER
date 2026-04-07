# src/zara/dashboard/

Antigravity dashboard configuration and setup for BDD3-LICTER.

## Tool: Antigravity

Antigravity is the dashboard platform for this project. It connects directly
to Supabase and visualises KPIs, sentiment trends, crisis alerts and
competitive benchmarks in real-time.

## Setup

### 1. Create an Antigravity account

Sign up at https://antigravity.so (or the platform URL provided by Licter).

### 2. Connect Supabase

In the Antigravity workspace settings:
- **Connection type:** Supabase
- **Project URL:** value of `SUPABASE_URL` from `src/zara/config/.env`
- **Anon key:** value of `SUPABASE_KEY` from `src/zara/config/.env`

### 3. Dashboard Sections

| Section              | Source Table       | Chart Type              | Business Question                                    |
|----------------------|--------------------|-------------------------|------------------------------------------------------|
| Sentiment Overview   | sentiment_scores   | Gauge + time series     | Is Zara's reputation improving or declining?         |
| Crisis Radar         | alerts             | Alert list + severity   | Are there active reputation crises to act on?        |
| Product Health       | product_health     | Radar / spider chart    | Which product categories need attention?             |
| Trend Radar          | trends             | Word cloud + bar chart  | What are customers talking about most this week?     |
| Source Breakdown     | clean_data         | Stacked bar by source   | Where are negative signals coming from?              |
| Competitive Position | competitive        | Grouped bar             | How does Zara compare to H&M, Mango, Uniqlo?        |
| COMEX KPIs           | kpis               | Summary card + table    | What are the top 5 actions for COMEX this week?      |
| Volume Monitor       | raw_reviews        | Line chart over time    | How many new data points are flowing in daily?       |

### 4. Refresh Settings

- **Auto-refresh interval:** 5 minutes (for crisis radar)
- **Daily summary refresh:** triggered by N8N WF-02 after analysis completes
- **Weekly COMEX view:** refreshed by N8N WF-04 every Monday

## Key Design Principles

- **Every chart answers a question** — no decorative visuals
- **Decision-first layout** — KPIs and crisis alerts above the fold
- **COMEX-ready** — a COMEX member with 2 minutes should be able to make a decision
- **Mobile-responsive** — for on-the-go executive access

## Exporting for the Magazine

The Antigravity dashboard screenshots / embeds are used in the COMEX magazine PDF.
Export charts as PNG from the Antigravity UI and place them in `src/zara/magazine/templates/`.
