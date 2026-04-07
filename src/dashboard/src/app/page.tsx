import { KpiTile } from "@/components/kpi-tile";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SentimentDonut } from "@/components/charts/sentiment-donut";
import { CountryBar } from "@/components/charts/country-bar";
import {
  getKpis,
  getSentimentBreakdown,
  getSentimentByCountry,
  getAlerts,
  getRecentReviews,
} from "@/lib/data";
import { format } from "date-fns";

const KPI_LABELS: Record<
  string,
  { label: string; format: (v: number) => string; invert?: boolean }
> = {
  brand_health: { label: "Brand Health", format: (v) => v.toFixed(1) },
  nps: { label: "NPS", format: (v) => v.toFixed(0) },
  review_volume: { label: "Review Volume (30d)", format: (v) => v.toFixed(0) },
  avg_rating: { label: "Avg Rating", format: (v) => v.toFixed(2) },
  negative_share: {
    label: "Negative Share",
    format: (v) => `${v.toFixed(1)}%`,
    invert: true,
  },
};

export default async function OverviewPage() {
  const [kpis, sentiment, byCountry, alerts, recentReviews] = await Promise.all([
    getKpis(),
    getSentimentBreakdown(),
    getSentimentByCountry(),
    getAlerts(),
    getRecentReviews(6),
  ]);

  const openAlerts = alerts.filter((a) => !a.resolved);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Brand Intelligence Overview</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          What a COMEX member needs to know about Zara&apos;s social signals — in 2 minutes.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => {
          const meta = KPI_LABELS[kpi.name] ?? {
            label: kpi.name,
            format: (v: number) => v.toFixed(1),
          };
          return (
            <KpiTile
              key={kpi.id}
              label={meta.label}
              value={meta.format(kpi.value)}
              delta={kpi.delta}
              invertDelta={meta.invert}
            />
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Sentiment breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <SentimentDonut data={sentiment} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Average sentiment by country</CardTitle>
            <Badge variant="info">{byCountry.length} markets</Badge>
          </CardHeader>
          <CardContent>
            <CountryBar data={byCountry} />
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active alerts</CardTitle>
            <Badge variant={openAlerts.length > 0 ? "danger" : "success"}>
              {openAlerts.length} open
            </Badge>
          </CardHeader>
          <CardContent>
            {openAlerts.length === 0 ? (
              <p className="text-sm text-neutral-500">No open alerts.</p>
            ) : (
              <ul className="space-y-3">
                {openAlerts.slice(0, 5).map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-3 last:border-none last:pb-0 dark:border-neutral-800"
                  >
                    <div>
                      <div className="text-sm font-medium">{a.title}</div>
                      <div className="text-xs text-neutral-500">{a.message}</div>
                      {a.store && (
                        <div className="mt-1 text-xs text-neutral-400">
                          {a.store.name} — {a.store.city}, {a.store.country}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={
                        a.severity === "CRITICAL"
                          ? "danger"
                          : a.severity === "HIGH"
                            ? "warning"
                            : a.severity === "MEDIUM"
                              ? "info"
                              : "neutral"
                      }
                    >
                      {a.severity}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recentReviews.map((r) => (
                <li
                  key={r.id}
                  className="border-b border-neutral-100 pb-3 last:border-none last:pb-0 dark:border-neutral-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs uppercase tracking-wide text-neutral-500">
                      {r.source} · {r.store?.city ?? "—"}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {format(r.postedAt, "MMM d")}
                    </div>
                  </div>
                  <div className="mt-1 text-sm">{r.body}</div>
                  {r.sentimentScore && (
                    <Badge
                      className="mt-2"
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
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
