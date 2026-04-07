"""
analysis/agents/comex_synthesizer.py
======================================
COMEX insight synthesizer for BDD3-LICTER.

Reads all analysis outputs (sentiment, crisis, product health, trends,
competitive) and generates a structured executive brief designed for a Zara
COMEX audience. The brief is stored as a KPI record and can be rendered into
the weekly magazine PDF.

Output (kpis table)
--------------------
- period          : ISO week string (e.g. "2026-W12")
- overall_sentiment : float — weighted average across all sources
- crisis_count    : int — number of open crisis alerts
- top_trend       : str — highest-velocity trend term
- phs_general     : float — general Product Health Score
- best_competitor  : str — competitor Zara leads most
- worst_competitor : str — competitor where Zara trails most
- executive_brief : str — AI-generated 5-bullet COMEX brief (Markdown)
- generated_at    : timestamp UTC

Usage
-----
    python -m zara.analysis.agents.comex_synthesizer
"""

import logging
import os
from datetime import datetime, timezone
from typing import Any

from openai import OpenAI  # type: ignore
from supabase import create_client, Client  # type: ignore

log = logging.getLogger(__name__)

BRIEF_SYSTEM_PROMPT = """
You are a senior strategic advisor preparing a weekly intelligence brief for
the Zara COMEX (Executive Committee). Your brief must be:
- Written in clear, executive-level English (or French if specified)
- Structured as exactly 5 bullet points
- Each bullet: one insight + one recommended action
- Focused on decisions, not data description
- Grounded in the data provided — do not invent metrics

Format:
• [INSIGHT]: [RECOMMENDED ACTION]
"""


class COMEXSynthesizer:
    """
    Aggregates all agent outputs into a weekly COMEX intelligence brief.

    TODO: add PDF export trigger after upsert (call magazine generator).
    TODO: support French-language brief generation (add language parameter).
    TODO: schedule via N8N every Monday at 07:00 CET.
    """

    def __init__(self, supabase: Client, openai_client: OpenAI) -> None:
        self.db = supabase
        self.ai = openai_client

    def fetch_context(self) -> dict[str, Any]:
        """
        Aggregate data from all analysis tables for the brief.

        TODO: add time-window filtering (current week only).
        TODO: add error handling for empty tables on first run.
        """
        context: dict[str, Any] = {}

        # Sentiment overview
        sent = self.db.table("sentiment_scores").select("score, label").execute()
        scores = [r["score"] for r in (sent.data or []) if r.get("score") is not None]
        context["avg_sentiment"] = round(sum(scores) / len(scores), 3) if scores else 0.0
        context["total_records"] = len(scores)
        label_counts: dict[str, int] = {}
        for r in (sent.data or []):
            lbl = r.get("label", "unknown")
            label_counts[lbl] = label_counts.get(lbl, 0) + 1
        context["label_distribution"] = label_counts

        # Crisis alerts
        alerts = (
            self.db.table("alerts")
            .select("severity, summary")
            .is_("resolved_at", "null")
            .execute()
        )
        context["open_alerts"] = alerts.data or []
        context["crisis_count"] = len(context["open_alerts"])

        # Top trend
        trends = (
            self.db.table("trends")
            .select("term, velocity, narrative")
            .order("velocity", desc=True)
            .limit(5)
            .execute()
        )
        context["top_trends"] = trends.data or []
        context["top_trend"] = context["top_trends"][0]["term"] if context["top_trends"] else "N/A"

        # Product health
        ph = self.db.table("product_health").select("category, phs").execute()
        context["product_health"] = ph.data or []
        context["phs_general"] = next(
            (r["phs"] for r in (ph.data or []) if r["category"] == "general"), 0.0
        )

        # Competitive
        comp = self.db.table("competitive").select("brand, vs_zara_delta, summary").execute()
        context["competitive"] = comp.data or []
        if comp.data:
            best = max(comp.data, key=lambda r: r.get("vs_zara_delta", 0))
            worst = min(comp.data, key=lambda r: r.get("vs_zara_delta", 0))
            context["best_competitor"] = best["brand"]
            context["worst_competitor"] = worst["brand"]
        else:
            context["best_competitor"] = "N/A"
            context["worst_competitor"] = "N/A"

        return context

    def format_context_for_prompt(self, ctx: dict[str, Any]) -> str:
        """Convert the context dict to a readable prompt section."""
        lines = [
            f"Overall sentiment: {ctx['avg_sentiment']:.2f} (across {ctx['total_records']} records)",
            f"Sentiment distribution: {ctx['label_distribution']}",
            f"Open crisis alerts: {ctx['crisis_count']}",
        ]
        if ctx["open_alerts"]:
            for alert in ctx["open_alerts"][:2]:
                lines.append(f"  - [{alert['severity']}] {alert['summary'][:150]}")
        lines.append(f"Top trending term: {ctx['top_trend']}")
        if ctx["top_trends"]:
            for t in ctx["top_trends"][:3]:
                lines.append(f"  - {t['term']} (velocity: {t['velocity']:.0f}): {t['narrative']}")
        lines.append(f"Product Health Score (general): {ctx['phs_general']:.1f}/100")
        lines.append(f"Strongest vs competitor: {ctx['best_competitor']}")
        lines.append(f"Weakest vs competitor: {ctx['worst_competitor']}")
        return "\n".join(lines)

    def generate_brief(self, ctx: dict[str, Any]) -> str:
        """
        Call OpenAI to produce the 5-bullet COMEX brief.

        TODO: add few-shot examples for more consistent output format.
        TODO: tune temperature after evaluating brief quality over first runs.
        """
        context_text = self.format_context_for_prompt(ctx)
        try:
            response = self.ai.chat.completions.create(
                model="gpt-4o",  # Use the most capable model for the executive brief
                messages=[
                    {"role": "system", "content": BRIEF_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": (
                            f"Here is the weekly intelligence data for Zara:\n\n"
                            f"{context_text}\n\n"
                            f"Generate the 5-bullet COMEX brief."
                        ),
                    },
                ],
                temperature=0.5,
                max_tokens=500,
            )
            return response.choices[0].message.content.strip()
        except Exception as exc:
            log.error("Failed to generate COMEX brief: %s", exc)
            return "Brief generation failed — check OpenAI API key and quota."

    def get_iso_week(self) -> str:
        now = datetime.now(timezone.utc)
        return f"{now.isocalendar()[0]}-W{now.isocalendar()[1]:02d}"

    def run(self) -> None:
        """
        Run the COMEX synthesizer and upsert the weekly brief.
        """
        log.info("Generating COMEX brief...")
        ctx = self.fetch_context()
        brief = self.generate_brief(ctx)
        period = self.get_iso_week()

        payload = {
            "period": period,
            "overall_sentiment": ctx["avg_sentiment"],
            "crisis_count": ctx["crisis_count"],
            "top_trend": ctx["top_trend"],
            "phs_general": ctx["phs_general"],
            "best_competitor": ctx["best_competitor"],
            "worst_competitor": ctx["worst_competitor"],
            "executive_brief": brief,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
        self.db.table("kpis").upsert(payload, on_conflict="period").execute()
        log.info("COMEX brief upserted for period: %s", period)
        log.info("\n--- BRIEF ---\n%s\n-------------", brief)


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
    agent = COMEXSynthesizer(supabase=supabase, openai_client=openai_client)
    agent.run()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    main()
