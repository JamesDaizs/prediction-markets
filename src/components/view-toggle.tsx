"use client";

import { BarChart3, Columns2, Grid2X2, Table2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "treemap" | "bar" | "table" | "line" | "compare";

const VIEWS: { mode: ViewMode; icon: typeof BarChart3; label: string }[] = [
  { mode: "treemap", icon: Grid2X2, label: "Treemap" },
  { mode: "bar", icon: BarChart3, label: "Bar" },
  { mode: "compare", icon: Columns2, label: "Compare" },
  { mode: "line", icon: TrendingUp, label: "Line" },
  { mode: "table", icon: Table2, label: "Table" },
];

interface Props {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/50 p-0.5">
      {VIEWS.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          title={label}
          className={cn(
            "rounded-md p-1.5 transition-colors",
            value === mode
              ? "bg-zinc-700 text-white"
              : "text-zinc-500 hover:text-white"
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
