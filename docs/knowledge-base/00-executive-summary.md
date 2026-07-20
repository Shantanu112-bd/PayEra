# 00 · Executive Summary

## What Payra is

Payra (package namespace still `@cryptopay/*`) is a **crypto-to-UPI payment platform** built on
Stellar/Soroban. The core user story:

1. A consumer connects a Freighter wallet and completes KYC.
2. They scan a merchant's UPI QR code (`upi://pay?...`).
3. They pay in crypto (XLM/USDC); the app quotes INR↔crypto using live rates.
4. A **trusted backend operator** signs the on-chain payment and settles the merchant in INR
   (via UPI payout — Decentro on the PayEra branch; ZebPay stub on LOCAL).
5. The consumer earns **STAR** reward tokens minted on-chain (10 STAR per ₹100 spent).

The design is deliberately **operator-centric**: a consumer scanning a QR on a mobile browser
cannot sign a Soroban transaction in real time, so the NestJS backend holds a platform keypair
and signs the payment lifecycle on the payer's behalf.
(Source: `docs/CONTRACT_VERIFICATION_REPORT.md`; `contracts/payment-engine/src/lib.rs`.)

## Tech stack (verified)

| Layer | Technology | Evidence |
|---|---|---|
| Monorepo | Turborepo + npm workspaces | `turbo.json`, root `package.json` |
| Backend | NestJS, Prisma ORM, PostgreSQL | `apps/api/src/**`, `apps/api/prisma/schema.prisma` |
| Frontend | Next.js 15 (App Router), React 19, Tailwind v4 | `apps/web`, `apps/admin` |
| State | Zustand (persist) + TanStack Query v5 | `apps/web/src/lib/store.ts`, `query-client.ts` |
| Contracts | Rust / Soroban SDK, 4 contracts | `contracts/**/src/lib.rs` |
| Chain access | `stellar-sdk` v16, Horizon + Soroban RPC | `apps/api/src/stellar/*`, `apps/web/src/lib/stellar.ts` |
| Wallet | Freighter (SEP-53 signing) | `apps/web/src/components/providers/StellarWalletProvider.tsx` |
| Shared pkgs | `@cryptopay/sdk`, `/types`, `/ui` | `packages/**` |
| Deploy | Docker → Render; Vercel (web); CI via GitHub Actions | `Dockerfile`, `render.yaml`, `.github/workflows/` |

## Status at a glance

- **Contracts:** Most mature layer. 4 contracts, 21/21 tests passing (per report dated 2026-07-11,
  not re-run here). Full 4-contract integration test exists.
- **Backend:** Broad and largely real — 14–16 modules, live rate fetching, retry/backoff
  transaction processor, real on-chain STAR minting (LOCAL). Key gaps: no API-layer KYC/AML gate,
  hardcoded JWT fallback secrets, in-memory nonce cache.
- **Frontend (web):** Core pay flow is real; many surrounding pages carry hardcoded/mock data
  (merchant KPIs, referrals, profile). ZebPay linking (LOCAL) is a stub end-to-end.
- **Frontend (admin):** Stub on LOCAL; full portal on PayEra but with **mock auto-login as ADMIN**.
- **Integrations:** MoneyGram SEP-24 on/off-ramp (both); Decentro UPI settlement (PayEra, real);
  ZebPay (LOCAL, stub); KYCAID for KYC (both).

## The single most important fact for future work

There is **no clean "combine both repos" operation**. LOCAL and PayEra each hold unique, valuable
work. A reconciliation must: preserve LOCAL's uncommitted ZebPay + contract fixes, adopt PayEra's
frontend/AML/Decentro breadth, and hand-resolve 3 files changed on both sides. See
[02-branch-reconciliation.md](./02-branch-reconciliation.md).
