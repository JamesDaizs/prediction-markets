"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { BetBucket } from "@/lib/types";

const COLORS = ["#22c55e", "#3b82f6", "#8b5cf6", "#f97316", "#ef4444", "#ec4899"];

export function BetHistogram({ data, title, colorBy = "count" }: { data: BetBucket[]; title?: string; colorBy?: "count" | "volume" }) {
  return (
    <div className="rounded-xl border border-pm-border-base bg-pm-bg-card p-5">
      {title && <h3 className="mb-4 text-sm font-medium text-pm-fg-subtle">{title}</h3>}
      <div className="h-64 min-h-[256px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" />
            <XAxis dataKey="bucket" stroke="var(--pm-fg-faint)" fontSize={11} />
            <YAxis stroke="var(--pm-fg-faint)" fontSize={11} tickFormatter={(v) => colorBy === "volume" ? formatCurrency(v, true) : formatNumber(v, true)} />
            <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "12px" }} formatter={(value) => [colorBy === "volume" ? formatCurrency(Number(value)) : formatNumber(Number(value)), colorBy === "volume" ? "Volume" : "Trades"]} labelStyle={{ color: "var(--pm-fg-subtle)" }} />
            <Bar dataKey={colorBy} radius={[4, 4, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
