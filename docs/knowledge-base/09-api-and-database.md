# Knowledge Drop — API & Database Reference

> Part of the Payra Knowledge Base. See [README](./README.md) for the index.
> **Verification basis:** `apps/api/prisma/schema.prisma`, `apps/api/src/**/*.controller.ts` (both LOCAL and PayEra copies), read directly on 2026-07-20.

---

## 1. API surface overview

**84 route handlers** across **16 controllers** (LOCAL). PayEra adds 2 more controllers (`aml`, `stellar`), so the merged surface is 18 controllers.

Global prefix: `/api/v1` (set in `apps/api/src/main.ts`). All routes below are relative to that prefix.

### Controllers (LOCAL — verified via `@Controller(...)` decorators)

| Prefix | Controller | Purpose |
|---|---|---|
| `auth` | `auth.controller.ts` | Wallet challenge/login, refresh, current user |
| `users` | `users.controller.ts` | Profile, activate/suspend/soft-delete, GDPR export/delete |
| `wallets` | `wallets.controller.ts` | Wallet CRUD, primary selection |
| `merchants` | `merchants.controller.ts` | Merchant onboarding, QR codes, dashboard metrics, transactions |
| `transactions` | `transactions.controller.ts` | Quote, create, list, get, cancel, fail |
| `rewards` | `rewards.controller.ts` | Reward balance, list |
| `referrals` | `referrals.controller.ts` | Referral codes, claims |
| `campaigns` | `campaigns.controller.ts` | Campaign CRUD, analytics, lifecycle |
| `kyc` | `kyc.controller.ts` | KYC start, webhook, (PayEra: status) |
| `ramps` | `ramps.controller.ts` | MoneyGram SEP-10/SEP-24 on/off-ramp |
| `admin` | `admin.controller.ts` | Overview, list users/merchants/tx/rewards/logs, approvals |
| `analytics` | `analytics.controller.ts` | Consumer/merchant metrics |
| `health` | `health.controller.ts` | Liveness |
| `zebpay` | `zebpay.controller.ts` | **LOCAL only** — ZebPay callback/webhook (STUB) |
| — `aml` | `aml.controller.ts` | **PayEra only** — `GET /aml/screen` wallet screening |
| — `stellar` | `stellar.controller.ts` | **PayEra only** — on-chain balance/merchant-status reads |

### Key transaction routes (verified `transactions.controller.ts`)

```
POST /api/v1/transactions/quote      → price a payment (no persistence)
POST /api/v1/transactions            → create transaction (status=CREATED)
GET  /api/v1/transactions            → list (access-scoped)
GET  /api/v1/transactions/:id        → get one
POST /api/v1/transactions/:id/cancel → cancel before conversion
POST /api/v1/transactions/:id/fail   → mark failed
```

### Ramps routes (verified `ramps.controller.ts`)

```
POST /api/v1/ramps/authenticate      → SEP-10 auth with MoneyGram
POST /api/v1/ramps/deposit           → SEP-24 interactive deposit (on-ramp)
POST /api/v1/ramps/withdraw          → SEP-24 interactive withdrawal (off-ramp)
GET  /api/v1/ramps/transaction/:id   → poll anchor transaction status
```

> **Full per-route enumeration** was not exhaustively transcribed for all 84 handlers. The controllers above are cited from direct reads; a complete OpenAPI dump can be generated from the running app's Swagger endpoint (the app uses `@nestjs/swagger` decorators — `@ApiTags`, `@ApiOperation` seen in `zebpay.controller.ts`). This is the recommended way to produce authoritative API docs. **Not independently verified: the exact request/response DTO shape of every route.**

---

## 2. Database schema

**Source:** `apps/api/prisma/schema.prisma`. Prisma ORM. **15 models, 21 enums.**

### Models

| Model | Purpose |
|---|---|
| `User` | Account, role (CONSUMER/MERCHANT/ADMIN), KYC status |
| `Wallet` | Stellar wallets; `isPrimary`, `status`, `provider`, `network` |
| `Merchant` | Merchant record; `status` (PENDING→APPROVED/…), settlement config, `defaultUpiVpa` |
| `MerchantQrCode` | Per-merchant QR codes with `upiVpa`, `qrPayloadHash`, `isActive` |
| `Brand` | Brand grouping for campaigns |
| `Campaign` | Reward campaigns; status lifecycle, reward type |
| `CampaignMerchant` | Join table: campaigns ↔ merchants |
| `Transaction` | Core payment record; full status machine, amounts, hashes |
| `TransactionEvent` | Append-only event log per transaction (`sequence`, `status`, `payload`) |
| `SettlementInstruction` | Off-chain INR settlement record; `status`, references |
| `Reward` | STAR reward; `status` (PENDING→MINTED/FAILED), `stellarMintHash` |
| `Referral` | Referral relationships and status |
| `AdminLog` | Audit trail (`actorUserId`, `action`, `targetType`, `targetId`, `metadata`) |
| `ApiIdempotencyKey` | Idempotency key storage |
| `OutboxEvent` | Transactional outbox pattern (`status`) |

### Enums (21)

`UserRole`, `UserStatus`, `WalletProvider`, `WalletNetwork`, `WalletStatus`, `MerchantStatus`, `BrandStatus`, `RiskLevel`, `CampaignStatus`, `CampaignRewardType`, `TransactionStatus`, `TransactionType`, `PaymentRail`, `SettlementLayer`, `AssetCode`, `SettlementStatus`, `RewardReason`, `RewardStatus`, `ReferralStatus`, `OutboxStatus`, `KycStatus`.

### LOCAL ↔ PayEra schema divergence (verified diff)

Only **2 substantive changes** in PayEra vs LOCAL:

1. **`DECENTRO` added to `PaymentRail`** enum — supports the Decentro UPI settlement path.
2. **`settlementReference` field added to `SettlementInstruction`** — stores the Decentro payout reference.

> **Merge implication:** adopting PayEra's schema requires a Prisma migration. These two additions are additive and low-risk, but a migration file must be generated (`prisma migrate dev`) — neither branch currently commits migration files for this delta (the `prisma/` dir contains `schema.prisma`; migration history was not verified present).

---

## 3. Notable data-flow facts (verified)

- **`Transaction` → `TransactionEvent`** is append-only with a monotonic `sequence` per transaction (see `transaction-processor.service.ts` `logEvent`, which aggregates `_max.sequence` then increments).
- **`Reward.status`** transitions `PENDING → MINTED` (on-chain success or DB-only no-wallet case) or `→ FAILED` (on-chain mint error). Verified in LOCAL `transaction-processor.service.ts`.
- **`SettlementInstruction.status`** transitions to `CONFIRMED` with a `mockReference` (LOCAL) — PayEra's `settlement.service.ts` replaces the mock with a real Decentro payout reference.
- **`AdminLog`** is written on transaction create/complete and admin actions — the primary audit mechanism.

---

## 4. What could not be verified

- Exact request/response DTOs for all 84 routes (recommend Swagger export from running app).
- Presence/absence of committed Prisma **migration files** (only `schema.prisma` was confirmed).
- Database indexes and constraints beyond model/enum names (schema body not fully transcribed here).
- Whether `ApiIdempotencyKey` and `OutboxEvent` are actively used or scaffolding (models exist; usage not traced end-to-end).
