"""
analysis/agents/sentiment.py
=============================
Sentiment analysis agent for BDD3-LICTER.

For each cleaned record in Supabase `clean_data` that has not yet been scored,
this agent calls the OpenAI API to classify sentiment and writes results to
the `sentiment_scores` table.

Output schema (sentiment_scores)
---------------------------------
- clean_data_id   : FK → clean_data.id
- label           : "positive" | "neutral" | "negative"
- score           : float in [-1.0, 1.0]
- confidence      : float in [0.0, 1.0]
- themes          : list[str] — extracted topics (e.g. ["quality", "price"])
- analysed_at     : timestamp UTC

Usage
-----
    python -m zara.analysis.agents.sentiment
"""

import logging
import os
from typing import Any

from openai import OpenAI  # type: ignore
from supabase import create_client, Client  # type: ignore

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prompt template
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """
You are a sentiment analysis expert for fashion retail brand intelligence.
Analyse the provided customer review or social media post about Zara.

Return a JSON object with the following fields:
- label: "positive", "neutral", or "negative"
- score: a float between -1.0 (very negative) and 1.0 (very positive)
- confidence: a float between 0.0 and 1.0
- themes: a list of up to 5 topic keywords extracted from the text
  (e.g. "quality", "price", "sizing", "customer_service", "sustainability")
"""


# ---------------------------------------------------------------------------
# Agent class
# ---------------------------------------------------------------------------


class SentimentAgent:
    """
    Scores sentiment for unprocessed records in the `clean_data` table.

    TODO: add batch processing to reduce API call overhead (use embeddings
          or a fine-tuned classifier for high-volume workloads).
    TODO: implement retry logic with exponential backoff for rate limit errors.
    TODO: add a `processed` flag / separate tracking table to avoid re-scoring.
    """

    def __init__(self, supabase: Client, openai_client: OpenAI) -> None:
        self.db = supabase
        self.ai = openai_client

    def fetch_unscored_records(self, limit: int = 100) -> list[dict[str, Any]]:
        """
        Return up to `limit` clean records that have no sentiment score yet.

        TODO: use a LEFT JOIN or subquery to exclude already-scored IDs.
        TODO: add source filter so the agent can be run per-source.
        """
        response = self.db.table("clean_data").select("*").limit(limit).execute()
        return response.data or []

    def score_record(self, record: dict[str, Any]) -> dict[str, Any] | None:
        """
        Call OpenAI to score a single record.

        Returns a dict ready to upsert into `sentiment_scores`, or None on error.

        TODO: switch to structured outputs (response_format={"type":"json_object"})
              when available for the chosen model.
        """
        text = record.get("text", "")
        if not text:
            return None

        try:
            response = self.ai.chat.completions.create(
                model="gpt-4o-mini",  # TODO: make model configurable via env var
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Text to analyse:\n\n{text[:2000]}"},
                ],
                response_format={"type": "json_object"},
                temperature=0,
            )
            import json
            result = json.loads(response.choices[0].message.content)
            return {
                "clean_data_id": record["id"],
                "label": result.get("label"),
                "score": result.get("score"),
                "confidence": result.get("confidence"),
                "themes": result.get("themes", []),
            }
        except Exception as exc:
            log.error("Failed to score record %s: %s", record.get("id"), exc)
            return None

    def run(self, limit: int = 100) -> int:
        """
        Run the sentiment agent on up to `limit` unscored records.

        Returns the count of records successfully scored.
        """
        records = self.fetch_unscored_records(limit=limit)
        log.info("Scoring %d records", len(records))
        scored = 0
        for record in records:
            payload = self.score_record(record)
            if payload:
                self.db.table("sentiment_scores").upsert(
                    payload, on_conflict="clean_data_id"
                ).execute()
                scored += 1
        log.info("Sentiment agent complete — %d records scored.", scored)
        return scored


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
    agent = SentimentAgent(supabase=supabase, openai_client=openai_client)
    agent.run()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    main()
