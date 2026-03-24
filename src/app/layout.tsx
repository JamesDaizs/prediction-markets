import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SidebarNav, MobileNav } from "@/components/sidebar-nav";
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
        <SidebarNav />
        <main className="flex-1 overflow-y-auto px-4 py-6 pb-20 md:px-8 md:py-8 md:pb-8">
          {children}
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
