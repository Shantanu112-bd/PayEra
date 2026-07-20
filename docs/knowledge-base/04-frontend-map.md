# 04 · Frontend Map (web + admin)

Two Next.js 15 App Router apps. React 19, Tailwind v4, Zustand (persist), TanStack Query v5,
shared `@cryptopay/sdk`. On-chain reads go direct to Horizon/Soroban via `lib/stellar|horizon|trustline`.

## apps/web (consumer + merchant PWA, :3000)

- **Auth flow:** Freighter connect → challenge/sign/login → JWT in Zustand (`payra-auth-storage`)
  → client-side `AppLock` (WebAuthn/PIN, salt `payra-salt-2026`) → KYC gate
  (KycOnboarding/KycPending). All gating is **client-side only** — no `middleware.ts`.
- **Core flow (identical both branches):** `/pay` scan→quote→processing→success, 2s poll / 60s
  timeout, KYC-gated. Hardcoded fallback merchant UUID `1111…1111` (testnet demo).
- **Real integrations:** wallet onramp/offramp (MoneyGram SEP-24, Freighter signing), campaigns,
  merchant transactions.
- **Confirmed mock/placeholder (LOCAL):** `profile` (Demo User, `mock.zebpay.com`), `rewards/
  referrals` (fully mock), merchant dashboard/analytics (fetch data but render hardcoded KPIs),
  3 conflicting `DEMO_USER_ID`/`BRAND_ID` UUIDs, non-functional filter tabs / search / export /
  logout / notification-bell buttons.
- **Real bug (both branches):** `profile/trust/page.tsx` reads `localStorage.getItem("accessToken")`
  but token persists under `payra-auth-storage` → export/delete calls sent unauthenticated (401).
- **PayEra-only:** `components/stellar/*`, error/loading/not-found boundaries, ~15 routes
  (wallet/manage, history/[id], merchant onboard/profile/qr-codes/settlements/webhooks,
  tax-report). `merchant/developers/webhooks` uses `MOCK_WEBHOOKS` + visible "MOCK DATA" banner.
- **LOCAL-only:** `app/api/zebpay/callback/route.ts` (only Next API route in either app).

## apps/admin (compliance portal, :3002)

- **LOCAL:** 3-file stub — `page.tsx` renders "Architecture shell only." No routes/data/auth.
- **PayEra:** full 10-page portal (overview, users, merchants + pending approval queue,
  transactions, rewards, audit logs, AML). All lists use real SDK calls.
  - ⚠ **No real auth:** `Providers.tsx` auto-runs `auth.mockLogin({admin@cryptopay.network, ADMIN})`
    when no token — anyone loading the app becomes ADMIN. No route guards. Backend must enforce.
  - Placeholders: merchant "KYC State" col hardcoded `-`; reject/suspend reasons hardcoded;
    AML page inconsistent dark theme.

## State / data

- Zustand persist key `payra-auth-storage` (partialize: tokens, user id/name, kycStatus).
  `isAppUnlocked` not persisted → re-lock each reload (intended).
- Response-shape drift: some pages read `.items`, others `.data` — PayEra's PaginationInterceptor
  (`items`→`data`) drove refactors in `4cfcb4d`/`947133c`/`9fde360`.

Full citations: `_scratch/kb-frontend.md`.
