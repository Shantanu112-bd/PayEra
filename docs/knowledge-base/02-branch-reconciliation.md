# 02 · Branch Reconciliation (LOCAL ↔ PayEra)

> **Critical framing:** these are **two branches of one project**, not two apps.
> Common ancestor (merge-base): commit `4f660de` (*fix(soroban): stellar-sdk v16 rpc import*).
> Verified via `git merge-base local-main payera/main`.

## Divergence at a glance

| | **LOCAL (your working copy)** | **PayEra (github Shantanu112-bd/PayEra)** |
|---|---|---|
| Commits ahead of base | 1 committed + large uncommitted set | 5 commits, +13,893 / −558 lines, 105 files |
| Theme | ZebPay off-ramp + on-chain reward minting + contract fixes | Frontend parity + Decentro UPI + AML + compliance |
| Admin portal | 3-file stub ("Architecture shell only.") | Full 10-page portal |
| Off-ramp/settlement | ZebPay (**stub**) | Decentro UPI payout (**real**, mock fallback) |
| transaction-processor | Advanced: retry+backoff, on-chain STAR mint | Baseline |
| Contracts | TTL-extend + operator-auth fixes (uncommitted) | Fee-burn feature; dropped 1 TTL extend (regression) |
| Error boundaries | none | error/loading/not-found.tsx |

## What lives ONLY in LOCAL (must be preserved on any merge)

**Committed:**
- `5b6bc8e` dashboard 3-zone refactor — `apps/web/src/app/dashboard/page.tsx`

**Uncommitted (working tree — HIGH RISK of loss on merge):**
- `apps/api/src/zebpay/` — module/service/controller. **STUB** — `handleCallback` returns
  `{ token: 'mock_zebpay_token' }`, `processWebhook` logs only. No real OAuth exchange.
- `apps/web/src/app/api/zebpay/callback/route.ts` — **STUB** — ignores backend response,
  always redirects `/profile?zebpay=success`.
- `apps/api/src/transaction-processor/transaction-processor.service.ts` (+87 lines) —
  **REAL, most valuable local work**: `processTransactionWithRetry` (3 attempts, backoff),
  on-chain STAR minting via `SorobanService.issueStarReward`, graceful mint-failure handling.
- Contract edits (all 4 `contracts/*/src/lib.rs`): TTL `extend_ttl` after every persistent
  `set()`, and `create_payment` auth `payer.require_auth()` → `require_operator()`. Documented
  in `docs/CONTRACT_VERIFICATION_REPORT.md` (21/21 tests pass at 2026-07-11).
- `apps/web/src/app/profile/page.tsx` — ZebPay linking UI (points at `mock.zebpay.com`).
- `apps/api/.env.example` — `ZEBPAY_CLIENT_ID/SECRET`.
- `docs/CONTRACT_VERIFICATION_REPORT.md`, `.claude/`.

## What lives ONLY in PayEra

- **Admin:** 10 pages (users, merchants+approval queue, transactions, rewards, logs, AML),
  AdminShell, Providers (⚠ auto `mockLogin` as ADMIN), store, query-client.
- **Web:** ~15 routes (wallet/manage, history/[id], merchant onboard/profile/qr-codes/
  settlements/developers/webhooks/campaigns edit, transactions/tax-report, rewards/referrals),
  `error.tsx`/`loading.tsx`/`not-found.tsx`, `components/stellar/*`.
- **Backend:** `aml/` (screen wallet, mock default), `settlement/` (Decentro UPI payout),
  `stellar/stellar.controller.ts`, `common/interceptors/pagination.interceptor.ts`,
  `GET /kyc/status`, refresh-token reuse detection, `ConfigModule`.
- **Contracts:** star-token fee-burn (`FeeBurnConfig`, `set/get_fee_burn_config`, `burn_fee`).
- **Shared:** SDK `aml/` + `stellar/` modules, `ui/Pagination.tsx`, `DECENTRO` enum,
  `settlementReference` on `SettlementInstruction` (Prisma).
- **Docs:** `IMPLEMENTATION_AUDIT.md`, `FRONTEND_AUDIT_REPORT.md` (+ .pdf), `apps/api/api.log`.

## Files changed on BOTH sides → genuine merge conflicts

| File | LOCAL change | PayEra change |
|---|---|---|
| `apps/web/src/app/dashboard/page.tsx` | 3-zone layout refactor | reward shape `totalStarAmount`→`RewardsBalance`, pagination |
| `apps/api/src/transaction-processor/transaction-processor.service.ts` | +87 on-chain minting | baseline pagination-era edits |
| `contracts/*/src/lib.rs` | TTL + operator-auth | fee-burn; key-inlining |
| `apps/api/.env.example` | ZebPay vars | Decentro/MoneyGram vars |
| `apps/web/src/app/profile/page.tsx` | ZebPay UI | profile refactor |

## Recommended reconciliation (NOT yet executed — analysis only)

User chose **"Analyze only, no merge yet"** + **"Git stash"** for preservation.
When ready to merge, the safe sequence is:

1. `git stash push -u` (or commit to a `wip/zebpay-contracts` branch) — preserve uncommitted work.
2. Adopt PayEra `main` as the base (it is strictly ahead in breadth).
3. Replay LOCAL-unique work on top: zebpay module, transaction-processor minting, contract fixes.
4. Hand-resolve the 5 conflict files above.
5. Prisma: generate a migration for `DECENTRO` + `settlementReference` (+ any LOCAL additions).
6. Decide ZebPay vs Decentro as the off-ramp (see risks) — do not ship both half-wired.
7. Re-run: `cargo test` (contracts, expect 21), `turbo build`, the 2 API specs.

**Blocking decision for the user:** ZebPay (LOCAL, stub) vs Decentro (PayEra, real) as the
INR settlement rail. They target the same role and should not coexist half-implemented.
