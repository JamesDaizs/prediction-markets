"use client";

import type { Granularity } from "@/lib/api/clickhouse";
import { cn } from "@/lib/utils";

const OPTIONS: { label: string; value: Granularity }[] = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

interface Props {
  value: Granularity;
  onChange: (v: Granularity) => void;
}

export function PeriodToggle({ value, onChange }: Props) {
  return (
    <div className="flex rounded-lg border border-pm-border-base bg-pm-bg-card p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === opt.value
              ? "bg-pm-brand text-white"
              : "text-pm-fg-muted hover:text-pm-fg-base"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
