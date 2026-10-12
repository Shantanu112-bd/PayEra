<div align="center">

# PayEra Network

**Enterprise-grade, non-custodial crypto-to-fiat payment and settlement rail built on the Stellar network.**

[![CI/CD Pipeline](https://img.shields.io/github/actions/workflow/status/Shantanu112-bd/start-up-track/ci.yml?branch=main&label=CI%2FCD&style=flat-square&logo=githubactions&logoColor=white)](https://github.com/Shantanu112-bd/start-up-track/actions)
[![Stellar Network](https://img.shields.io/badge/Stellar-Testnet%20%7C%20Mainnet-08B5E5?style=flat-square&logo=stellar&logoColor=white)](https://stellar.org)
[![Soroban SDK](https://img.shields.io/badge/Soroban%20SDK-v26.1.0-7D52FF?style=flat-square&logo=rust&logoColor=white)](https://soroban.stellar.org)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.19-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/NestJS-11.0.0-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Prisma ORM](https://img.shields.io/badge/Prisma-7.8.0-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 1. Executive Summary & System Overview

### The Problem
Traditional crypto payment flows suffer from prohibitive friction: prolonged block confirmation latencies, high gas fees, lack of merchant point-of-sale infrastructure, and the absence of direct off-ramping into domestic fiat rails. Conversely, traditional international and cross-border settlement rails impose significant interchange markups, high foreign exchange fees, and multi-day settlement windows.

### The Solution: PayEra Rail
**PayEra** is a high-throughput, non-custodial payment protocol and settlement rail engineered on top of the **Stellar Network** and **Soroban Smart Contracts**. PayEra allows consumers to pay using digital assets (USDC, XLM, BTC, ETH, SOL) directly at merchant point-of-sale locations or online payment gateways, while merchants receive deterministic, real-time fiat payouts (such as INR via UPI/IMPS rails or physical cash pickup via MoneyGram Access).

```
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────────┐
│  Consumer dApp  │ ────► │  PayEra Core Engine  │ ────► │ Real-Time Fiat Rail │
│ (USDC/XLM/Web3) │       │ (Soroban + Stellar)  │       │ (UPI / MoneyGram)   │
└─────────────────┘       └──────────────────────┘       └─────────────────────┘
```

### Architectural Tenets
- **Non-Custodial Escrow & Settlement**: Payer funds are transferred directly from user-controlled keypairs using cryptographic authorization (SEP-10 challenge-response and Freighter wallet signing) or dedicated smart-contract escrow.
- **Oracle-Free FX Architecture**: Foreign exchange quoting and crypto-to-fiat pricing are computed off-chain through transparent, provider-agnostic quoting engines with signed quote bounds, avoiding brittle and front-runnable on-chain price oracles.
- **Deterministic Transaction State Machine**: Payment states transition through strict forward-only stages (`CREATED` → `QUOTED` → `AUTHORIZED` → `CONVERTING` → `ROUTING_STELLAR` → `SETTLING` → `REWARDING` → `COMPLETED`), guarded by atomic database locks, outbox patterns, and on-chain contract assertions.
- **Dual-Layer Resilience**: Distributed background processors utilize atomic lock claiming, exponential backoff with jitter, and Cockatiel circuit breakers to guarantee zero double-spends and reliable payout delivery.
- **Decentralized Loyalty Protocol**: Native STAR token minted via the Soroban `RewardEngine` delivers gas rebates and volume-based loyalty incentives on-chain directly to consumer wallets.

---

## 2. Key Capabilities & Feature Matrix

| Capability | Technical Realization | Production Benefit |
| :--- | :--- | :--- |
| **Multi-Asset Settlement** | Supports USDC, XLM, and wrapped cross-chain assets (BTC, ETH, SOL) with automatic path-payment routing on Stellar. | Users pay with any liquid asset; merchants receive local fiat or stablecoins. |
| **Micro-Second Dynamic Quotes** | Real-time exchange rate feed with configurable slippage buffers, fee breakdown, and guaranteed quote TTL. | Eliminates consumer FX risk between scan and confirmation. |
| **Direct-to-Bank Fiat Payouts** | Integrated with Decentro banking APIs for sub-second UPI VPA and IMPS/NEFT bank settlements with UTR tracking. | Merchants receive immediate working capital directly in their local bank accounts. |
| **Global Cash Ramps (SEP-24)** | Provider-agnostic ramp abstraction layer with MoneyGram Access integration for retail cash-in/cash-out. | Extends protocol utility to underbanked demographics across 180+ countries. |
| **On-Chain Merchant Identity** | Soroban `MerchantRegistry` mapping cryptographically hashed UPI/tax IDs and metadata to Stellar accounts. | Tamper-proof merchant verification and permissioned payment processing. |
| **Programmable Rewards Engine** | Soroban `StarToken` & `RewardEngine` contracts granting deflationary STAR loyalty tokens with burn-on-transfer. | Incentivizes transaction volume while ensuring verifiable token supply caps. |
| **Enterprise Security Posture** | Stellar SEP-10 wallet challenge-response authentication, JWT refresh rotation with family-reuse revocation, and KYCAID/AML gates. | Protects against replay attacks, unauthorized payouts, and regulatory non-compliance. |

---

## 3. End-to-End Architecture & Transaction Lifecycle

The sequence diagram below illustrates the complete lifecycle of a PayEra transaction: from QR scanning and SEP-10 authentication to on-chain Soroban state tracking, Stellar network payment routing, fiat banking settlement, and STAR reward minting.

```mermaid
sequenceDiagram
    autonumber
    actor Consumer as Consumer (Freighter Wallet)
    participant Web as PayEra Web (Next.js)
    participant API as PayEra API (NestJS Gateway)
    participant Processor as Transaction Processor (Cron Engine)
    participant Soroban as Soroban Contracts (Payment & Reward Engine)
    participant Stellar as Stellar Network (Horizon / Core)
    participant Decentro as Fiat Rail (Decentro UPI / Bank)
    actor Merchant as Merchant Bank / Terminal

    %% Auth & Quote
    Consumer->>Web: Scan Merchant QR / Enter UPI ID
    Web->>API: POST /transactions/create (merchantId, amountInPaise)
    API-->>Web: Return Transaction Quote (USDC/XLM required, rate, TTL)
    Consumer->>Web: Confirm Payment (Freighter sign transaction / SEP-10)
    Web->>API: POST /transactions/authorize (signature, walletAddress)
    API-->>Web: Status: AUTHORIZED (Queued)

    %% Background Processing Pipeline
    Note over Processor,API: Processor claims pending AUTHORIZED transaction
    Processor->>Soroban: create_payment(paymentId, payer, merchant, asset)
    Soroban-->>Processor: Payment Recorded (Status: Created)
    Processor->>Soroban: quote_payment(paymentId, assetAmount, usdcAmount)
    Soroban-->>Processor: Status: Quoted

    %% Conversion & Stellar Settlement
    Processor->>Soroban: mark_converted(paymentId)
    Processor->>Stellar: Submit Payment Tx (USDC / XLM path payment)
    Stellar-->>Processor: Tx Confirmed (Hash, Ledger Sequence)
    Processor->>Soroban: mark_settled(paymentId)

    %% Fiat Payout
    Processor->>Decentro: POST /v2/payments/upi/payout (VPA, amount, refId)
    Decentro->>Merchant: Payout Dispatched (IMPS / UPI Rail)
    Decentro-->>Processor: Payout Confirmed (UTR Number)

    %% Reward Issuance & Finalization
    Processor->>Soroban: issue_spend_reward(rewardId, payer, starAmount)
    Soroban->>Soroban: StarToken.mint_from_minter(payer, starAmount)
    Processor->>Soroban: complete_payment(paymentId)
    Soroban-->>Processor: Status: Completed

    %% Real-time update
    API-->>Web: WebSocket / Polling: COMPLETED (TxHash, UTR, RewardBalance)
    Web-->>Consumer: Payment Receipt & STAR Reward Credited
```

---

## 4. Technology Stack Breakdown

| Domain | Layer / Framework | Version | Purpose & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Smart Contracts** | **Soroban SDK (Rust)** | `26.1.0` | High-performance WebAssembly smart contracts on Stellar. State storage, access control, and token logic. |
| **Blockchain Client** | **@stellar/stellar-sdk** | `16.0.1` | Horizon API client, transaction envelope construction, and Soroban RPC bridge. |
| **Wallet Protocol** | **@stellar/freighter-api** | `6.0.1` | Non-custodial browser wallet connector supporting SEP-10 challenge signing. |
| **Ramp Integration** | **@stellar/typescript-wallet-sdk** | `3.0.1` | SEP-24 (Interactive Anchor) implementation for MoneyGram deposit/withdrawal flows. |
| **Backend Framework** | **NestJS Core & Express** | `11.0.0` | Modular backend architecture, dependency injection, role-based guards, and microservices. |
| **Database & ORM** | **Prisma ORM & PostgreSQL** | `7.8.0` / `16+` | Type-safe persistence layer with connection pooling, migrations, and transactional isolation. |
| **Resilience & Queue** | **Cockatiel & @nestjs/schedule** | `4.0.0` | Circuit breaker policies, backoff retries, and atomic cron execution for asynchronous pipelines. |
| **Frontend Framework** | **Next.js (App Router)** | `15.5.19` | Turbopack-powered SSR & client components for consumer, admin, and marketing applications. |
| **UI & Animation** | **React 19 & Tailwind CSS v4** | `19.1.0` / `4.0` | Design system primitives using Radix UI, Framer Motion, GSAP, and Three.js 3D visualizers. |
| **State Management** | **Zustand & TanStack Query** | `5.0` / `5.101` | Global client store and optimistic asynchronous server-state cache. |
| **Testing Engine** | **Cargo Test, Jest, Node Test** | Latest | 68 Rust contract unit/invariant tests, Jest API suites, and native Node test runner for web. |
| **Monorepo Manager** | **Turborepo** | `2.6.3` | High-efficiency pipeline orchestration, build caching, and workspace graph management. |

---

## 5. Repository & Directory Structure

```txt
PayEra/
├── apps/
│   ├── web/                        # Consumer payment web application (Next.js 15, React 19)
│   │   ├── src/app/
│   │   │   ├── pay/                # QR scan, quote review, biometric confirmation, top-up
│   │   │   ├── wallet/             # Balance cards, activity history, and MoneyGram on-ramp
│   │   │   ├── merchant/           # Merchant onboarding, dynamic QR generation, terminal
│   │   │   ├── rewards/            # STAR balance tracker, referral hub, campaign tiers
│   │   │   └── kyc/                # KYCAID verification and status monitoring
│   │   └── src/lib/                # Freighter wallet provider, client stores, top-up resolver
│   ├── admin/                      # Operational back-office portal (Next.js 15)
│   │   ├── src/app/merchants/      # Merchant verification, status transitions, review
│   │   ├── src/app/transactions/   # Live payment monitor, dispute handling, ledger audit
│   │   ├── src/app/aml/            # Sanctions screening, risk scores, flagged accounts
│   │   └── src/app/rewards/        # Campaign configuration and STAR allocation rules
│   ├── web-landing/                # High-fidelity 3D marketing application (Three.js, GSAP)
│   └── api/                        # NestJS enterprise backend API gateway
│       ├── prisma/                 # PostgreSQL schema, migrations, and seed scripts
│       └── src/
│           ├── auth/               # SEP-10 challenge generator, verification, JWT rotation
│           ├── stellar/            # StellarService (Horizon) and SorobanService (RPC/Contracts)
│           ├── transaction-processor/ # 5-second atomic cron worker with backoff & retry
│           ├── transactions/       # Transaction creation, quoting, authorization endpoints
│           ├── ramps/              # Provider-agnostic fiat ramp engine (MoneyGram SEP-24)
│           ├── settlement/         # Decentro payout rail service (UPI/IMPS bank transfers)
│           ├── kyc/                # KYCAID webhook ingestion and status synchronization
│           ├── aml/                # Chainalysis / TRM Labs transaction screening integration
│           └── merchants/          # Merchant registry synchronization and QR management
├── contracts/                      # Soroban Rust smart contract crates (SDK v26.1.0)
│   ├── payment-engine/             # Multi-asset lifecycle, state machine, quote validation
│   ├── merchant-registry/          # Merchant approval lifecycle, UPI hash registry
│   ├── reward-engine/              # Idempotent spend/referral STAR minting engine
│   └── star-token/                 # SEP-41 compliant token with supply cap and fee burn
├── packages/
│   ├── sdk/                        # Isomorphic TypeScript SDK client for API consumption
│   ├── types/                      # Shared TypeScript contracts and Prisma enum mirrors
│   └── ui/                         # Shared presentation component system (Radix UI, Tailwind)
├── tools/
│   ├── eslint-config/              # Shared ESLint 9 configuration
│   └── typescript-config/          # Shared tsconfig compiler presets
├── .github/workflows/
│   ├── ci.yml                      # CI matrix: Postgres 16 service, build, test, typecheck
│   └── deploy.yml                  # Automated webhook deployments (Railway & Vercel)
├── Cargo.toml                      # Cargo workspace configuration for Soroban contracts
├── turbo.json                      # Turborepo task definitions and dependency graphs
└── package.json                    # Workspace root manifest
```

---

## 6. Smart Contracts Architecture & Specifications

The protocol's on-chain trust boundary consists of four Soroban smart contracts compiled to WebAssembly:

```
                      ┌──────────────────────┐
                      │  Merchant Registry   │
                      │  (Approval Status)   │
                      └──────────┬───────────┘
                                 │ verifies approval
                                 ▼
┌──────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
│  Star Token  │ ◄────┤    Reward Engine     │ ◄────┤    Payment Engine    │
│  (Mint/Burn) │ mints│  (Spend & Referral)  │calls │  (Payment Lifecycle) │
└──────────────┘      └──────────────────────┘      └──────────────────────┘
```

### 1. `payment-engine`
* **File**: [`contracts/payment-engine/src/lib.rs`](file:///Users/macbook/Documents/Payra/contracts/payment-engine/src/lib.rs)
* **Function**: Orchestrates the core payment state machine.
* **State Machine**:
  `Created (1)` → `Quoted (2)` → `Converted (3)` → `Settled (4)` → `Rewarded (5)` → `Completed (6)` (or `Failed (7)` / `Cancelled (8)`).
* **Guarantees**:
  - Validates that the merchant is active and approved in `merchant-registry`.
  - Non-custodial cancellation: Payer can cancel a transaction at any time before it enters the `Converted` phase.
  - Instance TTL bump: Automatically bumps contract storage TTL to prevent ledger expiration.
  - Two-step administrative transfer pattern with pending admin handoff.

### 2. `merchant-registry`
* **File**: [`contracts/merchant-registry/src/lib.rs`](file:///Users/macbook/Documents/Payra/contracts/merchant-registry/src/lib.rs)
* **Function**: Maintains the on-chain status of approved merchants.
* **Fields**: `merchant_id: BytesN<32>`, `owner: Address`, `upi_id_hash: BytesN<32>`, `metadata_hash: BytesN<32>`, `status: MerchantStatus`.
* **Statuses**: `Pending (1)` → `Approved (2)` ⇄ `Suspended (3)` / `Rejected (4)`.
* **Heartbeat**: Permissionless `heartbeat()` method allowing any node to maintain instance TTL without admin keys.

### 3. `reward-engine`
* **File**: [`contracts/reward-engine/src/lib.rs`](file:///Users/macbook/Documents/Payra/contracts/reward-engine/src/lib.rs)
* **Function**: Manages deterministic loyalty rewards for platform spending and referrals.
* **Reward Formula**: Default 10 STAR tokens per 100 INR (10,000 paise) spent; 100 STAR tokens per verified referral.
* **Idempotency**: Every reward issuance requires a unique `reward_id: BytesN<32>` to prevent duplicate minting.

### 4. `star-token`
* **File**: [`contracts/star-token/src/lib.rs`](file:///Users/macbook/Documents/Payra/contracts/star-token/src/lib.rs)
* **Function**: SEP-41 compatible utility and governance token.
* **Parameters**: Decimals: `0`, Configurable max supply cap (`max_supply: i128`).
* **Fee Burn Mechanism**: Built-in `FeeBurnConfig` allowing a percentage of transfer amounts (in basis points) to be burned from circulation, creating a deflationary supply sink.

---

## 7. Prerequisites & Environment Configuration

### System Prerequisites
Ensure the following tools are installed in your development environment:
* **Node.js**: `v20.19.0` or higher (LTS recommended)
* **npm**: `v11.4.2` or higher (monorepo package manager)
* **Rust**: `1.75.0` or higher with `wasm32-unknown-unknown` target
* **Stellar CLI**: `v22.0.0` or higher (`cargo install --locked stellar-cli`)
* **PostgreSQL**: `v16.0` or higher
* **Docker & Docker Compose**: (Optional, for containerized local services)

### Environment Mapping Reference (`.env`)

Copy the configuration template to `.env`:
```bash
cp .env.example .env
```

| Environment Variable | Description | Example / Default |
| :--- | :--- | :--- |
| **DATABASE_URL** | PostgreSQL connection string used by Prisma ORM | `postgresql://payra:payra@localhost:5432/payra?schema=public` |
| **PORT** | Port for the NestJS API server | `4000` |
| **NODE_ENV** | Server runtime environment (`development`, `production`, `test`) | `development` |
| **JWT_SECRET** | Cryptographic key used to sign access tokens (15m validity) | `change_this_to_a_secure_256bit_key` |
| **JWT_REFRESH_SECRET** | Cryptographic key used to sign refresh tokens (7d validity) | `change_this_to_another_secure_key` |
| **JWT_EXPIRES_IN** | Expiry window for access tokens in seconds | `86400` |
| **PLATFORM_STELLAR_SECRET_KEY** | Operational keypair secret driving Soroban contracts | `SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |
| **STELLAR_NETWORK** | Target Stellar network (`testnet` or `mainnet`) | `testnet` |
| **STELLAR_HORIZON_URL** | Horizon API endpoint for ledger queries & path payments | `https://horizon-testnet.stellar.org` |
| **STELLAR_SOROBAN_RPC_URL** | Soroban RPC endpoint for contract simulations & execution | `https://soroban-testnet.stellar.org` |
| **STAR_CONTRACT_ADDRESS** | Deployed StarToken contract address (C...) | `CD7LZ3UFV7Z6RMFJZT3G24HNDGB2D7F3H7YOTM35OIMDBIHF7XY3O6A4` |
| **REWARD_ENGINE_CONTRACT_ADDRESS** | Deployed RewardEngine contract address (C...) | `CC...` |
| **PAYMENT_ENGINE_CONTRACT_ADDRESS** | Deployed PaymentEngine contract address (C...) | `CCY2RUZ2F3O7YZVOWEWYR6H5335O2SQU6O3ZTYGMFK6X2X2YFTDOPM4I` |
| **MERCHANT_REGISTRY_CONTRACT_ADDRESS**| Deployed MerchantRegistry contract address (C...) | `CA...` |
| **DECENTRO_CLIENT_ID** | Decentro API client identifier for domestic fiat payouts | `sandbox_decentro_client_id` |
| **DECENTRO_CLIENT_SECRET** | Decentro API client secret | `sandbox_decentro_client_secret` |
| **DECENTRO_MODULE_SECRET** | Decentro collections / payouts module key | `sandbox_module_secret` |
| **DECENTRO_BASE_URL** | Decentro gateway URL | `https://in.staging.decentro.tech` |
| **MONEYGRAM_HOME_DOMAIN** | MoneyGram Anchor home domain (SEP-24 / SEP-38) | `testanchor.stellar.org` |
| **MONEYGRAM_RAMPS_ENVIRONMENT** | MoneyGram integration mode (`testnet` / `mainnet`) | `testnet` |
| **KYCAID_API_TOKEN** | KYCAID platform token for customer verification | `sandbox_kycaid_token` |
| **KYCAID_FORM_ID** | Form template ID for hosted KYC onboarding verification | `sandbox_form_id` |
| **AML_PROVIDER** | Anti-money laundering provider (`chainalysis`, `trm`, or `mock`)| `mock` |
| **CHAINALYSIS_API_KEY** | Chainalysis Oracle / API token | `optional_key` |
| **TRM_API_KEY** | TRM Labs screening engine API key | `optional_key` |
| **ALLOWED_ORIGINS** | CORS allowed origin list (comma-separated) | `http://localhost:3000,http://localhost:3001` |
| **NEXT_PUBLIC_API_URL** | API gateway URL accessed by Next.js clients | `http://localhost:4000` |
| **NEXT_PUBLIC_STELLAR_NETWORK** | Target network exposed to the frontend | `testnet` |
| **NEXT_PUBLIC_DEMO_MODE** | Mock simulation mode for offline testnet evaluation | `false` |
| **NEXT_PUBLIC_USDC_ISSUER** | Stellar public key of the approved USDC asset issuer | `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |

---

## 8. Local Development & Deployment Guide

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/Shantanu112-bd/start-up-track.git payera
cd payera

# Install root, workspace packages, and tooling dependencies
npm install
```

### Step 2: Database Provisioning & Client Generation
Start a local PostgreSQL instance (or supply an external connection string in `.env`):
```bash
# Optional: Run local Postgres with Docker
docker run --name payera-postgres -e POSTGRES_USER=payra -e POSTGRES_PASSWORD=payra -e POSTGRES_DB=payra -p 5432:5432 -d postgres:16

# Generate Prisma client and run migrations
cd apps/api
npx prisma generate
npx prisma migrate dev --name init

# (Optional) Seed test data
npx prisma db seed
cd ../..
```

### Step 3: Compile & Validate Smart Contracts
```bash
# Add the wasm32 compilation target
rustup target add wasm32-unknown-unknown

# Check contracts syntax and compilation across the workspace
npm run contracts:check

# Execute Soroban contract test suites (68 unit & invariant tests)
cargo test --workspace
```

### Step 4: Run the Development Environment
Start all monorepo applications concurrently via Turborepo:
```bash
npm run dev
```

The services will initialize on the following endpoints:
* **Consumer App (`apps/web`)**: [http://localhost:3000](http://localhost:3000)
* **Admin Portal (`apps/admin`)**: [http://localhost:3001](http://localhost:3001)
* **Landing Page (`apps/web-landing`)**: [http://localhost:3100](http://localhost:3100)
* **Backend API (`apps/api`)**: [http://localhost:4000](http://localhost:4000)
* **Swagger API Documentation**: [http://localhost:4000/api](http://localhost:4000/api)

---

## 9. Verification & Testing Regimes

PayEra enforces strict automated testing at all tiers of the architecture:

```bash
# 1. Run all Rust Soroban contract test suites
cargo test --workspace

# 2. Run API unit and integration tests (NestJS + Jest)
npm test --workspace=apps/api

# 3. Run Web application unit tests (Node test runner)
npm test --workspace=apps/web

# 4. Monorepo TypeScript static analysis
npm run typecheck

# 5. Monorepo code style and formatting audit
npm run lint
npm run format:check
```

### Production Artifact Build
```bash
npm run build
```

---

## 10. Security, Compliance & Resiliency Posture

### Cryptographic Identity & SEP-10 Authentication
- PayEra authenticates client requests using **Stellar SEP-10 (Web Authentication)**. The server emits an ephemeral challenge transaction cryptographically bounded by sequence numbers and timebounds.
- The client signs the challenge using their private key in Freighter. The API verifies the cryptographic signature against the public account before issuing a short-lived JSON Web Token (JWT).
- Access tokens expire in 15 minutes. Refresh tokens are stored in the database with one-way SHA-256 hashes, implementing **Token Rotation** and **Family Reuse Detection**: if a used refresh token is presented, the entire token family is immediately revoked to neutralize token theft.

### Anti-Tamper Transactions & Idempotency
- Every payment request generates a deterministic `payment_id` and binds an SHA-256 hash of the merchant's point-of-sale QR payload (`qrPayloadHash`).
- Smart contract invocations enforce nonces and unique payment identifiers; attempts to replay or re-quote an existing payment are aborted at the Soroban virtual machine level.

### Regulatory Compliance & KYC/AML Gates
- **KYC Enforcement**: Server-side guards prevent unverified accounts from initiating on-ramp or off-ramp transactions (`KycStatus !== 'VERIFIED'`).
- **AML Screening**: Transactions undergo real-time heuristic risk scoring and external sanctions screening (OFAC, UN, EU watchlists) via Chainalysis and TRM Labs integrations. High-risk wallets are quarantined before settlement execution.

### Fault Tolerance & Circuit Breaker Architecture
- Integration endpoints to Horizon RPC, Decentro banking, and MoneyGram anchors are wrapped with **Cockatiel Circuit Breakers**.
- Transient network failures automatically trigger exponential backoff retry schedules (immediate, +2s, +8s) before falling back to manual reconciliation logs.

---

## 11. Contributing & Development Workflow

Contributions to PayEra must comply with enterprise Web3 software practices:

### Branching Strategy
* `main`: Production-ready, verified code. Protected branch.
* `develop`: Integration staging branch.
* `feature/<feature-name>`: Scoped feature development branches.
* `fix/<bug-name>`: Targeted bug and security fixes.

### Conventional Commit Standard
All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
* `feat(protocol)`: New feature or contract integration
* `fix(processor)`: Bug fix in transaction or settlement pipeline
* `test(contracts)`: Add or modify test fixtures
* `docs(readme)`: Documentation and architectural updates
* `refactor(web)`: Structural code modifications without logic changes

---

## 12. License & Legal Disclaimer

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

> **Disclaimer**: *PayEra is non-custodial financial infrastructure. Digital asset interactions involve financial risks. Smart contracts deployed to public networks should undergo independent professional security audits prior to mainnet capital allocation.*
