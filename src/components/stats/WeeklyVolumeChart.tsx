"use client";

import { useState } from "react";
import type { WeeklyVolumePoint } from "@/lib/stats";
import { toDateKey } from "@/lib/weeks";

const CHART_HEIGHT = 160;
const BAR_MAX_WIDTH = 24;
const GAP = 6;

export function WeeklyVolumeChart({
  data,
  currentWeekStartISO,
}: {
  data: WeeklyVolumePoint[];
  currentWeekStartISO: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const max = Math.max(1, ...data.map((d) => d.planned));
  const niceMax = Math.ceil(max / 5) * 5 || 5;

  const width = data.length * (BAR_MAX_WIDTH + GAP) + GAP;

  function barHeight(value: number) {
    return (value / niceMax) * CHART_HEIGHT;
  }

  return (
    <div className="neo p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-cap-black">
          Volume hebdomadaire
        </h2>
        <div className="flex items-center gap-4 text-xs text-cap-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cap-violet-soft border border-cap-violet/30" />
            Prévu
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cap-violet" />
            Fait
          </span>
        </div>
      </div>

      <div className="overflow-x-auto neo-scrollbar">
        <div className="relative" style={{ width: Math.max(width, 280) }}>
          {/* Gridlines */}
          <div className="absolute inset-x-0 top-0" style={{ height: CHART_HEIGHT }}>
            {[0, 0.5, 1].map((fraction) => (
              <div
                key={fraction}
                className="absolute left-0 right-0 border-t border-cap-muted/15 flex items-center"
                style={{ bottom: fraction * CHART_HEIGHT }}
              >
                <span className="text-[10px] text-cap-muted -translate-y-1/2 bg-background pr-1">
                  {Math.round(niceMax * fraction)}
                </span>
              </div>
            ))}
          </div>

          <div
            className="flex items-end gap-1.5 relative"
            style={{ height: CHART_HEIGHT, paddingLeft: 24 }}
          >
            {data.map((point, i) => {
              const isCurrentWeek = toDateKey(point.weekStart) === currentWeekStartISO;
              return (
              <div
                key={point.weekStart.toISOString()}
                className="relative flex flex-col items-center justify-end"
                style={{ width: BAR_MAX_WIDTH, height: CHART_HEIGHT }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
              >
                {isCurrentWeek ? (
                  <div className="absolute inset-y-0 -inset-x-1 bg-cap-lime-soft rounded-md -z-10" />
                ) : null}
                {/* Track = planned */}
                <div
                  className="w-full bg-cap-violet-soft rounded-t-[4px]"
                  style={{ height: Math.max(barHeight(point.planned), point.planned > 0 ? 3 : 0) }}
                />
                {/* Fill = done, overlaid from baseline */}
                <div
                  className="w-full bg-cap-violet rounded-t-[4px] absolute bottom-0"
                  style={{ height: Math.max(barHeight(point.done), point.done > 0 ? 3 : 0) }}
                />

                {hovered === i ? (
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 neo-sm px-2 py-1 text-[11px] font-semibold text-cap-black whitespace-nowrap z-10">
                    {point.done} / {point.planned} km
                  </div>
                ) : null}
              </div>
              );
            })}
          </div>

          <div className="flex gap-1.5 mt-2" style={{ paddingLeft: 24 }}>
            {data.map((point) => (
              <span
                key={point.weekStart.toISOString()}
                className={`text-[10px] text-center ${
                  toDateKey(point.weekStart) === currentWeekStartISO
                    ? "font-bold text-cap-violet"
                    : "text-cap-muted"
                }`}
                style={{ width: BAR_MAX_WIDTH }}
              >
                {point.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
