"use client";

import type { TimeRange } from "@/lib/api/types";
import { TIME_RANGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Props {
  value: TimeRange;
  onChange: (v: TimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: Props) {
  return (
    <div className="flex rounded-lg border border-pm-border-base bg-pm-bg-card p-0.5">
      {TIME_RANGES.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
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

/** Dashboard-specific time range selector with "Latest" option */
interface DashboardTimeRangeSelectorProps {
  value: string;
  onChange: (v: string) => void;
  ranges: { label: string; value: string }[];
}

export function DashboardTimeRangeSelector({
  value,
  onChange,
  ranges,
}: DashboardTimeRangeSelectorProps) {
  return (
    <div className="flex rounded-lg border border-pm-border-base bg-pm-bg-card p-0.5">
      {ranges.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
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
