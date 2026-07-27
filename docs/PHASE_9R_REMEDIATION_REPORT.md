# Phase 9-R — MoneyGram Ramps Remediation Report

**Date:** 2026-07-22
**Scope:** Close the integration, security, migration, and validation gaps left open by Phase 9.
**Constraints honored:** No new features. No Soroban contract logic touched. Provider-agnostic
architecture preserved. No production credentials. No fabricated APIs/endpoints/workflows.

All code-level checks are green:

| Check | Result |
|---|---|
| API ramp test suites | ✅ 4 suites / **19 tests** pass (was 12) |
| API `tsc --noEmit` | ✅ clean |
| SDK `tsc --noEmit` | ✅ clean |
| Web `tsc --noEmit` | ✅ clean |
| Web R1 unit tests (`node --test`) | ✅ **6 tests** pass |

---

## Coverage table — Phase-9 requirement → status → proof

| Item | Requirement | Status | Proving test / evidence |
|---|---|---|---|
| **R1** | QR/pay ↔ ramps integration | **Implemented** | `apps/web/src/lib/topup.test.ts` (6 tests): sufficient/exact/insufficient balance, zero-quote, missing-balance, provider-agnostic query. Pay page routes to shared on-ramp entry point on shortfall. |
| **R2** | KYC gate on ramp initiation (server-side) | **Implemented** | `apps/api/src/ramps/ramps.service.spec.ts`: blocks `NONE`/`PENDING`/`REJECTED` (no record created), allows `VERIFIED`. |
| **R3** | Ramp history on a user surface (read-only) | **Implemented** | `apps/web/src/app/wallet/activity/page.tsx` reads `cryptoPaySdk.ramps.history()`; linked from profile. Web `tsc` clean = render-tree types valid. |
| **R4** | Rate limiting on ramp endpoints | **Implemented** | `apps/api/src/ramps/ramps.controller.throttle.spec.ts` (3 tests): 6th call past the 5/min limit throws `ThrottlerException`; per-client isolation; off-ramp also limited. |
| **R5** | Dependency vulnerability scan + triage | **Implemented (triaged)** | `npm audit --omit=dev` triage table below. No safely-applicable fix exists (all are major/breaking); accepted-risk notes recorded. |
| **R6** | Regenerate migration via `prisma migrate dev` + diff | **Externally blocked** | `prisma migrate status` → `P1010`; `psql` confirms role `cryptopay` **does not exist** in local Postgres. No DB with shadow-database privileges reachable. Hand-written SQL is **NOT** declared validated. |
| **R7** | Honest live-sandbox status | **Stated** | See "Sandbox validation status" — mocked-SEP passes are explicitly separated from real-MoneyGram-sandbox (which is blocked on KYB/DocuSign). |

---

## R1 — QR payment ↔ ramps integration (Implemented)

**Design decision (with justification):** QR-pay and ramps are integrated at a single, decoupled
seam. When the payment quote's required asset amount exceeds the user's live on-chain balance, the
pay flow surfaces a **top-up (on-ramp) entry point**. The pay page **never names a provider** — it
only routes to the shared on-ramp flow, which resolves a provider through the ramps **registry**
(`cryptoPaySdk.ramps.listProviders()` → first provider whose `supportsOnRamp` is true). This
satisfies "surface an on-ramp entry point without coupling the pay flow to any specific provider."

**Changes**
- `apps/web/src/lib/topup.ts` — pure, testable decision logic (`computeTopUp`, `buildTopUpQuery`).
  Deliberately provider-agnostic: computes *whether/how much* to top up, never *which* provider.
- `apps/web/src/app/pay/page.tsx` — QUOTE step now detects insufficient balance and shows a
  "Top up" CTA (instead of "Confirm Payment") that routes to `/wallet/onramp?topup=<shortfall>&returnTo=/pay`.
- `apps/web/src/app/wallet/onramp/page.tsx` — **removed the hardcoded `providerId: 'MONEYGRAM'`**;
  now resolves an on-ramp-capable provider from the registry. Reads `topup`/`returnTo` from the query.

**Fail-before/pass-after:** before this change the pay page had no insufficient-balance handling at
all; `computeTopUp` did not exist. The 6 tests pin the new behavior, including asserting the
generated query contains no provider name.

## R2 — KYC gate (Implemented)

**Change:** `RampsService.assertKycVerified(userId)` runs at the top of both `initiateOnRamp` and
`initiateOffRamp`, **before any `RampTransaction` row is created**, so a blocked attempt leaves no
orphaned record. It calls `KycService.getStatus(userId)` (server-side; never trusts the client) and
throws `ForbiddenException` unless `kycStatus === VERIFIED`. The real enum is `NONE | PENDING |
VERIFIED | REJECTED`, so `NONE` (never started), `PENDING` (in review), and `REJECTED` are all
refused. `KycModule` now exports `KycService`; `RampsModule` imports `KycModule`.

**Fail-before/pass-after:** the service constructor gained a required `KycService` dependency and a
new gate; the 4 added tests fail against the pre-remediation service (no gate, no injected KYC).

## R3 — Ramp history surface (Implemented)

**Design decision:** ramp history (deposits/withdrawals) is distinct from payment history
(`/history`). The correct home is under the wallet area, at **`/wallet/activity`**
("Deposits & Withdrawals"), linked from the profile settings list. Rendered **read-only** through
`cryptoPaySdk.ramps.history()` — no new mutations. SDK now re-exports ramp types from the package
root (`RampStatus`, `RampType`, …) so the page and the onramp flow type-check.

**Sanity check:** web `tsc --noEmit` is clean, validating the page's render-tree types and the
profile edit.

## R4 — Rate limiting (Implemented)

`@nestjs/throttler` was already globally registered (100 req/min via `APP_GUARD`). Remediation adds
**tighter per-route limits** to the money-moving endpoints, mirroring the strict limits already used
on auth endpoints:

| Endpoint | Limit | Rationale |
|---|---|---|
| `POST /ramps/onramp` | **5 / min** | Initiation hits the anchor (SEP-10 + SEP-24); expensive & sensitive. |
| `POST /ramps/offramp` | **5 / min** | Same. |
| `GET /ramps/:id` | **30 / min** | Read-through triggers a provider poll; capped so a client can't hammer the anchor. |

**Fail-before/pass-after:** the test drives the **real** `ThrottlerGuard` against the **real**
controller handler with real in-memory storage — 5 calls pass, the 6th throws `ThrottlerException`.
Before the `@Throttle` decorator the 6th call was allowed.

## R5 — Dependency vulnerability scan (Implemented — triaged, accepted risk)

`npm audit --omit=dev` (production deps), 16 findings (0 critical / 9 high / 6 moderate / 1 low).
Ramps-path reachability assessed by inspecting the ramps module's external imports.

| Package | Sev | Reachable from ramps? | Decision |
|---|---|---|---|
| `next` (+ transitive `postcss`, `sharp`) | High/Mod | No — web build tooling, server-side only | **Accept.** Only fix is `next@9.3.3` — a catastrophic major **downgrade** that would break the entire Next 15 app. Track for a forward upgrade, not a downgrade. |
| `sharp` / libvips CVEs | High | No — image processing; not used by ramps | **Accept.** Bundled via `next`; same forced-downgrade blocker. |
| `@stellar/stellar-sdk` (>=15.0.1) & transitive `axios` | High | Partially — ramps uses `@stellar/stellar-sdk` (`Keypair`, `Transaction`, `Networks`) | **Accept (with note).** Ramps performs **all** HTTP via native `fetch`, **not axios**, so the axios advisory is not reachable through the ramps code path. The only offered fix is `stellar-sdk@15` (major, `isSemVerMajor`), which would break the wallet/contract integration. Requires a planned SDK upgrade. |
| `@stellar/typescript-wallet-sdk` | High | No — not imported by ramps | **Accept.** Fix is a major downgrade to 2.0.0. |
| `multer` (DoS) via `@nestjs/platform-express` | High | No | **Accept.** Grep confirms **no file uploads** anywhere in the API (`FileInterceptor`/`@UploadedFile`/`multer` unused); the DoS vectors are unreachable. Resolves on the next `@nestjs/platform-express` patch. |
| `@nestjs/swagger` → `js-yaml`, `fast-uri` | High/Mod | No | **Accept.** Swagger is docs-only (`/docs`); should be disabled in production. YAML/URI parsing not on the ramp request path. |
| `body-parser` (2.x) | Low | Indirect (express) | **Accept.** Low severity; resolves on express patch. |
| `hono`, `@hono/node-server`, `prisma`/`@prisma/dev` | Mod | No | **Accept.** Not on the ramps runtime path; `@prisma/dev` is tooling. |

**Why nothing was auto-fixed:** `npm audit fix` (non-force) dry-run resolves **zero** of these in
this hoisted workspace, and every remaining fix is flagged `isSemVerMajor` — i.e. a breaking
downgrade (`next@9`, `stellar-sdk@15`, `wallet-sdk@2`). Applying those during a remediation that
"does NOT add new features" and must keep the build green is not "safely fixable." **None are
reachable from the ramps code path in a way the ramp feature introduces** (ramps adds no file
upload, no axios call, no YAML parsing). Recommendation for a dedicated dependency-upgrade task:
forward-upgrade `@stellar/stellar-sdk`, `@nestjs/platform-express`, and `@nestjs/swagger` to patched
lines, and disable Swagger in production.

## R6 — Migration regeneration (Externally blocked)

`prisma migrate dev` / `prisma migrate status` fail with **`P1010: User was denied access`**. Direct
`psql` confirms the root cause: the configured role **`cryptopay` does not exist** in the local
Postgres instance (port 5432 is open, but the role/database/shadow-database are not provisioned).

Regenerating and diffing the migration requires a database with shadow-database privileges, which is
**not reachable in this environment** and would require creating DB roles/databases — provisioning I
am not authorized to perform here. Per the R6 instruction, this is marked **EXTERNALLY BLOCKED**.

**The hand-written `migrations/20260722000000_add_ramp_transaction/migration.sql` is therefore NOT
declared validated.** It matches the Prisma schema by inspection, but has not been round-tripped
through `prisma migrate dev` or applied via `prisma migrate deploy`. To clear this item: point
`DATABASE_URL` + `SHADOW_DATABASE_URL` at a Postgres where the app role exists with create-database
privileges, run `prisma migrate dev`, `diff` the generated SQL against the hand-written file
(keeping the generated one on divergence), then confirm `prisma migrate deploy` applies drift-free.

## R7 — Sandbox validation status (honest classification)

Two **different** claims, kept separate:

- ✅ **Passes against mocked SEP endpoints.** The MoneyGram provider's SEP-10 auth, SEP-24
  interactive initiation, and status parsing are unit-tested against a mocked `global.fetch`
  (`moneygram.provider.spec.ts`). This proves the adapter's request shaping and response mapping,
  **not** live interoperability.
- ⛔ **NOT validated against the real MoneyGram sandbox.** A live round-trip requires
  MoneyGram-registered/certified anchor credentials (KYB + DocuSign legal + integrated-wallet
  listing). This is **EXTERNALLY BLOCKED** on those credentials and was not attempted. No production
  credentials were used.

---

## Files changed in this remediation

**API**
- `apps/api/src/kyc/kyc.module.ts` — export `KycService`.
- `apps/api/src/ramps/ramps.module.ts` — import `KycModule`.
- `apps/api/src/ramps/ramps.service.ts` — inject `KycService`; `assertKycVerified` gate (R2).
- `apps/api/src/ramps/ramps.controller.ts` — per-route `@Throttle` limits (R4).
- `apps/api/src/ramps/ramps.service.spec.ts` — KYC-gate tests (R2).
- `apps/api/src/ramps/ramps.controller.throttle.spec.ts` — **new**, throttling tests (R4).

**SDK**
- `packages/sdk/src/index.ts` — re-export ramp types from package root (rebuilt to `dist`).

**Web**
- `apps/web/src/lib/topup.ts` — **new**, pure top-up decision logic (R1).
- `apps/web/src/lib/topup.test.ts` — **new**, R1 tests.
- `apps/web/src/app/pay/page.tsx` — insufficient-balance detection + provider-agnostic top-up CTA (R1).
- `apps/web/src/app/wallet/onramp/page.tsx` — registry-driven provider resolution + top-up prefill (R1).
- `apps/web/src/app/wallet/activity/page.tsx` — **new**, read-only ramp history (R3).
- `apps/web/src/app/profile/page.tsx` — link to the new activity surface (R3).
- `apps/web/package.json` — add `test` script (`node --import tsx --test`).

## Remaining risks / follow-ups

1. **R6 migration unverified** until a properly-privileged DB is available (blocker above).
2. **Live MoneyGram sandbox unverified** until KYB/DocuSign credentials exist (R7).
3. **Dependency upgrades** (`stellar-sdk`, `platform-express`, `swagger`; disable Swagger in prod)
   belong in a dedicated task — not force-applied here because every offered fix is a breaking
   major/downgrade (R5).
4. Next phase per plan: **Phase 10 — contract hardening** (not started; Soroban logic untouched here).
