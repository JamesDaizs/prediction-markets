"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { Segment } from "@/lib/types";

const COLORS = ["#ef4444", "#f97316", "#22c55e"];

export function SegmentPie({ data, title, metric = "volume" }: { data: Segment[]; title?: string; metric?: "count" | "volume" }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      {title && <h3 className="mb-4 text-sm font-medium text-zinc-400">{title}</h3>}
      <div className="flex items-center gap-6">
        <div className="h-48 w-48 min-h-[192px] min-w-[192px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <PieChart>
              <Pie data={data} dataKey={metric} nameKey="segment" cx="50%" cy="50%" outerRadius={70} innerRadius={40} strokeWidth={2} stroke="#18181b">
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "12px" }} formatter={(value) => [metric === "volume" ? formatCurrency(Number(value), true) : formatNumber(Number(value)), metric === "volume" ? "Volume" : "Traders"]} labelStyle={{ color: "#a1a1aa" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2">
          {data.map((item, i) => (
            <div key={item.segment} className="flex items-center gap-2 text-sm">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-zinc-300">{item.segment}</span>
              <span className="text-zinc-500">({formatNumber(item.count)} traders, {formatCurrency(item.volume, true)})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
