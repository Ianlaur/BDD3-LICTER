"""Load hand-curated French Zara stores + Google Maps reviews into the dashboard DB.

Reads `data/manual/france_demo.json`, parses French relative dates, generates
Prisma-compatible cuids, and upserts into `dashboard.Store` and `dashboard.Review`
in the same Neon Postgres the Next.js dashboard reads via Prisma.

Usage:
    PYTHONPATH=src python3 -m zara.scrapers.manual.load_france
    PYTHONPATH=src python3 -m zara.scrapers.manual.load_france --clean-france
    PYTHONPATH=src python3 -m zara.scrapers.manual.load_france --dry-run

Flags:
    --clean-france  Wipe ALL existing France stores + their reviews before insert.
                    Use this once to remove the seed data; subsequent runs are
                    upserts and don't need it.
    --dry-run       Parse and validate the JSON but don't touch the DB.

Spec / context: docs/superpowers/specs/2026-04-01-france-stores-reviews-scraper-design.md
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from cuid import cuid
from dateutil.relativedelta import relativedelta
from dotenv import load_dotenv

import psycopg

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

# parents[4] = load_france.py → manual → scrapers → zara → src → REPO_ROOT
REPO_ROOT = Path(__file__).resolve().parents[4]
DASHBOARD_ENV = REPO_ROOT / "src" / "dashboard" / ".env"
DEFAULT_INPUT = REPO_ROOT / "data" / "manual" / "france_demo.json"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("manual.load_france")

# ---------------------------------------------------------------------------
# French relative-date parser
# ---------------------------------------------------------------------------

_FRENCH_ONE = {"un", "une"}
_UNIT_MAP = {
    "seconde": "seconds", "secondes": "seconds",
    "minute": "minutes", "minutes": "minutes",
    "heure": "hours",   "heures": "hours",
    "jour": "days",     "jours": "days",
    "semaine": "weeks", "semaines": "weeks",
    "mois": "months",
    "an": "years",      "ans": "years",
}
_REL_RE = re.compile(r"il\s+y\s+a\s+(\d+|un|une)\s+(\w+)", re.IGNORECASE)


def parse_french_relative_date(text: str, anchor: datetime) -> datetime | None:
    """Convert 'il y a N <unit>' to absolute datetime, anchored on `anchor`.

    Returns None if the input does not match the expected shape.
    """
    if not text:
        return None
    match = _REL_RE.search(text.strip().lower())
    if not match:
        return None
    count_raw, unit_raw = match.group(1), match.group(2)
    count = 1 if count_raw in _FRENCH_ONE else int(count_raw)
    kwarg = _UNIT_MAP.get(unit_raw)
    if kwarg is None:
        return None
    return anchor - relativedelta(**{kwarg: count})


# ---------------------------------------------------------------------------
# JSON loading + validation
# ---------------------------------------------------------------------------


def _drop_underscore_keys(obj: Any) -> Any:
    """Recursively drop keys starting with '_' (used for inline comments)."""
    if isinstance(obj, dict):
        return {k: _drop_underscore_keys(v) for k, v in obj.items() if not k.startswith("_")}
    if isinstance(obj, list):
        return [_drop_underscore_keys(v) for v in obj if not (isinstance(v, dict) and any(k.startswith("_") for k in v))]
    return obj


def load_input(path: Path) -> tuple[list[dict], list[dict]]:
    """Read the JSON file, strip comment keys, return (stores, reviews)."""
    with path.open("r", encoding="utf-8") as fh:
        raw = json.load(fh)

    # Drop top-level keys starting with '_'
    cleaned = {k: v for k, v in raw.items() if not k.startswith("_")}

    stores = cleaned.get("stores", [])
    # Drop reviews that have a '_comment' marker (the example placeholders)
    reviews = [r for r in cleaned.get("reviews", []) if "_comment" not in r]

    log.info("Loaded %d stores, %d reviews from %s", len(stores), len(reviews), path)
    return stores, reviews


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------


def get_database_url() -> str:
    load_dotenv(DASHBOARD_ENV)
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise SystemExit(f"DATABASE_URL not found in {DASHBOARD_ENV}")
    return url


def clean_france(conn: psycopg.Connection) -> None:
    """DELETE all France stores + their reviews. Use only when nuking seed data."""
    with conn.cursor() as cur:
        cur.execute(
            'DELETE FROM dashboard."Review" WHERE "storeId" IN '
            '(SELECT id FROM dashboard."Store" WHERE country = %s)',
            ("FR",),
        )
        deleted_reviews = cur.rowcount
        cur.execute('DELETE FROM dashboard."Store" WHERE country = %s', ("FR",))
        deleted_stores = cur.rowcount
    conn.commit()
    log.info("Cleaned France: deleted %d stores, %d reviews", deleted_stores, deleted_reviews)


def upsert_store(conn: psycopg.Connection, store: dict) -> str:
    """Upsert one store row. Returns its `id`."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO dashboard."Store"
              (id, code, name, city, country, address, lat, lng, "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, 'FR', %s, %s, %s, NOW(), NOW())
            ON CONFLICT (code) DO UPDATE SET
              name      = EXCLUDED.name,
              city      = EXCLUDED.city,
              address   = EXCLUDED.address,
              lat       = EXCLUDED.lat,
              lng       = EXCLUDED.lng,
              "updatedAt" = NOW()
            RETURNING id
            """,
            (
                cuid(),
                store["code"],
                store["name"],
                store["city"],
                store.get("address"),
                float(store["lat"]),
                float(store["lng"]),
            ),
        )
        store_id = cur.fetchone()[0]
    conn.commit()
    return store_id


# Rating → (polarity, label) mapping used to derive demo sentiment from the
# star rating when no real sentiment-analysis agent has been run yet. This is
# a pragmatic stand-in: the dashboard's sentiment breakdown and per-country
# bar both join on SentimentScore, so without this step the 75 France
# reviews would never appear in those panels.
_RATING_TO_SENTIMENT: dict[int, tuple[float, str]] = {
    1: (-0.8, "negative"),
    2: (-0.4, "negative"),
    3: (0.0, "neutral"),
    4: (0.4, "positive"),
    5: (0.8, "positive"),
}


def derive_sentiment_from_ratings(conn: psycopg.Connection) -> int:
    """Insert a SentimentScore row for any France review that doesn't have one."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT r.id, r."storeId", r.rating
            FROM dashboard."Review" r
            JOIN dashboard."Store" s ON s.id = r."storeId"
            LEFT JOIN dashboard."SentimentScore" ss ON ss."reviewId" = r.id
            WHERE s.country = 'FR' AND ss.id IS NULL
            """
        )
        missing = cur.fetchall()

        inserted = 0
        for review_id, store_id, rating in missing:
            polarity, label = _RATING_TO_SENTIMENT.get(rating or 3, (0.0, "neutral"))
            cur.execute(
                """
                INSERT INTO dashboard."SentimentScore"
                  (id, "reviewId", "storeId", polarity, confidence, label, topics, "createdAt")
                VALUES (%s, %s, %s, %s, 0.6, %s, ARRAY[]::text[], NOW())
                ON CONFLICT ("reviewId") DO NOTHING
                """,
                (cuid(), review_id, store_id, polarity, label),
            )
            inserted += cur.rowcount
    conn.commit()
    return inserted


def insert_review(
    conn: psycopg.Connection,
    review: dict,
    store_id: str,
    anchor: datetime,
) -> str:
    """Insert one review. Returns 'inserted' | 'skipped' | 'dropped'."""
    body = (review.get("body") or "").strip()
    if not body:
        return "dropped"

    posted = parse_french_relative_date(review.get("posted_relative", ""), anchor)
    if posted is None:
        log.warning(
            "Could not parse date '%s' for review by %s — using anchor",
            review.get("posted_relative"),
            review.get("author"),
        )
        posted = anchor

    # Date-free dedup hash so re-runs are idempotent.
    import hashlib
    payload = f"{review['store_code']}|{review.get('author', '')}|{body[:200]}"
    external_id = hashlib.sha1(payload.encode("utf-8")).hexdigest()[:32]

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO dashboard."Review"
              (id, source, "externalId", author, rating, body, language, url, "postedAt", "collectedAt", "storeId")
            VALUES (%s, 'google', %s, %s, %s, %s, 'fr', %s, %s, NOW(), %s)
            ON CONFLICT (source, "externalId") DO NOTHING
            """,
            (
                cuid(),
                external_id,
                review.get("author"),
                int(review["rating"]) if review.get("rating") is not None else None,
                body,
                review.get("url") or None,
                posted,
                store_id,
            ),
        )
        return "inserted" if cur.rowcount > 0 else "skipped"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT,
                        help=f"Input JSON file (default: {DEFAULT_INPUT})")
    parser.add_argument("--clean-france", action="store_true",
                        help="DELETE all France stores+reviews before inserting")
    parser.add_argument("--dry-run", action="store_true",
                        help="Parse and validate but do not touch the DB")
    args = parser.parse_args()

    if not args.input.exists():
        log.error("Input file not found: %s", args.input)
        return 1

    stores, reviews = load_input(args.input)
    if not stores:
        log.error("No stores in input file — nothing to do")
        return 1

    # Sanity-check: every review references a known store_code
    known_codes = {s["code"] for s in stores}
    bad = [r for r in reviews if r.get("store_code") not in known_codes]
    if bad:
        log.error("%d reviews reference unknown store_code:", len(bad))
        for r in bad[:5]:
            log.error("  - %s by %s", r.get("store_code"), r.get("author"))
        return 1

    if args.dry_run:
        log.info("[dry-run] would upsert %d stores and %d reviews",
                 len(stores), len(reviews))
        # Spot-check date parsing
        anchor = datetime.now(timezone.utc)
        for r in reviews[:3]:
            parsed = parse_french_relative_date(r.get("posted_relative", ""), anchor)
            log.info("  date check: '%s' → %s",
                     r.get("posted_relative"), parsed.isoformat() if parsed else "FAILED")
        return 0

    db_url = get_database_url()
    log.info("Connecting to %s", db_url.split("@")[1].split("/")[0])

    counts = {"inserted": 0, "skipped": 0, "dropped": 0, "stores_upserted": 0}

    with psycopg.connect(db_url) as conn:
        if args.clean_france:
            clean_france(conn)

        # Upsert stores, build code → id map
        code_to_id: dict[str, str] = {}
        for store in stores:
            store_id = upsert_store(conn, store)
            code_to_id[store["code"]] = store_id
            counts["stores_upserted"] += 1
        log.info("Stores upserted: %d", counts["stores_upserted"])

        # Insert reviews
        anchor = datetime.now(timezone.utc)
        for review in reviews:
            store_id = code_to_id[review["store_code"]]
            try:
                outcome = insert_review(conn, review, store_id, anchor)
                counts[outcome] += 1
            except Exception as exc:
                log.exception("Failed to insert review by %s: %s", review.get("author"), exc)
                conn.rollback()
                counts["dropped"] += 1
            else:
                conn.commit()

        # Derive demo SentimentScore rows from star ratings so the France
        # reviews flow through the dashboard's sentiment-breakdown, per-country
        # bar, and store ranking. This is a stand-in until the real sentiment
        # agent runs.
        sentiment_count = derive_sentiment_from_ratings(conn)

    log.info("--- Load complete ---")
    log.info("  Stores upserted: %d", counts["stores_upserted"])
    log.info("  Reviews inserted: %d", counts["inserted"])
    log.info("  Reviews skipped (already in DB): %d", counts["skipped"])
    log.info("  Reviews dropped (empty/error): %d", counts["dropped"])
    log.info("  Sentiment scores derived: %d", sentiment_count)
    return 0


if __name__ == "__main__":
    sys.exit(main())
