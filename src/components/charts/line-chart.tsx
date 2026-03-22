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

interface DataPoint {
  date: string;
  [key: string]: string | number;
}

interface LineConfig {
  dataKey: string;
  name: string;
  color: string;
}

interface Props {
  data: DataPoint[];
  lines: LineConfig[];
  title?: string;
  yFormatter?: (v: number) => string;
  height?: number;
}

export function TimeSeriesChart({
  data,
  lines,
  title,
  yFormatter,
  height = 280,
}: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      {title && (
        <h3 className="mb-4 text-sm font-medium text-zinc-400">{title}</h3>
      )}
      <div style={{ height, minHeight: height }} className="min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="date" stroke="#52525b" fontSize={10} />
            <YAxis
              stroke="#52525b"
              fontSize={11}
              tickFormatter={yFormatter}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value) => [
                yFormatter ? yFormatter(Number(value)) : value,
              ]}
              labelStyle={{ color: "#a1a1aa" }}
            />
            {lines.length > 1 && (
              <Legend wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }} />
            )}
            {lines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color}
                strokeWidth={2}
                dot={false}
                name={line.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
