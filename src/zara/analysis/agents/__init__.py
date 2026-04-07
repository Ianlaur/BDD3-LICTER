"""
analysis/agents/
================
Collection of OpenAI-powered analysis agents.

Each agent exposes a `run()` function that:
  1. Reads cleaned data from Supabase.
  2. Calls the OpenAI API with a structured prompt.
  3. Writes results back to the relevant Supabase table.

Agents
------
sentiment         : Score sentiment per review/post (positive/neutral/negative + score).
crisis            : Detect reputation crises and fire alerts.
product_health    : Aggregate product-level health scores from review signals.
trends            : Identify trending topics, hashtags and keywords over time.
competitive       : Benchmark Zara against competitors (H&M, Mango, Uniqlo…).
comex_synthesizer : Produce the weekly executive brief for COMEX consumption.
"""
