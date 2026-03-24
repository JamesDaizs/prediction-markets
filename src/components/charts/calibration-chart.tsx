"use client";

import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ComposedChart,
} from "recharts";
import { CHART_TOOLTIP_STYLE } from "@/lib/constants";
import type { CalibrationBucket } from "@/app/accuracy/types";

interface Props {
  polymarket: CalibrationBucket[];
  kalshi: CalibrationBucket[];
}

/** Convert bucket to integer index 0-19 for float-safe matching. */
function bucketIndex(b: CalibrationBucket): number {
  return Math.round(b.bucket_low * 20);
}

export function CalibrationChart({ polymarket, kalshi }: Props) {
  // Build lookup maps keyed by integer bucket index (0-19) to avoid float drift
  const polyMap = new Map(polymarket.map((b) => [bucketIndex(b), b]));
  const kalshiMap = new Map(kalshi.map((b) => [bucketIndex(b), b]));

  const allIndices = new Set([...polyMap.keys(), ...kalshiMap.keys()]);

  const data = Array.from(allIndices)
    .sort((a, b) => a - b)
    .map((idx) => {
      const mid = (idx + 0.5) * 5; // midpoint in percentage (e.g. idx=0 → 2.5%)
      const p = polyMap.get(idx);
      const k = kalshiMap.get(idx);
      return {
        predicted: Math.round(mid),
        polyActual: p ? Math.round(p.actual_rate * 100 * 10) / 10 : null,
        kalshiActual: k ? Math.round(k.actual_rate * 100 * 10) / 10 : null,
        polyN: p?.n ?? 0,
        kalshiN: k?.n ?? 0,
        perfect: Math.round(mid),
      };
    });

  return (
    <div className="rounded-xl border border-pm-border-base bg-pm-bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-pm-fg-subtle">
          Calibration Curve
        </h3>
        <p className="mt-0.5 text-xs text-pm-fg-faint">
          Predicted probability vs actual resolution rate (1 day before close).
          Perfect calibration = diagonal.
        </p>
      </div>
      <div className="h-80 min-h-[320px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
            <XAxis
              dataKey="predicted"
              stroke="#52525b"
              fontSize={10}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
              type="number"
              ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
            />
            <YAxis
              stroke="#52525b"
              fontSize={10}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
              ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value, name) => {
                const label =
                  name === "polyActual"
                    ? "Polymarket"
                    : name === "kalshiActual"
                      ? "Kalshi"
                      : "Perfect";
                return [`${value}%`, label];
              }}
              labelFormatter={(v) => `Predicted: ${v}%`}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }}
              formatter={(value) => {
                if (value === "polyActual") return "Polymarket";
                if (value === "kalshiActual") return "Kalshi";
                if (value === "perfect") return "Perfect";
                return value;
              }}
            />
            {/* Perfect calibration diagonal */}
            <Line
              type="linear"
              dataKey="perfect"
              stroke="#52525b"
              strokeWidth={1}
              strokeDasharray="6 4"
              dot={false}
              name="perfect"
              legendType="plainline"
            />
            {/* Polymarket line */}
            <Line
              type="monotone"
              dataKey="polyActual"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 3, fill: "#8b5cf6", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#8b5cf6" }}
              name="polyActual"
              connectNulls
            />
            {/* Kalshi line */}
            <Line
              type="monotone"
              dataKey="kalshiActual"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#3b82f6" }}
              name="kalshiActual"
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
