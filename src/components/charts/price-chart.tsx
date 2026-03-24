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
import { CHART_TOOLTIP_STYLE } from "@/lib/constants";

interface PricePoint {
  date: string;
  yes: number;
  no: number;
  high?: number;
  low?: number;
}

interface Props {
  data: PricePoint[];
  title?: string;
  labelA?: string;
  labelB?: string;
}

export function PriceChart({
  data,
  title,
  labelA = "Yes",
  labelB = "No",
}: Props) {
  return (
    <div className="rounded-xl border border-pm-border-base bg-pm-bg-card p-5">
      {title && (
        <h3 className="mb-4 text-sm font-medium text-pm-fg-subtle">{title}</h3>
      )}
      <div className="h-64 min-h-[256px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorYes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--pm-positive)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--pm-positive)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorNo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--pm-negative)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--pm-negative)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" />
            <XAxis dataKey="date" stroke="var(--pm-fg-faint)" fontSize={10} />
            <YAxis
              stroke="var(--pm-fg-faint)"
              fontSize={11}
              domain={[0, 1]}
              tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value) => [
                `${(Number(value) * 100).toFixed(1)}%`,
              ]}
              labelStyle={{ color: "var(--pm-fg-subtle)" }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", color: "var(--pm-fg-subtle)" }} />
            <Area
              type="monotone"
              dataKey="yes"
              stroke="var(--pm-positive)"
              strokeWidth={2}
              fill="url(#colorYes)"
              name={labelA}
            />
            <Area
              type="monotone"
              dataKey="no"
              stroke="var(--pm-negative)"
              strokeWidth={2}
              fill="url(#colorNo)"
              name={labelB}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
