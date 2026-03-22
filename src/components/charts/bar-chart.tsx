"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { CHART_TOOLTIP_STYLE } from "@/lib/constants";

interface DataItem {
  name: string;
  polymarket?: number;
  kalshi?: number;
  value?: number;
}

interface Props {
  data: DataItem[];
  title?: string;
  stacked?: boolean;
  showPercentage?: boolean;
}

export function CategoryBarChart({
  data,
  title,
  stacked = false,
  showPercentage = false,
}: Props) {
  const displayData = showPercentage
    ? data.map((d) => {
        const total = (d.polymarket ?? 0) + (d.kalshi ?? 0) + (d.value ?? 0);
        if (total === 0) return d;
        return {
          ...d,
          polymarket: d.polymarket ? (d.polymarket / total) * 100 : undefined,
          kalshi: d.kalshi ? (d.kalshi / total) * 100 : undefined,
          value: d.value ? (d.value / total) * 100 : undefined,
        };
      })
    : data;

  const hasPlatformSplit = data.some(
    (d) => d.polymarket !== undefined || d.kalshi !== undefined
  );

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      {title && (
        <h3 className="mb-4 text-sm font-medium text-zinc-400">{title}</h3>
      )}
      <div className="h-80 min-h-[320px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <BarChart data={displayData} layout="vertical" margin={{ left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              type="number"
              tickFormatter={(v) =>
                showPercentage ? `${v.toFixed(0)}%` : formatCurrency(v, true)
              }
              stroke="#52525b"
              fontSize={11}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#52525b"
              fontSize={11}
              width={95}
              tickFormatter={(v: string) =>
                v.length > 20 ? v.slice(0, 20) + "..." : v
              }
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value) => [
                showPercentage
                  ? `${Number(value).toFixed(1)}%`
                  : formatCurrency(Number(value), true),
              ]}
              labelStyle={{ color: "#a1a1aa" }}
            />
            {hasPlatformSplit ? (
              <>
                <Legend
                  wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }}
                />
                <Bar
                  dataKey="polymarket"
                  name="Polymarket"
                  fill="#8b5cf6"
                  radius={stacked ? undefined : [0, 4, 4, 0]}
                  stackId={stacked ? "stack" : undefined}
                />
                <Bar
                  dataKey="kalshi"
                  name="Kalshi"
                  fill="#3b82f6"
                  radius={stacked ? undefined : [0, 4, 4, 0]}
                  stackId={stacked ? "stack" : undefined}
                />
              </>
            ) : (
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
