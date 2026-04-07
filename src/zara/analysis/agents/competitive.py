"""
analysis/agents/competitive.py
================================
Competitive benchmarking agent for BDD3-LICTER.

Compares Zara's sentiment, product health and online reputation metrics
against key competitors scraped from the same platforms.

Competitors tracked
-------------------
- H&M
- Mango
- Uniqlo
- Bershka  (Inditex sister brand)
- Pull&Bear (Inditex sister brand)

Output (competitive table)
---------------------------
- brand            : competitor brand name
- source           : data source
- avg_sentiment    : float — average sentiment score
- review_count     : int
- avg_rating       : float — star rating average (where applicable)
- top_themes       : list[str] — most frequent review themes
- vs_zara_delta    : float — sentiment delta vs Zara (positive = Zara leads)
- summary          : AI-generated competitive positioning statement
- computed_at      : timestamp UTC

Usage
-----
    python -m zara.analysis.agents.competitive
"""

import logging
import os
from datetime import datetime, timezone
from typing import Any

from openai import OpenAI  # type: ignore
from supabase import create_client, Client  # type: ignore

log = logging.getLogger(__name__)

COMPETITORS = ["H&M", "Mango", "Uniqlo", "Bershka", "Pull&Bear"]


class CompetitiveAgent:
    """
    Benchmarks Zara's performance against competitors using shared Supabase data.

    TODO: ensure competitor data is scraped via Apify actors with brand-tagged
          source field in raw_reviews / raw_social.
    TODO: add Share of Voice calculation across social platforms.
    TODO: implement Net Promoter Score proxy from review distribution.
    """

    def __init__(self, supabase: Client, openai_client: OpenAI) -> None:
        self.db = supabase
        self.ai = openai_client

    def fetch_brand_metrics(self, brand: str) -> dict[str, Any]:
        """
        Fetch aggregated sentiment and rating metrics for a given brand.

        TODO: join clean_data with sentiment_scores in a single query.
        TODO: segment by source (Trustpilot rating vs social sentiment).
        """
        # TODO: implement actual brand filtering (requires brand tag in clean_data)
        return {
            "brand": brand,
            "avg_sentiment": 0.0,   # placeholder
            "review_count": 0,      # placeholder
            "avg_rating": 0.0,      # placeholder
            "top_themes": [],       # placeholder
        }

    def fetch_zara_metrics(self) -> dict[str, Any]:
        """
        Fetch Zara's own aggregated metrics for comparison.

        TODO: reuse product_health table aggregates for consistency.
        """
        response = (
            self.db.table("sentiment_scores")
            .select("score")
            .execute()
        )
        scores = [r["score"] for r in (response.data or []) if r.get("score") is not None]
        avg = sum(scores) / len(scores) if scores else 0.0
        return {
            "brand": "Zara",
            "avg_sentiment": avg,
            "review_count": len(scores),
            "avg_rating": 0.0,   # TODO: pull from clean_data rating field
            "top_themes": [],    # TODO: aggregate from sentiment_scores themes
        }

    def generate_competitive_summary(
        self,
        zara: dict[str, Any],
        competitor: dict[str, Any],
    ) -> str:
        """
        Ask OpenAI to write a competitive positioning sentence.

        TODO: include trend data and crisis history for richer context.
        """
        prompt = (
            f"You are a fashion industry analyst. Compare Zara and {competitor['brand']} "
            f"based on these metrics:\n"
            f"- Zara: avg sentiment {zara['avg_sentiment']:.2f}, {zara['review_count']} reviews\n"
            f"- {competitor['brand']}: avg sentiment {competitor['avg_sentiment']:.2f}, "
            f"{competitor['review_count']} reviews\n\n"
            f"Write ONE sentence of competitive positioning advice for Zara's COMEX."
        )
        try:
            response = self.ai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=80,
            )
            return response.choices[0].message.content.strip()
        except Exception as exc:
            log.error("Failed to generate competitive summary: %s", exc)
            return ""

    def run(self) -> int:
        """
        Run the competitive benchmarking agent.

        Returns the number of competitor records upserted.
        """
        zara = self.fetch_zara_metrics()
        log.info("Zara baseline — avg_sentiment: %.2f, reviews: %d",
                 zara["avg_sentiment"], zara["review_count"])

        upserted = 0
        for brand in COMPETITORS:
            competitor = self.fetch_brand_metrics(brand)
            vs_delta = zara["avg_sentiment"] - competitor["avg_sentiment"]
            summary = self.generate_competitive_summary(zara, competitor)

            payload = {
                "brand": brand,
                "source": "multi",
                "avg_sentiment": competitor["avg_sentiment"],
                "review_count": competitor["review_count"],
                "avg_rating": competitor["avg_rating"],
                "top_themes": competitor["top_themes"],
                "vs_zara_delta": round(vs_delta, 4),
                "summary": summary,
                "computed_at": datetime.now(timezone.utc).isoformat(),
            }
            self.db.table("competitive").upsert(payload, on_conflict="brand,source").execute()
            log.info("Upserted competitive data for %s (delta: %.2f)", brand, vs_delta)
            upserted += 1

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
    agent = CompetitiveAgent(supabase=supabase, openai_client=openai_client)
    agent.run()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    main()
