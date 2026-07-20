# 01 · System Architecture

## High-level topology

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  apps/web       │     │  apps/admin     │     │  Freighter       │
│  (Next.js PWA)  │     │  (Next.js)      │     │  wallet (browser)│
│  consumer +     │     │  compliance     │     └────────┬─────────┘
│  merchant       │     │  portal         │              │ SEP-53 sign
└───────┬─────────┘     └───────┬─────────┘              │
        │  @cryptopay/sdk (typed HTTP client)            │
        │  baseUrl = NEXT_PUBLIC_API_URL + /api/v1       │
        ▼                       ▼                         │
┌───────────────────────────────────────────┐           │
│  apps/api  (NestJS)                         │           │
│  14–16 modules, Prisma, JWT auth            │           │
│  ┌─────────────────────────────────────┐   │           │
│  │ transaction-processor (@Cron 5s)    │   │           │
│  │  → StellarService.submitPayment     │───┼──────────┐│
│  │  → SorobanService.issueStarReward   │   │          ││
│  └─────────────────────────────────────┘   │          ▼▼
└───────┬───────────────────┬─────────────────┘   ┌──────────────┐
        │                   │                       │ Stellar      │
        ▼                   ▼                       │ Testnet      │
┌──────────────┐   ┌──────────────────┐            │ Horizon +    │
│ PostgreSQL   │   │ External services │           │ Soroban RPC  │
│ (Prisma)     │   │ • KYCAID (KYC)    │           │              │
└──────────────┘   │ • MoneyGram SEP24 │           │ 4 contracts: │
                   │ • Decentro (UPI)* │            │ merchant-reg │
                   │ • ZebPay (stub)†  │           │ payment-eng  │
                   │ • CoinGecko rates │           │ reward-eng   │
                   └──────────────────┘            │ star-token   │
                    * PayEra only  † LOCAL only     └──────────────┘
```

## Request/data flow: a payment (verified)

1. **Quote** — `POST /transactions/quote` → `TransactionsService.createQuote()` fetches live
   INR rates from CoinGecko (60s cache, circuit-breaker wrapped, static fallback) and computes
   crypto amount + STAR reward. (`apps/api/src/transactions/transactions.service.ts`)
2. **Create** — `POST /transactions` → validates merchant is `APPROVED`, resolves UPI VPA
   (dto → QR code → merchant default), writes `Transaction` (status `CREATED`) +
   `SettlementInstruction` + reward rows, logs `TRANSACTION_CREATED` to `AdminLog`.
3. **Process** — `TransactionProcessorService` `@Cron(EVERY_5_SECONDS)` atomically claims
   `CREATED`→`AUTHORIZED` via `updateMany`, then per tx:
   `ROUTING_STELLAR` → `StellarService.submitPayment` → `SETTLING` → mint STAR on-chain via
   `SorobanService.issueStarReward` → confirm settlement → `COMPLETED`.
   Retry with backoff (3 attempts, `[0, 2000, 8000]ms`); permanent failure → `FAILED` +
   `MAX_RETRIES_EXCEEDED`. (LOCAL branch — this is more advanced than PayEra's version.)
4. **Poll** — web `pay/page.tsx` polls `GET /transactions/:id` every 2s (60s timeout) until
   `COMPLETED`/`FAILED`.

## On-chain contract chain (verified via integration test)

```
payment-engine.create_payment (require_operator)
  ├─ merchant-registry.is_approved(merchant)
  ├─ ... quote → convert → settle (operator-signed) ...
  └─ reward-engine.issue_spend_reward
        └─ star-token.mint_from_minter (minter = reward-engine address)
```
State machine: `Created → Quoted → Converted → Settled → Rewarded → Completed`
(`contracts/payment-engine/src/lib.rs`; end-to-end `integrates_all_four_contracts` test.)

## Auth architecture

- **Wallet login:** `POST /auth/wallet/login` — challenge → Freighter `signMessage` →
  SEP-53 verify (tries raw/prefixed/SHA-256 payloads × LF/CRLF × hex/base64) → JWT.
  Nonce single-use, in-memory cache, 5-min TTL. (`apps/api/src/auth/*`)
- **JWT:** `JwtStrategy.validate` does **no DB lookup** (suspended users keep access until expiry);
  secrets fall back to hardcoded `"fallback_secret"` if env unset.
- **Client gates:** Zustand-persisted JWT (`payra-auth-storage`) → client-side AppLock
  (WebAuthn/PIN) → KYC gate (KycOnboarding/KycPending). **All client-side; no `middleware.ts`.**
- **KYC webhook:** HMAC using `KYCAID_API_TOKEN` as secret (non-constant-time compare).

## Deployment

- **API:** root `Dockerfile` → `render.yaml` (Render). Turbo-built monorepo.
- **Web/Admin:** Vercel (CORS config references Vercel preview URLs + Render origin).
- **CI:** `.github/workflows/ci.yml` (build/lint/test, `--passWithNoTests`), `deploy.yml`.
- A stale `railway/fix-deploy` remote branch exists — deploy target history is Railway→Render.

## Divergence map (LOCAL vs PayEra)

See [02-branch-reconciliation.md](./02-branch-reconciliation.md) for the full table. In short:
- **LOCAL adds:** ZebPay module + web callback (stub), advanced transaction-processor with
  on-chain minting, contract TTL/auth fixes (uncommitted), dashboard 3-zone refactor (committed).
- **PayEra adds:** full admin portal, ~15 web routes + error boundaries, `components/stellar/*`,
  `aml/` + `settlement/` (Decentro) + `stellar.controller` backend modules, pagination
  interceptor, KYC status endpoint, refresh-token reuse detection, star-token fee-burn,
  SDK aml/stellar modules, `DECENTRO` enum + `settlementReference` schema field.
