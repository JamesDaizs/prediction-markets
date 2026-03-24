"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { CHART_TOOLTIP_STYLE } from "@/lib/constants";
import type { CategoryRow } from "@/app/accuracy/types";

interface Props {
  polymarket: CategoryRow[];
  kalshi: CategoryRow[];
}

const WINDOWS = ["4h", "12h", "1d", "1w", "1mo"] as const;

export function AccuracyWindowChart({ polymarket, kalshi }: Props) {
  const polyTotal = polymarket.find((r) => r.category === "Total");
  const kalshiTotal = kalshi.find((r) => r.category === "Total");

  const data = WINDOWS.map((w) => ({
    window: w,
    polymarket: polyTotal?.[`acc_${w}` as keyof CategoryRow] as number | null,
    kalshi: kalshiTotal?.[`acc_${w}` as keyof CategoryRow] as number | null,
  }));

  return (
    <div className="rounded-xl border border-pm-border-base bg-pm-bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-pm-fg-subtle">
          Accuracy by Time Window
        </h3>
        <p className="mt-0.5 text-xs text-pm-fg-faint">
          Overall accuracy at different intervals before resolution
        </p>
      </div>
      <div className="h-64 min-h-[256px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
            <XAxis
              dataKey="window"
              stroke="#52525b"
              fontSize={11}
            />
            <YAxis
              stroke="#52525b"
              fontSize={10}
              tickFormatter={(v) => `${v}%`}
              domain={[50, 100]}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value) => [`${value}%`]}
              labelFormatter={(v) => `${v} before resolution`}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }} />
            <Line
              type="monotone"
              dataKey="polymarket"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
              name="Polymarket"
            />
            <Line
              type="monotone"
              dataKey="kalshi"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
              name="Kalshi"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
