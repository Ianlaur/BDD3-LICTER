-- =============================================================================
-- BDD3-LICTER — Supabase Database Schema
-- Zara Social Data Intelligence Project
-- =============================================================================
-- How to apply:
--   1. Open Supabase Dashboard → SQL Editor
--   2. Paste this file and click Run
-- Or via CLI:
--   psql "$SUPABASE_DB_URL" -f database/schema.sql
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. raw_reviews
--    Landing table for review-type data (Trustpilot, Google Reviews, Glassdoor)
--    Written by Apify actor runs via N8N. Never modified after insert.
-- =============================================================================
CREATE TABLE IF NOT EXISTS raw_reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source          TEXT NOT NULL,                 -- 'trustpilot' | 'google_reviews' | 'glassdoor'
    external_id     TEXT,                          -- actor-assigned ID for deduplication
    author          TEXT,
    text            TEXT,
    rating          NUMERIC(3, 1),                 -- star rating (1.0 – 5.0)
    published_at    TIMESTAMPTZ,
    url             TEXT,
    raw_payload     JSONB,                         -- full original actor output
    ingested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed       BOOLEAN NOT NULL DEFAULT FALSE, -- set to TRUE after cleaning pipeline
    UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_raw_reviews_source     ON raw_reviews (source);
CREATE INDEX IF NOT EXISTS idx_raw_reviews_processed  ON raw_reviews (processed);
CREATE INDEX IF NOT EXISTS idx_raw_reviews_published  ON raw_reviews (published_at DESC);

-- =============================================================================
-- 2. raw_social
--    Landing table for social media posts (TikTok, Instagram, Reddit, LinkedIn)
--    Written by Apify actor runs via N8N. Never modified after insert.
-- =============================================================================
CREATE TABLE IF NOT EXISTS raw_social (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source          TEXT NOT NULL,                 -- 'tiktok' | 'instagram' | 'reddit' | 'linkedin'
    external_id     TEXT,
    author          TEXT,
    text            TEXT,
    published_at    TIMESTAMPTZ,
    likes           INTEGER,
    comments        INTEGER,
    shares          INTEGER,
    url             TEXT,
    hashtags        TEXT[],
    raw_payload     JSONB,
    ingested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed       BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_raw_social_source     ON raw_social (source);
CREATE INDEX IF NOT EXISTS idx_raw_social_processed  ON raw_social (processed);
CREATE INDEX IF NOT EXISTS idx_raw_social_published  ON raw_social (published_at DESC);

-- =============================================================================
-- 3. clean_data
--    Normalised, deduplicated records produced by cleaning/pipeline.py.
--    Single unified table for all sources.
-- =============================================================================
CREATE TABLE IF NOT EXISTS clean_data (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source          TEXT NOT NULL,
    external_id     TEXT,
    author          TEXT,
    text            TEXT,
    rating          NUMERIC(3, 1),
    published_at    TIMESTAMPTZ,
    language        TEXT,                          -- ISO 639-1 code (e.g. 'en', 'fr')
    likes           INTEGER,
    comments        INTEGER,
    shares          INTEGER,
    url             TEXT,
    cleaned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_clean_data_source    ON clean_data (source);
CREATE INDEX IF NOT EXISTS idx_clean_data_published ON clean_data (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_clean_data_language  ON clean_data (language);

-- =============================================================================
-- 4. sentiment_scores
--    Output of analysis/agents/sentiment.py (one row per clean_data record).
-- =============================================================================
CREATE TABLE IF NOT EXISTS sentiment_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clean_data_id   UUID NOT NULL REFERENCES clean_data (id) ON DELETE CASCADE,
    label           TEXT NOT NULL CHECK (label IN ('positive', 'neutral', 'negative')),
    score           NUMERIC(5, 4) NOT NULL,        -- range [-1.0, 1.0]
    confidence      NUMERIC(4, 3),                 -- range [0.0, 1.0]
    themes          TEXT[],                        -- extracted topic keywords
    analysed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (clean_data_id)
);

CREATE INDEX IF NOT EXISTS idx_sentiment_label  ON sentiment_scores (label);
CREATE INDEX IF NOT EXISTS idx_sentiment_score  ON sentiment_scores (score DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_themes ON sentiment_scores USING GIN (themes);

-- =============================================================================
-- 5. product_health
--    Output of analysis/agents/product_health.py (one row per category).
-- =============================================================================
CREATE TABLE IF NOT EXISTS product_health (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category        TEXT NOT NULL,                 -- e.g. 'general', 'denim', 'knitwear'
    phs             NUMERIC(5, 2) NOT NULL,         -- composite score [0, 100]
    quality_score   NUMERIC(5, 2),
    price_score     NUMERIC(5, 2),
    fit_score       NUMERIC(5, 2),
    service_score   NUMERIC(5, 2),
    trend_score     NUMERIC(5, 2),
    review_count    INTEGER,
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (category)
);

CREATE INDEX IF NOT EXISTS idx_product_health_category   ON product_health (category);
CREATE INDEX IF NOT EXISTS idx_product_health_computed   ON product_health (computed_at DESC);

-- =============================================================================
-- 6. trends
--    Output of analysis/agents/trends.py (rising topics per time window).
-- =============================================================================
CREATE TABLE IF NOT EXISTS trends (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term            TEXT NOT NULL,
    source          TEXT NOT NULL DEFAULT 'multi',
    frequency       INTEGER NOT NULL,
    velocity        NUMERIC(10, 2),                -- delta vs previous window
    narrative       TEXT,                          -- AI-generated trend description
    window_start    TIMESTAMPTZ NOT NULL,
    window_end      TIMESTAMPTZ NOT NULL,
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (term, window_start)
);

CREATE INDEX IF NOT EXISTS idx_trends_velocity     ON trends (velocity DESC);
CREATE INDEX IF NOT EXISTS idx_trends_window_start ON trends (window_start DESC);

-- =============================================================================
-- 7. alerts
--    Output of analysis/agents/crisis.py (reputation crisis events).
-- =============================================================================
CREATE TABLE IF NOT EXISTS alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source          TEXT NOT NULL DEFAULT 'multi',
    severity        TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    summary         TEXT,
    sample_ids      UUID[],                        -- referenced clean_data IDs
    detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,                   -- NULL = still open
    resolved_by     TEXT                           -- username or agent name
);

CREATE INDEX IF NOT EXISTS idx_alerts_severity     ON alerts (severity);
CREATE INDEX IF NOT EXISTS idx_alerts_detected     ON alerts (detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved     ON alerts (resolved_at) WHERE resolved_at IS NULL;

-- =============================================================================
-- 8. kpis
--    Output of analysis/agents/comex_synthesizer.py (weekly executive brief).
-- =============================================================================
CREATE TABLE IF NOT EXISTS kpis (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period              TEXT NOT NULL,             -- ISO week, e.g. '2026-W12'
    overall_sentiment   NUMERIC(5, 4),
    crisis_count        INTEGER NOT NULL DEFAULT 0,
    top_trend           TEXT,
    phs_general         NUMERIC(5, 2),
    best_competitor     TEXT,
    worst_competitor    TEXT,
    executive_brief     TEXT,                      -- Markdown 5-bullet COMEX brief
    generated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (period)
);

CREATE INDEX IF NOT EXISTS idx_kpis_period       ON kpis (period DESC);
CREATE INDEX IF NOT EXISTS idx_kpis_generated    ON kpis (generated_at DESC);

-- =============================================================================
-- 9. competitive
--    Output of analysis/agents/competitive.py (competitor benchmarks).
-- =============================================================================
CREATE TABLE IF NOT EXISTS competitive (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand           TEXT NOT NULL,                 -- 'H&M' | 'Mango' | 'Uniqlo' | etc.
    source          TEXT NOT NULL DEFAULT 'multi',
    avg_sentiment   NUMERIC(5, 4),
    review_count    INTEGER,
    avg_rating      NUMERIC(3, 1),
    top_themes      TEXT[],
    vs_zara_delta   NUMERIC(6, 4),                 -- positive = Zara leads
    summary         TEXT,                          -- AI-generated positioning statement
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (brand, source)
);

CREATE INDEX IF NOT EXISTS idx_competitive_brand    ON competitive (brand);
CREATE INDEX IF NOT EXISTS idx_competitive_delta    ON competitive (vs_zara_delta DESC);
CREATE INDEX IF NOT EXISTS idx_competitive_computed ON competitive (computed_at DESC);

-- =============================================================================
-- Row-Level Security (RLS)
-- Uncomment and configure once Supabase auth is set up.
-- =============================================================================
-- ALTER TABLE clean_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sentiment_scores ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
-- (Add policies per role: anon read-only for dashboard, service_role for agents)
