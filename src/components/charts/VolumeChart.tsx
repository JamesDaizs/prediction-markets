"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/format";
import { CHART_TOOLTIP_STYLE } from "@/lib/constants";

export function VolumeBarChart({ data, title }: { data: { name: string; volume: number }[]; title?: string }) {
  return (
    <div className="rounded-xl border border-pm-border-base bg-pm-bg-card p-5">
      {title && <h3 className="mb-4 text-sm font-medium text-pm-fg-subtle">{title}</h3>}
      <div className="h-80 min-h-[320px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" />
            <XAxis type="number" tickFormatter={(v) => formatCurrency(v, true)} stroke="var(--pm-fg-faint)" fontSize={11} />
            <YAxis type="category" dataKey="name" stroke="var(--pm-fg-faint)" fontSize={11} width={110} tickFormatter={(v: string) => v.length > 25 ? v.slice(0, 25) + "\u2026" : v} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value) => [formatCurrency(Number(value)), "Volume"]} labelStyle={{ color: "var(--pm-fg-subtle)" }} />
            <Bar dataKey="volume" fill="var(--pm-brand)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
