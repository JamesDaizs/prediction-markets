"use client";

import type { CategoryRow } from "./types";

interface AccuracyTableProps {
  platform: string;
  data: CategoryRow[];
  totalMarkets?: number;
}

const TIME_WINDOWS = [
  { key: "acc_4h", label: "4h", nKey: "n_4h" },
  { key: "acc_12h", label: "12h", nKey: "n_12h" },
  { key: "acc_1d", label: "1d", nKey: "n_1d" },
  { key: "acc_1w", label: "1w", nKey: "n_1w" },
  { key: "acc_1mo", label: "1mo", nKey: "n_1mo" },
] as const;

function getAccuracyColor(value: number | null): string {
  if (value === null) return "text-pm-fg-faint";
  if (value >= 95) return "text-emerald-400";
  if (value >= 90) return "text-emerald-500";
  if (value >= 85) return "text-green-500";
  if (value >= 80) return "text-lime-500";
  if (value >= 75) return "text-yellow-400";
  if (value >= 70) return "text-amber-400";
  if (value >= 65) return "text-orange-400";
  if (value >= 60) return "text-orange-500";
  return "text-red-400";
}

function getAccuracyBg(value: number | null): string {
  if (value === null) return "";
  if (value >= 95) return "bg-emerald-400/10";
  if (value >= 90) return "bg-emerald-500/8";
  if (value >= 85) return "bg-green-500/8";
  if (value >= 80) return "bg-lime-500/6";
  if (value >= 75) return "bg-yellow-400/6";
  return "";
}

function getBrierColor(value: number | null): string {
  if (value === null) return "text-pm-fg-faint";
  if (value <= 0.05) return "text-emerald-400";
  if (value <= 0.10) return "text-emerald-500";
  if (value <= 0.15) return "text-lime-500";
  if (value <= 0.20) return "text-yellow-400";
  return "text-red-400";
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function AccuracyTable({
  platform,
  data,
  totalMarkets,
}: AccuracyTableProps) {
  const categories = data.filter((r) => r.category !== "Total");
  const totalRow = data.find((r) => r.category === "Total");

  return (
    <div className="rounded-xl border border-pm-border-base bg-pm-bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-pm-border-subtle px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              platform === "Polymarket" ? "bg-pm-polymarket" : "bg-pm-kalshi"
            }`}
          />
          <h2 className="text-sm font-semibold text-pm-fg-base">{platform}</h2>
        </div>
        {totalMarkets && (
          <span className="text-xs text-pm-fg-faint">
            {formatNumber(totalMarkets)} resolved markets
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-pm-border-subtle/50">
              <th className="px-5 py-2.5 text-left text-xs font-medium text-pm-fg-faint uppercase tracking-wider">
                Category
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-medium text-pm-fg-faint uppercase tracking-wider">
                Markets
              </th>
              {TIME_WINDOWS.map((tw) => (
                <th
                  key={tw.key}
                  className="px-3 py-2.5 text-center text-xs font-medium text-pm-fg-faint uppercase tracking-wider"
                >
                  {tw.label}
                </th>
              ))}
              <th className="px-3 py-2.5 text-center text-xs font-medium text-pm-fg-faint uppercase tracking-wider">
                Brier
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pm-border-subtle/30">
            {categories.map((row) => (
              <tr
                key={row.category}
                className="hover:bg-pm-bg-card-hover transition-colors"
              >
                <td className="px-5 py-2.5 font-medium text-pm-fg-subtle whitespace-nowrap">
                  {row.category}
                </td>
                <td className="px-3 py-2.5 text-right text-pm-fg-muted tabular-nums">
                  {formatNumber(row.markets)}
                </td>
                {TIME_WINDOWS.map((tw) => {
                  const val = row[tw.key as keyof CategoryRow] as
                    | number
                    | null;
                  const n = row[tw.nKey as keyof CategoryRow] as number;
                  return (
                    <td
                      key={tw.key}
                      className={`px-3 py-2.5 text-center tabular-nums ${getAccuracyBg(val)}`}
                    >
                      <span className={`font-medium ${getAccuracyColor(val)}`}>
                        {val !== null ? `${val}%` : "-"}
                      </span>
                      {n > 0 && val !== null && (
                        <span className="ml-1 text-[10px] text-pm-fg-faint">
                          ({formatNumber(n)})
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2.5 text-center tabular-nums">
                  <span className={`font-medium ${getBrierColor(row.brier)}`}>
                    {row.brier != null ? row.brier.toFixed(4) : "-"}
                  </span>
                  {row.brier_n > 0 && row.brier != null && (
                    <span className="ml-1 text-[10px] text-pm-fg-faint">
                      ({formatNumber(row.brier_n)})
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {/* Total row */}
            {totalRow && (
              <tr className="border-t border-pm-border-base bg-pm-bg-subtle">
                <td className="px-5 py-2.5 font-semibold text-pm-fg-base">Total</td>
                <td className="px-3 py-2.5 text-right font-semibold text-pm-fg-base tabular-nums">
                  {formatNumber(totalRow.markets)}
                </td>
                {TIME_WINDOWS.map((tw) => {
                  const val = totalRow[tw.key as keyof CategoryRow] as
                    | number
                    | null;
                  return (
                    <td
                      key={tw.key}
                      className={`px-3 py-2.5 text-center tabular-nums ${getAccuracyBg(val)}`}
                    >
                      <span
                        className={`font-semibold ${getAccuracyColor(val)}`}
                      >
                        {val !== null ? `${val}%` : "-"}
                      </span>
                    </td>
                  );
                })}
                <td className="px-3 py-2.5 text-center tabular-nums">
                  <span className={`font-semibold ${getBrierColor(totalRow.brier)}`}>
                    {totalRow.brier != null ? totalRow.brier.toFixed(4) : "-"}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
