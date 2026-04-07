"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  data: Array<{ label: string; count: number; share: number }>;
}

const COLORS: Record<string, string> = {
  positive: "#10b981",
  neutral: "#94a3b8",
  negative: "#ef4444",
};

export function SentimentDonut({ data }: Props) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
          >
            {data.map((entry) => (
              <Cell key={entry.label} fill={COLORS[entry.label] ?? "#94a3b8"} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex justify-center gap-4 text-xs">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: COLORS[d.label] ?? "#94a3b8" }}
            />
            <span className="capitalize text-neutral-600 dark:text-neutral-400">
              {d.label} {(d.share * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
