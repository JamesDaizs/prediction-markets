"use client";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/format";

const COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#14b8a6", "#22c55e", "#eab308", "#f97316", "#ef4444", "#ec4899", "#a855f7", "#2563eb"];

interface ContentProps { x: number; y: number; width: number; height: number; name?: string; index?: number; depth?: number }

function CustomContent({ x, y, width, height, name, index, depth }: ContentProps) {
  if (depth !== 1) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={COLORS[(index ?? 0) % COLORS.length]} fillOpacity={0.85} stroke="#18181b" strokeWidth={2} rx={4} />
      {width > 60 && height > 30 && (
        <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={width > 100 ? 11 : 9} fontWeight={500}>
          {(name ?? "").length > 18 ? (name ?? "").slice(0, 18) + "\u2026" : name}
        </text>
      )}
    </g>
  );
}

export function CategoryTreemap({ data, title }: { data: { name: string; size: number }[]; title?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      {title && <h3 className="mb-4 text-sm font-medium text-zinc-400">{title}</h3>}
      <div className="h-72 min-h-[288px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <Treemap data={data} dataKey="size" aspectRatio={4 / 3} content={<CustomContent x={0} y={0} width={0} height={0} />}>
            <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "12px" }} formatter={(value) => [formatCurrency(Number(value), true), "Volume"]} labelStyle={{ color: "#a1a1aa" }} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
