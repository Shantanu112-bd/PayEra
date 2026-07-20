# 03 · Backend Service Map

NestJS API (`apps/api`), global prefix `/api/v1`, Prisma + PostgreSQL.

## Controllers / route prefixes (LOCAL: 14)

| Prefix | Module | Notes |
|---|---|---|
| `auth` | Auth | wallet challenge/login, JWT, refresh |
| `users` | Users | profile, activate/suspend/soft-delete, GDPR export/delete |
| `wallets` | Wallets | list/link Stellar wallets |
| `merchants` | Merchants | registration, my-merchant, transactions, dashboard metrics |
| `transactions` | Transactions | quote, create, list, get, cancel, fail |
| `rewards` | Rewards | list/get STAR rewards, balance |
| `referrals` | Referrals | referral codes |
| `campaigns` | Campaigns | merchant reward campaigns |
| `kyc` | KYC | start, webhook (KYCAID), `+status` (PayEra) |
| `ramps` | Ramps | MoneyGram SEP-10/24 authenticate/deposit/withdraw |
| `admin` | Admin | overview, list users/merchants/tx/rewards/logs, approve/reject |
| `analytics` | Analytics | consumer reward metrics, merchant dashboard |
| `health` | Health | liveness |
| `zebpay` | ZebPay **(LOCAL only, STUB)** | callback, webhook — returns mock token |

**PayEra adds:** `aml` (screen wallet), `stellar` (star balance, merchant status).

## Key services

- **TransactionsService** — quote via live CoinGecko rates (60s cache, circuit-breaker,
  static fallback XLM 9 / USDC 83 / BTC 9M / ETH 300k / SOL 14k INR); create writes tx +
  settlement instruction + event + admin log; reward computed `calculateSpendRewardStar`.
- **TransactionProcessorService** (`@Cron` every 5s) — atomically claims CREATED→AUTHORIZED
  via `updateMany`, routes payment on Stellar, **mints STAR on-chain (LOCAL)**, confirms
  settlement, completes. Retry w/ backoff [0,2s,8s]×3 (LOCAL). Mint failure ≠ payment failure.
- **SorobanService** — `issueStarReward` (real: build→simulate→assemble→sign platform key→
  submit→poll 40s against reward-engine `issue_spend_reward`), `getStarBalance`, `createPayment`.
- **StellarService** — Horizon payment submission (`submitPayment`).
- **SettlementService** (PayEra) — Decentro UPI payout: OAuth token, `initiateUpiPayout`,
  `checkPayoutStatus` (UTR). Mock mode if creds unset.
- **AmlService** (PayEra) — wallet risk screening, mock default.
- **AuthService** — SEP-53 wallet signature verification ("ultimate robust": raw/prefixed/
  SHA-256 payloads × LF/CRLF × hex/base64 via `Keypair.verify`). In-memory nonce replay guard.
- **KycService** — KYCAID start + webhook (HMAC via `KYCAID_API_TOKEN`).

See `_scratch/kb-backend-core.md` and `_scratch/kb-backend-auth.md` for full detail + citations.
