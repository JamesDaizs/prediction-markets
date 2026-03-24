export function PageSkeleton({ title, rows = 8 }: { title: string; rows?: number }) {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-7 w-48 rounded bg-pm-bg-elevated" />
        <div className="mt-2 h-4 w-72 rounded bg-pm-bg-card" />
      </div>
      <div className="rounded-xl border border-pm-border-base bg-pm-bg-card">
        <div className="border-b border-pm-border-subtle px-4 py-3">
          <div className="h-3 w-full rounded bg-pm-bg-elevated/40" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-pm-border-subtle/30 px-4 py-3">
            <div className="h-4 w-1/4 rounded bg-pm-bg-elevated/30" />
            <div className="h-4 w-1/3 rounded bg-pm-bg-elevated/20" />
            <div className="h-4 w-1/6 rounded bg-pm-bg-elevated/20" />
            <div className="h-4 w-1/6 rounded bg-pm-bg-elevated/20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 w-56 rounded bg-pm-bg-elevated" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-pm-border-base bg-pm-bg-card p-5">
            <div className="h-3 w-20 rounded bg-pm-bg-elevated/40" />
            <div className="mt-2 h-8 w-28 rounded bg-pm-bg-elevated" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl border border-pm-border-base bg-pm-bg-card" />
        <div className="h-64 rounded-xl border border-pm-border-base bg-pm-bg-card" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-pm-border-base bg-pm-bg-card p-5">
      <div className="mb-4 h-4 w-40 rounded bg-pm-bg-elevated" />
      <div className="flex h-64 items-end justify-between gap-1">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-pm-bg-elevated/30"
            style={{ height: `${20 + Math.random() * 80}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-pm-border-base bg-pm-bg-card p-5">
      <div className="h-3 w-24 rounded bg-pm-bg-elevated/40" />
      <div className="mt-2 h-7 w-32 rounded bg-pm-bg-elevated" />
      <div className="mt-2 h-3 w-44 rounded bg-pm-bg-elevated/20" />
    </div>
  );
}
