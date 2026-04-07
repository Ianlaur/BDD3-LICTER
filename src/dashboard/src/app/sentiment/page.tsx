import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SentimentDonut } from "@/components/charts/sentiment-donut";
import { CountryBar } from "@/components/charts/country-bar";
import {
  getSentimentBreakdown,
  getSentimentByCountry,
  getRecentReviews,
} from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default async function SentimentPage() {
  const [breakdown, byCountry, recent] = await Promise.all([
    getSentimentBreakdown(),
    getSentimentByCountry(),
    getRecentReviews(20),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Sentiment</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          How customers feel about Zara, broken down by country and recent activity.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Polarity distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <SentimentDonut data={breakdown} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Average sentiment by country</CardTitle>
          </CardHeader>
          <CardContent>
            <CountryBar data={byCountry} />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Latest scored reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {recent.map((r) => (
              <li
                key={r.id}
                className="border-b border-neutral-100 pb-3 last:border-none last:pb-0 dark:border-neutral-800"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs uppercase tracking-wide text-neutral-500">
                    {r.source} · {r.store?.city ?? "—"}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {format(r.postedAt, "MMM d, yyyy")}
                  </div>
                </div>
                <div className="mt-1 text-sm">{r.body}</div>
                <div className="mt-2 flex items-center gap-2">
                  {r.sentimentScore && (
                    <>
                      <Badge
                        variant={
                          r.sentimentScore.label === "positive"
                            ? "success"
                            : r.sentimentScore.label === "negative"
                              ? "danger"
                              : "neutral"
                        }
                      >
                        {r.sentimentScore.label}
                      </Badge>
                      <span className="text-xs text-neutral-500">
                        polarity {r.sentimentScore.polarity.toFixed(2)} · confidence{" "}
                        {(r.sentimentScore.confidence * 100).toFixed(0)}%
                      </span>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
