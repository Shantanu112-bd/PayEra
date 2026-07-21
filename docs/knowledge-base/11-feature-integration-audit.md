# Feature & Integration Audit — Payra (branch: `main` @ 6c3c3ee)

**Scope:** Current verified state of the LOCAL `main` branch. Where the deferred
PayEra merge would change a row, it is tagged `[MERGE]`. Every claim is grounded
in files read during the two-branch audit (see sibling KB docs for full citations).

**Legend**
- ✅ Fully implemented + integrated (frontend + backend wired, real data)
- 🟡 Implemented but partially integrated (works, but placeholders/gaps remain)
- 🟠 Backend only (API exists, no/'stub' frontend)
- 🔵 Frontend only (UI exists, no real backend support)
- 🔴 Exists but disconnected (code present on both sides but not wired to each other)
- ❌ Missing

`~` prefix = inferred, not directly verified.

---

## Summary table

| # | Feature | Status | FE | BE | Chain | Notes |
|---|---------|--------|----|----|-------|-------|
| 1 | Wallet auth (Freighter, SEP-53) | ✅ | ✅ | ✅ | ✅ | challenge→sign→JWT, nonce replay guard |
| 2 | Scan-and-pay (QR → quote → pay) | ✅ | ✅ | ✅ | ✅ | core flow; on-chain STAR mint wired |
| 3 | Live FX quote | ✅ | ✅ | ✅ | — | CoinGecko + circuit breaker + fallback rates |
| 4 | Transaction processor (async settle) | ✅ | — | ✅ | ✅ | cron claim + retry/backoff + Soroban mint |
| 5 | STAR reward minting (on-chain) | ✅ | 🟡 | ✅ | ✅ | BE mints; FE balance partly placeholder |
| 6 | KYC (KYCAID) | 🟡 | ✅ | ✅ | — | gate client-side + pay page; **not on API** |
| 7 | On-ramp (MoneyGram SEP-24) | ✅ | ✅ | ✅ | ✅ | trustline + iframe + polling |
| 8 | Off-ramp (MoneyGram SEP-24) | ✅ | ✅ | ✅ | ✅ | signs USDC payment to anchor |
| 9 | Merchant registry / approval | 🟡 | 🟡 | ✅ | ✅ | BE+contract solid; FE merchant KPIs hardcoded |
| 10 | Merchant dashboard/analytics | 🔵 | 🔵 | ✅ | — | fetches data but renders hardcoded KPIs |
| 11 | Campaigns / rewards programs | 🟡 | 🟡 | ✅ | — | CRUD real; demo brand/user IDs hardcoded |
| 12 | Referrals | 🟡 | 🔵 | ✅ | — | BE service real; FE page fully mock |
| 13 | Admin portal | 🔴 | ❌ | ✅ | — | LOCAL admin = 3-file stub; BE admin API real |
| 14 | ZebPay off-ramp | 🔴 | 🔴 | 🔴 | — | stub both sides; **slated for removal** `[MERGE]` |
| 15 | AML screening | ❌ | ❌ | ❌ | — | LOCAL has none `[MERGE: PayEra adds]` |
| 16 | Decentro UPI settlement | ❌ | — | ❌ | — | LOCAL has none `[MERGE: PayEra adds real]` |
| 17 | Trust/privacy (export/delete) | 🔴 | 🔵 | ✅ | — | FE token-read bug → unauth calls (real defect) |
| 18 | App lock (PIN/biometric) | 🟡 | ✅ | — | — | client-side only; static PIN salt |
| 19 | Profile | 🔵 | 🔵 | 🟠 | — | LOCAL profile page largely mock/demo data |

---

## Per-feature detail

### 1. Wallet authentication — ✅
- **Purpose:** passwordless login via Stellar wallet (Freighter).
- **FE:** `apps/web/src/components/providers/StellarWalletProvider.tsx` — connect→`auth.walletChallenge`→`freighterApi.signMessage`→`auth.walletLogin`→JWT in Zustand.
- **BE:** `apps/api/src/auth/*` — SEP-53 verifier tries raw/prefixed/SHA-256 payloads across LF/CRLF + hex/base64; nonce single-use, 5-min TTL.
- **Missing:** nonce cache is in-memory (breaks under horizontal scale); `JwtStrategy.validate` does no DB lookup (suspended users keep access to expiry). ⚠️ JWT secret falls back to hardcoded `"fallback_secret"`.

### 2. Scan-and-pay — ✅
- **FE:** `apps/web/src/app/pay/page.tsx` — SCAN→QUOTE→PROCESSING→SUCCESS, `QrScanner`, `parseUpiQr`, 2s poll / 60s timeout; KYC gate enforced here.
- **BE:** `transactions.service.ts create()` — merchant-approval check, quote, creates Transaction + SettlementInstruction + event.
- **Chain:** completed via processor (#4).
- **Missing:** hardcoded fallback merchant UUID `1111…1111` for testnet demo; errors via `alert()`.

### 3. Live FX quote — ✅
- **BE:** `transactions.service.ts getLiveRates()` — CoinGecko via `CircuitBreakerService('COINGECKO')`, 60s cache, static fallback (XLM 9, USDC 83…).

### 4. Transaction processor — ✅ (backend/chain)
- **BE:** `transaction-processor.service.ts` — `@Cron(EVERY_5_SECONDS)`, atomic `updateMany` claim (CREATED→AUTHORIZED), `processTransactionWithRetry` (3 attempts, backoff 0/2s/8s).
- **Chain:** `stellarService.submitPayment` then `sorobanService.issueStarReward`. Mint failure marks reward FAILED but **does not fail payment** (deliberate). No-wallet users → DB-only reward record.
- **Note:** this is LOCAL's most advanced work; keep on merge.

### 5. STAR reward minting — ✅ BE / 🟡 FE
- **BE/Chain:** `stellar/soroban.service.ts issueStarReward()` — builds `issue_spend_reward` call to reward-engine, simulate→assemble→sign(platform key)→submit→poll ≤40s.
- **FE gap:** balance display partly placeholder (`contracts/page.tsx` fallback `"5,000"`; StarBalance fakes USD as balance×0.01 in PayEra).

### 6. KYC — 🟡
- **BE:** `kyc/*` — start + webhook; HMAC uses `KYCAID_API_TOKEN` as secret (non-constant-time compare).
- **FE:** `KycOnboarding`/`KycPending` gate app-wide + re-checked in pay page.
- **Missing/⚠️:** **no KYC gate on transaction/payment API endpoints** — enforcement is client-side only. `GET /kyc/status` is `[MERGE: PayEra-only]`.

### 7–8. On/Off-ramp (MoneyGram SEP-24) — ✅
- **FE:** `wallet/onramp/page.tsx`, `wallet/offramp/page.tsx` — trustline check/add, authenticate, iframe URL, status poll; offramp signs real USDC `Operation.payment` w/ memo, min 5 USDC.
- **BE:** `ramps/*` — SEP-10 auth (platform key signs challenge), SEP-24 deposit/withdraw, toml fetch.

### 9. Merchant registry / approval — 🟡
- **BE:** `merchants/*` + `merchant-registry` contract (register/approve/suspend, status transitions). ✅
- **FE:** merchant pages exist but KPIs hardcoded (see #10); approval UI is admin-side (stub in LOCAL, #13).

### 10. Merchant dashboard / analytics — 🔵
- `merchant/page.tsx`, `merchant/analytics/page.tsx` fetch `getDashboardMetrics` but **render hardcoded** ₹2.4M / 1,240 tx / charts; fetched data unused. Only recent-tx list is live.

### 11. Campaigns — 🟡
- **BE:** `campaigns/*` real CRUD + analytics. **FE:** list/detail/create real, but `DEMO_BRAND_ID = 2222…` hardcoded on create.

### 12. Referrals — 🟡
- **BE:** `referrals/*` real. **FE:** `rewards/referrals/page.tsx` **fully mock** (hardcoded code `CRYPTO-2026-X8F`, fake referral list). → 🔴 disconnected on FE side.

### 13. Admin portal — 🔴 (LOCAL)
- **BE:** `admin/*` real (overview, list users/merchants/tx/rewards/logs, approve/reject). 🟠
- **FE (LOCAL):** `apps/admin` = 3-file stub ("Architecture shell only."). ❌
- `[MERGE]`: PayEra adds full 10-page portal — but ⚠️ **auto mock-login makes anyone ADMIN**, no route guards.

### 14. ZebPay — 🔴 → removal
- `apps/api/src/zebpay/*` returns `mock_zebpay_token`; `app/api/zebpay/callback/route.ts` ignores backend response, always redirects success. Profile points at `mock.zebpay.com`.
- **Decision:** drop in merge (Decentro replaces it). Preserved in history at `6c3c3ee`.

### 15. AML — ❌ (LOCAL) / `[MERGE]` PayEra adds
- `GET /aml/screen` (JWT-guarded, mock default) + admin AML page — PayEra only.

### 16. Decentro UPI settlement — ❌ (LOCAL) / `[MERGE]` PayEra adds real
- `settlement/settlement.service.ts` — Decentro OAuth, `initiateUpiPayout`, `checkPayoutStatus`, mock-mode if creds unset. Schema adds `settlementReference` + `DECENTRO` rail.

### 17. Trust / privacy (GDPR export/delete) — 🔴
- **BE:** `users` export/delete endpoints real. **FE:** `profile/trust/page.tsx` reads JWT from `localStorage.getItem("accessToken")` but token lives under Zustand key `payra-auth-storage` → **always null → unauthenticated 401**. Real defect, both branches.

### 18. App lock — 🟡
- `lib/appAuth.ts` + `AppLock.tsx` — WebAuthn/PIN, SHA-256 w/ static salt `payra-salt-2026`, 3-attempt lockout. Client-side convenience only, not server-verified. `PaymentConfirm` auto-confirms if no lock set up.

### 19. Profile — 🔵
- `profile/page.tsx` — hardcoded "Demo User", demo email, ZebPay "Not connected". Logout clears only `currentUser`, not tokens.

---

## Cross-cutting: backend capabilities NOT exposed in frontend (LOCAL)
- Admin API (full) — no functional FE (#13).
- Referrals API — FE is mock (#12).
- Analytics endpoints — fetched but unused; UI shows hardcoded values (#10).
- `POST /transactions/:id/cancel` and `/fail` — ~no dedicated FE control verified.

## Cross-cutting: frontend without real backend support
- Profile page, referrals page, merchant KPI cards — render demo/hardcoded data.
- Topbar bell (`alert`), sidebar logout (no onClick), history filter tabs, various search/export buttons — non-functional.

## Broken / incomplete user flows
1. **Trust export/delete** — unauthenticated due to token-key bug (#17).
2. **ZebPay linking** — stub end-to-end (#14).
3. **Admin (LOCAL)** — no usable UI (#13).
4. **KYC enforcement** — bypassable at API layer (#6).

## Top risks (security ⚠️)
- JWT fallback secret hardcoded; `JWT_SECRET` absent from env examples.
- No KYC/AML gate on payment API endpoints.
- `[MERGE]` PayEra admin: unauthenticated (mock-login) — must add real auth before deploy.
- KYC webhook non-constant-time HMAC compare.
- App-lock is client-side only.

---
*Companion to `10-master-context.md`. For citations and full narrative see `00`–`09`.*
