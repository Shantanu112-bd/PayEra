# Knowledge Drop: Integrations

> The single most important reconciliation fact: **LOCAL and PAYERA took divergent integration paths for INR settlement.** LOCAL = ZebPay (stub). PAYERA = Decentro (real). Both share MoneyGram ramps + KYCAID.

## Integration inventory

| Integration | Purpose | LOCAL | PAYERA | Status |
|---|---|---|---|---|
| **Stellar / Soroban** | On-chain payments + STAR minting | ✅ | ✅ | Real (`soroban.service.ts issueStarReward` fully implemented) |
| **MoneyGram (SEP-10/24)** | USDC on/off-ramp | ✅ | ✅ | Real (`ramps.service.ts`) |
| **KYCAID** | KYC verification + webhook | ✅ | ✅ | Real; webhook HMAC uses `KYCAID_API_TOKEN` |
| **CoinGecko** | Live INR conversion rates | ✅ | ✅ | Real, with circuit breaker + static fallback |
| **Freighter** | Browser wallet signing | ✅ | ✅ | Real (challenge→sign→JWT) |
| **ZebPay** | INR off-ramp (OAuth) | ✅ stub | ❌ | **STUB** — returns `mock_zebpay_token`, no real token exchange |
| **Decentro** | UPI payout settlement | ❌ | ✅ | Real with mock fallback (`settlement.service.ts`) |
| **AML screening** | Wallet risk scoring | ❌ | ✅ | Mock default (`aml.service.ts`) |

## ZebPay (LOCAL only) — STUB

- `apps/api/src/zebpay/zebpay.service.ts`: `handleCallback` returns `{ status: 'success', token: 'mock_zebpay_token' }` with "implementation goes here" comment. `processWebhook` logs + returns `{ received: true }`.
- `apps/web/src/app/api/zebpay/callback/route.ts`: forwards `code`/`state` to backend but **ignores the response and always redirects to `/profile?zebpay=success`**.
- Profile page points at `https://mock.zebpay.com/oauth2/authorize` with `mock_client`.
- **Verdict:** scaffolding, not functional. Env vars: `ZEBPAY_CLIENT_ID`/`ZEBPAY_CLIENT_SECRET`.

## Decentro (PAYERA only) — REAL

- `apps/api/src/settlement/settlement.service.ts`: `DecentroConfig`, OAuth `getAccessToken`, `initiateUpiPayout`, `checkPayoutStatus`. Falls back to mock mode if creds unset (logs a warning).
- Env vars: `DECENTRO_CLIENT_ID`/`_SECRET`/`_MODULE_SECRET`/`_BASE_URL` (default `https://in.staging.decentro.tech`).
- Backed by `PaymentRail.DECENTRO` enum value + `settlementReference` field in Prisma (PAYERA schema).

## MoneyGram ramps (both)

- `apps/api/src/ramps/ramps.service.ts`: fetches `stellar.toml`, SEP-10 auth (signs challenge with platform key), SEP-24 deposit/withdraw.
- Frontend: `wallet/onramp` + `wallet/offramp` pages sign with Freighter.

## Reconciliation implication

The branches did not build the *same* feature two ways — they built *different* off-ramp providers. A merge should likely **keep both** (ZebPay + Decentro as selectable `PaymentRail` options) rather than discard either. ZebPay would need real implementation to be usable; Decentro is already functional.

## Related files

- `apps/api/src/{zebpay,settlement,ramps,aml}/`
- `apps/web/src/app/api/zebpay/callback/route.ts`, `apps/web/src/app/wallet/{onramp,offramp}/page.tsx`
- `apps/api/.env.example` (both variants)
