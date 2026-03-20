"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { formatPercent } from "@/lib/format";
import type { Concentration } from "@/lib/types";

export function ConcentrationChart({ data, title }: { data: Concentration[]; title?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      {title && <h3 className="mb-4 text-sm font-medium text-zinc-400">{title}</h3>}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="pct_traders" stroke="#52525b" fontSize={11} tickFormatter={(v) => `${v}%`} />
            <YAxis stroke="#52525b" fontSize={11} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
            <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "12px" }} formatter={(value) => [formatPercent(Number(value)), "Volume share"]} labelFormatter={(v) => `Top ${v}% of traders`} labelStyle={{ color: "#a1a1aa" }} />
            <ReferenceLine x={10} stroke="#ef4444" strokeDasharray="3 3" />
            <Area type="monotone" dataKey="pct_volume" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
