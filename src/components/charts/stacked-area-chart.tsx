"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { CATEGORY_COLORS, CHART_TOOLTIP_STYLE } from "@/lib/constants";

interface DataPoint {
  date: string;
  [category: string]: string | number;
}

interface Props {
  data: DataPoint[];
  categories: string[];
  title?: string;
  normalized?: boolean;
}

export function StackedAreaChart({
  data,
  categories,
  title,
  normalized = false,
}: Props) {
  const displayData = normalized
    ? data.map((d) => {
        const total = categories.reduce(
          (sum, cat) => sum + (Number(d[cat]) || 0),
          0
        );
        if (total === 0) return d;
        const row: DataPoint = { date: d.date };
        for (const cat of categories) {
          row[cat] = ((Number(d[cat]) || 0) / total) * 100;
        }
        return row;
      })
    : data;

  return (
    <div className="rounded-xl border border-pm-border-base bg-pm-bg-card p-5">
      {title && (
        <h3 className="mb-4 text-sm font-medium text-pm-fg-subtle">{title}</h3>
      )}
      <div className="h-80 min-h-[320px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <AreaChart data={displayData}>
            <defs>
              {categories.map((cat) => {
                const color = CATEGORY_COLORS[cat] || "#71717a";
                return (
                  <linearGradient
                    key={cat}
                    id={`gradient-${cat.replace(/\s/g, "")}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
            <XAxis
              dataKey="date"
              stroke="#52525b"
              fontSize={10}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
            />
            <YAxis
              stroke="#52525b"
              fontSize={10}
              tickFormatter={(v) =>
                normalized ? `${v.toFixed(0)}%` : formatCurrency(v, true)
              }
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value) => [
                normalized
                  ? `${Number(value).toFixed(1)}%`
                  : formatCurrency(Number(value), true),
              ]}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }} />
            {categories.map((cat) => (
              <Area
                key={cat}
                type="monotone"
                dataKey={cat}
                name={cat}
                stackId="1"
                stroke={CATEGORY_COLORS[cat] || "#71717a"}
                fill={`url(#gradient-${cat.replace(/\s/g, "")})`}
                strokeWidth={1}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
