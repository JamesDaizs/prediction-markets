"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/format";

export function VolumeBarChart({ data, title }: { data: { name: string; volume: number }[]; title?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      {title && <h3 className="mb-4 text-sm font-medium text-zinc-400">{title}</h3>}
      <div className="h-80 min-h-[320px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis type="number" tickFormatter={(v) => formatCurrency(v, true)} stroke="#52525b" fontSize={11} />
            <YAxis type="category" dataKey="name" stroke="#52525b" fontSize={11} width={110} tickFormatter={(v: string) => v.length > 25 ? v.slice(0, 25) + "\u2026" : v} />
            <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "12px" }} formatter={(value) => [formatCurrency(Number(value)), "Volume"]} labelStyle={{ color: "#a1a1aa" }} />
            <Bar dataKey="volume" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
