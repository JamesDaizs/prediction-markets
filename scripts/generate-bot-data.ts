/**
 * Generate bot analysis JSON from research CSV + live ClickHouse queries.
 *
 * Usage: npx tsx scripts/generate-bot-data.ts
 *
 * Reads: research/polymarket_classified_wallets.csv (38,839 wallets)
 * Queries: ClickHouse for live aggregate metrics
 * Writes: public/data/bot_analysis.json
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// Load .env.local manually (no dotenv dependency)
function loadEnv(filepath: string): Record<string, string> {
  try {
    const lines = readFileSync(filepath, "utf-8").split("\n");
    const env: Record<string, string> = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
    }
    return env;
  } catch {
    return {};
  }
}

const localEnv = loadEnv(join(__dirname, "..", ".env.local"));
const CH_HOST = localEnv.CLICKHOUSE_HOST || process.env.CLICKHOUSE_HOST || "clickhouse.ask.surf";
const CH_USER = localEnv.CLICKHOUSE_USER || process.env.CLICKHOUSE_USER || "";
const CH_PASS = localEnv.CLICKHOUSE_PASSWORD || process.env.CLICKHOUSE_PASSWORD || "";

// ─── ClickHouse query helper ──────────────────────────────────
async function queryCH<T = Record<string, string>>(sql: string): Promise<T[]> {
  const url = `https://${CH_HOST}:8443/?user=${encodeURIComponent(CH_USER)}&password=${encodeURIComponent(CH_PASS)}&database=prediction_markets`;
  const body = `${sql.trim()} FORMAT JSONEachRow`;
  console.log(`  CH query: ${sql.trim().slice(0, 80)}...`);
  const res = await fetch(url, {
    method: "POST",
    body,
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`  CH error: ${err.slice(0, 200)}`);
    return [];
  }
  const text = await res.text();
  if (!text.trim()) return [];
  return text
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
}

// ─── CSV parsing ──────────────────────────────────────────────
interface Wallet {
  address: string;
  pnl: number;
  volume: number;
  total_trades: number;
  positions_won: number;
  positions_lost: number;
  win_rate: number;
  active_days: number;
  hourly_entropy_norm: number;
  maker_ratio: number;
  bot_score: number;
  bot_class: string;
  label: string;
  avg_size: number;
  trades_per_day: number;
  h0_6: number;
  h6_12: number;
  h12_18: number;
  h18_24: number;
}

function parseCSV(filepath: string): Wallet[] {
  const raw = readFileSync(filepath, "utf-8");
  const lines = raw.trim().split("\n");
  const header = lines[0].split(",");

  const idx = (name: string) => {
    const i = header.indexOf(name);
    if (i === -1) throw new Error(`Column not found: ${name}`);
    return i;
  };

  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    return {
      address: cols[idx("address")],
      pnl: parseFloat(cols[idx("pnl")]) || 0,
      volume: parseFloat(cols[idx("volume")]) || 0,
      total_trades: parseInt(cols[idx("total_trades")]) || 0,
      positions_won: parseInt(cols[idx("positions_won")]) || 0,
      positions_lost: parseInt(cols[idx("positions_lost")]) || 0,
      win_rate: parseFloat(cols[idx("win_rate")]) || 0,
      active_days: parseInt(cols[idx("active_days_y")]) || 0,
      hourly_entropy_norm: parseFloat(cols[idx("hourly_entropy_norm")]) || 0,
      maker_ratio: parseFloat(cols[idx("maker_ratio")]) || 0,
      bot_score: parseFloat(cols[idx("bot_score")]) || 0,
      bot_class: cols[idx("bot_class")],
      label: cols[idx("label")],
      avg_size: parseFloat(cols[idx("avg_size")]) || 0,
      trades_per_day: parseFloat(cols[idx("trades_per_day")]) || 0,
      h0_6: parseFloat(cols[idx("h0_6")]) || 0,
      h6_12: parseFloat(cols[idx("h6_12")]) || 0,
      h12_18: parseFloat(cols[idx("h12_18")]) || 0,
      h18_24: parseFloat(cols[idx("h18_24")]) || 0,
    };
  });
}

async function main() {
  const root = join(__dirname, "..");
  const csvPath = join(root, "research", "polymarket_classified_wallets.csv");
  const wallets = parseCSV(csvPath);
  console.log(`Loaded ${wallets.length} wallets from CSV`);

  // Build address sets for CH heuristic queries
  const botClasses = new Set(["Bot", "Likely Bot"]);
  const humanClasses = new Set(["Human", "Likely Human"]);
  const botAddresses = new Set(wallets.filter((w) => botClasses.has(w.bot_class)).map((w) => w.address));

  // ─── Classification Summary (CSV) ──────────────────
  const classes = ["Bot", "Likely Bot", "Likely Human", "Human"];
  const classificationSummary = classes.map((cls) => {
    const group = wallets.filter((w) => w.bot_class === cls);
    const totalPnl = group.reduce((s, w) => s + w.pnl, 0);
    const totalVolume = group.reduce((s, w) => s + w.volume, 0);
    const profitable = group.filter((w) => w.pnl > 0).length;
    return {
      class: cls,
      count: group.length,
      volume: totalVolume,
      pnl: totalPnl,
      avgPnl: group.length > 0 ? totalPnl / group.length : 0,
      profitablePercent:
        group.length > 0 ? (profitable / group.length) * 100 : 0,
    };
  });

  // ─── PnL Waterfall (CSV) ───────────────────────────
  const pnlWaterfall = classes.map((cls) => ({
    class: cls,
    pnl: wallets
      .filter((w) => w.bot_class === cls)
      .reduce((s, w) => s + w.pnl, 0),
  }));

  // ─── Hourly Activity (CSV) ─────────────────────────
  const sortedByTpd = [...wallets].sort(
    (a, b) => b.trades_per_day - a.trades_per_day
  );
  const highFreqCutoff =
    sortedByTpd[Math.floor(wallets.length * 0.25)]?.trades_per_day || 100;
  const hours = Array.from({ length: 4 }, (_, i) => {
    const hourKey = ["0-6", "6-12", "12-18", "18-24"][i];
    const highFreq = wallets
      .filter((w) => w.trades_per_day >= highFreqCutoff)
      .reduce((s, w) => s + [w.h0_6, w.h6_12, w.h12_18, w.h18_24][i], 0);
    const lowFreq = wallets
      .filter((w) => w.trades_per_day < highFreqCutoff)
      .reduce((s, w) => s + [w.h0_6, w.h6_12, w.h12_18, w.h18_24][i], 0);
    return { hours: hourKey, highFreq, lowFreq };
  });
  const totalHighFreq = hours.reduce((s, h) => s + h.highFreq, 0) || 1;
  const totalLowFreq = hours.reduce((s, h) => s + h.lowFreq, 0) || 1;
  const hourlyActivity = hours.map((h) => ({
    hours: h.hours,
    highFreqPct: (h.highFreq / totalHighFreq) * 100,
    lowFreqPct: (h.lowFreq / totalLowFreq) * 100,
  }));

  // ─── CH Queries (live data) ────────────────────────
  console.log("\nRunning ClickHouse queries...");

  // 1. Trade size distribution (yesterday, pure SQL)
  const tradeSizeRows = await queryCH<{
    bucket: string;
    trades: string;
    volume: string;
    unique_takers: string;
  }>(`
    SELECT
      multiIf(
        amount_usd < 1, 'Dust (<$1)',
        amount_usd < 5, 'Tiny ($1-5)',
        amount_usd < 20, 'Small ($5-20)',
        amount_usd < 100, 'Medium ($20-100)',
        amount_usd < 500, 'Large ($100-500)',
        amount_usd < 2000, 'Whale ($500-2K)',
        'Mega ($2K+)'
      ) AS bucket,
      count() AS trades,
      sum(amount_usd) AS volume,
      uniq(taker_address) AS unique_takers
    FROM agent.polymarket_market_trades
    WHERE block_date = today() - 1
    GROUP BY bucket
    ORDER BY multiIf(
      bucket = 'Dust (<$1)', 1,
      bucket = 'Tiny ($1-5)', 2,
      bucket = 'Small ($5-20)', 3,
      bucket = 'Medium ($20-100)', 4,
      bucket = 'Large ($100-500)', 5,
      bucket = 'Whale ($500-2K)', 6,
      7
    )
  `);
  const totalTrades = tradeSizeRows.reduce(
    (s, r) => s + parseInt(r.trades),
    0
  );
  const totalVol = tradeSizeRows.reduce(
    (s, r) => s + parseFloat(r.volume),
    0
  );
  const tradeSizeDistribution = tradeSizeRows.map((r) => ({
    bucket: r.bucket,
    pctTrades:
      totalTrades > 0
        ? parseFloat(((parseInt(r.trades) / totalTrades) * 100).toFixed(2))
        : 0,
    pctVolume:
      totalVol > 0
        ? parseFloat(((parseFloat(r.volume) / totalVol) * 100).toFixed(2))
        : 0,
    uniqueTakers: parseInt(r.unique_takers),
  }));
  console.log(
    `  Trade size: ${tradeSizeRows.length} buckets, ${totalTrades.toLocaleString()} trades`
  );

  // 2. Same-block multi-trade stats (yesterday, pure SQL — bot signature)
  const sameBlockRows = await queryCH<{
    multi_blocks: string;
    max_trades: string;
    wallets_with_multi: string;
    total_multi_trades: string;
  }>(`
    SELECT
      count() AS multi_blocks,
      max(trades_in_block) AS max_trades,
      uniq(taker_address) AS wallets_with_multi,
      sum(trades_in_block) AS total_multi_trades
    FROM (
      SELECT taker_address, block_number, count() AS trades_in_block
      FROM agent.polymarket_market_trades
      WHERE block_date = today() - 1
      GROUP BY taker_address, block_number
      HAVING trades_in_block >= 3
    )
  `);
  const sameBlockStats = sameBlockRows[0]
    ? {
        multiBlocks: parseInt(sameBlockRows[0].multi_blocks),
        maxTradesInBlock: parseInt(sameBlockRows[0].max_trades),
        walletsWithMulti: parseInt(sameBlockRows[0].wallets_with_multi),
        totalMultiTrades: parseInt(sameBlockRows[0].total_multi_trades),
      }
    : null;
  console.log(
    `  Same-block: ${sameBlockStats?.walletsWithMulti ?? 0} wallets with multi-trade blocks`
  );

  // 3. CTF vs NegRisk daily active wallets (30 days)
  const ctfNegRiskRows = await queryCH<{
    date: string;
    ctf_daw: string;
    neg_risk_daw: string;
    total_daw: string;
  }>(`
    SELECT
      toString(toDate(block_time)) AS date,
      uniqIf(taker_address, neg_risk = 0) AS ctf_daw,
      uniqIf(taker_address, neg_risk = 1) AS neg_risk_daw,
      uniq(taker_address) AS total_daw
    FROM agent.polymarket_market_trades
    WHERE block_date >= today() - 30
    GROUP BY date
    ORDER BY date
  `);
  const ctfVsNegRisk = ctfNegRiskRows.map((r) => ({
    date: r.date,
    ctfDAW: parseInt(r.ctf_daw),
    negRiskDAW: parseInt(r.neg_risk_daw),
    totalDAW: parseInt(r.total_daw),
  }));
  console.log(`  CTF vs NegRisk: ${ctfVsNegRisk.length} days`);

  // 4. Weekly bot volume share (heuristic: trades >= 1000/week = high_freq proxy)
  const botVolumeRows = await queryCH<{
    week: string;
    high_freq_volume: string;
    total_volume: string;
    high_freq_wallets: string;
    total_wallets: string;
  }>(`
    WITH weekly_freq AS (
      SELECT
        toMonday(block_date) AS week,
        taker_address,
        count() AS trades,
        sum(amount_usd) AS volume
      FROM agent.polymarket_market_trades
      WHERE block_date >= today() - 180
      GROUP BY week, taker_address
    )
    SELECT
      toString(week) AS week,
      sum(if(trades >= 1000, volume, 0)) AS high_freq_volume,
      sum(volume) AS total_volume,
      uniqIf(taker_address, trades >= 1000) AS high_freq_wallets,
      uniq(taker_address) AS total_wallets
    FROM weekly_freq
    GROUP BY week
    ORDER BY week
  `);
  const botVolumeTimeline = botVolumeRows.map((r) => {
    const hfVol = parseFloat(r.high_freq_volume);
    const totVol = parseFloat(r.total_volume);
    return {
      week: r.week,
      highFreqVolume: hfVol,
      totalVolume: totVol,
      highFreqPct: totVol > 0 ? (hfVol / totVol) * 100 : 0,
      highFreqWallets: parseInt(r.high_freq_wallets),
      totalWallets: parseInt(r.total_wallets),
    };
  });
  console.log(
    `  Bot volume timeline: ${botVolumeTimeline.length} weeks`
  );

  // 5. Category volume breakdown (7-day, from pre-aggregated prediction_markets.daily)
  // The trade-level JOIN is too expensive, so use category volumes from the daily table
  // and overlay with CSV-derived bot concentration from research
  const catVolRows = await queryCH<{
    category: string;
    volume: string;
  }>(`
    SELECT category, sum(notional_volume_usd) AS volume
    FROM prediction_markets.daily
    WHERE date >= today() - 7
      AND source = 'Polymarket'
      AND category != ''
    GROUP BY category
    ORDER BY volume DESC
    LIMIT 10
  `);
  // Research-derived bot % by category (from ML classification)
  const researchBotPct: Record<string, number> = {
    "Sports": 85.0, "Crypto": 71.3, "Politics": 65.2,
    "Pop Culture": 52.1, "Science": 47.8, "Finance": 60.5,
    "World": 47.8, "Technology": 55.0, "Entertainment": 50.0,
  };
  const categoryBotConcentration = catVolRows.map((r) => {
    const botPct = researchBotPct[r.category] ?? 55.0;
    return {
      category: r.category,
      botPct,
      humanPct: parseFloat((100 - botPct).toFixed(1)),
      totalVolume: parseFloat(r.volume),
    };
  }).sort((a, b) => b.botPct - a.botPct);
  console.log(
    `  Category concentration: ${categoryBotConcentration.length} categories`
  );

  // ─── Static data (from research, no CH equivalent) ─
  const tradeMatrix = {
    labels: ["Bot", "Likely Bot", "Likely Human", "Human"],
    data: [
      [2.1, 18.4, 15.3, 3.8],
      [18.4, 12.7, 11.2, 4.1],
      [15.3, 11.2, 3.8, 1.7],
      [3.8, 4.1, 1.7, 0.3],
    ],
  };

  const strategies = [
    {
      name: "Information Arbitrage",
      description:
        "Private or superior information about event outcomes. Large directional bets across multiple wallets.",
      example: "Theo ($85M on 2024 election via private polling)",
      profitRange: "$1M-$85M",
      status: "Active",
    },
    {
      name: "Market Making",
      description:
        "Post bid/ask orders, earn spread + maker fee rebates + liquidity rewards.",
      example: "0xd0d6 (102K trades/day, $1.69M PnL)",
      profitRange: "$1M-$10M",
      status: "Active",
    },
    {
      name: "Latency Trading",
      description:
        "Monitor CEX price feeds, buy mispriced contracts before CLOB reprices.",
      example: "0x8dxd ($313 to $438K in 1 month, 98% win rate)",
      profitRange: "$100K-$500K",
      status: "Countered",
    },
    {
      name: "Domain Specialization",
      description:
        "NOAA weather models, game APIs (Riot, Valve), real-time scoring feeds.",
      example: "gopfan2 ($700K via NOAA forecasts)",
      profitRange: "$50K-$700K",
      status: "Active",
    },
    {
      name: "NegRisk Rebalancing",
      description:
        "Multi-outcome events where YES prices don't sum to $1. Buy underpriced NO tokens and merge.",
      example: "$39.6M total arb extracted (Apr 2024-Apr 2025)",
      profitRange: "$50K-$2M",
      status: "Active",
    },
    {
      name: "Cross-Platform Arb",
      description:
        "Same event priced differently on Polymarket vs Kalshi. Buy cheap, sell expensive.",
      example: "Various arbitrageurs",
      profitRange: "$100K-$2M",
      status: "Active",
    },
    {
      name: "High-Probability Bond",
      description:
        "Buy outcomes at 95-99 cents near resolution for guaranteed $1 payout. Annualized ~1,900% APY.",
      example: "0xdb27 (avg $16,964 per trade at 80c)",
      profitRange: "5-20% per trade",
      status: "Active",
    },
  ];

  const feeExtraction = [
    {
      class: "Bot (147 wallets)",
      feesCollected: 11_100_000,
      pctTotal: 61,
      feeOverVolume: 5.9,
    },
    {
      class: "Active (1,378 wallets)",
      feesCollected: 2_700_000,
      pctTotal: 15,
      feeOverVolume: 8.6,
    },
    {
      class: "Human (127K wallets)",
      feesCollected: 4_400_000,
      pctTotal: 24,
      feeOverVolume: 4.3,
    },
  ];

  // ─── Top Wallets (CSV) ─────────────────────────────
  const topBots = wallets
    .filter((w) => botClasses.has(w.bot_class))
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 20)
    .map((w) => ({
      address: w.address,
      pnl: w.pnl,
      volume: w.volume,
      trades: w.total_trades,
      winRate: w.win_rate,
      botClass: w.bot_class,
      label: w.label,
    }));

  const topHumans = wallets
    .filter((w) => humanClasses.has(w.bot_class))
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 20)
    .map((w) => ({
      address: w.address,
      pnl: w.pnl,
      volume: w.volume,
      trades: w.total_trades,
      winRate: w.win_rate,
      botClass: w.bot_class,
      label: w.label,
    }));

  // ─── Hero Stats ─────────────────────────────────────
  const totalVolume = wallets.reduce((s, w) => s + w.volume, 0);
  const botVolume = wallets
    .filter((w) => botClasses.has(w.bot_class))
    .reduce((s, w) => s + w.volume, 0);
  const humanNetPnl = wallets
    .filter((w) => w.bot_class === "Human")
    .reduce((s, w) => s + w.pnl, 0);
  const activeBots = wallets.filter((w) =>
    botClasses.has(w.bot_class)
  ).length;
  const humanHumanPct = tradeMatrix.data[3][3];

  const heroStats = {
    botVolumePercent: totalVolume > 0 ? (botVolume / totalVolume) * 100 : 0,
    humanNetPnl,
    activeBots,
    humanHumanTradePct: humanHumanPct,
  };

  // ─── Assemble Output ───────────────────────────────
  const output = {
    generated_at: new Date().toISOString(),
    wallet_count: wallets.length,
    heroStats,
    classificationSummary,
    pnlWaterfall,
    hourlyActivity,
    tradeSizeDistribution,
    categoryBotConcentration,
    tradeMatrix,
    feeExtraction,
    botVolumeTimeline,
    ctfVsNegRisk,
    sameBlockStats,
    strategies,
    topBots,
    topHumans,
  };

  // Write output
  const outDir = join(root, "public", "data");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "bot_analysis.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nWritten to ${outPath}`);
  console.log(
    `  Hero: ${output.heroStats.botVolumePercent.toFixed(1)}% bot volume, ${activeBots} bots, $${(humanNetPnl / 1_000_000).toFixed(1)}M human PnL`
  );
  console.log(
    `  CH data: ${tradeSizeDistribution.length} trade buckets, ${botVolumeTimeline.length} weeks timeline, ${ctfVsNegRisk.length} days CTF/NR, ${categoryBotConcentration.length} categories`
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
