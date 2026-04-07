import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendLine } from "@/components/charts/trend-line";
import { getTopTopics, getTrendTimeseries } from "@/lib/data";
import { ArrowDown, ArrowUp } from "lucide-react";

export default async function TrendsPage() {
  const [topTopics, timeseries] = await Promise.all([
    getTopTopics(8),
    getTrendTimeseries(),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Trends</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Rising and falling conversation topics across the past 8 weeks.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Mention volume — last 8 weeks</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendLine data={timeseries} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top topics</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {topTopics.map((t) => {
              const isUp = t.momentum >= 0;
              return (
                <li
                  key={t.topic}
                  className="flex items-center justify-between rounded-lg border border-neutral-100 p-3 dark:border-neutral-800"
                >
                  <div>
                    <div className="font-medium">{t.topic}</div>
                    <div className="text-xs text-neutral-500">
                      {t.mentions.toLocaleString()} mentions · sentiment {t.sentiment.toFixed(2)}
                    </div>
                  </div>
                  <Badge variant={isUp ? "success" : "danger"} className="flex items-center gap-1">
                    {isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {Math.abs(t.momentum * 100).toFixed(0)}%
                  </Badge>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
