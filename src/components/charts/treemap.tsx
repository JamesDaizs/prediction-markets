"use client";

import { useState } from "react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { TREEMAP_COLORS, CHART_TOOLTIP_STYLE } from "@/lib/constants";

interface TreeNode {
  name: string;
  size: number;
  [key: string]: string | number;
}

export interface HierarchicalNode {
  name: string;
  children?: HierarchicalNode[];
  size?: number;
}

interface Props {
  data: TreeNode[];
  hierarchicalData?: HierarchicalNode[];
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
  root?: { children?: { name?: string }[] };
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
    </g>
  );
}

function flattenLevel(nodes: HierarchicalNode[]): TreeNode[] {
  return nodes.map((n) => {
    const size =
      n.size ??
      (n.children ?? []).reduce(
        (s, c) =>
          s +
          (c.size ??
            (c.children ?? []).reduce((ss, m) => ss + (m.size ?? 0), 0)),
        0
      );
    return { name: n.name, size };
  });
}

export function CategoryTreemap({
  data,
  hierarchicalData,
  title,
  valueLabel = "Volume",
}: Props) {
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);

  // Determine what to render based on drill-down state
  let displayData = data;
  let canDrillDown = false;

  if (hierarchicalData && hierarchicalData.length > 0) {
    let current: HierarchicalNode[] = hierarchicalData;

    for (const crumb of breadcrumb) {
      const found = current.find((n) => n.name === crumb);
      if (found?.children) {
        current = found.children;
      } else {
        break;
      }
    }

    displayData = flattenLevel(current);
    canDrillDown = current.some((n) => n.children && n.children.length > 0);
  }

  const handleClick = (entry: { name?: string }) => {
    if (!canDrillDown || !entry.name || !hierarchicalData) return;

    let current: HierarchicalNode[] = hierarchicalData;
    for (const crumb of breadcrumb) {
      const found = current.find((n) => n.name === crumb);
      if (found?.children) current = found.children;
    }

    const target = current.find((n) => n.name === entry.name);
    if (target?.children && target.children.length > 0) {
      setBreadcrumb((prev) => [...prev, entry.name!]);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-4 flex items-center gap-2">
        {title && (
          <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
        )}
        {breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setBreadcrumb([])}
              className="text-violet-400 hover:text-violet-300"
            >
              All
            </button>
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="text-zinc-600">/</span>
                <button
                  onClick={() => setBreadcrumb((prev) => prev.slice(0, i + 1))}
                  className={
                    i === breadcrumb.length - 1
                      ? "text-zinc-300"
                      : "text-violet-400 hover:text-violet-300"
                  }
                >
                  {crumb}
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      {canDrillDown && (
        <p className="mb-2 text-xs text-zinc-600">Click a category to drill down</p>
      )}
      <div className="h-80 min-h-[320px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <Treemap
            data={displayData}
            dataKey="size"
            aspectRatio={4 / 3}
            content={<CustomContent x={0} y={0} width={0} height={0} />}
            onClick={canDrillDown ? handleClick : undefined}
            style={canDrillDown ? { cursor: "pointer" } : undefined}
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
