"""
cleaning/utils.py
=================
Shared utility functions for the data cleaning pipeline.

Responsibilities
----------------
- Text normalisation (lowercasing, punctuation, emoji stripping)
- Language detection helpers
- Deduplication logic
- Date/timestamp standardisation
- Supabase upsert helpers
"""

import re
import hashlib
from datetime import datetime, timezone
from typing import Any

# ---------------------------------------------------------------------------
# Text normalisation
# ---------------------------------------------------------------------------


def normalise_text(text: str) -> str:
    """
    Strip excess whitespace, control characters and normalise unicode.

    TODO: add emoji removal using the `emoji` library.
    TODO: add language detection via `langdetect` or `lingua`.
    """
    if not isinstance(text, str):
        return ""
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    # TODO: strip or transliterate emojis
    # TODO: normalise unicode (unicodedata.normalize)
    return text


def remove_html_tags(text: str) -> str:
    """Remove HTML tags from a string."""
    # TODO: use BeautifulSoup for more robust parsing
    clean = re.compile(r"<[^>]+>")
    return re.sub(clean, "", text)


# ---------------------------------------------------------------------------
# Deduplication
# ---------------------------------------------------------------------------


def compute_fingerprint(record: dict[str, Any], keys: list[str]) -> str:
    """
    Return a stable MD5 fingerprint for a record based on selected keys.

    Used to detect duplicate entries across scraping runs.

    TODO: switch to SHA-256 for stronger collision resistance if needed.
    """
    raw = "|".join(str(record.get(k, "")) for k in sorted(keys))
    return hashlib.md5(raw.encode("utf-8")).hexdigest()


def deduplicate_records(
    records: list[dict[str, Any]], fingerprint_keys: list[str]
) -> list[dict[str, Any]]:
    """
    Remove duplicates from a list of records using fingerprint comparison.

    TODO: cross-reference with Supabase to avoid re-inserting existing rows.
    """
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for record in records:
        fp = compute_fingerprint(record, fingerprint_keys)
        if fp not in seen:
            seen.add(fp)
            unique.append(record)
    return unique


# ---------------------------------------------------------------------------
# Date helpers
# ---------------------------------------------------------------------------


def to_utc_iso(value: Any) -> str | None:
    """
    Attempt to parse a date-like value and return an ISO-8601 UTC string.

    TODO: handle more input formats (epoch ms, locale strings, etc.).
    """
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc).isoformat()
    # TODO: use dateutil.parser.parse for arbitrary string formats
    return str(value)


# ---------------------------------------------------------------------------
# Supabase helpers
# ---------------------------------------------------------------------------


def build_upsert_payload(
    record: dict[str, Any], table: str
) -> dict[str, Any]:
    """
    Wrap a cleaned record in the metadata expected by Supabase upsert calls.

    TODO: add conflict_column parameter to support per-table upsert keys.
    """
    return {
        "table": table,
        "data": record,
        # TODO: set on_conflict to the unique column for each table
    }
