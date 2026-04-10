# Prediction Markets Dashboard

A comprehensive analytics dashboard for prediction markets data from Polymarket and Kalshi, built with Next.js and powered by the [Surf API](https://agents.asksurf.ai).

## 🎯 Features

- **Multi-Platform Data**: Aggregated data from Polymarket and Kalshi
- **Real-Time Analytics**: Live market analytics and correlations
- **Cross-Platform Matching**: Find similar markets across platforms
- **Interactive Visualizations**: Charts and dashboards for market insights
- **Open Source**: Ready for community contributions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- [Surf CLI](https://github.com/asksurf-ai/surf-cli) for data collection
- Surf API key from [agents.asksurf.ai](https://agents.asksurf.ai)

### Setup

1. **Clone and install:**
   ```bash
   git clone <repo-url>
   cd prediction-markets
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Add your Surf API key to .env.local
   ```

3. **Set up Surf CLI:**
   ```bash
   # Install surf CLI (if not already installed)
   curl -fsSL https://agent.asksurf.ai/cli/releases/install.sh | sh

   # Login with your API key
   surf login
   ```

4. **Collect data:**
   ```bash
   # Quick data collection (bash)
   ./scripts/collect_surf.sh

   # Or detailed collection (Python)
   cd scripts && python collect_surf.py
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

## 📊 Data Collection

The project includes two data collection approaches:

### Bash Script (Recommended)
```bash
./scripts/collect_surf.sh
```
Fast, simple collection using surf CLI commands:
- Prediction markets overview
- Market analytics
- Cross-platform matching
- Market correlations

### Python Script (Advanced)
```bash
cd scripts && python collect_surf.py
```
More detailed collection with:
- Price history for top markets
- Trade data analysis
- Event extraction
- Custom processing

## 📁 Data Structure

```
data/
├── surf/                    # Surf CLI collected data
│   ├── prediction_markets.json
│   ├── market_analytics.json
│   ├── cross_platform_matches.json
│   └── market_correlations.json
└── raw/                     # Legacy data (optional)
```

## 🔧 Available Surf Commands

| Command | Purpose | Usage |
|---------|---------|-------|
| `search-prediction-market` | Get all active markets | `surf search-prediction-market --limit 100` |
| `polymarket-markets` | Polymarket market details | `surf polymarket-markets --market-slug <slug>` |
| `polymarket-prices` | Price history | `surf polymarket-prices --condition-id <id>` |
| `polymarket-trades` | Trade history | `surf polymarket-trades --condition-id <id>` |
| `kalshi-markets` | Kalshi market details | `surf kalshi-markets --market-ticker <ticker>` |
| `prediction-market-analytics` | Market analytics | `surf prediction-market-analytics` |
| `matching-market-pairs` | Cross-platform matches | `surf matching-market-pairs --limit 50` |

## 🌐 Environment Variables

```env
# Required
SURF_API_KEY=sk-your_surf_api_key_here

# Optional (for legacy features)
CLICKHOUSE_HOST=clickhouse.ask.surf
CLICKHOUSE_USER=bot_ro
CLICKHOUSE_PASSWORD=your_password
CLICKHOUSE_DB=prediction_markets
```

## 🏗️ Architecture

- **Frontend**: Next.js 15 with App Router
- **Data Source**: Surf API via CLI
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Type Safety**: TypeScript

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit: `git commit -m 'feat: description'`
6. Push: `git push origin feature-name`
7. Open a Pull Request

## 📝 Migration Notes

This project has been migrated from internal Surf API gateway to the open-source surf CLI:

- ✅ **Before**: Internal API calls to `api.ask.surf/gateway/v1/prediction-market`
- ✅ **After**: Open-source surf CLI commands
- ✅ **Benefits**: Standardized API, better rate limiting, public access
- ✅ **Credits**: Transparent credit usage tracking

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- [Surf CLI Documentation](https://docs.asksurf.ai/cli)
- [Surf API Reference](https://docs.asksurf.ai/api)
- [Polymarket](https://polymarket.com)
- [Kalshi](https://kalshi.com)