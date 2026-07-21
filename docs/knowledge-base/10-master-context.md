# Payra — Master Context (compressed, reusable)

> Single high-density context for AI sessions. Describes the **current verified `main` branch** (LOCAL). `[MERGE]` tags mark deltas from the pending PayEra merge (see `02-branch-reconciliation.md`). Every claim traces to a file; `~inferred` marks non-verified observations. Date basis: 2026-07-21. Pkg names are still `@cryptopay/*` despite "Payra" branding.

## 0. TL;DR
Crypto-to-UPI payment platform on Stellar (testnet/Soroban). User pays merchant by scanning a UPI QR; backend converts crypto→INR, settles to merchant UPI, mints STAR loyalty tokens on-chain. Turborepo monorepo: NestJS API + Next.js 15 web + Next.js admin + 4 Rust Soroban contracts + shared TS packages (sdk/types/ui). Operator-custody model: backend platform keypair signs all on-chain ops (payer can't sign from a mobile QR scan).

## 1. Monorepo layout
```
apps/api        NestJS 11 backend (REST /api/v1, Swagger, Prisma/Postgres)
apps/web        Next.js 15 App Router consumer+merchant PWA (React 19, Tailwind v4)
apps/admin      Next.js 15 admin portal — LOCAL: 3-file stub; [MERGE] full 10-page portal
contracts/      Rust Soroban: star-token, reward-engine, payment-engine, merchant-registry
packages/sdk    @cryptopay/sdk typed API client (browser-coupled: window/localStorage 401 handler)
packages/types  @cryptopay/types shared enums+DTOs
packages/ui     @cryptopay/ui Radix components  [MERGE] +Pagination.tsx
tools/          eslint-config, typescript-config
docs/           contracts/, database/, knowledge-base/, CONTRACT_VERIFICATION_REPORT.md
```
Build: Turbo + npm workspaces. Deploy: `Dockerfile`+`render.yaml` (Render) and `.github/workflows/{ci,deploy}.yml` (Railway/Vercel) — dual target, ambiguous. Node/Nest 11, Prisma client generated to `apps/api/src/generated/prisma`.

## 2. Backend (apps/api) — 14 controllers, prefix `/api/v1`, 84 routes
Modules (controller prefix): auth, users, wallets, merchants, transactions, campaigns, rewards, referrals, kyc, ramps, analytics, admin, health, **zebpay** `[MERGE:removed]`. `[MERGE]` adds: aml, stellar, settlement.
- **auth**: wallet challenge→sign→verify→JWT. Verifier = "ultimate robust" SEP-53 (raw/prefixed/SHA-256 × LF/CRLF × hex/base64 via `Keypair.verify`), `auth/auth.service.ts`. Nonce replay protection single-use, **in-memory only** (breaks under horizontal scale). `jwt.strategy.ts` validate() does **no DB lookup** → suspended users keep access until token expiry. JWT secret falls back to hardcoded `"fallback_secret"`; `JWT_SECRET` absent from env examples ⚠️.
- **transactions** (`transactions.service.ts`): quote via CoinGecko live rates (60s cache, circuit-breaker `COINGECKO`, static fallback XLM9/USDC83/BTC9M/ETH300k/SOL14k INR). `create` validates merchant APPROVED, resolves UPI VPA (dto→qr→default), creates Transaction+SettlementInstruction+event, admin-logs. Reward = `calculateSpendRewardStar` (10 STAR/₹100). Routes: POST quote, POST /, GET /, GET :id, POST :id/cancel, POST :id/fail.
- **transaction-processor** (`transaction-processor.service.ts`, cron every 5s) — **LOCAL's key asset, verified real**: atomically claims CREATED→AUTHORIZED via `updateMany`, retry w/ backoff [0,2s,8s]×3, submits Stellar payment (`stellarService.submitPayment`), then **mints STAR on-chain** via `sorobanService.issueStarReward` per pending reward. Mint failure marks reward FAILED but **does not fail payment** (graceful degrade); no-wallet users get DB-only reward. Confirms settlement, COMPLETED, admin-log.
- **stellar/soroban.service.ts** (verified, both branches): `issueStarReward` builds `issue_spend_reward` call to reward-engine, simulate→assemble→sign(platformKeypair)→submit→poll 40s. `getStarBalance` via simulateTransaction. `stellarService.submitPayment` = Horizon classic payment.
- **ramps** (`ramps.service.ts`): MoneyGram **SEP-10/SEP-24** on/off-ramp. Reads stellar.toml, SEP-10 challenge signed w/ platform key, SEP-24 interactive deposit/withdraw. Routes: authenticate, deposit, withdraw, transaction/:id.
- **kyc**: KYCAID provider; webhook HMAC uses `KYCAID_API_TOKEN` as secret (commit c6b89fb), **non-constant-time `!==`** compare ⚠️. `[MERGE]` adds GET /kyc/status.
- **settlement** `[MERGE only]` (`settlement.service.ts`): **Decentro UPI payout** (real): OAuth token, `initiateUpiPayout`, `checkPayoutStatus(utrNumber)`, mock-mode if creds unset.
- **zebpay** `[LOCAL only, STUB → dropped in merge]`: `handleCallback` returns `{token:'mock_zebpay_token'}`, `processWebhook` logs only. No real OAuth.
- **common/**: circuit-breaker, pagination utils, ids (`createReadableId`/`sha256Hex`), guards, filters, interceptors, validators. `[MERGE]` adds PaginationInterceptor (response `items`→`data`).
- **admin/analytics/campaigns/referrals/rewards/merchants/wallets/users**: standard CRUD+list services over Prisma.

## 3. Database (Prisma/Postgres) — 15 models, 21 enums
Models: User, Wallet, Merchant, MerchantQrCode, Brand, Campaign, CampaignMerchant, Transaction, TransactionEvent, SettlementInstruction, Reward, Referral, AdminLog, ApiIdempotencyKey, OutboxEvent.
Key rels: User 1─* Wallet/Transaction/Reward/Referral; Merchant 1─* MerchantQrCode/Transaction, *─* Campaign via CampaignMerchant; Transaction 1─* TransactionEvent, 1─1 SettlementInstruction, 1─* Reward. AdminLog = audit trail (actorUserId nullable for system). OutboxEvent/ApiIdempotencyKey = reliability primitives (~outbox pattern, verify consumer). Enums include TransactionStatus (CREATED→AUTHORIZED→ROUTING_STELLAR→SETTLING→COMPLETED / FAILED), RewardStatus (PENDING/MINTED/FAILED), KycStatus, PaymentRail `[MERGE]+DECENTRO`. `[MERGE]` SettlementInstruction +`settlementReference` → needs migration.

## 4. Contracts (Soroban, Rust) — verified 21/21 tests pass (report 2026-07-11)
- **payment-engine**: orchestrator, linear state machine Created→Quoted→Converted→Settled→Rewarded→Completed. Cross-calls via `#[contractclient]`: →merchant-registry.is_approved, →reward-engine.issue_spend_reward (→star-token.mint_from_minter).
- **star-token**: 0 decimals, capped supply, admin+minter. 10 STAR/₹100. `is_authorized` **defaults true** → allowlist behaves as blocklist ⚠️. `[MERGE]` +fee-burn (FeeBurnConfig, bps fee→burn).
- **reward-engine**: issues spend reward, mints STAR; `RewardKind::Merchant` unused.
- **merchant-registry**: register/approve/suspend, status transitions.
- LOCAL fixes (uncommitted→now in 6c3c3ee): TTL `extend_ttl(&key,100,518400)` after every persistent set() (prevents ~7-day archival) + `create_payment` auth payer→**operator**. `[MERGE]` PayEra dropped one TTL extend in `payment-engine.set_admin` (regression — restore on merge).
- No on-chain price oracle → full trust in operator-supplied conversion ⚠️. Testnet addresses in `apps/api/.env.example`.

## 5. Frontend (apps/web) — Next 15 App Router, all `'use client'`
State: Zustand `persist` key `payra-auth-storage` (JWT+user, `partialize` tokens/userid/kyc) + TanStack Query v5 (staleTime 5m, retry 1). SDK wired in `providers/Providers.tsx` baseUrl `${NEXT_PUBLIC_API_URL||localhost:4000}/api/v1`, getToken from Zustand. On-chain reads direct to Horizon/Soroban via `lib/{stellar,horizon,trustline}.ts`.
Auth chain: Freighter connect (`StellarWalletProvider`: challenge→signMessage→walletLogin→JWT) → **AppLockWrapper** gate: no token=login; locked=`AppLock` (WebAuthn/PIN, client-only, static salt `payra-salt-2026`, bypassable ⚠️); KYC NOT_STARTED/REJECTED=`KycOnboarding`, PENDING/IN_REVIEW=`KycPending` (polls getCurrentUser 8s). No server-side route protection (no middleware.ts).
Core flow `/pay`: SCAN→QUOTE→PROCESSING→SUCCESS, `parseUpiQr`, getQuote/createTransaction/getTransaction 2s-poll/60s-timeout, KYC re-gated here. Fallback merchant UUID `1111...1111`.
Verified stubs/mocks (LOCAL): profile page (Demo User, `mock.zebpay.com` OAuth `[dropped]`), rewards/referrals (fully mock), merchant dashboard+analytics (fetch data but render **hardcoded** KPIs ₹2.4M etc.), 3 conflicting DEMO_USER_ID/BRAND_ID UUIDs, non-functional: history filter tabs, search boxes, Sidebar logout, Topbar bell, ADD USDC/CASH OUT. `lib/stellar.ts` usdc=`CBXYZ...` placeholder. **Real bug (both branches):** `profile/trust` reads token via `localStorage.getItem("accessToken")` but token is under `payra-auth-storage` → unauthenticated 401.
`[MERGE]` adds: components/stellar/{StarBalance,MerchantStatus,TransactionStatus}, ~15 routes (wallet/manage, history/[id], merchant onboard/profile/qr-codes/settlements/webhooks, tax-report), error/loading/not-found boundaries (LOCAL has none), full admin portal.

## 6. apps/admin — LOCAL 3-file stub ("Architecture shell only."). `[MERGE]` full portal
`[MERGE]` 10 pages (overview/users/merchants+approval/pending/transactions/rewards/logs/aml) via SDK+React Query. **Auth is fake:** `Providers.tsx` auto `mockLogin({admin@cryptopay.network, ADMIN})`, no login form, no route guards → anyone = ADMIN ⚠️. Placeholders: KYC column `-`, hardcoded reject reasons, AML page inconsistent dark theme.

## 7. Payment lifecycle (E2E, verified)
1. User scans UPI QR → `/pay` parses VPA/amount. 2. `POST /transactions/quote` (CoinGecko rate). 3. `POST /transactions` creates CREATED tx + SettlementInstruction + PENDING Reward. 4. Cron processor claims→AUTHORIZED→ROUTING_STELLAR, `submitPayment` (Horizon)→SETTLING. 5. Mints STAR on-chain (soroban issueStarReward)→Reward MINTED. 6. SettlementInstruction CONFIRMED (`[MERGE]` real Decentro UPI payout to merchant VPA; LOCAL=mockReference). 7. tx COMPLETED, admin-logged. On/off-ramp = MoneyGram SEP-24 (`wallet/onramp|offramp`, Freighter-signed USDC, trustline check, min 5 USDC withdraw).

## 8. Screen→API→Service→DB→Chain map (gaps marked)
- /pay → POST /transactions → TransactionsService → Transaction/Reward/SettlementInstruction → (cron) Stellar+Soroban. ✅ connected.
- merchant dashboard/analytics → getDashboardMetrics → ✅ API exists but **frontend renders hardcoded values, fetched data unused** ⚠️partial.
- profile/trust → raw fetch /users/me/export|delete → **broken token key** ⚠️.
- zebpay callback → /zebpay/callback → **stub both ends** `[dropped]`.
- rewards/referrals → **no API call, mock** ⚠️.
- admin `[MERGE]` → SDK → real APIs but **unauthenticated frontend** ⚠️.

## 9. Dependencies / integrations
External: Stellar Horizon+Soroban RPC (testnet), Freighter wallet, CoinGecko (rates, circuit-broken), KYCAID (KYC), MoneyGram SEP-10/24 (ramps), `[MERGE]` Decentro (UPI payout), `[LOCAL/dropped]` ZebPay. Internal: web/admin→@cryptopay/sdk→api; api→Prisma→Postgres; api→soroban→contracts; types/ui shared. Root `package.json` `[MERGE]` +@nestjs/config, uuid.

## 10. Env vars (apps/api/.env.example)
DATABASE_URL, JWT_SECRET (⚠️missing/fallback), STELLAR_* (network/rpc/horizon/passphrase), PLATFORM_SECRET_KEY (operator keypair), {STAR_TOKEN,REWARD_ENGINE,PAYMENT_ENGINE,MERCHANT_REGISTRY}_CONTRACT_ADDRESS, KYCAID_API_TOKEN/FORM_ID, ALLOWED_ORIGINS, MONEYGRAM_HOME_DOMAIN, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_STELLAR_*, NEXT_PUBLIC_DEMO_MODE. `[LOCAL]` ZEBPAY_CLIENT_ID/SECRET `[dropped]`. `[MERGE]` DECENTRO_CLIENT_ID/SECRET/MODULE_SECRET/BASE_URL, NEXT_PUBLIC_APP_DOMAIN.

## 11. Knowledge graph (text)
```
User ──owns──> Wallet(Freighter) ──signs──> Stellar/Soroban
User ──scans──> MerchantQrCode ──belongs──> Merchant(APPROVED, merchant-registry contract)
User ──creates──> Transaction ──has──> SettlementInstruction ──payout──> [Decentro UPI | mock]
Transaction ──generates──> Reward ──mint──> reward-engine ──> star-token(STAR) ──> User Wallet
payment-engine ──orchestrates──> {merchant-registry, reward-engine, star-token}
Backend(operator keypair) ──signs-all──> contracts (custody model)
AuthN: Freighter→JWT→AppLock(client)→KYC gate ; AuthZ: backend-only (admin frontend unguarded)
Ramps: MoneyGram SEP-10/24 <──> USDC trustline <──> Wallet
CI: Turbo build ──> Render + Railway/Vercel (dual, ambiguous)
```

## 12. Status / risks (highest signal)
Verified-real: on-chain STAR mint (LOCAL processor), Soroban service, contracts 21/21, MoneyGram ramps, CoinGecko quotes w/ circuit breaker, wallet-auth SEP-53, KYCAID, `[MERGE]` Decentro payout.
Stub/mock: ZebPay (both ends)`[dropped]`, merchant dashboard KPIs, rewards/referrals, admin auth `[MERGE]`.
Security ⚠️: JWT fallback secret + missing JWT_SECRET env; no KYC/AML gate on payment API (client-only); jwt.strategy no DB lookup; nonce cache in-memory; KYC webhook non-constant-time compare; admin portal unauthenticated `[MERGE]`; profile/trust token bug; client-only app-lock; star-token allowlist-as-blocklist; no on-chain oracle.
Tech debt: `@cryptopay/*` naming vs Payra brand; SDK browser-coupled; response shape `items` vs `data` inconsistency (`[MERGE]` interceptor fixes); tests thin (2 API specs, `--passWithNoTests`); dual deploy target.

## 13. Merge status (as of pause)
Rollback point committed `6c3c3ee` (LOCAL work + KB). Plan: merge payera/main, Decentro-only (drop ZebPay), combine-best on 3 conflicts (keep LOCAL processor; contracts=LOCAL fixes+PayEra fee-burn+restore dropped TTL; dashboard=merge both; schema=PayEra superset+migration). Not yet executed beyond backup commit.
