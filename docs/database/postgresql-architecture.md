# CryptoPay Network PostgreSQL Architecture

Source: CryptoPay Network Master PRD supplied in the project thread.

The production schema is defined in:

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/sql/postgres_constraints.sql`

## ERD

```mermaid
erDiagram
  USERS ||--o{ WALLETS : owns
  USERS ||--o{ MERCHANTS : owns
  USERS ||--o{ BRANDS : owns
  USERS ||--o{ TRANSACTIONS : initiates
  USERS ||--o{ REWARDS : earns
  USERS ||--o{ REFERRALS : invites
  USERS ||--o| REFERRALS : "is invited"
  USERS ||--o{ ADMIN_LOGS : acts
  USERS ||--o{ API_IDEMPOTENCY_KEYS : scopes

  MERCHANTS ||--o{ MERCHANT_QR_CODES : issues
  MERCHANTS ||--o{ TRANSACTIONS : receives
  MERCHANTS ||--o{ SETTLEMENT_INSTRUCTIONS : settles
  MERCHANTS ||--o{ CAMPAIGN_MERCHANTS : participates

  BRANDS ||--o{ CAMPAIGNS : funds
  CAMPAIGNS ||--o{ CAMPAIGN_MERCHANTS : includes
  CAMPAIGNS ||--o{ TRANSACTIONS : attributes
  CAMPAIGNS ||--o{ REWARDS : funds

  WALLETS ||--o{ TRANSACTIONS : pays
  MERCHANT_QR_CODES ||--o{ TRANSACTIONS : scanned
  TRANSACTIONS ||--o{ TRANSACTION_EVENTS : records
  TRANSACTIONS ||--o| SETTLEMENT_INSTRUCTIONS : produces
  TRANSACTIONS ||--o{ REWARDS : earns
  TRANSACTIONS ||--o| REFERRALS : qualifies
  REFERRALS ||--o| REWARDS : creates

  USERS {
    uuid id PK
    varchar email_normalized UK
    varchar phone_e164 UK
    enum role
    enum status
    varchar referral_code UK
    timestamptz created_at
  }

  WALLETS {
    uuid id PK
    uuid user_id FK
    enum provider
    enum network
    varchar address_normalized
    enum status
    boolean is_primary
  }

  MERCHANTS {
    uuid id PK
    uuid owner_user_id FK
    varchar merchant_code UK
    varchar default_upi_vpa UK
    enum status
    enum risk_level
  }

  MERCHANT_QR_CODES {
    uuid id PK
    uuid merchant_id FK
    varchar upi_vpa
    text qr_payload
    varchar qr_payload_hash UK
    boolean is_active
  }

  BRANDS {
    uuid id PK
    uuid owner_user_id FK
    varchar slug UK
    enum status
  }

  CAMPAIGNS {
    uuid id PK
    uuid brand_id FK
    enum status
    bigint threshold_amount_paise
    bigint reward_amount_star
    bigint budget_star
    bigint spent_star
  }

  CAMPAIGN_MERCHANTS {
    uuid campaign_id PK,FK
    uuid merchant_id PK,FK
    boolean is_active
  }

  TRANSACTIONS {
    uuid id PK
    varchar public_id UK
    uuid user_id FK
    uuid wallet_id FK
    uuid merchant_id FK
    enum status
    enum asset_in
    bigint amount_in_paise
    decimal amount_in_crypto
    decimal usdc_amount
    varchar stellar_transaction_hash UK
  }

  TRANSACTION_EVENTS {
    uuid id PK
    uuid transaction_id FK
    int sequence
    varchar event_type
    json payload
  }

  SETTLEMENT_INSTRUCTIONS {
    uuid id PK
    uuid transaction_id UK,FK
    uuid merchant_id FK
    bigint amount_paise
    enum status
    varchar mock_reference UK
  }

  REWARDS {
    uuid id PK
    uuid user_id FK
    uuid transaction_id FK
    uuid campaign_id FK
    uuid referral_id UK,FK
    enum reason
    enum status
    bigint star_amount
    varchar stellar_mint_hash UK
  }

  REFERRALS {
    uuid id PK
    uuid inviter_user_id FK
    uuid invited_user_id UK,FK
    varchar code UK
    enum status
    uuid first_transaction_id UK,FK
  }

  ADMIN_LOGS {
    uuid id PK
    uuid actor_user_id FK
    varchar action
    varchar target_type
    varchar target_id
    json before_state
    json after_state
  }

  API_IDEMPOTENCY_KEYS {
    uuid id PK
    uuid user_id FK
    varchar scope
    varchar key
    varchar request_hash
    timestamptz expires_at
  }

  OUTBOX_EVENTS {
    uuid id PK
    varchar aggregate_type
    varchar aggregate_id
    varchar event_type
    enum status
    timestamptz available_at
  }
```

## Core Schema Decisions

- Money is stored in integer minor units: INR values use `*_paise` as `BigInt`.
- Crypto and USDC values use `Decimal(36, 18)` to preserve on-chain precision.
- Public transaction references are separate from UUID primary keys through `transactions.public_id`.
- External financial integrations remain mocked through `UPI_MOCK`, mock settlement references, and metadata snapshots.
- Transaction state changes are append-only in `transaction_events`.
- Async side effects use `outbox_events` so payment, reward, and settlement workers can process reliably.
- Write APIs can use `api_idempotency_keys` to prevent duplicate payment creation.

## Prisma-Level Constraints

- Primary keys on every table use UUIDs.
- Natural uniqueness:
  - `users.email_normalized`
  - `users.phone_e164`
  - `users.referral_code`
  - `wallets.network + wallets.address_normalized`
  - `merchants.merchant_code`
  - `merchants.default_upi_vpa`
  - `merchant_qr_codes.qr_payload_hash`
  - `brands.slug`
  - `transactions.public_id`
  - `transactions.stellar_transaction_hash`
  - `settlement_instructions.transaction_id`
  - `settlement_instructions.mock_reference`
  - `rewards.referral_id`
  - `rewards.stellar_mint_hash`
  - `referrals.code`
  - `referrals.invited_user_id`
  - `referrals.first_transaction_id`
  - `api_idempotency_keys.scope + api_idempotency_keys.key`
- Composite identity:
  - `campaign_merchants.campaign_id + merchant_id`
  - `transaction_events.transaction_id + sequence`
- Referential actions:
  - user deletion cascades wallets
  - merchant deletion cascades QR codes and campaign links
  - transaction deletion cascades transaction events and settlement instruction
  - historical financial records use `Restrict` or `SetNull` to avoid accidental loss

## PostgreSQL Hardening Constraints

Defined in `apps/api/prisma/sql/postgres_constraints.sql`:

- one active primary wallet per user
- positive INR, STAR, crypto, USDC, and settlement amounts
- campaign `spent_star <= budget_star`
- non-negative outbox retry attempts
- GIN indexes for JSON metadata/outbox payload search

## Index Strategy

High-cardinality read paths:

- user transaction history: `transactions(user_id, created_at)`
- merchant revenue dashboard: `transactions(merchant_id, created_at)`
- admin transaction monitoring: `transactions(status, created_at)`
- asset/status monitoring: `transactions(asset_in, status)`
- campaign analytics: `transactions(campaign_id, created_at)`
- merchant QR lookup: `merchant_qr_codes(qr_payload_hash)`
- rewards wallet: `rewards(user_id, status, created_at)`
- campaign reward spend: `rewards(campaign_id, created_at)`
- settlement worker queue: `settlement_instructions(status, created_at)`
- outbox worker queue: `outbox_events(status, available_at)`
- admin audit: `admin_logs(target_type, target_id, created_at)`

## Scale Plan

Initial MVP can run on a single PostgreSQL primary with read replicas. For growth:

- partition `transactions`, `transaction_events`, `rewards`, `admin_logs`, and `outbox_events` monthly by `created_at`
- keep indexes local to partitions for high-volume tables
- move analytical dashboards to read replicas or materialized views
- archive old `transaction_events` and `admin_logs` to cold storage after retention windows
- keep idempotency records short-lived with scheduled expiry cleanup
- use transactionally written `outbox_events` instead of direct side effects inside API requests

## PRD Table Coverage

- Users: `users`
- Wallets: `wallets`
- Merchants: `merchants`, `merchant_qr_codes`
- Transactions: `transactions`, `transaction_events`, `settlement_instructions`
- Rewards: `rewards`
- Campaigns: `brands`, `campaigns`, `campaign_merchants`
- Referrals: `referrals`
- AdminLogs: `admin_logs`
