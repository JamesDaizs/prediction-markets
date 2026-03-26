# 10: Web Research — Execution Mechanics & Detection Tools

## NegRisk Arbitrage: Smart Contract Architecture

### Core Contracts on Polygon

| Contract | Address | Role |
|----------|---------|------|
| **CTF Exchange** | `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E` | Binary market order matching & settlement |
| **Neg Risk CTF Exchange** | `0xC5d563A36AE78145C45a50134d48A1215220f80a` | Multi-outcome market order matching |
| **ConditionalTokens (CTF)** | `0x4D97DCd97eC945f40cF65F87097ACe5EA0476045` | ERC-1155 conditional token minting/burning (Gnosis) |
| **NegRiskAdapter** | (wraps CTF) | Converts NO tokens across mutually exclusive outcomes |

### How Trades Execute On-Chain

Hybrid off-chain matching / on-chain settlement:
1. Users submit signed orders (EIP-712) to Polymarket's off-chain CLOB API
2. Polymarket's operator matches orders off-chain
3. Operator constructs settlement tx and submits to Polygon
4. CTF Exchange verifies both signatures, checks conditions, performs atomic swap

Key on-chain events:
- `OrderFilled` / `OrdersMatched` — token-for-USDC trades
- `PositionSplit` — minting conditional tokens by locking USDC
- `PositionsMerge` — burning tokens and withdrawing USDC
- `PositionsConverted` (NegRiskAdapter only) — converting NO→YES positions

### Arb Execution Is NOT Atomic

From arXiv paper: *"Each of the above trades is non-atomic; thus, there is always some risk in attempting the arbitrage."*

Researchers used 950-block windows (~1 hour) to group related bid activities. Execution is spread over time because Polymarket's CLOB architecture routes through off-chain matching first. Exception: simple split/merge operations are single on-chain transactions.

### Gas Economics

- Polygon gas: ~$0.007/transaction (150K gas at 30-100 gwei)
- Standard CLOB order gas: ~150,000 units
- Median arb spread: 0.3% (barely profitable after fees)
- **Profitable arb needs >3% spread** on $100 position (2% winner fee + gas + risk)
- Larger trades ($1,000+) need only 2.2% spread
- 73% of arb profits captured by sub-100ms execution bots

## Polyclaw Execution Flow

### How It Trades
1. **Approve contracts** (~6 transactions, ~0.01 POL gas) — one-time setup
2. **Split**: Deposit USDC.e → mint equal YES + NO tokens
3. **Sell unwanted side** on CLOB order book
4. **Example**: $2 USDC.e → 2 YES + 2 NO. Sell 2 NO @ $0.35 → recover $0.70. Net: $1.30 for 2 YES ($0.65 effective price)

### LLM-Powered Hedge Discovery
- Uses contrapositive logic to find covering portfolios across markets
- Only logically necessary implications accepted (correlations rejected)

### CLOB API Challenges
- Polymarket uses Cloudflare protection blocking POST requests from many IPs
- Polyclaw uses rotating residential proxies (IPRoyal, BrightData)
- Orders typically succeed within 5-10 retries

## IronClaw (Near AI)

Rust reimplementation of OpenClaw focused on security:
- **Encrypted vault** for secrets — LLM never touches private keys
- **WebAssembly sandboxing** with capability-based permissions
- **Endpoint allowlisting** — credentials only injected for approved sites
- **Leak detection and rate limiting**
- Supports NEAR AI, Anthropic, OpenAI, Gemini, Mistral, Ollama
- Does NOT implement strategies itself — framework for skills

## Multi-Wallet Detection Methods

### Chainalysis Approach (Used for Theo)
1. **Funding pattern analysis**: Shared exchange deposit/withdrawal addresses
2. **Transaction timing correlation**: Timestamps across accounts
3. **Cash-out convergence**: Withdrawals to same exchange addresses
- Initially identified 4 accounts (~$78.7M), expanded to 10 ($83.5M), then 11th suspected ($2.1M)

### On-Chain Signatures of Multi-Wallet Operations
1. **Shared funding address**: All wallets funded from same CEX withdrawal or EOA
2. **Same Gnosis Safe deployer**: Polymarket creates 1-of-1 Gnosis Safe proxy per user
3. **Sequential trades**: Correlated entry/exit timing on same markets
4. **Identical trade sizing**: Similar position sizes or round-number patterns
5. **Cash-out convergence**: Withdrawals to same exchange deposit address
6. **Contract interaction patterns**: Jaccard similarity >50% flags sybil clusters

### Available Detection Tools

| Tool | Method | Type |
|------|--------|------|
| **Chainalysis** | Forensic funding patterns | Commercial |
| **PolyTrack** | Behavioral analysis, <30s alerts, identified all Theo wallets | Free |
| **Polywhaler** | Real-time $10K+ trade monitoring, AI predictions | Commercial |
| **suislanchez/insider-detector** | USDC funding traces + p-value win rate analysis | Open source (GitHub) |
| **Arkham Intelligence** | Cross-chain deanonymization, entity labeling | Freemium |
| **Nansen** | 500M+ labeled wallets, Smart Money filters | Commercial |
| **Forta Sybil Defender** | Louvain community detection + Jaccard similarity | Open source |
| **Dune Analytics** | Custom SQL against indexed Polygon data | Freemium |

### Forta Sybil Defender Algorithm
1. Analyze transactions in batches of 50,000 per chain
2. Separate wallet-to-wallet transfers vs wallet-to-contract interactions
3. Build NetworkX graph (nodes=addresses, edges=transfers)
4. **Weakly Connected Component** algorithm → connected wallet groups
5. Refine large clusters with **Louvain algorithm**
6. Compare contract interaction patterns via **Jaccard similarity**
7. If similarity >50% → flag as Sybil cluster

### Polymarket-Specific Detection (suislanchez)
- **Shared USDC funding**: Trace USDC.e transfers on Polygon
- **Pre-resolution trading**: Trades 1-10 min before resolution = insider signal
- **Win rate anomalies**: Binomial p-value <0.001 (>80% win rate → suspicious)
- **Multi-market success**: Winning across unrelated markets = broad insider access
- **Gnosis Safe deployer**: Same deployer EOA links accounts

## Information Bot Data Sources

### Weather (gopfan2 type)
- **Primary**: NOAA GFS (Global Forecast System), 31-member ensemble
- **Secondary**: ECMWF models via Open-Meteo API
- **Update schedule**: Every 6 hours, **00:05 UTC = highest-value window**
- **Edge calculation**: Count ensemble members above/below threshold → model probability
- **Trade threshold**: Edge > 8% vs market price
- **Latency**: 5-10 minute edge windows (human markets slow to react)
- **Open source**: github.com/suislanchez/polymarket-kalshi-weather-bot

### Esports (TeemuTeemuTeemu type)
- **LoL**: Riot Games API (live match events)
- **CS2/Dota 2**: Valve Game State Integration
- **Commercial**: PandaScore (aggregated live data + odds)
- **Edge**: 30-40 second stream delay advantage over Twitch/YouTube viewers

### Crypto (0x8dxd type)
- **Primary**: Binance + Coinbase WebSocket feeds (sub-100ms latency)
- **Target**: 15-minute BTC/ETH/SOL up/down contracts
- **Edge**: Exchange prices move first, Polymarket CLOB reprices slower
- **Status**: KILLED by dynamic taker fees (~3.15%, introduced Feb 2026)

### Sports (general)
- **Injury data**: ESPN API, team social media accounts, press conferences
- **Live scoring**: ESPN, odds APIs, real-time game state
- **Lineup data**: Official team announcements (typically 30-60 min before game)
- **Edge**: Faster processing of publicly available data + better models

## Polymarket Auth Architecture

### Two-Level Authentication
- **L1 (EIP-712)**: Basic — sign typed data with Ethereum private key. For casual API access.
- **L2 (HMAC-SHA256)**: For HFT — derive API credentials from L1, use HMAC for each request. Lower latency, higher rate limits.

### Polymarket Account Structure
- Each user gets a **1-of-1 Gnosis Safe proxy** wallet on Polygon
- Created via Gnosis Safe ProxyFactory
- The user's EOA is the single owner
- All trades execute through this proxy

## Sources

- arXiv:2508.03474 "Unravelling the Probabilistic Forest"
- arXiv:2603.03136 "The Anatomy of Polymarket"
- Flashbots Forum: Arbitrage in Prediction Markets
- ChainCatcher: Six Profit Models analysis (95M txs)
- Finance Magnates: Bot Playground / Dynamic Fees articles
- Chainstack Polyclaw Documentation
- GitHub: Polyclaw, NegRisk Adapter, Sybil Defender, insider-detector, weather-bot, IronClaw
- Olas: Polystrat blog posts
- Chainalysis X thread (Theo investigation)
- PolyTrack blog
- Polymarket Analytics
- Zichao Yang: Decoding Polymarket
- Kotaku/esports.net: TeemuTeemuTeemu coverage
- CNBC/Cointelegraph/Entrepreneur: Theo coverage
- CoinMarketCap: Taker Fees article
- ChainSecurity: NegRiskAdapter Audit
- Polymarket Docs
