# Knowledge Drop: Security Architecture

> Source: backend-auth agent (`_scratch/kb-backend-auth.md`) + frontend agents + direct reads. Findings are marked VERIFIED where confirmed by file read/grep.

## Authentication model

**Wallet-based login (both branches, byte-identical):**
1. Client requests challenge: `POST /auth/wallet/challenge` → server issues nonce.
2. Freighter signs the challenge message.
3. `POST /auth/wallet/login` verifies signature → issues JWT (access + refresh).

The verifier is the "ultimate robust" SEP-53 implementation (`auth.service.ts`) trying raw/prefixed/SHA-256 payloads across LF/CRLF and hex/base64 framings via `Keypair.verify`. History: commits `4a2d8fb`, `47a1c2b`, `df8d77a`.

**Nonce replay protection:** genuine single-use (cache `"issued"`, deleted on login, 5-min TTL) — but **in-memory only**, so it weakens under horizontal scaling. History: commit `f0b7819`.

## Critical security findings

| # | Severity | Finding | Location | Status |
|---|---|---|---|---|
| 1 | **Critical** | JWT secrets fall back to hardcoded `"fallback_secret"` / `"fallback_refresh_secret"` if env unset; `JWT_SECRET` absent from env examples | `auth` module | VERIFIED, both branches |
| 2 | **High** | No KYC/AML gating on transaction/payment endpoints (API layer) — enforcement is client-side only | grep-confirmed zero enforcement | VERIFIED, both branches |
| 3 | **High** | `JwtStrategy.validate` does no DB lookup → suspended/deleted users keep access until token expiry | `auth/jwt.strategy.ts` | VERIFIED, both branches |
| 4 | **High** | PAYERA admin portal has **no real auth** — auto `mockLogin({email:"admin@cryptopay.network", role:"ADMIN"})`, no route guards | `apps/admin/src/components/providers/Providers.tsx` | VERIFIED, PAYERA only |
| 5 | **Medium** | `profile/trust` reads JWT from wrong localStorage key (`accessToken` vs Zustand `payra-auth-storage`) → unauthenticated export/delete requests | `apps/web/src/app/profile/trust/page.tsx` | VERIFIED, both branches |
| 6 | **Medium** | KYC webhook HMAC uses non-constant-time `!==` comparison | `kyc` module | VERIFIED |
| 7 | **Medium** | Nonce replay cache in-memory only | `auth.service.ts` | VERIFIED |
| 8 | **Medium** | `POST /auth/wallet/login` is the only auth route without throttling; error messages leak expected-message/signature detail | `auth` | VERIFIED |
| 9 | **Low** | Client-side-only biometric/PIN gate with static salt `payra-salt-2026` — device convenience, bypassable, not server auth | `apps/web/src/lib/appAuth.ts` | VERIFIED |
| 10 | **Low** | JWT stored in localStorage (XSS-exposed) | web + admin | VERIFIED |

## PAYERA-only security additions

- `GET /aml/screen` (JWT-guarded) — wallet screening (mock default).
- `GET /kyc/status`.
- Refresh-token reuse detection (revokes all sessions on reuse).
- `ConfigModule` + `PaginationInterceptor`.

## Authorization

- Backend: role-based via JWT `role` claim + guards.
- Frontend: **no server-side route protection** in either app — gates (AppLock, KYC) are client-only. Sidebar chooses merchant vs consumer nav purely by `pathname.startsWith("/merchant")` — no role check.

## Priority remediation (for MVP hardening)

1. Fail-fast on missing `JWT_SECRET` (remove fallback secrets); add to env examples.
2. Add KYC/AML guard to transaction/payment controllers (backend).
3. Add DB lookup (or revocation list) to `JwtStrategy.validate`.
4. Replace PAYERA admin mock-login with real authenticated flow before any deploy.
5. Fix `profile/trust` token key.

## Related files

- `apps/api/src/auth/{auth.service.ts,jwt.strategy.ts}`, `apps/api/src/kyc/`, `apps/api/src/aml/`
- `apps/admin/src/components/providers/Providers.tsx`
- `apps/web/src/lib/{appAuth.ts,store.ts}`, `apps/web/src/app/profile/trust/page.tsx`
