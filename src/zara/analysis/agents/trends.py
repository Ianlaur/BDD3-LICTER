"""
analysis/agents/trends.py
==========================
Trend detection agent for BDD3-LICTER.

Identifies rising topics, hashtags, and keywords across all social sources
over configurable time windows. Results are written to the `trends` table and
surfaced on the Antigravity dashboard as a trend radar.

Detection approach
------------------
1. Extract n-grams and hashtags from clean_data (last 7 days vs previous 7 days).
2. Compute frequency deltas to surface rising terms.
3. Use OpenAI to cluster related terms into coherent trend narratives.
4. Store top trends with velocity scores in the `trends` table.

Output (trends table)
---------------------
- term         : keyword or hashtag
- source       : data source (or "multi" for cross-source trends)
- frequency    : int — occurrences in the current window
- velocity     : float — frequency delta vs previous window (positive = rising)
- narrative    : AI-generated 1-sentence trend description
- window_start : timestamp UTC
- window_end   : timestamp UTC
- computed_at  : timestamp UTC

Usage
-----
    python -m zara.analysis.agents.trends
"""

import logging
import os
import re
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any

from openai import OpenAI  # type: ignore
from supabase import create_client, Client  # type: ignore

log = logging.getLogger(__name__)

WINDOW_DAYS = 7          # current analysis window in days
TOP_N_TERMS = 20         # number of top terms to store per run
MIN_FREQUENCY = 3        # ignore terms appearing fewer than N times


class TrendAgent:
    """
    Detects and ranks trending topics across Zara's social data.

    TODO: implement hashtag extraction (#zara, #zarahaul, etc.).
    TODO: add Named Entity Recognition (NER) to surface product names.
    TODO: support multi-language trend detection (FR, ES, EN at minimum).
    TODO: integrate TikTok sound/audio trend detection.
    """

    def __init__(self, supabase: Client, openai_client: OpenAI) -> None:
        self.db = supabase
        self.ai = openai_client

    def fetch_records_in_window(
        self, start: datetime, end: datetime
    ) -> list[dict[str, Any]]:
        """
        Fetch clean records published between `start` and `end`.

        TODO: add source filter for source-specific trend analysis.
        """
        response = (
            self.db.table("clean_data")
            .select("text, source")
            .gte("published_at", start.isoformat())
            .lte("published_at", end.isoformat())
            .execute()
        )
        return response.data or []

    def extract_terms(self, records: list[dict[str, Any]]) -> Counter:
        """
        Extract word unigrams and bigrams from record texts.

        TODO: add stopword removal per language (NLTK or spaCy).
        TODO: extract hashtags separately with # prefix.
        TODO: add trigrams for multi-word brand/product names.
        """
        counter: Counter = Counter()
        stopwords = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
            "for", "of", "with", "is", "it", "this", "that", "was", "are",
            "be", "have", "has", "had", "do", "did", "not", "from", "i",
            "my", "me", "we", "you", "they", "their", "its", "zara",
        }
        for record in records:
            text = (record.get("text") or "").lower()
            words = re.findall(r"\b[a-z]{3,}\b", text)
            words = [w for w in words if w not in stopwords]
            counter.update(words)
            # Bigrams
            bigrams = [f"{words[i]}_{words[i+1]}" for i in range(len(words) - 1)]
            counter.update(bigrams)
        return counter

    def generate_narrative(self, term: str, sample_texts: list[str]) -> str:
        """
        Use OpenAI to generate a concise trend narrative for a term.

        TODO: batch multiple terms in a single API call to reduce costs.
        """
        sample = "\n".join(sample_texts[:5])
        prompt = (
            f"You are a fashion trend analyst. The term '{term}' is trending in "
            f"Zara customer reviews and social media. Based on the following examples, "
            f"write ONE sentence describing what this trend means for Zara:\n\n{sample}"
        )
        try:
            response = self.ai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=80,
            )
            return response.choices[0].message.content.strip()
        except Exception as exc:
            log.error("Failed to generate narrative for term '%s': %s", term, exc)
            return ""

    def run(self) -> int:
        """
        Run the trend agent for the current and previous windows.

        Returns the number of trend records upserted.
        """
        now = datetime.now(timezone.utc)
        current_end = now
        current_start = now - timedelta(days=WINDOW_DAYS)
        previous_start = current_start - timedelta(days=WINDOW_DAYS)

        current_records = self.fetch_records_in_window(current_start, current_end)
        previous_records = self.fetch_records_in_window(previous_start, current_start)

        log.info(
            "Trend window: %d current records, %d previous records",
            len(current_records), len(previous_records),
        )

        current_counts = self.extract_terms(current_records)
        previous_counts = self.extract_terms(previous_records)

        # Compute velocity (frequency delta, normalised)
        all_terms = set(list(current_counts.keys())[:200])
        velocities = {}
        for term in all_terms:
            curr = current_counts[term]
            prev = previous_counts.get(term, 0)
            if curr < MIN_FREQUENCY:
                continue
            velocity = curr - prev  # TODO: normalise by total volume
            velocities[term] = (curr, velocity)

        top_terms = sorted(velocities.items(), key=lambda x: x[1][1], reverse=True)[:TOP_N_TERMS]

        upserted = 0
        for term, (freq, velocity) in top_terms:
            # Find sample texts containing the term
            samples = [
                r["text"] for r in current_records
                if term.replace("_", " ") in (r.get("text") or "").lower()
            ][:5]
            narrative = self.generate_narrative(term, samples) if samples else ""

            payload = {
                "term": term,
                "source": "multi",
                "frequency": freq,
                "velocity": float(velocity),
                "narrative": narrative,
                "window_start": current_start.isoformat(),
                "window_end": current_end.isoformat(),
                "computed_at": now.isoformat(),
            }
            self.db.table("trends").upsert(payload, on_conflict="term,window_start").execute()
            upserted += 1

        log.info("Trend agent complete — %d trends upserted.", upserted)
        return upserted


# ---------------------------------------------------------------------------
# CLI entry-point
# ---------------------------------------------------------------------------


def main() -> None:
    try:
        from dotenv import load_dotenv  # type: ignore
        load_dotenv(dotenv_path="src/zara/config/.env")
    except ImportError:
        pass

    supabase = create_client(
        os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"]
    )
    openai_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    agent = TrendAgent(supabase=supabase, openai_client=openai_client)
    agent.run()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    main()
