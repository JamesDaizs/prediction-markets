"use client";

import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { TREEMAP_COLORS, CHART_TOOLTIP_STYLE } from "@/lib/constants";

interface TreeNode {
  name: string;
  size: number;
  [key: string]: string | number;
}

interface Props {
  data: TreeNode[];
  title?: string;
  valueLabel?: string;
}

interface ContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
  index?: number;
  depth?: number;
}

function CustomContent({ x, y, width, height, name, index, depth }: ContentProps) {
  if (depth !== 1) return null;
  const color = TREEMAP_COLORS[(index ?? 0) % TREEMAP_COLORS.length];
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        fillOpacity={0.85}
        stroke="#18181b"
        strokeWidth={2}
        rx={4}
      />
      {width > 50 && height > 28 && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (height > 44 ? 6 : 0)}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={width > 120 ? 12 : 10}
          fontWeight={500}
        >
          {(name ?? "").length > 20 ? (name ?? "").slice(0, 20) + "..." : name}
        </text>
      )}
      {width > 70 && height > 44 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 12}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(255,255,255,0.7)"
          fontSize={9}
        >
          {formatCurrency(0, true)}
        </text>
      )}
    </g>
  );
}

export function CategoryTreemap({ data, title, valueLabel = "Volume" }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      {title && (
        <h3 className="mb-4 text-sm font-medium text-zinc-400">{title}</h3>
      )}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey="size"
            aspectRatio={4 / 3}
            content={<CustomContent x={0} y={0} width={0} height={0} />}
          >
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value) => [
                formatCurrency(Number(value), true),
                valueLabel,
              ]}
              labelStyle={{ color: "#a1a1aa" }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
