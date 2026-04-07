"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface CompetitiveRow {
  competitor: string;
  metric: string;
  zaraValue: number;
  competitorValue: number;
}

interface Props {
  data: CompetitiveRow[];
}

export function CompetitiveRadar({ data }: Props) {
  // Pivot per metric: { metric, Zara, H&M, Mango, ... }
  const metrics = Array.from(new Set(data.map((d) => d.metric)));
  const competitors = Array.from(new Set(data.map((d) => d.competitor)));

  const chartData = metrics.map((metric) => {
    const row: Record<string, number | string> = { metric };
    // Take Zara from any row for this metric (they all share the same value).
    const zaraRow = data.find((d) => d.metric === metric);
    row["Zara"] = zaraRow?.zaraValue ?? 0;
    for (const competitor of competitors) {
      const compRow = data.find((d) => d.metric === metric && d.competitor === competitor);
      if (compRow) row[competitor] = compRow.competitorValue;
    }
    return row;
  });

  const colors = ["#0a0a0a", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  const allKeys = ["Zara", ...competitors];

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
          {allKeys.map((key, i) => (
            <Radar
              key={key}
              name={key}
              dataKey={key}
              stroke={colors[i % colors.length]}
              fill={colors[i % colors.length]}
              fillOpacity={key === "Zara" ? 0.4 : 0.1}
            />
          ))}
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
