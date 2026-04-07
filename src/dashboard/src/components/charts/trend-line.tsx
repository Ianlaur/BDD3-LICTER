"use client";

import { format } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TrendPoint {
  topic: string;
  mentionCount: number;
  periodEnd: Date | string;
}

interface Props {
  data: TrendPoint[];
}

export function TrendLine({ data }: Props) {
  // Pivot rows into series-per-topic for the line chart.
  const byPeriod = new Map<string, Record<string, number | string>>();
  const topics = new Set<string>();

  for (const row of data) {
    const period = format(new Date(row.periodEnd), "MMM d");
    topics.add(row.topic);
    const existing = byPeriod.get(period) ?? { period };
    existing[row.topic] = row.mentionCount;
    byPeriod.set(period, existing);
  }

  const chartData = Array.from(byPeriod.values()).reverse();
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="period" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          {Array.from(topics).map((topic, i) => (
            <Line
              key={topic}
              type="monotone"
              dataKey={topic}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        {Array.from(topics).map((topic, i) => (
          <div key={topic} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: colors[i % colors.length] }}
            />
            <span className="text-neutral-600 dark:text-neutral-400">{topic}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
