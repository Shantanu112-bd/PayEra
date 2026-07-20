# Knowledge Drop: Soroban Smart Contracts

> Source: contracts agent (`_scratch/kb-contracts.md`) + direct reads. Cites files in both LOCAL (`/Users/macbook/Documents/Payra`) and PAYERA clone (`/tmp/payera-analysis`).

## Purpose

Four Soroban (Stellar smart contract platform) contracts implement the on-chain layer of a crypto-to-UPI payment + rewards system on **Stellar Testnet**.

## Architecture

| Contract | Path | Role |
|---|---|---|
| `merchant-registry` | `contracts/merchant-registry/src/lib.rs` | Merchant records + approval status; `is_approved` gate |
| `payment-engine` | `contracts/payment-engine/src/lib.rs` | Orchestrator; linear payment state machine |
| `reward-engine` | `contracts/reward-engine/src/lib.rs` | Computes + issues STAR spend rewards |
| `star-token` | `contracts/star-token/src/lib.rs` | STAR fungible token (0 decimals, capped supply) |

### Payment state machine (payment-engine)

```
Created → Quoted → Converted → Settled → Rewarded → Completed
```

Cross-contract calls via typed `#[contractclient]`:
- payment-engine → `merchant-registry.is_approved`
- payment-engine → `reward-engine.issue_spend_reward`
- reward-engine → `star-token.mint_from_minter`

### Design: operator-centric auth

A consumer scanning a QR code cannot sign a Soroban transaction from a mobile browser in real time. So the **operator backend (NestJS) holds the signing key** and creates on-chain records on the payer's behalf. This is why `create_payment` requires `require_operator()` rather than `payer.require_auth()` (documented in `docs/CONTRACT_VERIFICATION_REPORT.md`, 2026-07-11).

## Reward economics

- 10 STAR per ₹100 spent (spend reward)
- Flat 100 STAR for referrals
- STAR: 0 decimals, capped supply, admin + minter controls

## Current implementation

- Verification report (2026-07-11): **all 4 contracts compile clean, 21/21 tests pass**, including `integrates_all_four_contracts` end-to-end test.
- LOCAL's uncommitted contract edits apply two fixes:
  1. **TTL extension** after every `persistent().set()` — `extend_ttl(&key, 100, 518400)` (~30 days), preventing ~7-day archival of balances/approvals/payments.
  2. **Auth model correction** — `create_payment` from `payer.require_auth()` → `require_operator()`.

## LOCAL ↔ PAYERA divergence

- **PAYERA adds a fee-burn feature to star-token** (`FeeBurnConfig`, `set_fee_burn_config`/`get_fee_burn_config`/`burn_fee`; basis-points fee transferred then burned). Absent in LOCAL.
- **PAYERA dropped one TTL extend** in `payment-engine set_admin` — a likely regression relative to LOCAL's TTL fix.
- Other diffs are cosmetic key-inlining.
- `test_snapshots` exist in LOCAL only (not in the PAYERA clone).

## Risks

- `star-token.is_authorized` **defaults to true** → the "allowlist" effectively behaves as a blocklist (VERIFIED, flag for review).
- **No on-chain price oracle** — full trust in operator-supplied conversion figures.
- Operator-key centralization: compromise of the platform key = full control of payment creation + minting.
- Unused `RewardKind::Merchant` variant.

## Related files

- `contracts/*/src/lib.rs` (4 contracts)
- `docs/CONTRACT_VERIFICATION_REPORT.md` (LOCAL only, uncommitted)
- `apps/api/src/stellar/soroban.service.ts` (off-chain caller)
- `apps/api/.env.example` (testnet contract addresses)
