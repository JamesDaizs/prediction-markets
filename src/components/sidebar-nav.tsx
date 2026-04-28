"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  LayoutDashboard,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accuracy", label: "Accuracy", icon: Target },
  { href: "/bots", label: "Bots", icon: Bot },
  { href: "/metrics", label: "Metrics", icon: TrendingUp },
  { href: "/portfolio", label: "Traders", icon: Users },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-pm-border-base bg-pm-bg-base px-3 py-6 md:flex">
      <Link href="/" className="mb-8 flex items-center gap-2 px-3">
        <BarChart3 className="h-5 w-5 text-pm-brand" />
        <span className="text-sm font-semibold text-pm-fg-base">
          PredMarket
        </span>
      </Link>
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "border-l-2 border-pm-brand bg-pm-brand-glow font-medium text-pm-fg-base"
                  : "text-pm-fg-muted hover:bg-pm-bg-card-hover hover:text-pm-fg-base"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-pm-brand" : ""
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-2 px-3">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3 text-pm-brand" />
          <span className="text-xs text-pm-fg-faint">
            Polymarket + Kalshi
          </span>
        </div>
        <div className="text-xs text-pm-fg-faint/60">Data via Surf API</div>
      </div>
    </aside>
  );
}

/** Mobile bottom nav */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-pm-border-base bg-pm-bg-base/95 backdrop-blur-sm md:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[10px]",
              isActive ? "text-pm-brand" : "text-pm-fg-muted"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
