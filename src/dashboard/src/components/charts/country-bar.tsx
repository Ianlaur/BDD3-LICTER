"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  data: Array<{ country: string; avgPolarity: number; reviewCount: number }>;
}

export function CountryBar({ data }: Props) {
  return (
    <div className="h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="country" tick={{ fontSize: 12 }} />
          <YAxis domain={[-1, 1]} tick={{ fontSize: 12 }} />
          <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Bar dataKey="avgPolarity" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.country}
                fill={entry.avgPolarity >= 0 ? "#10b981" : "#ef4444"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
