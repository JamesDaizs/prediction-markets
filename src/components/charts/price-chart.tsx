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
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      {title && (
        <h3 className="mb-4 text-sm font-medium text-zinc-400">{title}</h3>
      )}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorYes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorNo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="date" stroke="#52525b" fontSize={10} />
            <YAxis
              stroke="#52525b"
              fontSize={11}
              domain={[0, 1]}
              tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value) => [
                `${(Number(value) * 100).toFixed(1)}%`,
              ]}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }} />
            <Area
              type="monotone"
              dataKey="yes"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#colorYes)"
              name={labelA}
            />
            <Area
              type="monotone"
              dataKey="no"
              stroke="#ef4444"
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
