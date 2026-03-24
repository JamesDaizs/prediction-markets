"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { TREEMAP_COLORS } from "@/lib/constants";
import { Loader2 } from "lucide-react";

interface TreeNode {
  name: string;
  size: number;
  [key: string]: string | number;
}

export interface HierarchicalNode {
  name: string;
  children?: HierarchicalNode[];
  size?: number;
  polymarket?: number;
  kalshi?: number;
}

type Platform = "both" | "polymarket" | "kalshi";

interface Props {
  data: TreeNode[];
  hierarchicalData?: HierarchicalNode[];
  title?: string;
  valueLabel?: string;
  platform?: Platform;
}

interface ContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
  index?: number;
  depth?: number;
  colorIdx?: number;
  category?: string;
}

// ── Tooltip style ──
const TOOLTIP_STYLE = {
  backgroundColor: "#27272a",
  border: "1px solid #3f3f46",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#d4d4d8",
  padding: "8px 12px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
};

// ── Paradigm-style nested content ──
function NestedContent({ x, y, width, height, depth, name, colorIdx }: ContentProps) {
  const color = TREEMAP_COLORS[(colorIdx ?? 0) % TREEMAP_COLORS.length];
  const label = name ?? "";

  if (depth === 1) {
    const maxChars = Math.max(Math.floor(width / 7), 3);
    return (
      <g>
        <rect
          x={x} y={y} width={width} height={height}
          fill={color} fillOpacity={0.06}
          stroke={color} strokeWidth={2} strokeOpacity={0.4} rx={6}
        />
        {width > 40 && height > 18 && (
          <text
            x={x + 6} y={y + 14}
            fill={color} fontSize={11} fontWeight={700} opacity={0.9}
          >
            {label.length > maxChars ? label.slice(0, maxChars) + "\u2026" : label}
          </text>
        )}
      </g>
    );
  }

  if (depth === 2) {
    const maxChars = Math.max(Math.floor(width / 7), 3);
    return (
      <g>
        <rect
          x={x + 1} y={y + 1}
          width={Math.max(width - 2, 0)} height={Math.max(height - 2, 0)}
          fill={color} fillOpacity={0.8}
          stroke="var(--pm-bg-base)" strokeWidth={1} rx={3}
        />
        {width > 40 && height > 22 && (
          <text
            x={x + width / 2} y={y + height / 2}
            textAnchor="middle" dominantBaseline="central"
            fill="#fff" fontSize={width > 100 ? 11 : 9} fontWeight={400} opacity={0.9}
          >
            {label.length > maxChars ? label.slice(0, maxChars) + "\u2026" : label}
          </text>
        )}
      </g>
    );
  }

  return null;
}

// ── Flat content (drill-down levels) ──
function FlatContent({ x, y, width, height, name, index, depth }: ContentProps) {
  if (depth !== 1) return null;
  const color = TREEMAP_COLORS[(index ?? 0) % TREEMAP_COLORS.length];
  const label = name ?? "";
  const maxChars = Math.max(Math.floor(width / 7), 3);
  return (
    <g>
      <rect
        x={x} y={y} width={width} height={height}
        fill={color} fillOpacity={0.85}
        stroke="var(--pm-bg-card)" strokeWidth={2} rx={4}
      />
      {width > 50 && height > 28 && (
        <text
          x={x + width / 2} y={y + height / 2 - (height > 44 ? 6 : 0)}
          textAnchor="middle" dominantBaseline="central"
          fill="#fff" fontSize={width > 120 ? 12 : 10} fontWeight={500}
        >
          {label.length > maxChars ? label.slice(0, maxChars) + "\u2026" : label}
        </text>
      )}
    </g>
  );
}

// ── Helper: get subcategory size respecting platform filter ──
function getSubSize(node: HierarchicalNode, platform: Platform): number {
  if (platform === "polymarket") return node.polymarket ?? 0;
  if (platform === "kalshi") return node.kalshi ?? 0;
  return node.size ?? ((node.polymarket ?? 0) + (node.kalshi ?? 0));
}

export function CategoryTreemap({
  data,
  hierarchicalData,
  title,
  valueLabel = "Volume",
  platform = "both",
}: Props) {
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
  const [drillMarkets, setDrillMarkets] = useState<TreeNode[] | null>(null);
  const [drillLoading, setDrillLoading] = useState(false);

  // Reset breadcrumb when platform changes
  useEffect(() => {
    setBreadcrumb([]);
    setDrillMarkets(null);
  }, [platform]);

  // ── Fetch individual markets when drilling into a subcategory ──
  useEffect(() => {
    if (breadcrumb.length < 2 || !hierarchicalData) {
      setDrillMarkets(null);
      return;
    }

    const [category, subcategory] = breadcrumb;
    setDrillLoading(true);
    setDrillMarkets(null);

    const params = new URLSearchParams({
      category,
      subcategory,
      platform,
      limit: "30",
    });

    fetch(`/api/subcategory-markets?${params}`)
      .then((res) => res.json())
      .then((markets: { title: string; oi: number; volume: number }[]) => {
        if (Array.isArray(markets)) {
          setDrillMarkets(
            markets.map((m) => ({
              name: m.title.length > 55 ? m.title.slice(0, 55) + "\u2026" : m.title,
              size: Math.max(m.oi, m.volume),
            }))
          );
        } else {
          setDrillMarkets([]);
        }
      })
      .catch(() => setDrillMarkets([]))
      .finally(() => setDrillLoading(false));
  }, [breadcrumb, platform, hierarchicalData]);

  // ── Build nested 2-level data for root view ──
  const nestedData = useMemo(() => {
    if (!hierarchicalData || hierarchicalData.length === 0) return null;
    return hierarchicalData
      .map((cat, catIdx) => ({
        name: cat.name,
        colorIdx: catIdx,
        children: (cat.children ?? [])
          .map((sub) => ({
            name: sub.name,
            colorIdx: catIdx,
            category: cat.name,
            size: getSubSize(sub, platform),
          }))
          .filter((sub) => sub.size > 0)
          .sort((a, b) => b.size - a.size),
      }))
      .filter((cat) => cat.children.length > 0);
  }, [hierarchicalData, platform]);

  // ── Build flat data for category-level drill-down (breadcrumb length 1) ──
  const categoryDrillData = useMemo(() => {
    if (breadcrumb.length !== 1 || !hierarchicalData) return null;
    const cat = hierarchicalData.find((h) => h.name === breadcrumb[0]);
    if (!cat?.children) return null;
    return cat.children
      .map((sub) => ({
        name: sub.name,
        size: getSubSize(sub, platform),
      }))
      .filter((s) => s.size > 0)
      .sort((a, b) => b.size - a.size);
  }, [breadcrumb, hierarchicalData, platform]);

  // ── State logic ──
  const atRoot = breadcrumb.length === 0;
  const atCategory = breadcrumb.length === 1;
  const atSubcategory = breadcrumb.length >= 2;
  const useNested = atRoot && nestedData && nestedData.length > 0;

  // What data to show in flat mode
  const flatData = atCategory ? categoryDrillData : atSubcategory ? drillMarkets : data;
  const isClickable = useNested || atCategory;

  // ── Click handler ──
  const handleClick = useCallback(
    (entry: Record<string, unknown>) => {
      const name = entry?.name as string | undefined;
      if (!name) return;

      if (useNested) {
        const category = entry?.category as string | undefined;
        if (category) {
          // Clicked subcategory → drill to individual markets
          setBreadcrumb([category, name]);
        } else {
          // Clicked category group → drill to subcategories
          setBreadcrumb([name]);
        }
      } else if (atCategory) {
        // Clicked subcategory → drill to individual markets
        setBreadcrumb((prev) => [...prev, name]);
      }
    },
    [useNested, atCategory]
  );

  return (
    <div className="rounded-xl border border-pm-border-base bg-pm-bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        {title && (
          <h3 className="text-sm font-medium text-pm-fg-subtle">{title}</h3>
        )}
        {breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setBreadcrumb([])}
              className="text-pm-brand hover:text-pm-brand/80"
            >
              All
            </button>
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="text-pm-fg-faint">/</span>
                <button
                  onClick={() => setBreadcrumb((prev) => prev.slice(0, i + 1))}
                  className={
                    i === breadcrumb.length - 1
                      ? "text-pm-fg-subtle"
                      : "text-pm-brand hover:text-pm-brand/80"
                  }
                >
                  {crumb}
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {isClickable && !drillLoading && (
        <p className="mb-2 text-xs text-pm-fg-faint">Click to drill down</p>
      )}

      <div className="h-[420px] min-h-[320px] min-w-0">
        {drillLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-pm-brand" />
            <span className="ml-2 text-sm text-pm-fg-muted">Loading markets...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            {useNested ? (
              <Treemap
                data={nestedData}
                dataKey="size"
                aspectRatio={4 / 3}
                content={<NestedContent x={0} y={0} width={0} height={0} />}
                onClick={handleClick}
                style={{ cursor: "pointer" }}
              >
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => [formatCurrency(Number(value), true), valueLabel]}
                  labelStyle={{ color: "#a1a1aa" }}
                />
              </Treemap>
            ) : (
              <Treemap
                data={flatData ?? data}
                dataKey="size"
                aspectRatio={4 / 3}
                content={<FlatContent x={0} y={0} width={0} height={0} />}
                onClick={isClickable ? handleClick : undefined}
                style={isClickable ? { cursor: "pointer" } : undefined}
              >
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => [formatCurrency(Number(value), true), valueLabel]}
                  labelStyle={{ color: "#a1a1aa" }}
                />
              </Treemap>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
