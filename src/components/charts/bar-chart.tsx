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
    <div className="rounded-xl border border-pm-border-base bg-pm-bg-card p-5">
      {title && (
        <h3 className="mb-4 text-sm font-medium text-pm-fg-subtle">{title}</h3>
      )}
      <div className="h-80 min-h-[320px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <BarChart data={displayData} layout="vertical" margin={{ left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" />
            <XAxis
              type="number"
              tickFormatter={(v) =>
                showPercentage ? `${v.toFixed(0)}%` : formatCurrency(v, true)
              }
              stroke="var(--pm-fg-faint)"
              fontSize={11}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="var(--pm-fg-faint)"
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
              labelStyle={{ color: "var(--pm-fg-subtle)" }}
            />
            {hasPlatformSplit ? (
              <>
                <Legend
                  wrapperStyle={{ fontSize: "11px", color: "var(--pm-fg-subtle)" }}
                />
                <Bar
                  dataKey="polymarket"
                  name="Polymarket"
                  fill="var(--pm-polymarket)"
                  radius={stacked ? undefined : [0, 4, 4, 0]}
                  stackId={stacked ? "stack" : undefined}
                />
                <Bar
                  dataKey="kalshi"
                  name="Kalshi"
                  fill="var(--pm-kalshi)"
                  radius={stacked ? undefined : [0, 4, 4, 0]}
                  stackId={stacked ? "stack" : undefined}
                />
              </>
            ) : (
              <Bar dataKey="value" fill="var(--pm-brand)" radius={[0, 4, 4, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
