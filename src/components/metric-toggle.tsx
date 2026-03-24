"use client";

import { cn } from "@/lib/utils";

export type Metric = "oi" | "volume";

const OPTIONS: { label: string; value: Metric }[] = [
  { label: "Open Interest", value: "oi" },
  { label: "Volume", value: "volume" },
];

interface Props {
  value: Metric;
  onChange: (v: Metric) => void;
}

export function MetricToggle({ value, onChange }: Props) {
  return (
    <div className="flex rounded-lg border border-pm-border-base bg-pm-bg-card p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === opt.value
              ? "bg-pm-bg-elevated text-pm-fg-base"
              : "text-pm-fg-muted hover:text-pm-fg-base"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
