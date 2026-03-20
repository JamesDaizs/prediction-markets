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
    <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/50 p-0.5">
      {TIME_RANGES.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            value === opt.value
              ? "bg-zinc-700 text-white"
              : "text-zinc-400 hover:text-white"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
