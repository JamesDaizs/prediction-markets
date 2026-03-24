"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CHART_TOOLTIP_STYLE } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import type { ResolutionData } from "@/app/accuracy/types";

interface Props {
  polymarket: ResolutionData;
  kalshi: ResolutionData;
}

const YES_COLOR = "#22c55e";
const NO_COLOR = "#ef4444";

function DonutHalf({
  data,
  label,
  accentColor,
}: {
  data: ResolutionData;
  label: string;
  accentColor: string;
}) {
  const chartData = [
    { name: "YES", value: data.yes },
    { name: "NO", value: data.no },
  ];
  const yesPct = data.total > 0 ? ((data.yes / data.total) * 100).toFixed(1) : "0";
  const noPct = data.total > 0 ? ((data.no / data.total) * 100).toFixed(1) : "0";

  return (
    <div className="flex flex-col items-center">
      <div className="mb-1 flex items-center gap-1.5">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
        <span className="text-xs font-medium text-pm-fg-subtle">{label}</span>
      </div>
      <div className="h-40 w-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={YES_COLOR} />
              <Cell fill={NO_COLOR} />
            </Pie>
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value) => [formatNumber(Number(value), true)]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex gap-4 text-xs">
        <span>
          <span className="font-medium" style={{ color: YES_COLOR }}>
            YES {yesPct}%
          </span>
        </span>
        <span>
          <span className="font-medium" style={{ color: NO_COLOR }}>
            NO {noPct}%
          </span>
        </span>
      </div>
      <div className="mt-0.5 text-[10px] text-pm-fg-faint">
        {formatNumber(data.total, true)} markets
      </div>
    </div>
  );
}

export function ResolutionDonut({ polymarket, kalshi }: Props) {
  return (
    <div className="rounded-xl border border-pm-border-base bg-pm-bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-pm-fg-subtle">
          Resolution Distribution
        </h3>
        <p className="mt-0.5 text-xs text-pm-fg-faint">
          YES vs NO outcome split for resolved markets
        </p>
      </div>
      <div className="flex items-center justify-around">
        <DonutHalf
          data={polymarket}
          label="Polymarket"
          accentColor="#8b5cf6"
        />
        <DonutHalf
          data={kalshi}
          label="Kalshi"
          accentColor="#3b82f6"
        />
      </div>
    </div>
  );
}
