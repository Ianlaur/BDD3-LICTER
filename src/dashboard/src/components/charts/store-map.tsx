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

interface ViewState {
  scale: number;
  tx: number;
  ty: number;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function colorFor(polarity: number) {
  if (polarity >= 0.2) return "#10b981";
  if (polarity <= -0.2) return "#ef4444";
  return "#f59e0b";
}

export function StoreMap({ stores, width = 900, height = 460 }: Props) {
  const [hover, setHover] = useState<StorePoint | null>(null);
  const [view, setView] = useState<ViewState>({ scale: 1, tx: 0, ty: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number } | null>(null);

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

  const zoomAtPoint = (px: number, py: number, nextScale: number) => {
    setView((current) => {
      const clampedScale = clamp(nextScale, MIN_ZOOM, MAX_ZOOM);
      if (clampedScale === current.scale) return current;
      const ratio = clampedScale / current.scale;
      return {
        scale: clampedScale,
        tx: px - (px - current.tx) * ratio,
        ty: py - (py - current.ty) * ratio,
      };
    });
  };

  const zoomBy = (factor: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    zoomAtPoint(centerX, centerY, view.scale * factor);
  };

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={`h-auto w-full rounded-xl bg-neutral-50 dark:bg-neutral-900 ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
        style={{ touchAction: "none" }}
        onWheel={(event) => {
          event.preventDefault();
          const rect = event.currentTarget.getBoundingClientRect();
          const px = ((event.clientX - rect.left) / rect.width) * width;
          const py = ((event.clientY - rect.top) / rect.height) * height;
          const factor = event.deltaY < 0 ? 1.15 : 0.87;
          zoomAtPoint(px, py, view.scale * factor);
        }}
        onMouseDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * width;
          const y = ((event.clientY - rect.top) / rect.height) * height;
          setIsPanning(true);
          setLastPanPoint({ x, y });
        }}
        onMouseMove={(event) => {
          if (!isPanning || !lastPanPoint) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * width;
          const y = ((event.clientY - rect.top) / rect.height) * height;
          const dx = x - lastPanPoint.x;
          const dy = y - lastPanPoint.y;
          setView((current) => ({ ...current, tx: current.tx + dx, ty: current.ty + dy }));
          setLastPanPoint({ x, y });
        }}
        onMouseUp={() => {
          setIsPanning(false);
          setLastPanPoint(null);
        }}
        onMouseLeave={() => {
          setIsPanning(false);
          setLastPanPoint(null);
        }}
      >
        <g transform={`translate(${view.tx} ${view.ty}) scale(${view.scale})`}>
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
              const baseRadius = Math.max(4, Math.min(14, 4 + Math.sqrt(s.reviewCount)));
              const r = Math.max(2, baseRadius / view.scale);
              const strokeWidth = Math.max(0.6, 1.5 / view.scale);
              return (
                <circle
                  key={s.id}
                  cx={coords[0]}
                  cy={coords[1]}
                  r={r}
                  fill={colorFor(s.avgPolarity)}
                  fillOpacity={0.7}
                  stroke="#ffffff"
                  strokeWidth={strokeWidth}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(null)}
                  className="cursor-pointer transition-opacity hover:fill-opacity-100"
                />
              );
            })}
          </g>
        </g>
      </svg>
      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white/95 p-1 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/95">
        <button
          type="button"
          onClick={() => zoomBy(1.2)}
          className="h-7 w-7 rounded-md text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomBy(0.84)}
          className="h-7 w-7 rounded-md text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setView({ scale: 1, tx: 0, ty: 0 })}
          className="rounded-md px-2 py-1 text-[11px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          aria-label="Reset map view"
        >
          Reset
        </button>
      </div>
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
        <div>Scroll to zoom · drag to pan</div>
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
