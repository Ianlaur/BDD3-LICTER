import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAlerts } from "@/lib/data";
import { format } from "date-fns";

const SEVERITY_VARIANT = {
  CRITICAL: "danger",
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "neutral",
} as const;

export default async function AlertsPage() {
  const alerts = await getAlerts();
  const open = alerts.filter((a) => !a.resolved);
  const resolved = alerts.filter((a) => a.resolved);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {open.length} open · {resolved.length} resolved — automatically fired by the crisis-detection agent.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Open alerts</CardTitle>
          <Badge variant={open.length > 0 ? "danger" : "success"}>{open.length}</Badge>
        </CardHeader>
        <CardContent>
          {open.length === 0 ? (
            <p className="text-sm text-neutral-500">All clear.</p>
          ) : (
            <ul className="space-y-4">
              {open.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold">{a.title}</div>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        {a.message}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                        <span>{format(a.triggeredAt, "MMM d, yyyy · HH:mm")}</span>
                        <span>·</span>
                        <span>source: {a.source}</span>
                        {a.store && (
                          <>
                            <span>·</span>
                            <span>
                              {a.store.name} ({a.store.city}, {a.store.country})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant={SEVERITY_VARIANT[a.severity]}>{a.severity}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently resolved</CardTitle>
          <Badge variant="success">{resolved.length}</Badge>
        </CardHeader>
        <CardContent>
          {resolved.length === 0 ? (
            <p className="text-sm text-neutral-500">Nothing in the resolved log yet.</p>
          ) : (
            <ul className="space-y-3">
              {resolved.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-3 last:border-none last:pb-0 dark:border-neutral-800"
                >
                  <div>
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="text-xs text-neutral-500">
                      Resolved {a.resolvedAt ? format(a.resolvedAt, "MMM d") : "—"}
                    </div>
                  </div>
                  <Badge variant="neutral">{a.severity}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
