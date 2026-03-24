"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PlatformToggle } from "@/components/platform-toggle";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";
import { MetricToggle, type Metric } from "@/components/metric-toggle";
import { DashboardTimeRangeSelector } from "@/components/time-range-selector";
import { TimeSlider } from "@/components/time-slider";
import { CategoryTreemap, type HierarchicalNode } from "@/components/charts/treemap";
import { CategoryBarChart } from "@/components/charts/bar-chart";
import { StackedAreaChart } from "@/components/charts/stacked-area-chart";
import { Card } from "@/components/ui/card";
import type { Platform } from "@/lib/api/types";
import { DASHBOARD_TIME_RANGES, CATEGORY_COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";

interface CompareCategory {
  name: string;
  polymarket: number;
  kalshi: number;
  total: number;
  polyMarkets: { name: string; value: number }[];
  kalshiMarkets: { name: string; value: number }[];
}

interface Props {
  treemapData: { name: string; size: number }[];
  barData: { name: string; polymarket: number; kalshi: number }[];
  topMarkets: { name: string; value: number; platform: string }[];
  hierarchicalData?: HierarchicalNode[];
  compareData?: CompareCategory[];
}

interface TimeSeriesRow {
  date: string;
  category: string;
  source: string;
  volume: number;
  oi: number;
}

export function DashboardClient({
  treemapData,
  barData,
  topMarkets,
  hierarchicalData,
  compareData,
}: Props) {
  const [platform, setPlatform] = useState<Platform>("both");
  const [view, setView] = useState<ViewMode>("treemap");
  const [metric, setMetric] = useState<Metric>("oi");
  const [timeRange, setTimeRange] = useState("latest");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesRow[]>([]);
  const [tsLoading, setTsLoading] = useState(false);
  const [sliderDate, setSliderDate] = useState<string | null>(null);

  // Fetch time series data when range changes from "latest"
  const fetchTimeSeries = useCallback(async (range: string) => {
    if (range === "latest") {
      setTimeSeriesData([]);
      setSliderDate(null);
      return;
    }
    setTsLoading(true);
    try {
      const res = await fetch(
        `/api/dashboard-timeseries?range=${range}&type=categories`
      );
      if (res.ok) {
        const data = await res.json();
        setTimeSeriesData(data);
        // Reset slider to latest date
        if (data.length > 0) {
          const dates = Array.from(new Set(data.map((r: TimeSeriesRow) => r.date))).sort() as string[];
          setSliderDate(dates[dates.length - 1]);
        }
      }
    } catch {
      // Keep existing data on error
    } finally {
      setTsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeSeries(timeRange);
  }, [timeRange, fetchTimeSeries]);

  // Unique sorted dates for the slider
  const allDates = useMemo(() => {
    if (timeSeriesData.length === 0) return [];
    return Array.from(new Set(timeSeriesData.map((r) => r.date))).sort();
  }, [timeSeriesData]);

  // Filter time series data by slider date
  const filteredTimeSeriesData = useMemo(() => {
    if (!sliderDate || timeSeriesData.length === 0) return timeSeriesData;
    return timeSeriesData.filter((row) => row.date <= sliderDate);
  }, [timeSeriesData, sliderDate]);

  // Build stacked area chart data from time series
  const { areaChartData, areaCategories } = useMemo(() => {
    if (filteredTimeSeriesData.length === 0) return { areaChartData: [], areaCategories: [] };

    // Filter by platform
    const filtered = filteredTimeSeriesData.filter((row) => {
      if (platform === "both") return true;
      if (platform === "polymarket") return row.source === "Polymarket";
      return row.source === "Kalshi";
    });

    // Pivot: { date, Category1: val, Category2: val, ... }
    const dateMap = new Map<string, Record<string, number>>();
    const catSet = new Set<string>();

    for (const row of filtered) {
      const cat = row.category || "Other";
      catSet.add(cat);
      const existing = dateMap.get(row.date) || {};
      existing[cat] = (existing[cat] || 0) + (metric === "oi" ? row.oi : row.volume);
      dateMap.set(row.date, existing);
    }

    const cats = Array.from(catSet).sort((a, b) => {
      // Sort by total value descending
      let aTotal = 0, bTotal = 0;
      for (const vals of dateMap.values()) {
        aTotal += vals[a] || 0;
        bTotal += vals[b] || 0;
      }
      return bTotal - aTotal;
    });

    const data = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => {
        const row: { date: string; [key: string]: string | number } = { date };
        for (const cat of cats) {
          row[cat] = vals[cat] || 0;
        }
        return row;
      });

    return { areaChartData: data, areaCategories: cats };
  }, [filteredTimeSeriesData, platform, metric]);

  // Filter bar data by platform and metric
  const filteredBar = useMemo(() => {
    return barData.map((d) => {
      if (platform === "polymarket")
        return { name: d.name, polymarket: d.polymarket, kalshi: 0 };
      if (platform === "kalshi")
        return { name: d.name, polymarket: 0, kalshi: d.kalshi };
      return d;
    });
  }, [barData, platform]);

  // Filter treemap by platform
  const filteredTreemap = useMemo(() => {
    return barData
      .map((d) => {
        const size =
          platform === "polymarket"
            ? d.polymarket
            : platform === "kalshi"
              ? d.kalshi
              : d.polymarket + d.kalshi;
        return { name: d.name, size };
      })
      .filter((d) => d.size > 0)
      .sort((a, b) => b.size - a.size);
  }, [barData, platform]);

  const toggleExpand = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const isHistorical = timeRange !== "latest";

  return (
    <>
      {/* Unified controls bar */}
      <div className="flex flex-wrap items-center gap-3">
        <MetricToggle value={metric} onChange={setMetric} />
        <DashboardTimeRangeSelector
          value={timeRange}
          onChange={setTimeRange}
          ranges={DASHBOARD_TIME_RANGES}
        />
        <div className="hidden h-5 w-px bg-pm-border-base sm:block" />
        <PlatformToggle value={platform} onChange={setPlatform} />
        <div className="ml-auto">
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {/* Time slider — only visible for historical ranges in area view */}
      {isHistorical && view === "area" && !tsLoading && allDates.length > 1 && (
        <TimeSlider
          dates={allDates}
          value={sliderDate ?? allDates[allDates.length - 1]}
          onChange={setSliderDate}
        />
      )}

      {/* Loading overlay for historical data */}
      {tsLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-pm-brand" />
          <span className="ml-2 text-sm text-pm-fg-muted">Loading historical data...</span>
        </div>
      )}

      {/* Chart views */}
      {!tsLoading && (
        <div key={view} className="animate-fade-in grid gap-6 lg:grid-cols-2">
          {view === "treemap" && (
            <>
              <CategoryTreemap
                data={filteredTreemap}
                hierarchicalData={hierarchicalData}
                title={`${metric === "oi" ? "Open Interest" : "Volume"} by Category`}
                valueLabel={metric === "oi" ? "OI" : "Vol"}
                platform={platform}
              />
              <CategoryBarChart
                data={filteredBar}
                title={`${metric === "oi" ? "Open Interest" : "Volume"} by Category (Stacked)`}
                stacked
              />
            </>
          )}

          {view === "bar" && (
            <div className="col-span-2 grid gap-6 lg:grid-cols-2">
              <CategoryBarChart
                data={filteredBar}
                title={`${metric === "oi" ? "Open Interest" : "Volume"} by Category`}
              />
              <CategoryBarChart
                data={filteredBar}
                title={`${metric === "oi" ? "OI" : "Volume"} Share (%)`}
                showPercentage
              />
            </div>
          )}

          {view === "area" && (
            <div className="col-span-2">
              {isHistorical && areaChartData.length > 0 ? (
                <StackedAreaChart
                  data={areaChartData}
                  categories={areaCategories}
                  title={`${metric === "oi" ? "Open Interest" : "Volume"} Distribution Over Time`}
                />
              ) : (
                <Card title={`${metric === "oi" ? "Open Interest" : "Volume"} Trend`}>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-pm-fg-muted">
                      Select a time range (1W, 1M, etc.) to see how category distribution evolves over time.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {view === "compare" && compareData && (
            <div className="col-span-2 space-y-1">
              {/* Header */}
              <div className="grid grid-cols-[1fr_200px_1fr] items-center gap-4 px-4 pb-2 text-xs font-medium text-pm-fg-faint">
                <div className="text-right">
                  <span className="text-pm-polymarket">Polymarket</span>
                </div>
                <div className="text-center">Category</div>
                <div>
                  <span className="text-pm-kalshi">Kalshi</span>
                </div>
              </div>

              {compareData.map((cat, catIdx) => {
                const isExpanded = expanded.has(cat.name);
                const polyPct =
                  cat.total > 0 ? (cat.polymarket / cat.total) * 100 : 50;
                const maxTotal = compareData[0]?.total ?? 1;

                return (
                  <div key={cat.name} className={catIdx > 0 ? "border-t border-pm-border-subtle/30" : ""}>
                    <button
                      onClick={() => toggleExpand(cat.name)}
                      className="grid w-full grid-cols-[1fr_200px_1fr] items-center gap-4 rounded-lg px-4 py-3 text-left transition-colors hover:bg-pm-bg-card-hover"
                    >
                      <div className="text-right">
                        <div className="text-sm text-pm-fg-base">
                          {formatCurrency(cat.polymarket, true)}
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-1.5">
                        <div className="flex items-center gap-1.5">
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3 text-pm-fg-faint" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-pm-fg-faint" />
                          )}
                          <span className="text-sm font-medium text-pm-fg-base">
                            {cat.name}
                          </span>
                        </div>
                        <div className="flex h-1.5 w-full overflow-hidden rounded-full">
                          <div
                            className="bg-pm-polymarket"
                            style={{ width: `${polyPct}%` }}
                          />
                          <div
                            className="bg-pm-kalshi"
                            style={{ width: `${100 - polyPct}%` }}
                          />
                        </div>
                        <div className="h-1 w-full rounded-full bg-pm-bg-elevated">
                          <div
                            className="h-full rounded-full bg-pm-fg-faint"
                            style={{
                              width: `${(cat.total / maxTotal) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-pm-fg-base">
                          {formatCurrency(cat.kalshi, true)}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mx-4 mb-2 grid grid-cols-2 gap-4 rounded-lg border border-pm-border-subtle bg-pm-bg-subtle p-4">
                        <div>
                          <h4 className="mb-2 text-xs font-medium text-pm-polymarket">
                            Polymarket ({cat.polyMarkets.length})
                          </h4>
                          {cat.polyMarkets.length === 0 ? (
                            <p className="text-xs text-pm-fg-faint">No markets</p>
                          ) : (
                            <div className="space-y-1">
                              {cat.polyMarkets.map((m, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between gap-2 text-xs"
                                >
                                  <span className="truncate text-pm-fg-subtle">
                                    {m.name}
                                  </span>
                                  <span className="shrink-0 text-pm-fg-faint">
                                    {formatCurrency(m.value, true)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="mb-2 text-xs font-medium text-pm-kalshi">
                            Kalshi ({cat.kalshiMarkets.length})
                          </h4>
                          {cat.kalshiMarkets.length === 0 ? (
                            <p className="text-xs text-pm-fg-faint">No markets</p>
                          ) : (
                            <div className="space-y-1">
                              {cat.kalshiMarkets.map((m, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between gap-2 text-xs"
                                >
                                  <span className="truncate text-pm-fg-subtle">
                                    {m.name}
                                  </span>
                                  <span className="shrink-0 text-pm-fg-faint">
                                    {formatCurrency(m.value, true)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {view === "table" && (
            <div className="col-span-2">
              <Card noPadding>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-pm-border-subtle text-xs text-pm-fg-faint">
                        <th className="px-4 py-3 font-medium">Category</th>
                        <th className="px-4 py-3 text-right font-medium">
                          Polymarket OI
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Kalshi Volume
                        </th>
                        <th className="px-4 py-3 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {barData.map((d) => (
                        <tr
                          key={d.name}
                          className="border-b border-pm-border-subtle/50 transition-colors hover:bg-pm-bg-card-hover"
                        >
                          <td className="px-4 py-3 text-pm-fg-base">{d.name}</td>
                          <td className="px-4 py-3 text-right text-pm-polymarket">
                            {formatCurrency(d.polymarket, true)}
                          </td>
                          <td className="px-4 py-3 text-right text-pm-kalshi">
                            {formatCurrency(d.kalshi, true)}
                          </td>
                          <td className="px-4 py-3 text-right text-pm-fg-subtle">
                            {formatCurrency(d.polymarket + d.kalshi, true)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {view === "line" && (
            <div className="col-span-2">
              <Card title={`Top Markets by ${metric === "oi" ? "Open Interest" : "Volume"}`}>
                <div className="space-y-2">
                  {topMarkets.map((m, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pm-bg-elevated text-[10px] tabular-nums text-pm-fg-faint">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="truncate text-sm text-pm-fg-base">{m.name}</span>
                          <span
                            className={`shrink-0 text-xs ${
                              m.platform === "Polymarket"
                                ? "text-pm-polymarket"
                                : "text-pm-kalshi"
                            }`}
                          >
                            {m.platform}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-pm-bg-elevated">
                          <div
                            className="h-full rounded-full bg-pm-brand"
                            style={{
                              width: `${(m.value / (topMarkets[0]?.value || 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-pm-fg-subtle">
                        {formatCurrency(m.value, true)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </>
  );
}
