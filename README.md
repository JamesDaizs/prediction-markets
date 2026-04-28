# prediction-markets

A cross-platform prediction-market analytics dashboard for **Polymarket** and **Kalshi**, powered entirely by the [Surf API](https://docs.asksurf.ai/llms.txt). Open interest by category, daily volume trends, whale trades, top traders, market search, and per-wallet drill-down — all from one API key.

## What you can build with Surf API

This repo demonstrates a real cross-platform analytics dashboard composed from these public Surf endpoints:

- **`prediction-market-analytics`** — daily category trends, top markets by OI, momentum summary, per-market signals.
- **`search-prediction-market`** — keyword + filter search across both Polymarket and Kalshi in one call.
- **`polymarket-leaderboard`** — top traders ranked by realized PnL, volume, or trade count.
- **`polymarket-smart-money`** — whale-tier (>$10K) trades with wallet metadata.
- **`polymarket-trades`** — full trade history filtered by wallet, market, outcome, or size.
- **`matching-market-pairs`** — cross-platform Polymarket↔Kalshi pair matcher (used for the "cross-platform matches" snapshot in `data/surf/`).
- **`prediction-market-correlations`** — 30-day Pearson correlations within a category (snapshotted in `data/surf/`).

The whole live integration lives in one file — [`src/lib/surfClient.ts`](src/lib/surfClient.ts) — about 250 lines of hand-written, dependency-free TypeScript hitting `https://api.asksurf.ai/gateway/v1`.

## Screenshots

> _Add screenshots here once you've cloned and run locally._

## Quickstart

```bash
git clone https://github.com/JamesDaizs/prediction-markets
cd prediction-markets
cp .env.example .env.local
# Open .env.local and paste your SURF_API_KEY (get one at https://agents.asksurf.ai)
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To refresh the static dashboard data in `data/surf/` (used by the homepage), install the [Surf CLI](https://docs.asksurf.ai) and run:

```bash
surf login
make collect
```

## How it works

```
┌──────────────────┐                ┌─────────────────────────┐
│    Next.js App   │                │   Static dashboard JSON │
│ ──────────────── │                │     (data/surf/*.json)  │
│  /               │  reads ──────▶ │ refreshed via surf CLI  │
│  /accuracy       │                └─────────────────────────┘
│  /bots           │
│  /metrics        │  live calls go through ──┐
│  /portfolio      │                          ▼
│  /api/whale-...  │           ┌──────────────────────────────┐
│  /api/dashboard- │           │     src/lib/surfClient.ts    │
│      timeseries  │           │     (raw HTTP, ~250 LOC)     │
└──────────────────┘           └──────────────┬───────────────┘
                                              │
                                              ▼
                                https://api.asksurf.ai/gateway/v1
                                  Auth: Bearer ${SURF_API_KEY}
```

There are two data layers:

1. **Static showcase data** in [`data/surf/`](data/surf/) — populated by [`scripts/collect_surf.sh`](scripts/collect_surf.sh) running the public `surf` CLI. The homepage and metrics summary read from these files so you can see something the moment you clone the repo.
2. **Live Surf API** via `src/lib/surfClient.ts` — the Traders page, dashboard time-series API, and subcategory drill-down all hit the public Surf gateway directly.

`src/lib/queries/*.ts` modules wrap `SurfClient` and shape responses for the page components. There is no database. There is no ORM. There is no caching layer beyond what Surf returns. The whole thing is intentionally readable end-to-end.

## Endpoints used

| Feature | Surf endpoint(s) |
|---|---|
| Dashboard (`/`) | static JSON from `search-prediction-market` + `prediction-market-analytics` |
| Metrics page (`/metrics`) | `prediction-market-analytics` (daily volume / OI / market count, top markets, momentum summary) |
| Subcategory drill-down (`/api/subcategory-markets`) | `search-prediction-market` (filtered client-side by subcategory) |
| Dashboard time-series (`/api/dashboard-timeseries`) | `prediction-market-analytics` (per-category daily trends) |
| Whale trades tab | `polymarket-smart-money` (`view=trades`, `whale_tier=whale`) |
| Top traders tab | `polymarket-leaderboard` |
| Hot markets tab | `search-prediction-market` (`sort_by=trade_count_7d`, `platform=polymarket`) |
| Cross-platform market search | `search-prediction-market` (`q=...`) |
| Wallet lookup | `polymarket-trades` (`address=0x...`) |

Surf CLI references for every endpoint: `surf <command> --help` (e.g. `surf prediction-market-analytics --help`).

## Tech stack

Next.js 16 · React 19 · TypeScript 5 · TailwindCSS 4 · Recharts · pnpm

## Pages

- `/` — Dashboard: total OI, total volume, top markets, treemap by category.
- `/metrics` — Daily Polymarket-vs-Kalshi side-by-side: volume, open interest, active markets, momentum summary.
- `/portfolio` — Traders explorer: whale trades, top traders, hot markets, market search, wallet lookup.
- `/accuracy` — Calibration and Brier-score breakdown by category (uses pre-generated `public/data/accuracy_by_category.json`).
- `/bots` — Bot vs human breakdown (uses pre-generated `public/data/bot_analysis.json`).
- `/alerts` — Local alerts UI (`localStorage` only, no backend).

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgments

- [Surf API](https://docs.asksurf.ai/llms.txt) — the data layer that makes this whole app possible.
- [Surf CLI](https://github.com/asksurf-ai/surf-cli) — the public CLI used to discover endpoints during development (`surf <command> --help`).
- [Polymarket](https://polymarket.com) and [Kalshi](https://kalshi.com) — the prediction market platforms providing the underlying data.
- Inspiration for the accuracy methodology: [@PredictParity](https://x.com/PredictParity) and [Brier.fyi](https://brier.fyi).
