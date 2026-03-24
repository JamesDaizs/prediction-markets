import type { TimeRange } from "./api/types";

export const DASHBOARD_TIME_RANGES: { label: string; value: string }[] = [
  { label: "Latest", value: "latest" },
  { label: "1W", value: "7d" },
  { label: "2W", value: "14d" },
  { label: "1M", value: "30d" },
  { label: "3M", value: "90d" },
  { label: "6M", value: "180d" },
  { label: "1Y", value: "1y" },
  { label: "All", value: "all" },
];

export const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "6M", value: "180d" },
  { label: "1Y", value: "1y" },
  { label: "All", value: "all" },
];

export const CATEGORY_COLORS: Record<string, string> = {
  Crypto: "#8b5cf6",
  Politics: "#3b82f6",
  Sports: "#22c55e",
  Science: "#06b6d4",
  Economics: "#eab308",
  Entertainment: "#ec4899",
  Technology: "#f97316",
  Finance: "#14b8a6",
  Weather: "#6366f1",
  Culture: "#a855f7",
  Other: "#71717a",
  // CH aliases (mapped by normalizeCHCategory, but kept for safety)
  Financials: "#14b8a6",
  STEM: "#06b6d4",
  Unknown: "#71717a",
};

export const TREEMAP_COLORS = [
  "#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#14b8a6",
  "#22c55e", "#eab308", "#f97316", "#ef4444", "#ec4899",
  "#a855f7", "#2563eb", "#0891b2", "#059669", "#d97706",
  "#dc2626", "#db2777", "#7c3aed", "#4f46e5", "#0284c7",
];

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#27272a",
  border: "1px solid #3f3f46",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#d4d4d8",
  padding: "8px 12px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
};
