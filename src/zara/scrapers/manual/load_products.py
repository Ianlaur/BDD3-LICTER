"""Load hand-curated Zara products + multi-source reviews into the dashboard DB.

Reads `data/manual/products_demo.json`, parses French relative dates, generates
Prisma-compatible cuids, and upserts into `dashboard.Product` and
`dashboard.ProductReview` in the same Neon Postgres the Next.js dashboard reads
via Prisma.

Usage:
    PYTHONPATH=src python3 -m zara.scrapers.manual.load_products
    PYTHONPATH=src python3 -m zara.scrapers.manual.load_products --clean-products
    PYTHONPATH=src python3 -m zara.scrapers.manual.load_products --dry-run

Flags:
    --clean-products  Wipe ALL existing products + their reviews before insert.
    --dry-run         Parse and validate the JSON but don't touch the DB.

Sentiment: polarity + label are derived inline from the star rating (1-2 →
negative, 3 → neutral, 4-5 → positive). This is a stand-in until the real
sentiment agent runs.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from cuid import cuid
from dotenv import load_dotenv

import psycopg

from zara.scrapers.manual.load_france import parse_french_relative_date

# ---------------------------------------------------------------------------
# Paths / logging
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parents[4]
DASHBOARD_ENV = REPO_ROOT / "src" / "dashboard" / ".env"
DEFAULT_INPUT = REPO_ROOT / "data" / "manual" / "products_demo.json"

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("manual.load_products")

# Rating → (polarity, label) — same mapping as load_france.
_RATING_TO_SENTIMENT: dict[int, tuple[float, str]] = {
    1: (-0.8, "negative"),
    2: (-0.4, "negative"),
    3: (0.0, "neutral"),
    4: (0.4, "positive"),
    5: (0.8, "positive"),
}

# ---------------------------------------------------------------------------
# JSON loading
# ---------------------------------------------------------------------------


def load_input(path: Path) -> tuple[list[dict], list[dict]]:
    """Read the JSON file, strip `_comment` markers, return (products, reviews)."""
    with path.open("r", encoding="utf-8") as fh:
        raw = json.load(fh)

    cleaned = {k: v for k, v in raw.items() if not k.startswith("_")}
    products = cleaned.get("products", [])
    reviews = [r for r in cleaned.get("reviews", []) if "_comment" not in r]

    log.info("Loaded %d products, %d reviews from %s", len(products), len(reviews), path)
    return products, reviews


# ---------------------------------------------------------------------------
# DB
# ---------------------------------------------------------------------------


def get_database_url() -> str:
    load_dotenv(DASHBOARD_ENV)
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise SystemExit(f"DATABASE_URL not found in {DASHBOARD_ENV}")
    return url


def clean_products(conn: psycopg.Connection) -> None:
    """DELETE all products + their reviews (cascades via FK onDelete: Cascade)."""
    with conn.cursor() as cur:
        cur.execute('DELETE FROM dashboard."ProductReview"')
        deleted_reviews = cur.rowcount
        cur.execute('DELETE FROM dashboard."Product"')
        deleted_products = cur.rowcount
    conn.commit()
    log.info(
        "Cleaned products: deleted %d products, %d reviews",
        deleted_products,
        deleted_reviews,
    )


def upsert_product(conn: psycopg.Connection, product: dict) -> str:
    """Upsert one product row. Returns its `id`."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO dashboard."Product"
              (id, code, name, category, color, "priceEur", description, "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            ON CONFLICT (code) DO UPDATE SET
              name        = EXCLUDED.name,
              category    = EXCLUDED.category,
              color       = EXCLUDED.color,
              "priceEur"  = EXCLUDED."priceEur",
              description = EXCLUDED.description,
              "updatedAt" = NOW()
            RETURNING id
            """,
            (
                cuid(),
                product["code"],
                product["name"],
                product["category"],
                product.get("color"),
                product.get("priceEur"),
                product.get("description"),
            ),
        )
        product_id = cur.fetchone()[0]
    conn.commit()
    return product_id


def insert_product_review(
    conn: psycopg.Connection,
    review: dict,
    product_id: str,
    anchor: datetime,
) -> str:
    """Insert one product review. Returns 'inserted' | 'skipped' | 'dropped'."""
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
    payload = f"{review['product_code']}|{review.get('source', '')}|{review.get('author', '')}|{body[:200]}"
    external_id = hashlib.sha1(payload.encode("utf-8")).hexdigest()[:32]

    rating = int(review["rating"]) if review.get("rating") is not None else None
    polarity, label = _RATING_TO_SENTIMENT.get(rating or 3, (0.0, "neutral"))

    # Language guess from source convention: Reddit + English usernames → en,
    # everything else → fr. The demo data is mostly French with a few English
    # Reddit reviews. We keep this simple rather than pulling in langdetect.
    language = "en" if review.get("source") == "reddit" and not any(
        c in body for c in "àâçéèêëîïôùûü"
    ) else "fr"

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO dashboard."ProductReview"
              (id, source, "externalId", author, rating, body, language, url,
               "postedAt", "collectedAt", polarity, label, "productId")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s, %s, %s)
            ON CONFLICT (source, "externalId") DO NOTHING
            """,
            (
                cuid(),
                review["source"],
                external_id,
                review.get("author"),
                rating,
                body,
                language,
                review.get("url") or None,
                posted,
                polarity,
                label,
                product_id,
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
    parser.add_argument("--clean-products", action="store_true",
                        help="DELETE all products+reviews before inserting")
    parser.add_argument("--dry-run", action="store_true",
                        help="Parse and validate but do not touch the DB")
    args = parser.parse_args()

    if not args.input.exists():
        log.error("Input file not found: %s", args.input)
        return 1

    products, reviews = load_input(args.input)
    if not products:
        log.error("No products in input file — nothing to do")
        return 1

    known_codes = {p["code"] for p in products}
    bad = [r for r in reviews if r.get("product_code") not in known_codes]
    if bad:
        log.error("%d reviews reference unknown product_code:", len(bad))
        for r in bad[:5]:
            log.error("  - %s by %s", r.get("product_code"), r.get("author"))
        return 1

    if args.dry_run:
        log.info("[dry-run] would upsert %d products and %d reviews",
                 len(products), len(reviews))
        return 0

    db_url = get_database_url()
    log.info("Connecting to %s", db_url.split("@")[1].split("/")[0])

    counts = {"inserted": 0, "skipped": 0, "dropped": 0, "products_upserted": 0}

    with psycopg.connect(db_url) as conn:
        if args.clean_products:
            clean_products(conn)

        code_to_id: dict[str, str] = {}
        for product in products:
            product_id = upsert_product(conn, product)
            code_to_id[product["code"]] = product_id
            counts["products_upserted"] += 1
        log.info("Products upserted: %d", counts["products_upserted"])

        anchor = datetime.now(timezone.utc)
        for review in reviews:
            product_id = code_to_id[review["product_code"]]
            try:
                outcome = insert_product_review(conn, review, product_id, anchor)
                counts[outcome] += 1
            except Exception as exc:
                log.exception("Failed to insert review by %s: %s", review.get("author"), exc)
                conn.rollback()
                counts["dropped"] += 1
            else:
                conn.commit()

    log.info("--- Load complete ---")
    log.info("  Products upserted: %d", counts["products_upserted"])
    log.info("  Reviews inserted: %d", counts["inserted"])
    log.info("  Reviews skipped (already in DB): %d", counts["skipped"])
    log.info("  Reviews dropped (empty/error): %d", counts["dropped"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
