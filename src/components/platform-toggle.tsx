"use client";

import type { Platform } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const OPTIONS: { label: string; value: Platform }[] = [
  { label: "Both", value: "both" },
  { label: "Polymarket", value: "polymarket" },
  { label: "Kalshi", value: "kalshi" },
];

interface Props {
  value: Platform;
  onChange: (v: Platform) => void;
}

export function PlatformToggle({ value, onChange }: Props) {
  return (
    <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/50 p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === opt.value
              ? "bg-violet-600 text-white"
              : "text-zinc-400 hover:text-white"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
