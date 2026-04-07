"""
analysis/
=========
AI-powered analysis layer for BDD3-LICTER (Zara Social Data Intelligence).

This package contains specialised agents that consume cleaned data from
Supabase and produce structured intelligence (sentiment scores, crisis alerts,
product health KPIs, trend signals, competitive benchmarks, and COMEX briefs).

Each agent is invoked by N8N after the cleaning pipeline has run.

Sub-packages
------------
agents : Individual analysis agents (one module per domain).
"""
