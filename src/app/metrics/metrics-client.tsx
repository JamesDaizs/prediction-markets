"use client";

import { useMemo } from "react";
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
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { formatNumber, formatCurrency } from "@/lib/utils";

const POLY_COLOR = "#8b5cf6";
const KALSHI_COLOR = "#3b82f6";

export interface PeriodRow {
  period: string;
  polymarket: number;
  kalshi: number;
}

export interface CategoryRow {
  period: string;
  category: string;
  volume: number;
  platform: string;
}

export interface TopMarket {
  question: string;
  platform: string;
  volume_7d: number;
  open_interest_usd: number;
  category: string;
}

export interface MomentumSummary {
  confirming_up: number;
  confirming_down: number;
  diverging_up: number;
  diverging_down: number;
  neutral: number;
  total_active: number;
  volume_increasing: number;
  volume_decreasing: number;
}

interface Props {
  initialTransactions: PeriodRow[];
  initialOI: PeriodRow[];
  initialNewMarkets: PeriodRow[];
  initialVolumeByCategory: CategoryRow[];
  topMarkets: TopMarket[];
  momentumSummary: MomentumSummary | null;
}

function formatPeriodLabel(period: string): string {
  const d = new Date(period + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function compactNum(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
}

function calcTrend(data: PeriodRow[]): number {
  if (data.length < 2) return 0;
  const prev = data[data.length - 2];
  const curr = data[data.length - 1];
  const prevTotal = prev.polymarket + prev.kalshi;
  const currTotal = curr.polymarket + curr.kalshi;
  if (prevTotal === 0) return 0;
  return ((currTotal - prevTotal) / prevTotal) * 100;
}

export function MetricsClient({
  initialTransactions,
  initialOI,
  initialNewMarkets,
  topMarkets,
  momentumSummary,
}: Props) {
  const transactions = initialTransactions;
  const oi = initialOI;
  const newMarkets = initialNewMarkets;

  const latestTx = transactions[transactions.length - 1];
  const latestOI = oi[oi.length - 1];
  const latestNewMarkets = newMarkets[newMarkets.length - 1];

  const txSparkline = useMemo(
    () => transactions.map((t) => t.polymarket + t.kalshi),
    [transactions]
  );
  const oiSparkline = useMemo(() => oi.map((o) => o.polymarket + o.kalshi), [oi]);
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
      <div>
        <h1 className="text-2xl font-bold text-pm-fg-base">Platform Metrics</h1>
        <p className="mt-1 text-sm text-pm-fg-faint">
          Polymarket vs Kalshi side-by-side comparison — daily over last 30 days
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Daily Volume"
          value={
            latestTx ? formatCurrency(latestTx.polymarket + latestTx.kalshi, true) : "-"
          }
          sub={
            latestTx
              ? `P: ${formatCurrency(latestTx.polymarket, true)} / K: ${formatCurrency(latestTx.kalshi, true)}`
              : undefined
          }
          sparkline={txSparkline}
          trend={
            transactions.length >= 2
              ? { value: calcTrend(transactions), label: "vs prev day" }
              : undefined
          }
        />
        <StatCard
          label="Open Interest"
          value={
            latestOI ? formatCurrency(latestOI.polymarket + latestOI.kalshi, true) : "-"
          }
          sub={
            latestOI
              ? `P: ${formatCurrency(latestOI.polymarket, true)} / K: ${formatCurrency(latestOI.kalshi, true)}`
              : undefined
          }
          sparkline={oiSparkline}
          trend={
            oi.length >= 2 ? { value: calcTrend(oi), label: "vs prev day" } : undefined
          }
        />
        <StatCard
          label="Active Markets"
          value={
            latestNewMarkets
              ? formatNumber(latestNewMarkets.polymarket + latestNewMarkets.kalshi)
              : "-"
          }
          sub={
            latestNewMarkets
              ? `P: ${formatNumber(latestNewMarkets.polymarket)} / K: ${formatNumber(latestNewMarkets.kalshi)}`
              : undefined
          }
          sparkline={nmSparkline}
        />
        <StatCard
          label="Total Active"
          value={momentumSummary ? formatNumber(momentumSummary.total_active) : "-"}
          sub={
            momentumSummary
              ? `${momentumSummary.volume_increasing} vol up / ${momentumSummary.volume_decreasing} down`
              : undefined
          }
          accentColor={POLY_COLOR}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Daily Volume">
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transactions}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" />
                <XAxis
                  dataKey="period"
                  tickFormatter={formatPeriodLabel}
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
                  labelFormatter={(v) => formatPeriodLabel(v as string)}
                  formatter={(value) => [formatCurrency(Number(value), true), undefined]}
                />
                <Legend wrapperStyle={{ fontSize: "12px", color: "var(--pm-fg-muted)" }} />
                <Bar dataKey="polymarket" name="Polymarket" fill={POLY_COLOR} radius={[3, 3, 0, 0]} />
                <Bar dataKey="kalshi" name="Kalshi" fill={KALSHI_COLOR} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Open Interest">
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={oi}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" />
                <XAxis
                  dataKey="period"
                  tickFormatter={formatPeriodLabel}
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
                  labelFormatter={(v) => formatPeriodLabel(v as string)}
                  formatter={(value) => [formatCurrency(Number(value), true), undefined]}
                />
                <Legend wrapperStyle={{ fontSize: "12px", color: "var(--pm-fg-muted)" }} />
                <Line dataKey="polymarket" name="Polymarket" stroke={POLY_COLOR} strokeWidth={2} dot={false} />
                <Line dataKey="kalshi" name="Kalshi" stroke={KALSHI_COLOR} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Active Markets">
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={newMarkets}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" />
                <XAxis
                  dataKey="period"
                  tickFormatter={formatPeriodLabel}
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
                  labelFormatter={(v) => formatPeriodLabel(v as string)}
                  formatter={(value) => [formatNumber(Number(value)), undefined]}
                />
                <Legend wrapperStyle={{ fontSize: "12px", color: "var(--pm-fg-muted)" }} />
                <Bar dataKey="polymarket" name="Polymarket" fill={POLY_COLOR} radius={[3, 3, 0, 0]} />
                <Bar dataKey="kalshi" name="Kalshi" fill={KALSHI_COLOR} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {topMarkets.length > 0 && (
          <Card title="Top Markets by Open Interest">
            <div className="space-y-2">
              {topMarkets.slice(0, 8).map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pm-bg-elevated text-[10px] tabular-nums text-pm-fg-faint">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-pm-fg-base">{m.question}</div>
                    <div className="text-xs text-pm-fg-faint">
                      <span className={m.platform === "polymarket" ? "text-pm-polymarket" : "text-pm-kalshi"}>
                        {m.platform}
                      </span>
                      {" · "}
                      <span>{m.category}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-pm-fg-subtle">
                    {formatCurrency(m.open_interest_usd, true)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <div className="text-xs text-pm-fg-faint">
        Data via Surf API — `prediction-market-analytics` endpoint, daily buckets across both platforms.
      </div>
    </div>
  );
}
