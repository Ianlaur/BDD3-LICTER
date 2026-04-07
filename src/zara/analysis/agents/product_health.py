"""
analysis/agents/product_health.py
===================================
Product health scoring agent for BDD3-LICTER.

Aggregates sentiment scores and review signals at the product/category level
to produce a composite Product Health Score (PHS) written to the
`product_health` table and surfaced on the Antigravity dashboard.

Scoring dimensions
------------------
- Quality perception   (from review themes: "quality", "material", "durability")
- Price perception     (from review themes: "price", "value", "expensive")
- Fit / sizing         (from review themes: "sizing", "fit", "size")
- Customer service     (from review themes: "customer_service", "return", "support")
- Trend relevance      (from social themes: "trendy", "fashion", "style")

Output (product_health table)
------------------------------
- category         : product category (e.g. "denim", "knitwear", "accessories")
- phs              : float in [0, 100] — composite health score
- quality_score    : float component
- price_score      : float component
- fit_score        : float component
- service_score    : float component
- trend_score      : float component
- review_count     : int — number of reviews used for calculation
- computed_at      : timestamp UTC

Usage
-----
    python -m zara.analysis.agents.product_health
"""

import logging
import os
from datetime import datetime, timezone
from typing import Any

from openai import OpenAI  # type: ignore
from supabase import create_client, Client  # type: ignore

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Theme → dimension mapping
# ---------------------------------------------------------------------------

DIMENSION_THEMES: dict[str, list[str]] = {
    "quality":  ["quality", "material", "durability", "fabric", "stitching"],
    "price":    ["price", "value", "expensive", "cheap", "affordable"],
    "fit":      ["sizing", "fit", "size", "small", "large", "tight"],
    "service":  ["customer_service", "return", "support", "refund", "delivery"],
    "trend":    ["trendy", "fashion", "style", "aesthetic", "design"],
}

# Dimension weights for composite PHS (must sum to 1.0)
DIMENSION_WEIGHTS: dict[str, float] = {
    "quality": 0.30,
    "price":   0.20,
    "fit":     0.20,
    "service": 0.15,
    "trend":   0.15,
}


# ---------------------------------------------------------------------------
# Agent class
# ---------------------------------------------------------------------------


class ProductHealthAgent:
    """
    Computes a Product Health Score per category from sentiment themes.

    TODO: implement category extraction from review text (NLP or keyword match).
    TODO: add time-series storage to track PHS evolution week-over-week.
    TODO: trigger a crisis alert if PHS drops > 15 points in one week.
    """

    def __init__(self, supabase: Client, openai_client: OpenAI) -> None:
        self.db = supabase
        self.ai = openai_client

    def fetch_sentiment_with_themes(self) -> list[dict[str, Any]]:
        """
        Fetch all sentiment_scores rows with their theme arrays.

        TODO: join with clean_data to get source and publication date.
        TODO: paginate for datasets > 1000 rows.
        """
        response = self.db.table("sentiment_scores").select("*").execute()
        return response.data or []

    def score_dimension(
        self, rows: list[dict[str, Any]], dimension: str
    ) -> float:
        """
        Compute a 0–100 score for a given dimension.

        Uses the average sentiment score of rows that contain at least one
        theme keyword for the dimension.

        TODO: weight by confidence score for more accurate aggregation.
        TODO: apply recency weighting (newer reviews count more).
        """
        keywords = DIMENSION_THEMES[dimension]
        relevant = [
            r for r in rows
            if any(kw in (r.get("themes") or []) for kw in keywords)
        ]
        if not relevant:
            return 50.0  # neutral default when no data

        scores = [r["score"] for r in relevant if r.get("score") is not None]
        if not scores:
            return 50.0

        avg = sum(scores) / len(scores)
        # Map from [-1, 1] to [0, 100]
        return round((avg + 1) / 2 * 100, 2)

    def compute_phs(self, dimension_scores: dict[str, float]) -> float:
        """
        Compute the composite Product Health Score as a weighted average.

        TODO: apply non-linear penalties for very low dimension scores.
        """
        return round(
            sum(dimension_scores[d] * DIMENSION_WEIGHTS[d] for d in DIMENSION_WEIGHTS),
            2,
        )

    def infer_categories_with_ai(
        self, sample_texts: list[str]
    ) -> list[str]:
        """
        Use OpenAI to infer the most common product categories from a text sample.

        TODO: implement category extraction — currently returns a placeholder.
        TODO: map extracted categories to a controlled vocabulary.
        """
        # TODO: implement actual category extraction call
        return ["general"]  # placeholder

    def run(self) -> None:
        """
        Run the product health agent and upsert scores for each category.
        """
        rows = self.fetch_sentiment_with_themes()
        log.info("Computing product health from %d sentiment records", len(rows))

        # TODO: split rows by category before scoring
        # For now, compute a single aggregate "general" score
        categories = ["general"]  # TODO: derive from data

        for category in categories:
            dimension_scores = {
                dim: self.score_dimension(rows, dim)
                for dim in DIMENSION_THEMES
            }
            phs = self.compute_phs(dimension_scores)

            payload = {
                "category": category,
                "phs": phs,
                "quality_score": dimension_scores["quality"],
                "price_score": dimension_scores["price"],
                "fit_score": dimension_scores["fit"],
                "service_score": dimension_scores["service"],
                "trend_score": dimension_scores["trend"],
                "review_count": len(rows),
                "computed_at": datetime.now(timezone.utc).isoformat(),
            }
            self.db.table("product_health").upsert(
                payload, on_conflict="category"
            ).execute()
            log.info("Product health — category: %s | PHS: %.1f", category, phs)


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
    agent = ProductHealthAgent(supabase=supabase, openai_client=openai_client)
    agent.run()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    main()
