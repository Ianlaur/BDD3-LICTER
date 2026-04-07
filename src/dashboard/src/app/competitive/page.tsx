import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompetitiveRadar } from "@/components/charts/competitive-radar";
import { getCompetitive } from "@/lib/data";

export default async function CompetitivePage() {
  const data = await getCompetitive();

  // Group rows by competitor for the breakdown table.
  const grouped = new Map<string, typeof data>();
  for (const row of data) {
    const list = grouped.get(row.competitor) ?? [];
    list.push(row);
    grouped.set(row.competitor, list);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Competitive</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          How Zara stacks up against {grouped.size} competitors across brand health, sentiment and share of voice.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Benchmark radar</CardTitle>
        </CardHeader>
        <CardContent>
          <CompetitiveRadar data={data} />
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from(grouped.entries()).map(([competitor, rows]) => (
          <Card key={competitor}>
            <CardHeader>
              <CardTitle>{competitor}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {rows.map((r) => {
                  const diff = r.zaraValue - r.competitorValue;
                  const winning = diff >= 0;
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium capitalize">
                          {r.metric.replace(/_/g, " ")}
                        </div>
                        <div className="text-xs text-neutral-500">
                          Zara {r.zaraValue.toFixed(1)} · {competitor} {r.competitorValue.toFixed(1)}
                        </div>
                      </div>
                      <Badge variant={winning ? "success" : "danger"}>
                        {winning ? "+" : ""}
                        {diff.toFixed(1)}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
