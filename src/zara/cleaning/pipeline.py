"""
cleaning/pipeline.py
====================
Main entry-point for the BDD3-LICTER data cleaning pipeline.

Pipeline steps
--------------
1. Load raw data (from Supabase `raw_reviews` / `raw_social`, or local JSON)
2. Normalise fields (text, dates, ratings)
3. Detect and remove duplicates
4. Detect language and filter if required
5. Enrich records with source metadata
6. Upsert cleaned records into Supabase `clean_data`

Usage
-----
    python -m zara.cleaning.pipeline --source trustpilot
    python -m zara.cleaning.pipeline --source all

Environment
-----------
Requires SUPABASE_URL and SUPABASE_KEY in src/zara/config/.env (or environment).
"""

import argparse
import logging
import os
from typing import Any

from supabase import create_client, Client  # type: ignore

from zara.cleaning.utils import (
    normalise_text,
    remove_html_tags,
    deduplicate_records,
    to_utc_iso,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Supported sources
# ---------------------------------------------------------------------------

SOURCES = [
    "google_reviews",
    "trustpilot",
    "instagram",
    "tiktok",
    "reddit",
    "linkedin",
    "glassdoor",
]

# ---------------------------------------------------------------------------
# Supabase client
# ---------------------------------------------------------------------------


def get_supabase_client() -> Client:
    """
    Initialise Supabase client from environment variables.

    TODO: add retry logic for transient network errors.
    """
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        raise EnvironmentError(
            "SUPABASE_URL and SUPABASE_KEY must be set in the environment."
        )
    return create_client(url, key)


# ---------------------------------------------------------------------------
# Source-specific field normalisers
# ---------------------------------------------------------------------------


def clean_review_record(raw: dict[str, Any], source: str) -> dict[str, Any]:
    """
    Normalise a single raw review record into the `clean_data` schema.

    TODO: implement per-source field mapping (field names differ by actor).
    TODO: add sentiment placeholder field (filled later by analysis agents).
    """
    return {
        "source": source,
        "external_id": raw.get("id") or raw.get("reviewId"),
        "author": raw.get("author") or raw.get("reviewerName"),
        "text": normalise_text(remove_html_tags(raw.get("text", ""))),
        "rating": raw.get("stars") or raw.get("rating"),
        "published_at": to_utc_iso(raw.get("date") or raw.get("publishedAt")),
        "language": raw.get("language"),
        "url": raw.get("url"),
        # TODO: map additional source-specific fields
    }


def clean_social_record(raw: dict[str, Any], source: str) -> dict[str, Any]:
    """
    Normalise a single raw social post record into the `clean_data` schema.

    TODO: implement per-source field mapping (TikTok vs Instagram vs Reddit).
    TODO: extract engagement metrics (likes, shares, comments count).
    """
    return {
        "source": source,
        "external_id": raw.get("id") or raw.get("postId"),
        "author": raw.get("ownerUsername") or raw.get("author"),
        "text": normalise_text(remove_html_tags(raw.get("text", "") or raw.get("caption", ""))),
        "published_at": to_utc_iso(raw.get("timestamp") or raw.get("createdAt")),
        "likes": raw.get("likesCount") or raw.get("likes"),
        "comments": raw.get("commentsCount") or raw.get("comments"),
        "shares": raw.get("sharesCount") or raw.get("shares"),
        "url": raw.get("url"),
        # TODO: map hashtags, mentions, video metadata
    }


# ---------------------------------------------------------------------------
# Pipeline steps
# ---------------------------------------------------------------------------


def load_raw_records(client: Client, source: str) -> list[dict[str, Any]]:
    """
    Fetch unprocessed raw records from Supabase for a given source.

    TODO: add pagination for large result sets (> 1000 rows).
    TODO: filter by `processed = false` flag once schema supports it.
    """
    log.info("Loading raw records for source: %s", source)
    # TODO: switch between raw_reviews and raw_social based on source type
    response = client.table("raw_reviews").select("*").eq("source", source).execute()
    return response.data or []


def process_source(client: Client, source: str) -> int:
    """
    Run the full cleaning pipeline for a single source.

    Returns the number of records upserted.

    TODO: mark raw records as processed after successful upsert.
    TODO: emit metrics / logs to monitoring system.
    """
    raw_records = load_raw_records(client, source)
    log.info("Loaded %d raw records for %s", len(raw_records), source)

    # Normalise
    review_sources = {"google_reviews", "trustpilot", "glassdoor"}
    if source in review_sources:
        cleaned = [clean_review_record(r, source) for r in raw_records]
    else:
        cleaned = [clean_social_record(r, source) for r in raw_records]

    # Deduplicate
    cleaned = deduplicate_records(cleaned, fingerprint_keys=["source", "external_id"])
    log.info("%d unique records after deduplication", len(cleaned))

    # Upsert to Supabase
    if cleaned:
        # TODO: batch upserts (Supabase limit: 1000 rows per request)
        client.table("clean_data").upsert(cleaned, on_conflict="source,external_id").execute()
        log.info("Upserted %d records into clean_data", len(cleaned))

    return len(cleaned)


# ---------------------------------------------------------------------------
# CLI entry-point
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description="BDD3-LICTER data cleaning pipeline")
    parser.add_argument(
        "--source",
        choices=SOURCES + ["all"],
        default="all",
        help="Data source to clean (default: all)",
    )
    args = parser.parse_args()

    # Load .env if present (for local development)
    try:
        from dotenv import load_dotenv  # type: ignore
        load_dotenv(dotenv_path="src/zara/config/.env")
    except ImportError:
        pass

    client = get_supabase_client()

    sources_to_run = SOURCES if args.source == "all" else [args.source]
    total = 0
    for source in sources_to_run:
        total += process_source(client, source)

    log.info("Pipeline complete — %d total records upserted.", total)


if __name__ == "__main__":
    main()
