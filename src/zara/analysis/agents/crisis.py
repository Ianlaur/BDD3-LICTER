"""
analysis/agents/crisis.py
==========================
Crisis detection agent for BDD3-LICTER.

Monitors the volume and tone of recent sentiment scores and raw social signals
to identify reputation crises in real-time. When a crisis threshold is breached,
an alert is written to the `alerts` table (picked up by N8N for notifications).

Detection logic
---------------
- Spike detection: abnormal volume increase in negative mentions over a rolling window.
- Keyword detection: presence of crisis keywords (boycott, scandal, fire, safety…).
- Sentiment cliff: average sentiment score drops below a configurable threshold.

Output (alerts table)
---------------------
- source       : data source where the crisis was detected
- severity     : "low" | "medium" | "high" | "critical"
- summary      : AI-generated one-paragraph description of the crisis
- sample_ids   : list of clean_data IDs that triggered the alert
- detected_at  : timestamp UTC
- resolved_at  : nullable timestamp (set manually or by resolution agent)

Usage
-----
    python -m zara.analysis.agents.crisis
"""

import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any

from openai import OpenAI  # type: ignore
from supabase import create_client, Client  # type: ignore

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration constants
# ---------------------------------------------------------------------------

CRISIS_KEYWORDS = [
    "boycott", "scandal", "fire", "safety", "lawsuit", "recall",
    "racist", "sweatshop", "exploitation", "data breach", "toxic",
]

SENTIMENT_CLIFF_THRESHOLD = -0.4   # average score below this triggers alert
VOLUME_SPIKE_MULTIPLIER = 3.0      # 3× normal volume = spike
LOOKBACK_HOURS = 24                # rolling window for spike detection


# ---------------------------------------------------------------------------
# Agent class
# ---------------------------------------------------------------------------


class CrisisAgent:
    """
    Detects reputation crises from sentiment and social data.

    TODO: add Slack / email notification via N8N webhook when severity >= "high".
    TODO: implement time-series comparison against a 30-day rolling baseline.
    TODO: add deduplication to avoid firing duplicate alerts for the same event.
    """

    def __init__(self, supabase: Client, openai_client: OpenAI) -> None:
        self.db = supabase
        self.ai = openai_client

    def fetch_recent_records(self, hours: int = LOOKBACK_HOURS) -> list[dict[str, Any]]:
        """
        Fetch clean records published within the last `hours` hours.

        TODO: filter joined with sentiment_scores for efficiency.
        """
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
        response = (
            self.db.table("clean_data")
            .select("*")
            .gte("published_at", cutoff)
            .execute()
        )
        return response.data or []

    def detect_keyword_crisis(
        self, records: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """
        Return records containing crisis keywords.

        TODO: make keyword list configurable (load from Supabase config table).
        """
        flagged = []
        for record in records:
            text = (record.get("text") or "").lower()
            if any(kw in text for kw in CRISIS_KEYWORDS):
                flagged.append(record)
        return flagged

    def compute_average_sentiment(self, record_ids: list[str]) -> float:
        """
        Return the average sentiment score for a list of clean_data IDs.

        TODO: optimise with a single aggregation query instead of fetching all rows.
        """
        if not record_ids:
            return 0.0
        response = (
            self.db.table("sentiment_scores")
            .select("score")
            .in_("clean_data_id", record_ids)
            .execute()
        )
        scores = [row["score"] for row in (response.data or []) if row.get("score") is not None]
        return sum(scores) / len(scores) if scores else 0.0

    def generate_crisis_summary(
        self, records: list[dict[str, Any]], avg_sentiment: float
    ) -> str:
        """
        Use OpenAI to produce a concise crisis summary paragraph.

        TODO: add language parameter to support multi-language summaries.
        """
        sample_texts = "\n---\n".join(
            (r.get("text") or "")[:300] for r in records[:10]
        )
        prompt = (
            f"You are a reputation crisis analyst for Zara. "
            f"The following {len(records)} social posts/reviews have been flagged "
            f"as potentially crisis-related (average sentiment: {avg_sentiment:.2f}).\n\n"
            f"Texts:\n{sample_texts}\n\n"
            f"Write a concise one-paragraph crisis summary for the COMEX, including: "
            f"nature of the issue, affected topics, estimated severity."
        )
        try:
            response = self.ai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
            )
            return response.choices[0].message.content.strip()
        except Exception as exc:
            log.error("Failed to generate crisis summary: %s", exc)
            return "Crisis summary unavailable."

    def classify_severity(self, count: int, avg_sentiment: float) -> str:
        """
        Heuristic severity classification.

        TODO: refine thresholds based on historical baseline data.
        """
        if count >= 50 or avg_sentiment <= -0.7:
            return "critical"
        if count >= 20 or avg_sentiment <= -0.55:
            return "high"
        if count >= 5 or avg_sentiment <= SENTIMENT_CLIFF_THRESHOLD:
            return "medium"
        return "low"

    def run(self) -> int:
        """
        Run the crisis detection agent.

        Returns the number of alerts fired.
        """
        records = self.fetch_recent_records()
        log.info("Analysing %d recent records for crisis signals", len(records))

        flagged = self.detect_keyword_crisis(records)
        if not flagged:
            log.info("No crisis keywords detected.")
            return 0

        record_ids = [r["id"] for r in flagged if r.get("id")]
        avg_sentiment = self.compute_average_sentiment(record_ids)
        severity = self.classify_severity(len(flagged), avg_sentiment)
        summary = self.generate_crisis_summary(flagged, avg_sentiment)

        alert = {
            "source": "multi",
            "severity": severity,
            "summary": summary,
            "sample_ids": record_ids[:20],
            "detected_at": datetime.now(timezone.utc).isoformat(),
            "resolved_at": None,
        }
        self.db.table("alerts").insert(alert).execute()
        log.info("Crisis alert fired — severity: %s, records: %d", severity, len(flagged))
        return 1


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
    agent = CrisisAgent(supabase=supabase, openai_client=openai_client)
    agent.run()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    main()
