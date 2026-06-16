# CryptoPay Network

Production-grade monorepo architecture for CryptoPay Network.

This repository is intentionally architecture-only at this stage. It defines
application, package, tooling, and Soroban contract boundaries without
implementing product features.

## Workspace Layout

```txt
apps/
  web/                  Consumer application shell
  api/                  NestJS API service shell
  admin/                Admin application shell
packages/
  ui/                   Shared UI package boundary
  types/                Shared TypeScript contracts
  sdk/                  Client SDK package boundary
contracts/
  star-token/           STAR token Soroban contract crate
  payment-engine/       Payment engine Soroban contract crate
  reward-engine/        Reward engine Soroban contract crate
  merchant-registry/    Merchant registry Soroban contract crate
tools/
  eslint-config/        Shared ESLint flat configs
  typescript-config/    Shared TypeScript configs
```

## Commands

```sh
npm run dev
npm run build
npm run lint
npm run typecheck
npm run format:check
npm run contracts:check
```

## Architecture Rules

- `apps/web` owns the consumer-facing payment application.
- `apps/admin` owns administrative operations.
- `apps/api` owns server-side orchestration and integrations.
- `packages/ui` owns reusable presentation primitives.
- `packages/types` owns shared TypeScript contracts.
- `packages/sdk` owns typed client access to platform APIs.
- `contracts/*` owns Soroban smart contract code.

## MVP Boundaries

The PRD limits MVP smart contracts to:

- STAR Token
- Merchant Registry
- Reward Engine
- Payment Engine

External financial systems, UPI settlement, anchors, KYC providers, and bridges
remain out of scope until later phases.

## Status

Architecture scaffold only. Feature implementation should be added in separate
workstreams after boundaries are reviewed.
