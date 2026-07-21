# Payra — Mobile-First UI Blueprint & Frontend Design Specification

> **Purpose:** Complete Figma-ready blueprint for a brand-new **mobile-first** UI.
> **Scope:** Analysis + specification **only**. No application code was modified to produce this document.
> **Grounding:** Every claim below is derived from the current merged codebase — `apps/web` (30 screens), `apps/admin` (10 screens), `apps/api` (16 controllers, ~90 routes), `packages/sdk` (client surface the frontend can actually call), and `apps/api/prisma/schema.prisma` (14 models, 21 enums). Where a capability is inferred rather than directly wired, it is flagged `~inferred`.
> **Legend:** ✅ done+wired · 🟡 partial · 🟠 backend-only · 🔵 frontend-only/mock · 🔴 present but disconnected · ❌ missing

---

## 0. Product in one paragraph

Payra is a **crypto-to-fiat payments app on Stellar/Soroban**. A consumer connects a Stellar wallet (Freighter), passes KYC, scans a merchant UPI QR, gets a **live FX quote** (crypto→INR), and pays. The backend runs an **operator-custody settlement pipeline**: it converts, routes on Stellar, settles fiat to the merchant (via Decentro UPI / MoneyGram rails), and **mints STAR reward tokens on-chain** (10 STAR per ₹100 spent). It also has on/off-ramps (MoneyGram SEP-24), a merchant portal (registry, QR, analytics, campaigns), a referral system, and an admin console (KYC/AML, approvals, logs). The current frontend is a **desktop/web-oriented Next.js app**; this blueprint reframes the entire product for a **native-feeling mobile experience**.

---

# 1. Existing Frontend (as-built inventory)

## 1.1 Consumer + merchant web app (`apps/web`, Next.js 15 App Router)

### Screens (route → file → state)
| Route | Purpose | State |
|---|---|---|
| `/` | Landing / entry | 🟡 |
| `/dashboard` | Consumer home (3-zone layout) | 🟡 |
| `/pay` | **Scan-and-pay core flow** (SCAN→QUOTE→PROCESSING→SUCCESS) | ✅ |
| `/wallet` | Wallet overview | 🟡 |
| `/wallet/manage` | Manage connected wallets / trustlines | 🟡 |
| `/wallet/onramp` | MoneyGram deposit (SEP-24) | ✅ |
| `/wallet/offramp` | MoneyGram withdraw (SEP-24) | ✅ |
| `/history` | Transaction list | 🟡 |
| `/history/[id]` | Transaction detail | 🟡 |
| `/transactions/tax-report` | Yearly tax export | 🟠→🔵 |
| `/rewards` | STAR rewards home | 🟡 |
| `/rewards/history` | Reward ledger | 🟡 |
| `/rewards/campaigns` | Reward campaigns (consumer view) | 🟡 |
| `/rewards/referrals` | Referral hub | 🔵 (mock data) |
| `/rewards/analytics` | Consumer reward analytics | 🟡 |
| `/contracts` | On-chain balances / contract addresses | 🟡 |
| `/profile` | Profile | 🔵 (demo data) |
| `/profile/trust` | GDPR export/delete | 🔴 (token-key bug → 401) |
| `/merchant` | Merchant dashboard | 🔵 (hardcoded KPIs) |
| `/merchant/analytics` | Merchant analytics | 🔵 |
| `/merchant/transactions` | Merchant tx list | 🟡 |
| `/merchant/settlements` | Settlement list | 🟡 |
| `/merchant/qr-codes` | Generate/manage QR codes | 🟡 |
| `/merchant/onboard` | Merchant registration | 🟡 |
| `/merchant/profile` | Merchant profile | 🟡 |
| `/merchant/campaigns` | Campaign list | 🟡 |
| `/merchant/campaigns/create` | Create campaign | 🟡 |
| `/merchant/campaigns/[id]` | Campaign detail | 🟡 |
| `/merchant/campaigns/[id]/edit` | Edit campaign | 🟡 |
| `/merchant/developers/webhooks` | Webhook config | 🔵 (~inferred no BE) |

### Components (`apps/web/src/components`)
- **auth/** `AppLock.tsx` (PIN/WebAuthn client-side lock), `PaymentConfirm.tsx` (confirm sheet)
- **kyc/** `KycOnboarding.tsx`, `KycPending.tsx`
- **payment/** `QrScanner.tsx`
- **stellar/** `StarBalance.tsx`, `MerchantStatus.tsx`, `TransactionStatus.tsx`
- **layout/** `AppShell.tsx`, `Sidebar.tsx`, `Topbar.tsx`, `MobileNav.tsx`, `AppLock.tsx`, `DemoTour.tsx`
- **providers/** `StellarWalletProvider.tsx` (Freighter connect + SEP-53 sign + JWT), `Providers.tsx` (SDK + TanStack Query)
- **root** `DemoTour.tsx`

### Lib (`apps/web/src/lib`)
`store.ts` (Zustand, persist key `payra-auth-storage`), `query-client.ts`, `stellar.ts`, `horizon.ts`, `trustline.ts`, `upi-parser.ts` (`parseUpiQr`), `appAuth.ts` (SHA-256 PIN w/ static salt).

## 1.2 Admin console (`apps/admin`, separate Next.js app)
`/` (overview), `/users`, `/users/[id]`, `/merchants`, `/merchants/pending`, `/merchants/[id]`, `/transactions`, `/rewards`, `/aml`, `/logs`.
Uses `AdminShell`, Zustand store, TanStack Query. ⚠️ Current auth is mock-login → **anyone becomes ADMIN, no route guards** (must not ship as-is).

## 1.3 Current navigation & design structure
- **Web:** desktop **sidebar + topbar** shell (`AppShell`) with a secondary `MobileNav`. Two personas (consumer, merchant) share one app via route prefixes (`/merchant/*`). Admin is a wholly separate app.
- **Design language:** Tailwind v4, React 19; card-heavy dashboards; several KPI cards render **hardcoded/demo values** rather than live data.
- **Current UX problems for mobile:** sidebar-first IA, desktop tables, `alert()`-based errors, mock/demo data in profile/referrals/merchant KPIs, and a payment flow that is genuinely good but embedded in a desktop chrome.

---

# 2. Backend Capabilities → mobile representation

For each backend domain: **what it does · exposed in FE? · needs a mobile screen? · required interactions.** (Routes verified from controllers; FE reach verified from `packages/sdk`.)

### Auth (`/auth`) — ✅ exposed
Routes: `POST wallet/challenge`, `POST wallet/login`, `POST refresh`, `GET me`, `POST mock-login`.
Mobile: **yes** — Connect Wallet + sign challenge, session bootstrap, silent refresh. Interactions: connect wallet, approve signature, auto-refresh, logout.

### Users (`/users`) — 🟡
Routes: `GET me/audit-log`, `GET me/export`, `DELETE me`, plus admin CRUD (`POST/GET/GET :id/PATCH :id/activate/suspend/DELETE`).
Mobile: **yes** — Profile, Security & Privacy (audit log, data export, delete account). Admin CRUD → admin app only.

### Wallets (`/wallets`) — 🟡
Routes: `POST` (connect), `GET`, `GET :id`, `PATCH :id`, `DELETE :id`.
Mobile: **yes** — Wallet list, connect/disconnect, set label/primary, trustline management.

### KYC (`/kyc`) — 🟡
Routes: `POST webhook`, `GET status`, `POST start`.
Mobile: **yes, dedicated flow** — Start KYC (KYCAID), Pending state, Verified/Rejected states. ⚠️ enforcement is client-side only today.

### Transactions (`/transactions`) — ✅ (core)
Routes: `POST quote`, `POST` (create), `GET`, `GET :id`, `POST :id/cancel`, `POST :id/fail`, `GET me/tax-report`.
Mobile: **yes** — Quote sheet, Pay flow, History list, Detail, Cancel action, Tax report export.

### Rewards (`/rewards`) — 🟡
Routes: `POST calculate/spend`, `POST`, `GET`, `GET balance`, `GET :id`, `POST :id/mint`, `POST :id/reverse`.
Mobile: **yes** — STAR balance widget, reward ledger, reward detail, claim/mint state. (`calculate/spend`, `reverse` are admin/system-ish.)

### Merchants (`/merchants`) — 🟡
Routes: `POST`, `GET`, `GET by-vpa/:vpa`, `GET mine`, `GET :id`, `PATCH :id`, approve/reject/suspend, `POST :id/qrs`, `GET :id/analytics`.
Mobile: **yes (merchant persona)** — Onboard, my merchant, QR generation, analytics, profile. `by-vpa` powers scan-and-pay merchant resolution.

### Stellar (`/stellar`) — 🟠→needs surfacing
Routes: `GET star-balance/:address`, `GET merchant/:merchantId/status`.
Mobile: **yes as widgets** — real on-chain STAR balance card, merchant on-chain status chip.

### Ramps (`/ramps`, MoneyGram SEP-24) — ✅
Routes: `POST authenticate`, `POST deposit`, `POST withdraw`, `GET transaction/:id`.
Mobile: **yes** — Deposit (on-ramp) and Withdraw (off-ramp) flows with anchor iframe + polling; trustline pre-check.

### Campaigns (`/campaigns`) — 🟡
Routes: brands CRUD, campaigns CRUD, activate/pause/complete, add-merchant, analytics.
Mobile: consumer sees active campaigns; **merchant persona** manages them. Full CRUD better as tablet/desktop but must be mobile-usable.

### Referrals (`/referrals`) — 🟡 (FE mock)
Routes: `POST` (create/generate), `POST accept`, `GET`, `POST :id/qualify`, `POST :id/reward`.
Mobile: **yes** — Referral code display/share, accept code, referral status list. (FE currently hardcoded — must be wired.)

### Analytics (`/analytics`) — 🟠 (fetched but unused)
Routes: `GET dashboard`, `GET revenue`, `GET rewards`, `GET campaigns`, `GET consumer-rewards`.
Mobile: **yes** — dashboards + charts (consumer rewards, merchant revenue). Currently rendered as hardcoded KPIs → must bind to real data.

### AML (`/aml`) — 🟠 (admin)
Route: `GET screen`. Mobile: **admin app only** — wallet screening result. Not a consumer screen.

### Admin (`/admin`) — 🟠 (admin app)
Routes: overview, users, users/:id/status, merchants/pending, approve/reject/suspend, transactions, rewards, logs.
Mobile: **admin console** (separate) — needs real auth + guards before shipping.

### Settlement (service, no controller) — 🟠 internal
`settlement.service.ts` (Decentro UPI OAuth, `initiateUpiPayout`, `checkPayoutStatus`). Driven by the transaction processor. Mobile: surfaced **indirectly** via tx status + merchant settlement list; no direct consumer screen.

### Transaction Processor (cron, no controller) — ✅ internal
`@Cron` claim → convert → Stellar submit → STAR mint → complete, with retry/backoff. Mobile: surfaced via **live tx status polling** (the pay flow already polls).

### ZebPay (`/zebpay`) — 🔴 slated for removal
Stub. **Do not design mobile screens for it.** Decentro replaces it.

---

# 3. Missing Frontend (what the new mobile UI must add)

**Net-new screens / flows**
- First-run **onboarding carousel** + Connect Wallet screen (mobile-native).
- Proper **KYC flow** as full-screen steps (not just a gate).
- **Home / Dashboard** bound to *real* balances + recent activity (replace hardcoded KPIs).
- **Wallet hub** with real trustline management + asset list.
- **Deposit** and **Withdraw** flows redesigned as mobile step wizards.
- **Rewards hub** with real STAR balance (on-chain) + ledger + claim.
- **Referrals** wired to real API (share sheet, accept code, status).
- **Merchant persona** as a switchable mode with real analytics.
- **Notifications center** (❌ no backend today — design UI, back with tx events / `~inferred` future push).
- **Settings** (security, PIN/biometric, language, network, legal).
- **Receipt view** (post-payment shareable receipt).
- **Error pages** (offline, 404, session expired, wallet-not-found).

**Missing UI primitives / patterns**
- Bottom navigation, mobile top app bar, bottom sheets (quote, confirm, asset picker, filters), toasts/snackbars, skeleton loaders, empty states, success/failure result screens, status chips, pull-to-refresh, QR scanner overlay, QR display card, share sheet, OTP/PIN entry, biometric prompt.

**Missing states (currently `alert()` or absent)**
- Loading (skeletons per card/list), empty (no tx / no rewards / no wallets), success (checkmark result), error (retryable inline + toast), pending (KYC pending, settlement pending, on-chain confirming), offline/degraded (FX circuit-breaker fallback banner).

---

# 4. Screen Specifications (mobile)

> Format per screen: **Purpose · Info shown · UI sections · Components · Actions · APIs (SDK) · Data · Validation · Navigation · States.**

### 4.1 Splash / First-run onboarding
- **Purpose:** brand intro + route to auth.
- **UI:** logo, 3 value-prop slides, "Connect Wallet" CTA.
- **Components:** Carousel, PrimaryButton.
- **APIs:** none (checks persisted session in Zustand).
- **Nav:** → Connect Wallet (new) or → Home (returning).
- **States:** loading (session check), first-run vs returning.

### 4.2 Connect Wallet / Login
- **Purpose:** passwordless wallet auth (Freighter, SEP-53).
- **UI:** wallet provider button, "why a wallet" helper, signing status.
- **Components:** WalletButton, SigningModal, InlineError.
- **Actions:** connect → request challenge → sign → login.
- **APIs:** `auth.walletChallenge`, `auth.walletLogin`; then `auth.getCurrentUser`.
- **Data:** address, network, provider, nonce, signature → JWT (Zustand `payra-auth-storage`).
- **Validation:** wallet installed? network match? signature present? nonce TTL (5 min).
- **Nav:** → KYC gate → Home.
- **States:** wallet-not-found (install prompt), user-rejected-signature, expired-nonce (retry), success.

### 4.3 KYC — Start / Pending / Result
- **Purpose:** identity verification (KYCAID).
- **UI:** status banner, start CTA, document/selfie handoff (KYCAID form), pending spinner, verified/rejected result.
- **Components:** KycStatusBanner, KycUpload/Handoff, StatusChip, ResultState.
- **Actions:** start KYC, poll status, retry if rejected.
- **APIs:** `kyc.start`, `kyc.getStatus`.
- **Data:** `KycStatus` (NONE/PENDING/VERIFIED/REJECTED), kycReference.
- **Validation:** must be authenticated; block pay actions until VERIFIED (should be enforced server-side too — current gap).
- **Nav:** → Home when VERIFIED; blocks Pay/Withdraw when not.
- **States:** none/start, pending (poll), verified (success), rejected (retry).

### 4.4 Home / Dashboard
- **Purpose:** at-a-glance balances + quick actions + recent activity.
- **UI sections:** total value card, STAR balance widget, quick actions (Pay, Deposit, Withdraw, Scan), recent transactions, active campaigns strip, KYC/trustline nudges.
- **Components:** BalanceCard, StarBalance, QuickActionGrid, TransactionCard (list), CampaignCard, NudgeBanner.
- **APIs:** `wallets.listWallets`, `stellar.getStarBalance`, `transactions.listTransactions`, `analytics.getConsumerRewardMetrics`, `kyc.getStatus`.
- **Data:** wallet balances (Horizon), STAR (on-chain), recent tx (paginated).
- **Nav:** tabs to Wallet/Rewards/History/Profile; CTAs into flows.
- **States:** loading skeletons, empty (no wallet/no tx), degraded (FX fallback banner).

### 4.5 Pay (Scan-and-Pay) — *core*
- **Purpose:** scan merchant UPI QR → quote → confirm → pay → settle → reward.
- **Flow steps:** SCAN → RESOLVE MERCHANT → QUOTE → CONFIRM → PROCESSING → RESULT.
- **UI:** camera scanner overlay, manual VPA entry fallback, merchant card, asset selector, amount, **quote sheet** (rate, fees, STAR earned), confirm sheet (+ app lock), processing status, success receipt.
- **Components:** QrScanner, MerchantCard, AssetSelector, AmountInput, QuoteBottomSheet, PaymentConfirmSheet, AppLock, TransactionStatus, ReceiptView.
- **Actions:** scan, pick asset, enter/confirm amount, get quote, confirm+sign/PIN, poll status, view receipt, share.
- **APIs:** `merchants.findByVpa`, `transactions.getQuote`, `transactions` create, `transactions.getTransaction` (poll), `stellar.getMerchantStatus`.
- **Data:** VPA→merchant, `assetIn`+`amountInPaise`, quote (rate/fees/STAR), tx lifecycle (`TransactionStatus` enum: CREATED→…→COMPLETED/FAILED).
- **Validation:** KYC VERIFIED, merchant APPROVED, sufficient balance, min/max amount, quote freshness.
- **Nav:** → Receipt → Home/History.
- **States:** scanning, merchant-not-found, quote-loading/expired, insufficient-funds, processing (poll w/ timeout 60s), success, failed (retry/cancel).

### 4.6 Receipt / Transaction Detail
- **Purpose:** proof + lifecycle + on-chain links.
- **UI:** amount, merchant, status timeline (state machine), fees, STAR earned, Stellar tx hash link, settlement ref.
- **Components:** ReceiptView, StatusTimeline, CopyRow, ExplorerLink, Button(share/export).
- **APIs:** `transactions.getTransaction`, `transactions.cancelTransaction` (if cancellable).
- **Data:** Transaction + TransactionEvent[] + SettlementInstruction + Reward.
- **States:** loading, each lifecycle status, failed, cancellable vs not.

### 4.7 Wallet Hub
- **Purpose:** manage assets, wallets, trustlines.
- **UI:** asset list w/ balances, add trustline (USDC), connected wallets, set primary/label, disconnect.
- **Components:** AssetRow, WalletCard, TrustlineSheet, ConfirmDialog.
- **APIs:** `wallets.listWallets/connectWallet/updateWallet/disconnect`, Horizon (balances), `trustline.ts`.
- **Data:** Wallet[] (provider/network/status/isPrimary), Horizon balances.
- **States:** loading, empty (no wallet → connect), no-trustline (add), success/error.

### 4.8 Deposit (On-ramp, MoneyGram SEP-24)
- **Purpose:** fund wallet with fiat→USDC.
- **UI:** amount, trustline check, anchor iframe, status poll.
- **Components:** AmountInput, TrustlineSheet, AnchorWebview, StatusPoller, ResultState.
- **APIs:** `ramps.authenticate`, `ramps.deposit` (`POST /ramps/deposit`), `ramps.getTransactionStatus`.
- **Validation:** trustline present, min amount.
- **States:** need-trustline, authenticating, anchor-interactive, polling, completed, failed.

### 4.9 Withdraw (Off-ramp, MoneyGram SEP-24)
- **Purpose:** USDC→fiat payout.
- **UI:** amount (min 5 USDC), destination, sign USDC payment, status.
- **Components:** AmountInput, ConfirmSheet, SigningModal, StatusPoller.
- **APIs:** `ramps.authenticate`, `ramps.withdraw` (`POST /ramps/withdraw`), `ramps.getTransactionStatus`.
- **Validation:** balance ≥ amount, min 5 USDC, memo.
- **States:** authenticating, signing, submitting, polling, completed, failed.

### 4.10 History
- **Purpose:** all transactions, filterable.
- **UI:** filter chips (status/type/date), search, list of TransactionCard, pull-to-refresh, pagination.
- **Components:** FilterChips, SearchBar, TransactionCard, EmptyState, Skeleton.
- **APIs:** `transactions.listTransactions({page,limit,status})`.
- **States:** loading, empty, error, end-of-list.

### 4.11 Rewards Hub
- **Purpose:** STAR balance + earning + ledger.
- **UI:** on-chain STAR balance, lifetime earned, active reward campaigns, reward ledger, claim CTA.
- **Components:** StarBalance, RewardCard, CampaignCard, ClaimSheet.
- **APIs:** `rewards.getRewards/listRewards/getReward/claimReward`, `rewards` balance, `stellar.getStarBalance`, `campaigns.listCampaigns`.
- **Data:** Reward (reason/status: PENDING/MINTED/FAILED/REVERSED), on-chain balance.
- **States:** loading, empty (no rewards), claimable vs minted, mint-failed.

### 4.12 Referrals
- **Purpose:** invite friends, track, earn.
- **UI:** my referral code + share, enter code, referral status list.
- **Components:** ReferralCodeCard, ShareSheet, CodeInput, ReferralStatusRow.
- **APIs:** `referrals.generateReferralCode/getReferralStats/accept/listReferrals`.
- **Data:** Referral (INVITED/QUALIFIED/REWARDED/EXPIRED/CANCELLED).
- **Validation:** valid code, not self-referral, one accept.
- **States:** loading, empty, code-accepted, invalid-code.

### 4.13 Profile & Settings
- **Purpose:** identity, security, privacy, preferences.
- **UI:** profile (name/role/KYC badge), security (PIN/biometric app-lock), privacy (audit log, export data, delete account), preferences (network testnet/mainnet, language), legal, logout.
- **Components:** ProfileHeader, SettingRow, Toggle, AppLockSetup, DangerZone, ConfirmDialog.
- **APIs:** `auth.getCurrentUser`, `users.getProfile/updateProfile`, `users` audit-log/export/delete (`GET me/audit-log`, `GET me/export`, `DELETE me`).
- **⚠️ Fix on redesign:** read JWT from Zustand store, **not** `localStorage.accessToken` (current 401 bug).
- **States:** loading, save-success/error, export-generating, delete-confirm (2-step).

### 4.14 Merchant mode (persona switch)
- **Merchant Home:** revenue, tx count, settlements — **bound to `analytics.getMerchantAnalytics`/`analytics.getRevenueMetrics`** (replace hardcoded KPIs).
- **QR Codes:** generate/display store QR (`merchants.createQrCode`), QrDisplay + share/print.
- **Transactions:** `merchants.getMerchantTransactions`.
- **Settlements:** settlement list + status (Decentro/MoneyGram).
- **Onboard/Profile:** register merchant (`merchants` create), edit (`merchants.updateMerchant`).
- **Campaigns:** list/create/edit/activate/pause/complete (`campaigns.*`).
- **States:** pending-approval banner (MerchantStatus), empty, loading, success/error.

### 4.15 Admin (separate console, mobile-responsive)
Overview, Users (list/detail/suspend), Merchants (pending/approve/reject/suspend), Transactions, Rewards, AML screen, Logs. **Must add real auth + role guards.** APIs: `admin.*`, `aml.screenWallet`.

---

# 5. Reusable Design System (component library)

**Actions & inputs:** PrimaryButton, SecondaryButton, GhostButton, IconButton, TextInput, AmountInput (currency-aware), SearchBar, OTP/PIN field, Toggle, Checkbox, RadioGroup, Slider, Dropdown/Select.
**Selectors:** AssetSelector (ETH/BTC/SOL/XLM/USDC/INR — from `AssetCode` enum), CurrencySelector, DatePicker/RangePicker, FilterChips.
**Crypto/payments:** QrScanner (camera + overlay), QrDisplay (merchant QR), WalletCard, BalanceCard, StarBalance, TrustlineSheet, TransactionCard, MerchantCard, ReceiptView, StatusTimeline, ExplorerLink/CopyRow.
**KYC:** KycStatusBanner, KycUpload/Handoff, DocumentPreview.
**Sheets & overlays:** QuoteBottomSheet, PaymentConfirmSheet, ClaimSheet, ShareSheet, ConfirmDialog, Modal, AppLock (PIN/biometric), SigningModal, AnchorWebview.
**Feedback:** Toast, Snackbar, InlineError, Skeleton/Shimmer, Spinner, ProgressBar/Stepper, EmptyState, ResultState (success/error), Badge, StatusChip (maps to enums).
**Navigation:** BottomNav, TopAppBar, TabBar, PersonaSwitcher, BackHeader, SectionHeader.
**Data display:** List/ListItem, KeyValueRow, StatCard, Chart (line/bar/donut — rewards, revenue, campaign), Table (merchant/admin dense views), Timeline, Avatar.

**Status-chip source of truth (from Prisma enums):**
- `TransactionStatus`: CREATED, QUOTED, AUTHORIZED, CONVERTING, ROUTING_STELLAR, SETTLING, REWARDING, COMPLETED, FAILED, CANCELLED
- `KycStatus`: NONE, PENDING, VERIFIED, REJECTED
- `MerchantStatus`: PENDING, APPROVED, SUSPENDED (+ REJECTED ~inferred)
- `RewardStatus`: PENDING, MINTED, FAILED, REVERSED
- `ReferralStatus`: INVITED, QUALIFIED, REWARDED, EXPIRED, CANCELLED
- `SettlementStatus`: PENDING, SENT, CONFIRMED, FAILED

---

# 6. Complete Mobile User Journey

**Launch → Login → KYC → Wallet → Deposit → Payment → QR Scan → Merchant Settlement → Withdrawal → History → Profile → Settings**

1. **Launch:** splash → session check. Returning+valid JWT → Home; else Onboarding.
2. **Login:** Connect Wallet → challenge → sign (SEP-53) → JWT → `getCurrentUser`.
3. **KYC:** if `KycStatus != VERIFIED` → KYC flow (start → pending poll → verified). Blocks Pay/Withdraw.
4. **Wallet:** view assets; add USDC trustline; set primary.
5. **Deposit (on-ramp):** amount → trustline check → MoneyGram anchor → poll → funded.
6. **Payment / QR Scan:** scan merchant QR → resolve VPA→merchant → pick asset+amount → **quote sheet** → confirm + app-lock/sign → processing (poll) → success.
7. **Merchant Settlement (system):** processor converts → Stellar routes → Decentro/MoneyGram settles fiat → STAR minted on-chain. Consumer sees status timeline; merchant sees settlement entry.
8. **Withdrawal (off-ramp):** amount (≥5 USDC) → sign USDC payment → MoneyGram → poll → paid out.
9. **History:** list/filter/detail → receipt → share/export/tax report.
10. **Profile/Settings:** identity, security (PIN/biometric), privacy (audit/export/delete), preferences, logout.

**Merchant sub-journey:** switch persona → onboard (pending approval) → generate QR → receive payments → view analytics → manage campaigns → track settlements.

---

# 7. Frontend ↔ Backend Mapping

| Screen | APIs (SDK) | DB entities | Blockchain | 3rd-party | Auth |
|---|---|---|---|---|---|
| Connect Wallet | auth.walletChallenge/walletLogin/getCurrentUser | User, Wallet | Stellar sign (SEP-53) | Freighter | none→JWT |
| KYC | kyc.start/getStatus | User(kycStatus) | — | KYCAID | JWT |
| Home | wallets.list, stellar.getStarBalance, transactions.list, analytics.getConsumerRewardMetrics | User, Wallet, Transaction, Reward | Horizon, STAR contract | CoinGecko (rates) | JWT |
| Pay / Scan | merchants.findByVpa, transactions.getQuote/create/getTransaction, stellar.getMerchantStatus | Transaction, TransactionEvent, Merchant, SettlementInstruction, Reward | Stellar submit, Soroban mint, merchant-registry | CoinGecko, Decentro/MoneyGram | JWT + KYC |
| Receipt/Detail | transactions.getTransaction/cancel | Transaction(+Event/Settlement/Reward) | Stellar tx hash | — | JWT |
| Wallet Hub | wallets.* + Horizon | Wallet | Horizon, trustlines | Freighter | JWT |
| Deposit | ramps.authenticate/deposit/getTransactionStatus | — (anchor-side) | SEP-10/24, trustline | MoneyGram | JWT |
| Withdraw | ramps.authenticate/withdraw/getTransactionStatus | — | Stellar USDC payment | MoneyGram | JWT |
| History | transactions.listTransactions | Transaction | — | — | JWT |
| Rewards | rewards.*, stellar.getStarBalance, campaigns.list | Reward, Campaign, Brand | reward-engine, STAR token | — | JWT |
| Referrals | referrals.* | Referral, User | — | — | JWT |
| Profile/Settings | users.* (audit/export/delete), auth.getCurrentUser | User, AdminLog(audit) | — | — | JWT |
| Merchant Home/Analytics | analytics.getMerchant*, merchants.getMerchant* | Merchant, Transaction, SettlementInstruction | merchant-registry status | Decentro/MoneyGram | JWT (merchant) |
| Merchant QR | merchants.createQrCode | MerchantQrCode | — | UPI | JWT (merchant) |
| Campaigns | campaigns.* | Campaign, Brand, CampaignMerchant | — | — | JWT (merchant) |
| Admin/AML | admin.*, aml.screenWallet | User, Merchant, Transaction, Reward, AdminLog | — | AML provider (mock) | JWT (admin) |

---

# 8. MVP vs Post-MVP screen list

**Essential MVP**
1. Splash / Onboarding
2. Connect Wallet
3. KYC (start/pending/result)
4. Home / Dashboard
5. Pay (Scan-and-Pay) + Quote sheet + Confirm
6. Transaction Processing / Result
7. Receipt / Transaction Detail
8. History (list + filter)
9. Wallet Hub (+ trustline)
10. Deposit (on-ramp)
11. Withdraw (off-ramp)
12. Rewards Hub (STAR balance + ledger)
13. Profile & Settings (incl. security + privacy)

**Post-MVP**
- Referrals hub (share + accept)
- Reward campaigns (consumer)
- Consumer reward analytics/charts
- Merchant persona (home, QR, analytics, transactions, settlements, onboard, profile)
- Campaign management (merchant)
- Tax report export
- Notifications center
- Developer/webhooks (merchant)
- Admin console (separate app; needs real auth)

---

# 9. Figma Blueprint — Information Architecture

**Bottom navigation (consumer, 5 tabs)**
`Home · Wallet · [Scan — center FAB] · Rewards · Profile`
(History reachable from Home + Wallet; Merchant mode via persona switch in Profile.)

**Navigation hierarchy**
```
App
├─ Onboarding (splash, slides, connect-wallet)
├─ Auth (challenge/sign)
├─ KYC (start → pending → result)   [gate]
├─ Main (BottomNav)
│  ├─ Home
│  │   ├─ Notifications (post-MVP)
│  │   └─ Recent → Transaction Detail / Receipt
│  ├─ Wallet
│  │   ├─ Asset detail / Trustline
│  │   ├─ Deposit (on-ramp)
│  │   └─ Withdraw (off-ramp)
│  ├─ Pay (center FAB)
│  │   ├─ Scan → Quote → Confirm → Processing → Result → Receipt
│  │   └─ Manual VPA entry
│  ├─ Rewards
│  │   ├─ STAR balance / ledger / reward detail
│  │   ├─ Campaigns (post-MVP)
│  │   └─ Referrals (post-MVP)
│  └─ Profile
│      ├─ Settings (security, preferences, legal)
│      ├─ Security & Privacy (app-lock, audit, export, delete)
│      ├─ History (full)
│      └─ Merchant mode ▸ (persona switch)
│          ├─ Merchant Home / Analytics
│          ├─ QR Codes
│          ├─ Transactions / Settlements
│          ├─ Onboard / Profile
│          └─ Campaigns (list/create/edit)
└─ Admin (separate app: overview, users, merchants, transactions, rewards, AML, logs)
```

**Component hierarchy (Figma pages/sections)**
1. **Foundations:** color, type, spacing, radius, elevation, iconography, dark/light.
2. **Primitives:** buttons, inputs, chips, badges, toggles, OTP/PIN.
3. **Composite:** cards (balance/wallet/transaction/merchant/reward/campaign), list rows, stat cards, charts.
4. **Overlays:** bottom sheets (quote/confirm/asset/filter/claim/share), modals, dialogs, app-lock, signing, anchor webview.
5. **Feedback:** toasts, snackbars, skeletons, empty/success/error states.
6. **Navigation:** bottom nav, top app bar, tabs, persona switcher, headers.
7. **Flows (prototypes):** Onboarding, Auth, KYC, Pay, Deposit, Withdraw, Rewards, Merchant.

**Feature grouping:** Money (Wallet, Deposit, Withdraw), Pay (Scan, Quote, Confirm, Receipt), Grow (Rewards, Referrals, Campaigns), Identity (Profile, KYC, Security), Business (Merchant), Ops (Admin).

---

# 10. Complete Build Specification & Frontend Build Checklist

## 10.1 Component build spec
Format: **Component · Purpose · Screens · APIs · Data · Interactions · States · Deps · Priority**

| Component | Purpose | Screens | APIs | Data | Interactions | States | Deps | Priority |
|---|---|---|---|---|---|---|---|---|
| WalletButton/SigningModal | connect+sign | Auth | auth.walletChallenge/Login | address,nonce,sig | tap, approve | idle/signing/error | Freighter | MVP |
| KycStatusBanner + Flow | KYC gate | KYC, Home | kyc.start/getStatus | KycStatus | start, poll | none/pending/verified/rejected | KYCAID | MVP |
| BalanceCard | show value | Home, Wallet | wallets.list, Horizon | balances | tap→detail | loading/empty/error | Horizon | MVP |
| StarBalance | on-chain STAR | Home, Rewards | stellar.getStarBalance | STAR amount | refresh | loading/error | Soroban | MVP |
| QrScanner | scan UPI | Pay | (client) upi-parser | VPA payload | scan, manual | scanning/found/not-found | camera | MVP |
| MerchantCard | show payee | Pay, Receipt | merchants.findByVpa, stellar.getMerchantStatus | merchant, status | — | loading/approved/pending | — | MVP |
| AssetSelector | pick asset | Pay, Deposit | (enum AssetCode) | assets+balances | select | — | — | MVP |
| AmountInput | enter amount | Pay/Deposit/Withdraw | — | paise/USDC | type, validate | valid/invalid/insufficient | — | MVP |
| QuoteBottomSheet | show rate/fees/STAR | Pay | transactions.getQuote | quote | confirm/refresh | loading/expired | CoinGecko | MVP |
| PaymentConfirmSheet + AppLock | authorize | Pay | transactions.create | tx | confirm+PIN/bio | idle/locked/confirming | WebAuthn | MVP |
| TransactionStatus/Timeline | live status | Pay, Receipt | transactions.getTransaction | status+events | poll | each status/failed | — | MVP |
| ReceiptView | proof | Receipt | transactions.getTransaction | tx+reward+settlement | share/export | loading/complete | — | MVP |
| TransactionCard + List | history | Home, History | transactions.list | tx[] | tap, filter | loading/empty/error | — | MVP |
| FilterChips/SearchBar | filter | History, Merchant tx | transactions.list(params) | — | select/type | — | — | MVP |
| WalletCard + TrustlineSheet | manage wallets | Wallet | wallets.*, trustline | Wallet[] | connect/disconnect/add-trustline | loading/empty/no-trustline | Freighter | MVP |
| AnchorWebview + StatusPoller | ramps | Deposit/Withdraw | ramps.* | anchor tx | interact, poll | authenticating/interactive/polling/done | MoneyGram | MVP |
| RewardCard/Ledger/ClaimSheet | rewards | Rewards | rewards.* | Reward[] | claim | loading/empty/minted/failed | — | MVP |
| ProfileHeader/SettingRow/DangerZone | profile | Profile/Settings | users.*, auth.getCurrentUser | User | edit/export/delete | loading/save/confirm | — | MVP |
| BottomNav/TopAppBar/PersonaSwitcher | nav | all | — | — | navigate/switch | active states | — | MVP |
| Toast/Snackbar/EmptyState/Skeleton/ResultState | feedback | all | — | — | — | — | — | MVP |
| ReferralCodeCard/ShareSheet/CodeInput | referrals | Referrals | referrals.* | Referral | share/accept | loading/empty/invalid | share API | Post-MVP |
| CampaignCard + CRUD forms | campaigns | Rewards, Merchant | campaigns.* | Campaign,Brand | create/edit/activate | loading/empty/error | — | Post-MVP |
| Chart (line/bar/donut) | analytics | Home, Merchant, Rewards | analytics.* | metrics | filter range | loading/empty | chart lib | Post-MVP |
| QrDisplay | merchant QR | Merchant QR | merchants.createQrCode | qr | share/print | loading/error | — | Post-MVP |
| Merchant analytics/settlement views | business | Merchant | analytics.*, merchants.* | metrics, settlements | filter | loading/empty | — | Post-MVP |
| NotificationsCenter | alerts | Home | ❌ none (tx events ~inferred) | events | mark-read | loading/empty | (future push) | Post-MVP |
| Admin views + AuthGuard | admin | Admin app | admin.*, aml.screenWallet | admin data | approve/reject/suspend/screen | loading/empty | real auth | Post-MVP |

## 10.2 Frontend Build Checklist

**A) Already exists & reusable (port/adapt to mobile)**
- QrScanner, upi-parser, StellarWalletProvider (wallet connect + SEP-53), PaymentConfirm, AppLock, KycOnboarding/KycPending, StarBalance, MerchantStatus, TransactionStatus, SDK client (all domains), Zustand store, TanStack Query setup, on/off-ramp flow logic, trustline util.

**B) Exists but needs redesign (mobile-native + real data)**
- Home/Dashboard (bind real balances, remove hardcoded KPIs), Wallet, History, Rewards, Profile (fix JWT-from-store bug; remove demo data), Merchant dashboard/analytics (bind `analytics.*`), navigation shell (sidebar→bottom nav + top app bar), error handling (`alert()`→toast/inline), Pay flow (mobile chrome).

**C) Missing & must be built**
- Splash/Onboarding, mobile Connect-Wallet screen, Receipt view, Notifications center, Settings (security/preferences/legal), proper empty/loading/success/error state set, skeletons, bottom sheets (quote/confirm/asset/filter/claim/share), StatusTimeline, PersonaSwitcher, real Referrals UI, QrDisplay, chart components, admin AuthGuard.

**D) Required for MVP** — Onboarding, Connect Wallet, KYC flow, Home, Pay (scan→quote→confirm→result), Receipt/Detail, History, Wallet+trustline, Deposit, Withdraw, Rewards hub, Profile & Settings (security+privacy), full feedback/state components, bottom nav.

**E) Required after MVP** — Referrals, Campaigns (consumer+merchant), Analytics charts, full Merchant persona (QR/analytics/settlements/onboard/campaigns), Tax report, Notifications, Developer/webhooks, Admin console.

---

## Appendix — Known defects to design around (not to reproduce)
1. **Profile trust/privacy 401:** reads token from `localStorage.accessToken`; token actually lives in Zustand `payra-auth-storage`. Design auth-aware data-export/delete.
2. **KYC/AML client-side only:** no server gate on payment endpoints. Design assumes server enforcement; still gate in UI.
3. **Hardcoded KPIs:** merchant/analytics/profile/referrals render demo data. New UI must bind live APIs + show empty states.
4. **Admin mock-login = anyone ADMIN, no guards.** Admin UI must include real auth + role guards.
5. **JWT fallback secret + in-memory nonce + no DB check on validate** — backend hardening notes; affects session/expiry UX (design for session-expired state).
6. **ZebPay:** stub, slated for removal — **do not design any ZebPay screens.** Settlement is Decentro (UPI) + MoneyGram (SEP-24).

---
*This blueprint is documentation only. No application or source code was modified. Companion to `docs/knowledge-base/` (00–11).*
