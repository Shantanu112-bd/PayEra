# Implementation Status, Known Limitations & Technical Debt

> Consolidated from all five domain drops. Each item cites evidence. "VERIFIED" = confirmed by direct read/grep; "INFERRED" = reasoned from evidence but not directly executed.

## Current implementation status

### Working / real (VERIFIED)

- **Soroban contracts** — 4 contracts, 21/21 tests pass (per `CONTRACT_VERIFICATION_REPORT.md`, 2026-07-11). TTL + operator-auth fixes applied in LOCAL uncommitted edits.
- **On-chain STAR minting** — `soroban.service.ts issueStarReward` fully implemented (build→simulate→assemble→sign→submit→poll). LOCAL.
- **Transaction processor** — `transaction-processor.service.ts` (LOCAL): atomic claim, retry w/ exponential backoff (3 attempts), on-chain minting wired in, graceful degradation on mint failure.
- **Wallet auth** — Freighter challenge→sign→JWT (both branches).
- **MoneyGram ramps** — SEP-10/24 on/off-ramp (both).
- **KYCAID KYC** — start + webhook (both).
- **CoinGecko live rates** — with circuit breaker + static fallback (both).
- **Decentro UPI settlement** — real, mock fallback (PAYERA only).
- **Consumer web flow** — scan→quote→pay→success (both, byte-identical core).
- **PAYERA admin portal** — 10 functional pages wired to real SDK calls (data real; auth mocked).

### Stubbed / mock (VERIFIED)

- **ZebPay** (LOCAL) — service returns `mock_zebpay_token`; callback route ignores backend response. Not functional.
- **AML screening** (PAYERA) — mock default.
- **Merchant dashboard/analytics** (both web) — fetch data but render hardcoded KPIs (₹2.4M etc.); fetched values unused.
- **PAYERA `merchant/developers/webhooks`** — `MOCK_WEBHOOKS` with on-page "MOCK DATA" banner.
- **Profile page** (LOCAL) — hardcoded "Demo User", mock ZebPay linking.
- **rewards/referrals** (LOCAL) — entirely mock.

## Known limitations

1. **Admin auth is fake** (PAYERA) — mock-login, no guards. Blocks production.
2. **No API-layer KYC/AML gate** — client-side only (both).
3. **JWT fallback secrets** — hardcoded defaults if env unset (both).
4. **In-memory nonce cache** — breaks horizontal scaling (both).
5. **No on-chain price oracle** — operator-supplied rates trusted.
6. **Thin test coverage** — only 2 API specs (`auth.service.spec.ts`, `transactions.service.spec.ts`); CI runs `--passWithNoTests`; no shared-package tests.
7. **No server-side route protection** on either frontend.
8. **LOCAL admin is a 3-file stub** — no functionality.
9. **Response-shape inconsistency** (`.items` vs `.data`) across web pages — PAYERA's pagination interceptor addressed this; LOCAL partially.
10. **Package naming** — still `@cryptopay/*` despite "Payra" branding.

## Technical debt

- **Two divergent integration paths** (ZebPay vs Decentro) that must be reconciled, not blindly merged (see `02-branch-reconciliation.md`).
- **Duplicate components** (PAYERA): `layout/AppLock.tsx` == `auth/AppLock.tsx`; `layout/DemoTour.tsx` diverges from root `DemoTour`. Double-mount risk.
- **Three conflicting hardcoded UUIDs** (`DEMO_USER_ID`/`BRAND_ID`) across rewards, rewards/analytics, campaigns/create.
- **Non-functional UI** across many pages: history filter tabs, search boxes, merchant Filter/Export, Sidebar logout, Topbar bell, dashboard ADD USDC/CASH OUT, rewards Copy Link.
- **Theme inconsistency** — several pages dark-themed vs light "paper" theme.
- **`star-token.is_authorized` defaults true** — allowlist behaves as blocklist.
- **PAYERA dropped a TTL extend** in `payment-engine set_admin` — regression vs LOCAL.
- **`apps/api/api.log`** (5299 lines) committed in PAYERA — should be gitignored.

## Future extension points

- Real ZebPay OAuth implementation (if keeping that rail).
- On-chain price oracle to remove operator trust.
- Persistent (Redis) nonce + rate-limit store for horizontal scale.
- Real admin authentication + RBAC guards.
- Expand test coverage beyond 2 specs; wire contracts tests into CI.
- Server-side middleware for route protection.

## Distinguishing verified vs inferred history

**VERIFIED (git log, both repos):** shared ancestor `4f660de`; LOCAL added `5b6bc8e` (dashboard 3-zone) + uncommitted zebpay/contracts/processor work; PAYERA added 5 commits including two `feat: complete frontend parity` + P0 fixes (`947133c`).

**INFERRED:** that PAYERA's later `947133c` fixed some of the P0 bugs its own `IMPLEMENTATION_AUDIT.md` (2026-07-17) flagged — the audit is a snapshot and may overstate current defects. Verify against current PAYERA code before acting on the audit.
