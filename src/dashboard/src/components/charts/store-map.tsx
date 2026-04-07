"use client";

import { useMemo, useState } from "react";
import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import worldData from "@/lib/world-110m.json";

interface StorePoint {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  avgPolarity: number;
  reviewCount: number;
  alertCount: number;
}

interface Props {
  stores: StorePoint[];
  width?: number;
  height?: number;
}

function colorFor(polarity: number) {
  if (polarity >= 0.2) return "#10b981";
  if (polarity <= -0.2) return "#ef4444";
  return "#f59e0b";
}

export function StoreMap({ stores, width = 900, height = 460 }: Props) {
  const [hover, setHover] = useState<StorePoint | null>(null);

  const projection = useMemo(
    () => geoEquirectangular().scale(140).translate([width / 2, height / 2]),
    [width, height]
  );

  const path = useMemo(() => geoPath(projection), [projection]);

  // Convert topojson to geojson features.
  // worldData is a topojson Topology with a `countries` object.
  const countries = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topo = worldData as any;
    const fc = feature(topo, topo.objects.countries) as unknown as FeatureCollection<Geometry>;
    return fc.features;
  }, []);

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full rounded-xl bg-neutral-50 dark:bg-neutral-900"
      >
        <g>
          {countries.map((f, i) => (
            <path
              key={i}
              d={path(f) ?? undefined}
              fill="#e5e7eb"
              stroke="#ffffff"
              strokeWidth={0.5}
              className="dark:fill-neutral-800 dark:stroke-neutral-950"
            />
          ))}
        </g>
        <g>
          {stores.map((s) => {
            const coords = projection([s.lng, s.lat]);
            if (!coords) return null;
            const r = Math.max(4, Math.min(14, 4 + Math.sqrt(s.reviewCount)));
            return (
              <circle
                key={s.id}
                cx={coords[0]}
                cy={coords[1]}
                r={r}
                fill={colorFor(s.avgPolarity)}
                fillOpacity={0.7}
                stroke="#ffffff"
                strokeWidth={1.5}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer transition-opacity hover:fill-opacity-100"
              />
            );
          })}
        </g>
      </svg>
      {hover && (
        <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-neutral-200 bg-white p-3 text-xs shadow-lg dark:border-neutral-800 dark:bg-neutral-950">
          <div className="font-semibold">{hover.name}</div>
          <div className="text-neutral-500">
            {hover.city}, {hover.country}
          </div>
          <div className="mt-2 space-y-0.5">
            <div>Reviews: {hover.reviewCount}</div>
            <div>Sentiment: {hover.avgPolarity.toFixed(2)}</div>
            <div>Active alerts: {hover.alertCount}</div>
          </div>
        </div>
      )}
      <div className="mt-3 flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Positive
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Neutral
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Negative
        </div>
      </div>
    </div>
  );
}
