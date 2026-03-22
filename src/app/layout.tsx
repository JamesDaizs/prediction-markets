import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  LayoutDashboard,
  Search,
  Target,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PredMarket Analytics",
  description:
    "Prediction market analytics across Polymarket & Kalshi",
};

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/markets", label: "Markets", icon: Search },
  { href: "/accuracy", label: "Accuracy", icon: Target },
  { href: "/arbitrage", label: "Arbitrage", icon: ArrowLeftRight },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/rankings", label: "Rankings", icon: Trophy },
  { href: "/alerts", label: "Alerts", icon: Bell },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="flex min-h-full">
        <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 px-3 py-6">
          <Link href="/" className="mb-8 flex items-center gap-2 px-3">
            <BarChart3 className="h-5 w-5 text-violet-400" />
            <span className="text-sm font-semibold text-white">
              PredMarket
            </span>
          </Link>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-white"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-2 px-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-violet-400" />
              <span className="text-xs text-zinc-600">
                Polymarket + Kalshi
              </span>
            </div>
            <div className="text-xs text-zinc-700">Data via Hermod API</div>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
      </body>
    </html>
  );
}
