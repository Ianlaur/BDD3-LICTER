"""
cleaning/
=========
Data cleaning pipeline for BDD3-LICTER (Zara Social Data Intelligence).

This package normalises raw scraped data from Apify actors and the initial
Excel dataset before it is stored in Supabase and passed to the analysis
agents.

Modules
-------
pipeline  : Main entry-point — orchestrate all cleaning steps end-to-end.
utils     : Shared helper functions (text normalisation, deduplication, etc.).
"""
