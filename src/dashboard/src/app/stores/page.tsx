import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStoresWithSignals } from "@/lib/data";

function polarityVariant(p: number) {
  if (p >= 0.2) return "success" as const;
  if (p <= -0.2) return "danger" as const;
  return "warning" as const;
}

export default async function StoresPage() {
  const stores = await getStoresWithSignals();
  const sorted = [...stores].sort((a, b) => a.avgPolarity - b.avgPolarity);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Stores</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {stores.length} Zara stores ranked by current sentiment — most distressed first.
        </p>
      </header>

      <Card className="p-0">
        <CardContent className="space-y-0 p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
                <tr>
                  <th className="px-6 py-3">Store</th>
                  <th className="px-6 py-3">Country</th>
                  <th className="px-6 py-3 text-right">Reviews</th>
                  <th className="px-6 py-3 text-right">Sentiment</th>
                  <th className="px-6 py-3 text-right">Negative %</th>
                  <th className="px-6 py-3 text-right">Alerts</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-neutral-100 transition-colors last:border-none hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                  >
                    <td className="px-6 py-4">
                      <Link href={`/stores/${s.code}`} className="block">
                        <div className="font-medium hover:underline">{s.name}</div>
                        <div className="text-xs text-neutral-500">
                          {s.city} · {s.code}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">{s.country}</td>
                    <td className="px-6 py-4 text-right tabular-nums">{s.reviewCount}</td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant={polarityVariant(s.avgPolarity)}>
                        {s.avgPolarity.toFixed(2)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums">
                      {(s.negativeShare * 100).toFixed(0)}%
                    </td>
                    <td className="px-6 py-4 text-right">
                      {s.alertCount > 0 ? (
                        <Badge variant="danger">{s.alertCount}</Badge>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
