"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Loader2 } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import type {
  CHWalletGrowthRow,
  CHWalletLifecycleRow,
  CHRetentionRow,
} from "@/lib/api/clickhouse";

interface Props {
  initialGrowth: CHWalletGrowthRow[];
  initialLifecycle: CHWalletLifecycleRow[];
}

const LIFECYCLE_COLORS: Record<string, string> = {
  "Active (7d)": "var(--pm-positive)",
  "At Risk (8-30d)": "var(--pm-warning)",
  "Dormant (31-90d)": "#6366f1",
  "Churned (90d+)": "var(--pm-negative)",
};

const LIFECYCLE_ORDER = [
  "Active (7d)",
  "At Risk (8-30d)",
  "Dormant (31-90d)",
  "Churned (90d+)",
];

export function RetentionClient({ initialGrowth, initialLifecycle }: Props) {
  const [growth, setGrowth] = useState(initialGrowth);
  const [lifecycle] = useState(initialLifecycle);
  const [cohortData, setCohortData] = useState<CHRetentionRow[]>([]);
  const [cohortLoading, setCohortLoading] = useState(false);

  // Fetch cohort data on mount (heavy query — not SSR)
  useEffect(() => {
    const controller = new AbortController();
    setCohortLoading(true);
    fetch("/api/retention?type=cohort", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCohortData(data))
      .catch(() => {
        // Aborted or failed — keep empty
      })
      .finally(() => setCohortLoading(false));
    return () => controller.abort();
  }, []);

  // Sort lifecycle by order
  const sortedLifecycle = useMemo(() => {
    return [...lifecycle].sort(
      (a, b) =>
        LIFECYCLE_ORDER.indexOf(a.segment) - LIFECYCLE_ORDER.indexOf(b.segment)
    );
  }, [lifecycle]);

  const totalWallets = sortedLifecycle.reduce(
    (s, l) => s + l.wallet_count,
    0
  );

  // Cohort heatmap data
  const { cohortWeeks, maxWeekNum, cohortMap } = useMemo(() => {
    if (cohortData.length === 0)
      return { cohortWeeks: [], maxWeekNum: 0, cohortMap: new Map() };

    const weeks = [
      ...new Set(cohortData.map((r) => r.cohort_week)),
    ].sort();
    const maxWk = Math.min(
      Math.max(...cohortData.map((r) => r.week_number)),
      12
    );
    const map = new Map<string, number>();
    for (const row of cohortData) {
      map.set(`${row.cohort_week}-${row.week_number}`, row.active_wallets);
    }
    return { cohortWeeks: weeks, maxWeekNum: maxWk, cohortMap: map };
  }, [cohortData]);

  // Chart data for stacked bar
  const barData = useMemo(() => {
    return growth.map((g) => ({
      week: g.week.slice(5), // MM-DD
      new_wallets: g.new_wallets,
      returning: g.returning_wallets,
    }));
  }, [growth]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-pm-fg-base">
          Polymarket Wallet Retention
        </h1>
        <p className="mt-1 text-sm text-pm-fg-faint">
          How many wallets are joining vs leaving the platform?
        </p>
      </div>

      {/* Lifecycle StatCards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {sortedLifecycle.map((seg) => (
          <StatCard
            key={seg.segment}
            label={seg.segment}
            value={formatNumber(seg.wallet_count, true)}
            sub={`${((seg.wallet_count / (totalWallets || 1)) * 100).toFixed(1)}% of total`}
            accentColor={LIFECYCLE_COLORS[seg.segment]}
          />
        ))}
      </div>

      {/* New vs Returning stacked bar + Lifecycle donut */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="New vs Returning Wallets (Weekly)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--pm-border-subtle)"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  tick={{ fill: "var(--pm-fg-faint)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--pm-border-subtle)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--pm-fg-faint)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => formatNumber(v, true)}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--pm-bg-card)",
                    border: "1px solid var(--pm-border-base)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value, name) => [
                    formatNumber(Number(value)),
                    name === "new_wallets" ? "New" : "Returning",
                  ]}
                />
                <Legend
                  formatter={(value: string) =>
                    value === "new_wallets" ? "New Wallets" : "Returning"
                  }
                />
                <Bar
                  dataKey="new_wallets"
                  stackId="a"
                  fill="var(--pm-positive)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="returning"
                  stackId="a"
                  fill="var(--pm-brand)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card title="Wallet Lifecycle">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={sortedLifecycle.map((s) => ({
                  name: s.segment,
                  value: s.wallet_count,
                }))}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {sortedLifecycle.map((s) => (
                  <Cell
                    key={s.segment}
                    fill={LIFECYCLE_COLORS[s.segment] || "#666"}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--pm-bg-card)",
                  border: "1px solid var(--pm-border-base)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value) => [formatNumber(Number(value)), "Wallets"]}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value: string) => (
                  <span style={{ color: "var(--pm-fg-subtle)" }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Cohort retention heatmap */}
      <Card title="Cohort Retention (Weekly)">
        {cohortLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-pm-brand" />
            <span className="ml-2 text-sm text-pm-fg-muted">
              Loading cohort data...
            </span>
          </div>
        ) : cohortWeeks.length === 0 ? (
          <div className="py-12 text-center text-sm text-pm-fg-muted">
            No cohort data available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium text-pm-fg-faint">
                    Cohort
                  </th>
                  <th className="px-2 py-1.5 text-center font-medium text-pm-fg-faint">
                    Size
                  </th>
                  {Array.from({ length: maxWeekNum + 1 }, (_, i) => (
                    <th
                      key={i}
                      className="px-2 py-1.5 text-center font-medium text-pm-fg-faint"
                    >
                      W{i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortWeeks.map((week) => {
                  const cohortSize =
                    cohortMap.get(`${week}-0`) || 0;
                  return (
                    <tr key={week}>
                      <td className="whitespace-nowrap px-2 py-1 text-pm-fg-subtle">
                        {week.slice(5)}
                      </td>
                      <td className="px-2 py-1 text-center tabular-nums text-pm-fg-subtle">
                        {formatNumber(cohortSize, true)}
                      </td>
                      {Array.from({ length: maxWeekNum + 1 }, (_, wk) => {
                        const active =
                          cohortMap.get(`${week}-${wk}`) || 0;
                        const retention =
                          cohortSize > 0
                            ? (active / cohortSize) * 100
                            : 0;
                        const opacity = Math.max(
                          0.05,
                          retention / 100
                        );
                        return (
                          <td
                            key={wk}
                            className="px-2 py-1 text-center tabular-nums"
                            style={{
                              backgroundColor: `rgba(139, 92, 246, ${opacity})`,
                              color:
                                retention > 50
                                  ? "var(--pm-fg-base)"
                                  : "var(--pm-fg-subtle)",
                            }}
                          >
                            {cohortSize > 0
                              ? `${retention.toFixed(0)}%`
                              : "-"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
