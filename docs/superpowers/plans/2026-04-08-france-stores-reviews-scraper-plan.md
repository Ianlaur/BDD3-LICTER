# France Zara Stores + Google Reviews Scraper — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first real scraper for the project: Python + vanilla Selenium pipeline that enumerates Zara physical stores in France and collects ~50 recent French-language Google Maps reviews per store, writing directly into the `dashboard.Store` / `dashboard.Review` tables the Next.js dashboard already reads.

**Architecture:** Three-phase Python pipeline under `src/zara/scrapers/france/`. Phase 1 fetches the store list from Zara's public locator JSON endpoint (Selenium fallback if the endpoint changes). Phase 2 drives vanilla Chrome Selenium over Google Maps, one store at a time, with polite delays, a persistent Chrome profile, and a `reviews.completed.txt` marker for crash-safe resume. Phase 3 reads the JSONL artifacts, cleans/normalizes in Python, and upserts into Neon Postgres via `psycopg` with per-store transactions.

**Tech Stack:** Python 3.11+, Selenium 4.6+ (no webdriver-manager — built-in Selenium Manager), `psycopg[binary]`, `python-dateutil`, `langdetect`, `python-dotenv`, `cuid==0.4`, `requests`, pytest.

**Spec reference:** `docs/superpowers/specs/2026-04-01-france-stores-reviews-scraper-design.md`

**Working directory:** all paths below are relative to the repo root `/Users/ian/Desktop/BDD3-LICTER/` unless otherwise noted.

---

## File Structure

```
src/zara/scrapers/france/
├── __init__.py              # package marker
├── __main__.py              # argparse dispatcher → phase modules
├── config.py                # paths, delays, URLs, selectors, REPO_ROOT resolver
├── parsing.py               # PURE functions: slugify, date parser, hash, lang gate, star rating
├── browser.py               # Selenium driver factory + polite_sleep + consent handler + captcha detector
├── scrape_stores.py         # Phase 1 — Zara locator JSON + Selenium fallback + Nominatim geocoder
├── scrape_reviews.py        # Phase 2 — Google Maps scraper with resume marker
└── load.py                  # Phase 3 — psycopg upserts to dashboard.Store + dashboard.Review

tests/zara/scrapers/france/
├── __init__.py
├── conftest.py              # repo-root PYTHONPATH shim for pytest discovery
├── test_parsing.py          # TDD coverage for all pure functions in parsing.py
├── test_config.py           # REPO_ROOT resolves to the right place
├── test_scrape_stores.py    # parse_zara_json_response, derive_store_code
└── test_load.py             # build_store_row, build_review_row, language gate behavior

data/raw/france/             # gitignored — created at runtime
├── stores.jsonl
├── stores.errors.jsonl
├── reviews.jsonl
├── reviews.errors.jsonl
├── reviews.completed.txt
├── geocode_cache.json       # populated only on fallback path
├── chrome-profile/          # persistent Selenium user-data-dir
└── captcha-*.png            # screenshots on CAPTCHA detection
```

**File responsibilities (one clear purpose each):**

| File | Responsibility |
| ---- | -------------- |
| `config.py` | Single source of truth for paths, delays, URLs, DOM selectors. Zero imports from other scraper modules. |
| `parsing.py` | Pure, side-effect-free transformations. No I/O, no Selenium. Fully unit-testable. |
| `browser.py` | Selenium driver lifecycle + low-level browser helpers. Zero knowledge of stores/reviews. |
| `scrape_stores.py` | Phase 1 logic: call Zara locator, parse, write JSONL. Imports `config`, `parsing`, `browser`. |
| `scrape_reviews.py` | Phase 2 logic: walk stores, scrape reviews, write JSONL with resume marker. Imports `config`, `parsing`, `browser`. |
| `load.py` | Phase 3 logic: read JSONL, clean, upsert via psycopg. Imports `config`, `parsing`. |
| `__main__.py` | Thin argparse dispatcher. Imports the three phase modules and nothing else. |

---

## Testing Approach

Follow @superpowers:test-driven-development for every pure function in `parsing.py`, `load.py` row builders, and `scrape_stores.py` JSON parsing. Selenium-heavy code (`browser.py`, `scrape_reviews.py`'s DOM walk) is verified by manual smoke tests with `--limit` and `--headless` flags, not unit tests — selectors go stale the moment Google ships a UI tweak, and mocking Selenium produces tests that lie.

**pytest discovery:** there is no `pyproject.toml` in this repo today. Tests rely on a `conftest.py` at the test root that inserts `src/` into `sys.path`. Run tests with:

```bash
cd /Users/ian/Desktop/BDD3-LICTER
PYTHONPATH=src pytest tests/zara/scrapers/france/ -v
```

Apply @superpowers:verification-before-completion before marking any task complete — run the exact command and confirm the output before checking the box.

---

## Chunk 1: Setup, package skeleton, and pure utilities

### Task 1: Add Python dependencies

**Files:**
- Modify: `requirements.txt`

- [ ] **Step 1: Append the three missing dependencies**

The project already has `langdetect`, `python-dotenv`, `python-dateutil`, `requests`, and `pytest`. Append only the new ones at the end of `requirements.txt`:

```
# -----------------------------------------------------------------------------
# Scraper: France stores + Google reviews (src/zara/scrapers/france/)
# -----------------------------------------------------------------------------
selenium>=4.6.0            # built-in Selenium Manager resolves chromedriver
psycopg[binary]>=3.1.18    # sync Postgres driver for the Phase 3 loader
cuid==0.4                  # v1 cuid matches Prisma @default(cuid())
```

- [ ] **Step 2: Install the new deps**

```bash
cd /Users/ian/Desktop/BDD3-LICTER
pip install selenium>=4.6.0 'psycopg[binary]>=3.1.18' cuid==0.4
```

Expected: three "Successfully installed" lines. No errors.

- [ ] **Step 3: Verify imports work**

```bash
cd /Users/ian/Desktop/BDD3-LICTER
python -c "import selenium, psycopg, cuid; print(selenium.__version__, psycopg.__version__, cuid.cuid()[:10])"
```

Expected: version strings + a 10-character cuid prefix. No ImportError.

- [ ] **Step 4: Commit**

```bash
cd /Users/ian/Desktop/BDD3-LICTER
git add requirements.txt
git commit -m "Add selenium, psycopg, cuid deps for France scraper"
```

---

### Task 2: Create package skeleton

**Files:**
- Create: `src/zara/scrapers/__init__.py` (empty, if missing)
- Create: `src/zara/scrapers/france/__init__.py` (empty)
- Create: `src/zara/scrapers/france/config.py` (empty for now)
- Create: `src/zara/scrapers/france/parsing.py` (empty)
- Create: `src/zara/scrapers/france/browser.py` (empty)
- Create: `src/zara/scrapers/france/scrape_stores.py` (empty)
- Create: `src/zara/scrapers/france/scrape_reviews.py` (empty)
- Create: `src/zara/scrapers/france/load.py` (empty)
- Create: `src/zara/scrapers/france/__main__.py` (empty)
- Create: `tests/zara/__init__.py` (empty)
- Create: `tests/zara/scrapers/__init__.py` (empty)
- Create: `tests/zara/scrapers/france/__init__.py` (empty)
- Create: `tests/zara/scrapers/france/conftest.py`

- [ ] **Step 1: Create the scraper package files**

All empty except `conftest.py`. Create them with a one-line module docstring each, e.g. `"""France scraper — phase 1 (stores)."""` so they're not literally zero bytes (makes git blame easier).

- [ ] **Step 2: Create `tests/zara/scrapers/france/conftest.py`**

```python
"""pytest configuration: ensure the `zara` package is importable from src/."""
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]
SRC_DIR = REPO_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))
```

`parents[4]` = `tests/zara/scrapers/france/conftest.py` → `france` → `scrapers` → `zara` → `tests` → repo root. Verify by running the hop count manually.

- [ ] **Step 3: Verify pytest discovery works**

```bash
cd /Users/ian/Desktop/BDD3-LICTER
pytest tests/zara/scrapers/france/ --collect-only
```

Expected: `no tests ran in 0.0Xs` with zero errors. Empty is fine; broken imports are not.

- [ ] **Step 4: Commit**

```bash
git add src/zara/scrapers/france/ src/zara/scrapers/__init__.py tests/zara/
git commit -m "Scaffold france scraper package + test directory"
```

---

### Task 3: `parsing.slugify` (TDD)

Applies to @superpowers:test-driven-development. Red → green → commit on every step.

**Files:**
- Create/Modify: `tests/zara/scrapers/france/test_parsing.py`
- Modify: `src/zara/scrapers/france/parsing.py`

- [ ] **Step 1: Write the failing tests**

Append to `tests/zara/scrapers/france/test_parsing.py`:

```python
"""Unit tests for zara.scrapers.france.parsing (pure functions only)."""
from zara.scrapers.france.parsing import slugify


class TestSlugify:
    def test_lowercases(self):
        assert slugify("PARIS") == "paris"

    def test_strips_accents(self):
        assert slugify("Galère") == "galere"

    def test_replaces_spaces_with_hyphen(self):
        assert slugify("Rue de Rivoli") == "rue-de-rivoli"

    def test_collapses_runs_of_non_alphanum(self):
        assert slugify("A  &  B") == "a-b"

    def test_strips_leading_trailing_hyphens(self):
        assert slugify("---hello---") == "hello"

    def test_empty_input(self):
        assert slugify("") == ""

    def test_all_punctuation(self):
        assert slugify("!!!???") == ""
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd /Users/ian/Desktop/BDD3-LICTER
PYTHONPATH=src pytest tests/zara/scrapers/france/test_parsing.py::TestSlugify -v
```

Expected: `ImportError: cannot import name 'slugify'` or 7 failing tests.

- [ ] **Step 3: Implement `slugify` in `parsing.py`**

Add at the top of `src/zara/scrapers/france/parsing.py`:

```python
"""Pure parsing utilities for the France scraper (no I/O, no Selenium)."""
import re
import unicodedata


def slugify(text: str) -> str:
    """Lowercase, strip accents, replace non-alphanumerics with hyphens.

    Used to build stable Store.code values when the Zara locator does not
    supply a numeric store id (Selenium fallback path).
    """
    if not text:
        return ""
    # Unicode NFKD decomposes accented chars into base + combining marks.
    decomposed = unicodedata.normalize("NFKD", text)
    ascii_only = decomposed.encode("ascii", "ignore").decode("ascii")
    ascii_only = ascii_only.lower()
    # Replace any run of non-alphanumerics with a single hyphen.
    hyphenated = re.sub(r"[^a-z0-9]+", "-", ascii_only)
    return hyphenated.strip("-")
```

- [ ] **Step 4: Run tests — expect pass**

```bash
PYTHONPATH=src pytest tests/zara/scrapers/france/test_parsing.py::TestSlugify -v
```

Expected: `7 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/zara/scrapers/france/parsing.py tests/zara/scrapers/france/test_parsing.py
git commit -m "parsing: add slugify() with accent stripping and hyphen collapsing"
```

---

### Task 4: `parsing.parse_french_relative_date` (TDD)

**Files:**
- Modify: `tests/zara/scrapers/france/test_parsing.py`
- Modify: `src/zara/scrapers/france/parsing.py`

- [ ] **Step 1: Write the failing tests**

Append to `test_parsing.py`:

```python
from datetime import datetime, timezone
from zara.scrapers.france.parsing import parse_french_relative_date


class TestParseFrenchRelativeDate:
    ANCHOR = datetime(2026, 4, 8, 12, 0, 0, tzinfo=timezone.utc)

    def test_days_ago(self):
        result = parse_french_relative_date("il y a 3 jours", anchor=self.ANCHOR)
        assert result == datetime(2026, 4, 5, 12, 0, 0, tzinfo=timezone.utc)

    def test_one_day_singular(self):
        result = parse_french_relative_date("il y a un jour", anchor=self.ANCHOR)
        assert result == datetime(2026, 4, 7, 12, 0, 0, tzinfo=timezone.utc)

    def test_weeks_ago(self):
        result = parse_french_relative_date("il y a 2 semaines", anchor=self.ANCHOR)
        assert result == datetime(2026, 3, 25, 12, 0, 0, tzinfo=timezone.utc)

    def test_one_week_singular(self):
        result = parse_french_relative_date("il y a une semaine", anchor=self.ANCHOR)
        assert result == datetime(2026, 4, 1, 12, 0, 0, tzinfo=timezone.utc)

    def test_months_ago(self):
        result = parse_french_relative_date("il y a 2 mois", anchor=self.ANCHOR)
        assert result == datetime(2026, 2, 8, 12, 0, 0, tzinfo=timezone.utc)

    def test_years_ago(self):
        result = parse_french_relative_date("il y a 1 an", anchor=self.ANCHOR)
        assert result == datetime(2025, 4, 8, 12, 0, 0, tzinfo=timezone.utc)

    def test_years_plural(self):
        result = parse_french_relative_date("il y a 3 ans", anchor=self.ANCHOR)
        assert result == datetime(2023, 4, 8, 12, 0, 0, tzinfo=timezone.utc)

    def test_hours_ago(self):
        result = parse_french_relative_date("il y a 5 heures", anchor=self.ANCHOR)
        assert result == datetime(2026, 4, 8, 7, 0, 0, tzinfo=timezone.utc)

    def test_unparseable_returns_none(self):
        assert parse_french_relative_date("garbage", anchor=self.ANCHOR) is None

    def test_empty_returns_none(self):
        assert parse_french_relative_date("", anchor=self.ANCHOR) is None
```

- [ ] **Step 2: Run — expect failure**

```bash
PYTHONPATH=src pytest tests/zara/scrapers/france/test_parsing.py::TestParseFrenchRelativeDate -v
```

Expected: ImportError.

- [ ] **Step 3: Implement in `parsing.py`**

Append to `src/zara/scrapers/france/parsing.py`:

```python
from datetime import datetime
from dateutil.relativedelta import relativedelta


_FRENCH_WORD_ONE = {"un", "une"}

# Mapping from French unit word → relativedelta kwarg.
_UNIT_MAP = {
    "seconde": "seconds",
    "secondes": "seconds",
    "minute": "minutes",
    "minutes": "minutes",
    "heure": "hours",
    "heures": "hours",
    "jour": "days",
    "jours": "days",
    "semaine": "weeks",
    "semaines": "weeks",
    "mois": "months",
    "an": "years",
    "ans": "years",
}

_RELATIVE_RE = re.compile(
    r"il\s+y\s+a\s+(\d+|un|une)\s+(\w+)",
    re.IGNORECASE,
)


def parse_french_relative_date(text: str, anchor: datetime) -> datetime | None:
    """Convert 'il y a N <unit>' to an absolute datetime anchored on `anchor`.

    Returns None if the input does not match the expected shape. `anchor`
    should be the review's `scraped_at` timestamp so the parse is stable
    across re-runs (see spec, 'externalId derivation' rationale).
    """
    if not text:
        return None
    match = _RELATIVE_RE.search(text.strip().lower())
    if not match:
        return None
    count_raw, unit_raw = match.group(1), match.group(2)
    count = 1 if count_raw in _FRENCH_WORD_ONE else int(count_raw)
    kwarg = _UNIT_MAP.get(unit_raw)
    if kwarg is None:
        return None
    return anchor - relativedelta(**{kwarg: count})
```

- [ ] **Step 4: Run — expect pass**

```bash
PYTHONPATH=src pytest tests/zara/scrapers/france/test_parsing.py::TestParseFrenchRelativeDate -v
```

Expected: `10 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/zara/scrapers/france/parsing.py tests/zara/scrapers/france/test_parsing.py
git commit -m "parsing: parse French relative dates ('il y a N mois') anchored to a timestamp"
```

---

### Task 5: `parsing.compute_external_id` (TDD)

**Files:**
- Modify: `tests/zara/scrapers/france/test_parsing.py`
- Modify: `src/zara/scrapers/france/parsing.py`

- [ ] **Step 1: Write the failing tests**

```python
from zara.scrapers.france.parsing import compute_external_id


class TestComputeExternalId:
    def test_is_32_hex_chars(self):
        result = compute_external_id("ZAR-FR-1", "Jean", "Bon magasin")
        assert len(result) == 32
        assert all(c in "0123456789abcdef" for c in result)

    def test_stable_across_calls(self):
        a = compute_external_id("ZAR-FR-1", "Jean", "Bon magasin")
        b = compute_external_id("ZAR-FR-1", "Jean", "Bon magasin")
        assert a == b

    def test_different_store_gives_different_id(self):
        a = compute_external_id("ZAR-FR-1", "Jean", "Bon magasin")
        b = compute_external_id("ZAR-FR-2", "Jean", "Bon magasin")
        assert a != b

    def test_different_author_gives_different_id(self):
        a = compute_external_id("ZAR-FR-1", "Jean", "Bon magasin")
        b = compute_external_id("ZAR-FR-1", "Marie", "Bon magasin")
        assert a != b

    def test_different_body_gives_different_id(self):
        a = compute_external_id("ZAR-FR-1", "Jean", "Bon magasin")
        b = compute_external_id("ZAR-FR-1", "Jean", "Mauvais magasin")
        assert a != b

    def test_uses_only_first_200_chars_of_body(self):
        # Same first 200 chars, different tail → same id (spec requirement).
        long_1 = "a" * 200 + "tail_one"
        long_2 = "a" * 200 + "tail_two"
        assert compute_external_id("S", "J", long_1) == compute_external_id("S", "J", long_2)

    def test_date_is_not_part_of_the_hash(self):
        # Regression guard: spec explicitly drops date to keep re-scrapes idempotent.
        # No date parameter exists on the function at all.
        import inspect
        sig = inspect.signature(compute_external_id)
        assert "date" not in sig.parameters
        assert "postedAt" not in sig.parameters
```

- [ ] **Step 2: Run — expect failure**

```bash
PYTHONPATH=src pytest tests/zara/scrapers/france/test_parsing.py::TestComputeExternalId -v
```

- [ ] **Step 3: Implement in `parsing.py`**

Append:

```python
import hashlib


def compute_external_id(store_code: str, author: str, body: str) -> str:
    """Return a stable 32-hex-char dedup key for a Google Maps review.

    Deliberately date-free: Google Maps only exposes relative dates, which we
    parse by anchoring to `scraped_at`. If the date were in the hash, every
    re-scrape would produce a different key for the same review and defeat
    the `dashboard.Review (source, externalId)` UNIQUE constraint.

    Collision risk: two different reviews from the same author on the same
    store with the same first 200 characters of body. Vanishingly rare;
    acceptable for hackathon scope.
    """
    payload = f"{store_code}|{author}|{body[:200]}"
    digest = hashlib.sha1(payload.encode("utf-8")).hexdigest()
    return digest[:32]
```

- [ ] **Step 4: Run — expect pass**

Expected: `7 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/zara/scrapers/france/parsing.py tests/zara/scrapers/france/test_parsing.py
git commit -m "parsing: compute_external_id() — date-free SHA-1 dedup key"
```

---

### Task 6: `parsing.detect_review_language` (TDD)

**Files:**
- Modify: `tests/zara/scrapers/france/test_parsing.py`
- Modify: `src/zara/scrapers/france/parsing.py`

- [ ] **Step 1: Write the failing tests**

```python
from zara.scrapers.france.parsing import detect_review_language


class TestDetectReviewLanguage:
    def test_short_body_defaults_to_french(self):
        # < 20 chars: langdetect unreliable, search is geo-scoped to FR.
        assert detect_review_language("Super!") == "fr"
        assert detect_review_language("Nul.") == "fr"
        assert detect_review_language("") == "fr"

    def test_long_french_body_returns_fr(self):
        body = (
            "Le magasin est très bien situé et le personnel est accueillant. "
            "J'ai trouvé tout ce que je cherchais rapidement."
        )
        assert detect_review_language(body) == "fr"

    def test_long_english_body_returns_en(self):
        body = (
            "The store was absolutely fantastic, the staff was friendly and "
            "helpful, and I found everything I was looking for very quickly."
        )
        assert detect_review_language(body) == "en"

    def test_is_deterministic(self):
        body = "Le magasin est correct, rien de spécial à signaler."
        assert detect_review_language(body) == detect_review_language(body)
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement**

Append to `parsing.py`:

```python
from langdetect import detect, DetectorFactory

# Seed the langdetect RNG for deterministic results across runs.
DetectorFactory.seed = 0

_SHORT_BODY_THRESHOLD = 20


def detect_review_language(body: str) -> str:
    """Return an ISO-639-1 code for the review body.

    Bodies shorter than 20 characters bypass langdetect and default to 'fr'
    because (a) langdetect is unreliable on very short text and (b) the
    Google Maps search is geo-scoped to France so short bodies are almost
    certainly French.
    """
    if len(body) < _SHORT_BODY_THRESHOLD:
        return "fr"
    try:
        return detect(body)
    except Exception:
        # langdetect raises LangDetectException on edge cases (no features);
        # fall back to French for the same geo-scope reason.
        return "fr"
```

- [ ] **Step 4: Run — expect pass**

Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/zara/scrapers/france/parsing.py tests/zara/scrapers/france/test_parsing.py
git commit -m "parsing: detect_review_language() with <20-char bypass"
```

---

### Task 7: `parsing.normalize_body` + `parsing.extract_star_rating` (TDD)

**Files:**
- Modify: `tests/zara/scrapers/france/test_parsing.py`
- Modify: `src/zara/scrapers/france/parsing.py`

- [ ] **Step 1: Write the failing tests**

```python
from zara.scrapers.france.parsing import normalize_body, extract_star_rating


class TestNormalizeBody:
    def test_strips_leading_trailing_whitespace(self):
        assert normalize_body("  hello  ") == "hello"

    def test_collapses_runs_of_whitespace(self):
        assert normalize_body("hello    world\n\n\tfoo") == "hello world foo"

    def test_empty_input(self):
        assert normalize_body("") == ""

    def test_only_whitespace(self):
        assert normalize_body("   \n\t  ") == ""

    def test_removes_control_chars(self):
        assert normalize_body("hello\x00world") == "helloworld"


class TestExtractStarRating:
    def test_five_stars(self):
        assert extract_star_rating("5 étoiles") == 5

    def test_five_stars_english(self):
        assert extract_star_rating("5 stars") == 5

    def test_one_star_singular(self):
        assert extract_star_rating("1 étoile") == 1

    def test_float_rating_rounds(self):
        # Some Google Maps DOMs expose "4,5 étoiles"
        assert extract_star_rating("4,5 étoiles") == 4

    def test_missing_returns_none(self):
        assert extract_star_rating("") is None

    def test_garbage_returns_none(self):
        assert extract_star_rating("not a rating") is None
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement**

Append:

```python
_STAR_RE = re.compile(r"(\d+)(?:[,.]\d+)?\s*(?:étoile|étoiles|star|stars)", re.IGNORECASE)


def normalize_body(body: str) -> str:
    """Strip control chars, collapse whitespace, trim."""
    if not body:
        return ""
    # Strip ASCII control chars (\x00-\x1f) except newline/tab, which become spaces below.
    cleaned = "".join(ch for ch in body if ch >= " " or ch in "\n\t")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def extract_star_rating(aria_label: str) -> int | None:
    """Extract an integer 1–5 rating from a Google Maps star aria-label.

    Handles 'N étoile(s)', 'N stars', and 'N,M étoiles' (we truncate to int).
    """
    if not aria_label:
        return None
    match = _STAR_RE.search(aria_label)
    if not match:
        return None
    value = int(match.group(1))
    if 1 <= value <= 5:
        return value
    return None
```

- [ ] **Step 4: Run — expect pass**

Expected: `11 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/zara/scrapers/france/parsing.py tests/zara/scrapers/france/test_parsing.py
git commit -m "parsing: normalize_body() + extract_star_rating()"
```

---

### Task 8: `config.py` — paths, delays, URLs, selectors

**Files:**
- Create: `tests/zara/scrapers/france/test_config.py`
- Modify: `src/zara/scrapers/france/config.py`

- [ ] **Step 1: Write the failing tests**

`tests/zara/scrapers/france/test_config.py`:

```python
"""Tests for config.py: verify REPO_ROOT and file paths resolve correctly."""
from pathlib import Path

from zara.scrapers.france import config


def test_repo_root_contains_src_zara():
    assert (config.REPO_ROOT / "src" / "zara").is_dir()

def test_repo_root_contains_dashboard_env():
    # Phase 3 loads DATABASE_URL from this path.
    assert (config.REPO_ROOT / "src" / "dashboard" / ".env").is_file()

def test_data_dir_is_under_repo_root():
    assert config.DATA_DIR == config.REPO_ROOT / "data" / "raw" / "france"

def test_delays_are_ordered_sanely():
    # Scroll delay < store delay < cooldown.
    assert config.SCROLL_DELAY_MIN_S < config.STORE_DELAY_MIN_S
    assert config.STORE_DELAY_MAX_S < config.COOLDOWN_EVERY_N_STORES_S

def test_reviews_per_store_matches_spec():
    assert config.REVIEWS_PER_STORE == 50
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement `config.py`**

```python
"""Centralized configuration for the France scraper.

Single source of truth for:
  - file paths (derived from REPO_ROOT)
  - polite-scraping delays
  - URL templates for Zara and Google Maps
  - DOM selectors for Phase 2 extraction

Nothing in this file imports from other scraper modules.
"""
from pathlib import Path


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

# parents[4] = config.py → france → scrapers → zara → src → BDD3-LICTER
REPO_ROOT = Path(__file__).resolve().parents[4]

DASHBOARD_ENV = REPO_ROOT / "src" / "dashboard" / ".env"

DATA_DIR = REPO_ROOT / "data" / "raw" / "france"
STORES_JSONL = DATA_DIR / "stores.jsonl"
STORES_ERRORS_JSONL = DATA_DIR / "stores.errors.jsonl"
REVIEWS_JSONL = DATA_DIR / "reviews.jsonl"
REVIEWS_ERRORS_JSONL = DATA_DIR / "reviews.errors.jsonl"
REVIEWS_COMPLETED_TXT = DATA_DIR / "reviews.completed.txt"
GEOCODE_CACHE_JSON = DATA_DIR / "geocode_cache.json"
CHROME_PROFILE_DIR = DATA_DIR / "chrome-profile"
LOAD_ERRORS_JSONL = DATA_DIR / "load.errors.jsonl"


# ---------------------------------------------------------------------------
# Scraping budget
# ---------------------------------------------------------------------------

REVIEWS_PER_STORE = 50
COUNTRY = "FR"


# ---------------------------------------------------------------------------
# Politeness delays (seconds)
# ---------------------------------------------------------------------------

SCROLL_DELAY_MIN_S = 2.0
SCROLL_DELAY_MAX_S = 4.0

STORE_DELAY_MIN_S = 8.0
STORE_DELAY_MAX_S = 15.0

# Every N stores, pause for this many seconds.
COOLDOWN_EVERY_N_STORES = 20
COOLDOWN_EVERY_N_STORES_S = 60.0

# On Phase 2 startup (resume), wait this long before the first navigation.
STARTUP_GRACE_MIN_S = 15.0
STARTUP_GRACE_MAX_S = 30.0


# ---------------------------------------------------------------------------
# URL templates
# ---------------------------------------------------------------------------

# Primary Phase 1 endpoint (may need adjustment at implementation time).
ZARA_LOCATOR_JSON_URL = (
    "https://www.zara.com/itxrest/2/catalog/store/-/physical-stores?"
    "country=FR&lang=en"
)

# Fallback Phase 1 page (Selenium on the rendered locator).
ZARA_LOCATOR_PAGE_URL = "https://www.zara.com/fr/en/stores-locator"

# Phase 2 Google Maps search (format-string: name, city).
GOOGLE_MAPS_SEARCH_URL = "https://www.google.com/maps/search/Zara+{name}+{city}"

# Nominatim geocoder (fallback path only). Requires a descriptive User-Agent.
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_USER_AGENT = "BDD3-LICTER-zara-scraper/1.0 (hackathon, non-commercial)"


# ---------------------------------------------------------------------------
# DOM selectors (Phase 2)
# Tune these first when Google Maps changes layout.
# ---------------------------------------------------------------------------

SEL_FIRST_RESULT = 'a[href*="/maps/place/"]'
SEL_REVIEWS_TAB_ARIA = [
    'button[aria-label*="Avis"]',
    'button[aria-label*="Reviews"]',
]
SEL_REVIEW_CARD = 'div[data-review-id]'
SEL_REVIEW_AUTHOR = '.d4r55'          # keep in one place for fast fixes
SEL_REVIEW_RATING_ARIA = 'span[role="img"][aria-label*="étoile"], span[role="img"][aria-label*="star"]'
SEL_REVIEW_BODY = '.wiI7pd'
SEL_REVIEW_MORE_BUTTON = 'button.w8nwRe'
SEL_REVIEW_RELATIVE_DATE = '.rsqaWe'
SEL_SCROLL_CONTAINER = 'div.m6QErb[tabindex="-1"]'

# Consent walls
SEL_CONSENT_REJECT = [
    'button[aria-label*="Tout refuser"]',
    'button[aria-label*="Reject all"]',
    'button[jsname="tWT92d"]',
]

# CAPTCHA markers
CAPTCHA_URL_MARKER = "/sorry/"
SEL_CAPTCHA = 'form#captcha-form, div#recaptcha'
```

**Note:** The selectors above are educated guesses based on historical Google Maps markup. Expect to tune them in Task 18 once you have a live page loaded. Keeping them here means it's a one-file edit.

- [ ] **Step 4: Run — expect pass**

```bash
PYTHONPATH=src pytest tests/zara/scrapers/france/test_config.py -v
```

Expected: `5 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/zara/scrapers/france/config.py tests/zara/scrapers/france/test_config.py
git commit -m "france scraper: add config.py with paths, delays, URLs, selectors"
```

---

