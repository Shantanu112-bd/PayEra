# Payra — Project Knowledge Base

> **Generated:** 2026-07-20 · **Method:** repository-wide analysis of two divergent branches
> (local working tree + `github.com/Shantanu112-bd/PayEra`), cross-referenced against source.
> Every claim is cited to a file path. Findings marked *inferred* were not directly verified.

Payra is a **crypto-to-UPI payment platform** on Stellar (Soroban). A consumer scans a UPI QR,
pays with crypto (XLM/USDC), a trusted backend operator settles the merchant in INR, and the
consumer earns on-chain **STAR** reward tokens.

## ⚠️ Read this first: there are two branches, not two apps

The "two repositories" are **divergent branches of one project** sharing a common ancestor at
commit `4f660de`. They must be *reconciled*, not blindly merged. See
[02-branch-reconciliation.md](./02-branch-reconciliation.md).

| | **LOCAL** (this working tree) | **PayEra** (cloned) |
|---|---|---|
| Commits ahead of `4f660de` | 1 committed + uncommitted work | 5 commits, +13,893 lines / 105 files |
| Off-ramp / settlement | **ZebPay** (stub) | **Decentro** UPI payout (real, mock-fallback) |
| On-chain reward minting | **Wired & working** (`soroban.service.issueStarReward`) | present |
| Admin portal | 3-file stub | Full 10-page portal (mock auth) |
| Frontend breadth | baseline | +15 web routes, `components/stellar/*`, error boundaries |
| AML screening | absent | `aml/` module + `/aml/screen` |
| Contract fee-burn | absent | `star-token` fee-burn feature |
| Contract TTL fixes | **applied** (uncommitted) | one TTL extend dropped (regression) |

**One-line summary of the fork:** LOCAL is the *ZebPay + contract-hardening* line; PayEra is the
*Decentro + frontend-parity + AML* line. Neither is a strict superset of the other.

## Index

| Doc | Contents |
|---|---|
| [00-executive-summary.md](./00-executive-summary.md) | What Payra is, tech stack, status at a glance |
| [01-system-architecture.md](./01-system-architecture.md) | System diagram, data flow, payment lifecycle |
| [02-branch-reconciliation.md](./02-branch-reconciliation.md) | LOCAL↔PayEra divergence, merge plan, conflict files |
| [03-backend.md](./03-backend.md) | NestJS module/service/controller map, API surface |
| [04-frontend.md](./04-frontend.md) | Next.js route + component map (web + admin) |
| [05-contracts.md](./05-contracts.md) | Soroban contracts, state machine, inter-contract calls |
| [06-data-and-integrations.md](./06-data-and-integrations.md) | Prisma schema, third-party integrations |
| [07-security.md](./07-security.md) | Auth model, security architecture, flagged risks |
| [08-status-gaps-risks.md](./08-status-gaps-risks.md) | Implementation status, mocks/stubs, tech debt, roadmap |
| `_scratch/` | Raw per-domain knowledge drops (detailed, cited) |

## Detailed Knowledge Drops

The `_scratch/` directory holds the raw domain analyses used to build this KB:
- `kb-backend-auth.md` — auth, JWT, KYC webhook, nonce replay
- `kb-backend-core.md` — transactions, processor, settlement, ramps, soroban service
- (contracts, frontend, platform drops were delivered inline and are folded into the docs above)

## Provenance & confidence

- **Verified** = a file was read or a diff/grep was run. Most claims here are verified.
- **Inferred** = deduced from naming/structure without direct execution (e.g. runtime behavior,
  test pass/fail not re-run this session). Marked inline.
- Test results (21/21 contract tests) come from `docs/CONTRACT_VERIFICATION_REPORT.md` dated
  2026-07-11 and were **not** re-executed in this analysis.
