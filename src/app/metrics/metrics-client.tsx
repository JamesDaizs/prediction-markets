"use client";

import { useState, useCallback, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { PeriodToggle } from "@/components/period-toggle";
import { formatNumber, formatCurrency } from "@/lib/utils";
import type {
  CHPlatformPeriodRow,
  CHPlatformCategoryRow,
  Granularity,
} from "@/lib/api/clickhouse";

interface Props {
  initialWallets: CHPlatformPeriodRow[];
  initialTransactions: CHPlatformPeriodRow[];
  initialVolumeByCategory: CHPlatformCategoryRow[];
  initialNewMarkets: CHPlatformPeriodRow[];
  initialOI: CHPlatformPeriodRow[];
}

const POLY_COLOR = "#8b5cf6";
const KALSHI_COLOR = "#3b82f6";

function formatPeriodLabel(period: string, granularity: Granularity): string {
  const d = new Date(period + "T00:00:00");
  if (granularity === "monthly") {
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function compactNum(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
}

function calcTrend(data: CHPlatformPeriodRow[]): number {
  if (data.length < 2) return 0;
  const prev = data[data.length - 2];
  const curr = data[data.length - 1];
  const prevTotal = prev.polymarket + prev.kalshi;
  const currTotal = curr.polymarket + curr.kalshi;
  if (prevTotal === 0) return 0;
  return ((currTotal - prevTotal) / prevTotal) * 100;
}

export function MetricsClient({
  initialWallets,
  initialTransactions,
  initialVolumeByCategory,
  initialNewMarkets,
  initialOI,
}: Props) {
  const [granularity, setGranularity] = useState<Granularity>("weekly");
  const [wallets, setWallets] = useState(initialWallets);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [volumeByCategory, setVolumeByCategory] = useState(initialVolumeByCategory);
  const [newMarkets, setNewMarkets] = useState(initialNewMarkets);
  const [oi, setOI] = useState(initialOI);
  const [loading, setLoading] = useState(false);

  const handleGranularityChange = useCallback(async (g: Granularity) => {
    setGranularity(g);
    setLoading(true);
    try {
      const [w, t, v, nm, o] = await Promise.all([
        fetch(`/api/platform-metrics?metric=wallets&granularity=${g}`).then(
          (r) => r.json()
        ),
        fetch(
          `/api/platform-metrics?metric=transactions&granularity=${g}`
        ).then((r) => r.json()),
        fetch(
          `/api/platform-metrics?metric=volume&granularity=${g}`
        ).then((r) => r.json()),
        fetch(
          `/api/platform-metrics?metric=new_markets&granularity=${g}`
        ).then((r) => r.json()),
        fetch(`/api/platform-metrics?metric=oi&granularity=${g}`).then((r) =>
          r.json()
        ),
      ]);
      setWallets(w);
      setTransactions(t);
      setVolumeByCategory(v);
      setNewMarkets(nm);
      setOI(o);
    } catch {
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Latest period stats
  const latestWallets = wallets[wallets.length - 1];
  const latestTx = transactions[transactions.length - 1];
  const latestOI = oi[oi.length - 1];
  const latestNewMarkets = newMarkets[newMarkets.length - 1];

  // Sparkline data
  const walletSparkline = useMemo(
    () => wallets.map((w) => w.polymarket),
    [wallets]
  );
  const txSparkline = useMemo(
    () => transactions.map((t) => t.polymarket + t.kalshi),
    [transactions]
  );
  const oiSparkline = useMemo(
    () => oi.map((o) => o.polymarket + o.kalshi),
    [oi]
  );
  const nmSparkline = useMemo(
    () => newMarkets.map((n) => n.polymarket + n.kalshi),
    [newMarkets]
  );

  const chartTooltipStyle = {
    contentStyle: {
      backgroundColor: "var(--pm-bg-card)",
      border: "1px solid var(--pm-border-base)",
      borderRadius: "8px",
      fontSize: "12px",
      color: "var(--pm-fg-base)",
    },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-pm-fg-base">
            Platform Metrics
          </h1>
          <p className="mt-1 text-sm text-pm-fg-faint">
            Polymarket vs Kalshi side-by-side comparison
          </p>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-pm-fg-muted" />
          )}
          <PeriodToggle value={granularity} onChange={handleGranularityChange} />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Wallets"
          value={latestWallets ? compactNum(latestWallets.polymarket) : "-"}
          sub="Polymarket only"
          sparkline={walletSparkline}
          trend={
            wallets.length >= 2
              ? {
                  value: calcTrend(
                    wallets.map((w) => ({
                      ...w,
                      kalshi: 0,
                    }))
                  ),
                  label: "vs prev",
                }
              : undefined
          }
          accentColor={POLY_COLOR}
        />
        <StatCard
          label="Transactions"
          value={
            latestTx
              ? compactNum(latestTx.polymarket + latestTx.kalshi)
              : "-"
          }
          sub={
            latestTx
              ? `P: ${compactNum(latestTx.polymarket)} / K: ${compactNum(latestTx.kalshi)}`
              : undefined
          }
          sparkline={txSparkline}
          trend={
            transactions.length >= 2
              ? { value: calcTrend(transactions), label: "vs prev" }
              : undefined
          }
        />
        <StatCard
          label="Open Interest"
          value={
            latestOI
              ? formatCurrency(latestOI.polymarket + latestOI.kalshi, true)
              : "-"
          }
          sub={
            latestOI
              ? `P: ${formatCurrency(latestOI.polymarket, true)} / K: ${formatCurrency(latestOI.kalshi, true)}`
              : undefined
          }
          sparkline={oiSparkline}
          trend={
            oi.length >= 2
              ? { value: calcTrend(oi), label: "vs prev" }
              : undefined
          }
        />
        <StatCard
          label="New Markets"
          value={
            latestNewMarkets
              ? formatNumber(
                  latestNewMarkets.polymarket + latestNewMarkets.kalshi
                )
              : "-"
          }
          sub={
            latestNewMarkets
              ? `P: ${formatNumber(latestNewMarkets.polymarket)} / K: ${formatNumber(latestNewMarkets.kalshi)}`
              : undefined
          }
          sparkline={nmSparkline}
          trend={
            newMarkets.length >= 2
              ? { value: calcTrend(newMarkets), label: "vs prev" }
              : undefined
          }
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Transactions */}
        <Card title="Transactions">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={transactions}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--pm-border-subtle)"
              />
              <XAxis
                dataKey="period"
                tickFormatter={(v) => formatPeriodLabel(v, granularity)}
                tick={{ fontSize: 11, fill: "var(--pm-fg-faint)" }}
                axisLine={{ stroke: "var(--pm-border-subtle)" }}
              />
              <YAxis
                tickFormatter={compactNum}
                tick={{ fontSize: 11, fill: "var(--pm-fg-faint)" }}
                axisLine={{ stroke: "var(--pm-border-subtle)" }}
              />
              <Tooltip
                {...chartTooltipStyle}
                labelFormatter={(v) => formatPeriodLabel(v as string, granularity)}
                formatter={(value) => [
                  formatNumber(Number(value)),
                  undefined,
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", color: "var(--pm-fg-muted)" }}
              />
              <Bar
                dataKey="polymarket"
                name="Polymarket"
                fill={POLY_COLOR}
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="kalshi"
                name="Kalshi"
                fill={KALSHI_COLOR}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Open Interest */}
        <Card title="Open Interest">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={oi}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--pm-border-subtle)"
              />
              <XAxis
                dataKey="period"
                tickFormatter={(v) => formatPeriodLabel(v, granularity)}
                tick={{ fontSize: 11, fill: "var(--pm-fg-faint)" }}
                axisLine={{ stroke: "var(--pm-border-subtle)" }}
              />
              <YAxis
                tickFormatter={(v) => formatCurrency(v, true)}
                tick={{ fontSize: 11, fill: "var(--pm-fg-faint)" }}
                axisLine={{ stroke: "var(--pm-border-subtle)" }}
              />
              <Tooltip
                {...chartTooltipStyle}
                labelFormatter={(v) => formatPeriodLabel(v as string, granularity)}
                formatter={(value) => [
                  formatCurrency(Number(value), true),
                  undefined,
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", color: "var(--pm-fg-muted)" }}
              />
              <Line
                dataKey="polymarket"
                name="Polymarket"
                stroke={POLY_COLOR}
                strokeWidth={2}
                dot={false}
              />
              <Line
                dataKey="kalshi"
                name="Kalshi"
                stroke={KALSHI_COLOR}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* New Markets */}
        <Card title="New Markets Created">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={newMarkets}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--pm-border-subtle)"
              />
              <XAxis
                dataKey="period"
                tickFormatter={(v) => formatPeriodLabel(v, granularity)}
                tick={{ fontSize: 11, fill: "var(--pm-fg-faint)" }}
                axisLine={{ stroke: "var(--pm-border-subtle)" }}
              />
              <YAxis
                tickFormatter={compactNum}
                tick={{ fontSize: 11, fill: "var(--pm-fg-faint)" }}
                axisLine={{ stroke: "var(--pm-border-subtle)" }}
              />
              <Tooltip
                {...chartTooltipStyle}
                labelFormatter={(v) => formatPeriodLabel(v as string, granularity)}
                formatter={(value) => [
                  formatNumber(Number(value)),
                  undefined,
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", color: "var(--pm-fg-muted)" }}
              />
              <Bar
                dataKey="polymarket"
                name="Polymarket"
                fill={POLY_COLOR}
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="kalshi"
                name="Kalshi"
                fill={KALSHI_COLOR}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Active Wallets */}
        <Card title="Active Wallets (Polymarket)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={wallets}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--pm-border-subtle)"
              />
              <XAxis
                dataKey="period"
                tickFormatter={(v) => formatPeriodLabel(v, granularity)}
                tick={{ fontSize: 11, fill: "var(--pm-fg-faint)" }}
                axisLine={{ stroke: "var(--pm-border-subtle)" }}
              />
              <YAxis
                tickFormatter={compactNum}
                tick={{ fontSize: 11, fill: "var(--pm-fg-faint)" }}
                axisLine={{ stroke: "var(--pm-border-subtle)" }}
              />
              <Tooltip
                {...chartTooltipStyle}
                labelFormatter={(v) => formatPeriodLabel(v as string, granularity)}
                formatter={(value) => [
                  formatNumber(Number(value)),
                  undefined,
                ]}
              />
              <Bar
                dataKey="polymarket"
                name="Polymarket"
                fill={POLY_COLOR}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-center text-xs text-pm-fg-faint">
            Kalshi does not expose wallet/user-level data
          </p>
        </Card>
      </div>

      {/* Volume by Category */}
      {volumeByCategory.length > 0 && (
        <VolumeByCategory
          data={volumeByCategory}
          granularity={granularity}
        />
      )}

      {/* Footer */}
      <div className="text-xs text-pm-fg-faint">
        Data from ClickHouse. Polymarket on-chain trades + Kalshi market
        reports. Active wallets are unique taker addresses per period.
      </div>
    </div>
  );
}

// ─── Volume by Category sub-component ──────────────────────────
const CAT_COLORS = [
  "#8b5cf6", "#3b82f6", "#06b6d4", "#22c55e", "#eab308",
  "#f97316", "#ef4444", "#ec4899", "#6366f1", "#14b8a6",
];

function VolumeByCategory({
  data,
  granularity,
}: {
  data: CHPlatformCategoryRow[];
  granularity: Granularity;
}) {
  // Pivot: group by period, each category becomes a key
  const { pivoted, categories } = useMemo(() => {
    const catSet = new Set<string>();
    const periodMap = new Map<string, Record<string, number>>();
    for (const row of data) {
      catSet.add(row.category);
      if (!periodMap.has(row.period)) periodMap.set(row.period, {});
      const entry = periodMap.get(row.period)!;
      entry[row.category] = (entry[row.category] || 0) + row.volume;
    }
    // Sort categories by total volume descending, take top 8
    const catTotals = [...catSet].map((cat) => ({
      cat,
      total: data
        .filter((r) => r.category === cat)
        .reduce((s, r) => s + r.volume, 0),
    }));
    catTotals.sort((a, b) => b.total - a.total);
    const topCats = catTotals.slice(0, 8).map((c) => c.cat);

    const pivoted = [...periodMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, vals]) => ({ period, ...vals }));

    return { pivoted, categories: topCats };
  }, [data]);

  if (pivoted.length === 0) return null;

  return (
    <Card title="Volume by Category">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={pivoted}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--pm-border-subtle)"
          />
          <XAxis
            dataKey="period"
            tickFormatter={(v) => formatPeriodLabel(v, granularity)}
            tick={{ fontSize: 10, fill: "var(--pm-fg-faint)" }}
            axisLine={{ stroke: "var(--pm-border-subtle)" }}
          />
          <YAxis
            tickFormatter={(v) => formatCurrency(Number(v), true)}
            tick={{ fontSize: 11, fill: "var(--pm-fg-faint)" }}
            axisLine={{ stroke: "var(--pm-border-subtle)" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--pm-bg-card)",
              border: "1px solid var(--pm-border-base)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "var(--pm-fg-base)",
            }}
            labelFormatter={(v) =>
              formatPeriodLabel(v as string, granularity)
            }
            formatter={(value) => [
              formatCurrency(Number(value), true),
              undefined,
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", color: "var(--pm-fg-muted)" }}
          />
          {categories.map((cat, i) => (
            <Bar
              key={cat}
              dataKey={cat}
              name={cat}
              stackId="vol"
              fill={CAT_COLORS[i % CAT_COLORS.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
