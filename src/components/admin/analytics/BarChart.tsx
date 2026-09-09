"use client";

import { useState } from "react";
import clsx from "clsx";
import { formatPrice } from "@/lib/format";

export type BarPoint = {
  label: string;
  value: number;
  tooltipLabel?: string;
  showLabel?: boolean;
};

type Props = {
  data: BarPoint[];
  height?: number;
};

// Sequential-blue bar chart for a single measure (revenue by day/hour/product).
// One hue throughout — magnitude is read from bar height, not color.
export default function BarChart({ data, height = 160 }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.length === 0 || max === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-slate-400" style={{ height }}>
        Нет данных за этот период
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d, i) => {
          const barHeight = Math.max(2, Math.round((d.value / max) * height));
          return (
            <div
              key={i}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {hover === i && (
                <div className="absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg">
                  {d.tooltipLabel && <div className="text-slate-300">{d.tooltipLabel}</div>}
                  <div className="font-semibold">{formatPrice(d.value)}</div>
                </div>
              )}
              <div
                className={clsx(
                  "w-full max-w-6 rounded-t transition-colors",
                  hover === i ? "bg-[#1c5cab]" : "bg-[#2a78d6]"
                )}
                style={{ height: barHeight }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-slate-400">
            {d.showLabel !== false ? d.label : " "}
          </div>
        ))}
      </div>
    </div>
  );
}
