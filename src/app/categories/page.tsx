export const dynamic = "force-dynamic";

import { getCategoryBreakdown } from "@/lib/api/clickhouse";
import { formatCurrency } from "@/lib/format";
import { VolumeBarChart } from "@/components/charts/VolumeChart";

export default async function CategoriesPage() {
  const catRows = await getCategoryBreakdown();

  // Group by subcategory per platform
  const polyGroups = new Map<string, { volume: number; oi: number }>();
  const kalshiGroups = new Map<string, { volume: number; oi: number }>();

  for (const row of catRows) {
    const name = row.subcategory || row.category || "Other";
    const target = row.source === "Polymarket" ? polyGroups : kalshiGroups;
    const existing = target.get(name) || { volume: 0, oi: 0 };
    existing.volume += row.volume;
    existing.oi += row.oi;
    target.set(name, existing);
  }

  const sortedSubs = Array.from(polyGroups.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.volume - a.volume);

  const chartData = sortedSubs
    .slice(0, 20)
    .map((s) => ({ name: s.name, volume: s.volume }));

  const kalshiSorted = Array.from(kalshiGroups.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.volume - a.volume);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Categories</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Volume and open interest by category across platforms
        </p>
      </div>
      <VolumeBarChart
        data={chartData}
        title="Top 20 Subcategories by Volume (Polymarket)"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedSubs.slice(0, 30).map((sub) => (
          <div
            key={sub.name}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
          >
            <h3 className="text-sm font-medium text-white">{sub.name}</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-zinc-500">Volume</div>
                <div className="text-zinc-200">
                  {formatCurrency(sub.volume, true)}
                </div>
              </div>
              <div>
                <div className="text-zinc-500">Open Interest</div>
                <div className="text-zinc-200">
                  {formatCurrency(sub.oi, true)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {kalshiSorted.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            Kalshi Categories
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {kalshiSorted
              .filter((c) => c.volume > 0)
              .slice(0, 20)
              .map((c) => (
                <div
                  key={c.name}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
                >
                  <h3 className="text-sm font-medium text-white">{c.name}</h3>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-zinc-500">Volume</div>
                      <div className="text-zinc-200">
                        {formatCurrency(c.volume, true)}
                      </div>
                    </div>
                    <div>
                      <div className="text-zinc-500">Open Interest</div>
                      <div className="text-zinc-200">
                        {formatCurrency(c.oi, true)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
