import type { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  sparkline?: number[];
  accentColor?: string;
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const step = w / (data.length - 1);

  const points = data
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(" ");

  const isUp = data[data.length - 1] >= data[0];

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? "var(--pm-positive)" : "var(--pm-negative)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  trend,
  sparkline,
  accentColor,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-pm-border-base bg-pm-bg-card p-4 shadow-pm-card transition-colors hover:bg-pm-bg-card-hover">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {accentColor && (
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
          )}
          <span className="text-sm text-pm-fg-subtle">{label}</span>
        </div>
        {icon && <span className="text-pm-fg-faint">{icon}</span>}
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold tabular-nums text-pm-fg-base">{value}</div>
          {trend && (
            <div className="mt-1 flex items-center gap-1">
              {trend.value >= 0 ? (
                <TrendingUp className="h-3 w-3 text-pm-positive" />
              ) : (
                <TrendingDown className="h-3 w-3 text-pm-negative" />
              )}
              <span
                className={`text-xs font-medium ${
                  trend.value >= 0 ? "text-pm-positive" : "text-pm-negative"
                }`}
              >
                {trend.value >= 0 ? "+" : ""}
                {trend.value.toFixed(1)}%
              </span>
              <span className="text-xs text-pm-fg-faint">{trend.label}</span>
            </div>
          )}
          {sub && !trend && (
            <div className="mt-1 text-xs text-pm-fg-faint">{sub}</div>
          )}
        </div>
        {sparkline && sparkline.length > 1 && (
          <Sparkline data={sparkline} />
        )}
      </div>
    </div>
  );
}
