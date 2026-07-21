# 🎯 COMPREHENSIVE FRONTEND AUDIT REPORT
## CryptoPay Network — Backend Capabilities vs Frontend Implementation

**Date**: 2026-07-18  
**Prepared by**: Claude Code  
**Status**: Complete — Ready for Team Review

---

## 📋 EXECUTIVE SUMMARY

| Metric | Status |
|--------|--------|
| **Backend API Modules** | 16 controllers / 90+ endpoints |
| **Frontend Pages (web)** | 19 pages implemented |
| **Frontend Pages (admin)** | 1 placeholder page |
| **SDK Coverage** | 13 SDK clients, full API mapping |
| **Authentication** | JWT + Freighter wallet (mock/demo) |
| **Role Support** | CONSUMER, MERCHANT_OPERATOR, BRAND_OPERATOR, ADMIN |

**Key Finding**: The frontend covers **~60% of backend capabilities**. Critical gaps exist in: **Admin Dashboard (95% missing)**, **Merchant Onboarding**, **Campaign Management**, **KYC Verification Flow**, **Referral Program**, **AML/Screening**, **Settlement Tracking**, **Tax Reports**, and **Webhook/Callback Handling**.

---

## 1️⃣ EXISTING FRONTEND COMPONENTS — CORRECTLY IMPLEMENTED ✅

| Component | Path | Backend Endpoint | Notes |
|-----------|------|------------------|-------|
| **Landing Page** | `/` | — | Marketing, wallet connect, demo mode |
| **Dashboard** | `/dashboard` | `/transactions`, `/rewards/balance`, `/campaigns`, `/stellar/star-balance` | Real balances, recent txns, active campaigns |
| **Wallet Overview** | `/wallet` | `/wallets`, `/stellar/star-balance`, `/ramps` | Horizon balances, trustlines, on/off-ramp |
| **Wallet On-ramp** | `/wallet/onramp` | `/ramps/authenticate`, `/ramps/deposit` | MoneyGram SEP-24 flow (iframe) |
| **Wallet Off-ramp** | `/wallet/offramp` | `/ramps/authenticate`, `/ramps/withdraw` | MoneyGram SEP-24 withdrawal |
| **Pay (Scan & Pay)** | `/pay` | `/transactions/quote`, `/transactions`, `/merchants/by-vpa` | QR scanner, quote, payment confirm, polling |
| **Transaction History** | `/history` | `/transactions` (paginated, filtered) | Infinite scroll, status badges, filters |
| **Rewards Overview** | `/rewards` | `/rewards/balance`, `/analytics/consumer-rewards` | Minted/pending STAR, tier progress, referral |
| **Reward History** | `/rewards/history` | `/rewards` (paginated) | List with reason, status, amount |
| **Active Campaigns** | `/rewards/campaigns` | `/campaigns?status=ACTIVE` | Consumer view of campaigns |
| **Campaign Detail** | `/rewards/campaigns/[id]` | `/campaigns/:id` | Campaign details |
| **Referrals** | `/rewards/referrals` | `/referrals`, `/referrals/stats` | Referral code, list, earned STAR |
| **Rewards Analytics** | `/rewards/analytics` | `/analytics/consumer-rewards` | By reason breakdown |
| **Merchant Dashboard** | `/merchant` | `/merchants/mine`, `/analytics/dashboard` | KPIs, revenue chart, recent txns |
| **Merchant Campaigns** | `/merchant/campaigns` | `/campaigns` (merchant filter) | List, create, link to merchant |
| **Create Campaign** | `/merchant/campaigns/create` | `/campaigns`, `/campaigns/brands` | Brand selection, campaign builder |
| **Campaign Detail** | `/merchant/campaigns/[id]` | `/campaigns/:id`, `/campaigns/:id/analytics` | Metrics, linked merchants |
| **Merchant Transactions** | `/merchant/transactions` | `/transactions?merchantId=...` | Filtered list |
| **Profile** | `/profile` | `/auth/me`, `/users/:id` | Basic profile, wallet disconnect |
| **Trust Center** | `/profile/trust` | `/users/me/export`, `DELETE /users/me` | Data export, account deletion |
| **KYC Onboarding** | Modal (KycOnboarding.tsx) | `/kyc/start`, `/kyc/status` | KYCAID iframe flow |

---

## 2️⃣ BACKEND FEATURES WITH **NO FRONTEND IMPLEMENTATION** ❌

### 2.1 Admin Dashboard (95% Missing) — **CRITICAL GAP**

| Backend Capability | Controller | Endpoint | Frontend Status |
|---|---|---|---|
| Admin Overview | `AdminController` | `GET /admin/overview` | ❌ Missing |
| User Management | `AdminController` | `GET /admin/users`, `PATCH /admin/users/:id/status` | ❌ Missing |
| Pending Merchants | `AdminController` | `GET /admin/merchants/pending` | ❌ Missing |
| Approve/Reject Merchant | `AdminController` | `POST /admin/merchants/:id/approve`, `POST /admin/merchants/:id/reject`, `POST /admin/merchants/:id/suspend` | ❌ Missing |
| Admin Transaction Monitoring | `AdminController` | `GET /admin/transactions` | ❌ Missing |
| Admin Reward Monitoring | `AdminController` | `GET /admin/rewards` | ❌ Missing |
| Admin Audit Logs | `AdminController` | `GET /admin/logs` | ❌ Missing |

**Required Screens**: Admin shell, `Admin Dashboard` (overview cards), `User Management Table`, `Merchant Approval Queue`, `Transaction Monitor`, `Reward Monitor`, `Audit Log Viewer`.

---

### 2.2 Merchant Onboarding & KYC (80% Missing)

| Backend Capability | Controller | Endpoint | Frontend Status |
|---|---|---|---|
| Register Merchant | `MerchantsController` | `POST /merchants` | ❌ Missing (no signup flow) |
| Merchant KYC | `KycController` | `POST /kyc/start`, `GET /kyc/status` | ⚠️ Partial (only consumer KYC modal) |
| Merchant Status Check | `MerchantsController` | `GET /merchants/mine` | ✅ Dashboard reads it |
| Update Merchant | `MerchantsController` | `PATCH /merchants/:id` | ❌ Missing (no edit profile) |
| Merchant QR Codes | `MerchantsController` | `POST /merchants/:id/qrs` | ❌ Missing |
| Merchant Analytics | `MerchantsController` | `GET /merchants/:id/analytics` | ✅ Dashboard shows it |

**Required Screens**: `Merchant Registration Wizard`, `Merchant KYC Flow`, `Merchant Profile Settings`, `QR Code Generator/Manager`.

---

### 2.3 Campaign Management (50% Missing)

| Backend Capability | Controller | Endpoint | Frontend Status |
|---|---|---|---|
| Create Brand | `CampaignsController` | `POST /campaigns/brands` | ✅ Create page has brand select |
| List Brands | `CampaignsController` | `GET /campaigns/brands` | ✅ Used in create |
| Create Campaign | `CampaignsController` | `POST /campaigns` | ✅ Create page |
| Update Campaign | `CampaignsController` | `PATCH /campaigns/:id` | ❌ Missing (no edit) |
| Activate/Pause/Complete | `CampaignsController` | `POST /campaigns/:id/activate`, `pause`, `complete` | ❌ Missing (no status actions) |
| Link Merchant to Campaign | `CampaignsController` | `POST /campaigns/:id/merchants/:merchantId` | ❌ Missing |
| Campaign Analytics | `CampaignsController` | `GET /campaigns/:id/analytics` | ✅ Detail page |

**Required Screens**: `Campaign Edit Page`, `Campaign Status Controls`, `Merchant Linking UI`.

---

### 2.4 Referral Program (40% Missing)

| Backend Capability | Controller | Endpoint | Frontend Status |
|---|---|---|---|
| Create Invite | `ReferralsController` | `POST /referrals` | ❌ Missing (hardcoded code) |
| Accept Referral | `ReferralsController` | `POST /referrals/accept` | ❌ Missing |
| List Referrals | `ReferralsController` | `GET /referrals` | ✅ Page exists |
| Qualify Referral | `ReferralsController` | `POST /referrals/:id/qualify` | ❌ Missing (auto?) |
| Issue Reward | `ReferralsController` | `POST /referrals/:id/reward` | ❌ Missing |
| Referral Stats | `ReferralsController` | `GET /referrals/stats` (SDK) | ⚠️ Hardcoded mock data |

**Required Screens**: `Referral Code Generator`, `Referral Accept Flow`, `Referral Management`.

---

### 2.5 AML / Transaction Screening (100% Missing)

| Backend Capability | Controller | Endpoint | Frontend Status |
|---|---|---|---|
| Screen Wallet | `AmlController` | `POST /aml/screen` | ❌ Missing |
| Batch Screen | `AmlController` | `POST /aml/screen/batch` | ❌ Missing |
| Sanctions Check | `AmlController` | `GET /aml/sanctioned/:address` | ❌ Missing |

**Required Screens**: `AML Screening Dashboard`, `Transaction Risk Flags`, `Sanctions Alert Panel`.

---

### 2.6 Settlement & Transaction Processing (70% Missing)

| Backend Capability | Controller | Endpoint | Frontend Status |
|---|---|---|---|
| Transaction Detail (with events) | `TransactionsController` | `GET /transactions/:id` | ⚠️ Partial (history links to detail but page missing) |
| Cancel Transaction | `TransactionsController` | `POST /transactions/:id/cancel` | ❌ Missing |
| Fail Transaction (mock) | `TransactionsController` | `POST /transactions/:id/fail` | ❌ Missing |
| Get Tax Report | `TransactionsController` | `GET /transactions/me/tax-report` | ❌ Missing |
| Settlement Instruction | `SettlementService` | Internal | ❌ Missing |
| Transaction Events Timeline | `TransactionEvent` model | Embedded in detail | ❌ Missing |

**Required Screens**: `Transaction Detail View` (with event timeline), `Tax Report Generator`, `Cancel/Refund Action`.

---

### 2.7 Wallet Management (30% Missing)

| Backend Capability | Controller | Endpoint | Frontend Status |
|---|---|---|---|
| Connect Wallet | `WalletsController` | `POST /wallets` | ✅ Handled via Freighter |
| List Wallets | `WalletsController` | `GET /wallets` | ⚠️ Not shown in UI |
| Update Wallet | `WalletsController` | `PATCH /wallets/:id` | ❌ Missing (label, primary) |
| Disconnect Wallet | `WalletsController` | `DELETE /wallets/:id` | ⚠️ Profile has button but not wired |

**Required Screens**: `Wallet List/Manager`, `Wallet Settings (label, primary)`.

---

### 2.8 SEP-10/24 Ramps (Consumer Flow Exists, Merchant Missing)

| Backend Capability | Controller | Endpoint | Frontend Status |
|---|---|---|---|
| Authenticate (SEP-10) | `RampsController` | `POST /ramps/authenticate` | ✅ Used in on/off-ramp |
| Deposit (SEP-24) | `RampsController` | `POST /ramps/deposit` | ✅ Consumer on-ramp |
| Withdrawal (SEP-24) | `RampsController` | `POST /ramps/withdraw` | ✅ Consumer off-ramp |
| Transaction Status | `RampsController` | `GET /ramps/transaction/:id` | ✅ Polling in pages |

**Gap**: No merchant-facing ramp reconciliation or batch settlement view.

---

### 2.9 Stellar/On-Chain (Partial)

| Backend Capability | Controller | Endpoint | Frontend Status |
|---|---|---|---|
| STAR Balance (on-chain) | `StellarController` | `GET /stellar/star-balance/:address` | ✅ StarBalance component |
| Merchant On-Chain Status | `StellarController` | `GET /stellar/merchant/:id/status` | ⚠️ MerchantStatus component exists but unused |
| Contract Addresses | Env vars | — | ✅ Dashboard shows them |

---

## 3️⃣ FRONTEND COMPONENTS — INCOMPLETE / NOT INTEGRATED ⚠️

| Component | File | Issue |
|---|---|---|
| `KycOnboarding.tsx` | `/components/kyc/KycOnboarding.tsx` | Used as modal, but no KYC status badge in profile/nav; no "Start KYC" CTA from dashboard |
| `KycPending.tsx` | `/components/kyc/KycPending.tsx` | Not rendered anywhere |
| `StarBalance.tsx` | `/components/stellar/StarBalance.tsx` | Works but only on dashboard/rewards; not in wallet page |
| `MerchantStatus.tsx` | `/components/stellar/MerchantStatus.tsx` | Created but **never used** in merchant pages |
| `TransactionStatus.tsx` | `/components/stellar/TransactionStatus.tsx` | Created but **never used** |
| `PaymentConfirm.tsx` | `/components/auth/PaymentConfirm.tsx` | Only used in `/pay` |
| `AppLock.tsx` | `/components/auth/AppLock.tsx` | Not integrated (no biometric/pin lock) |
| `DemoTour.tsx` | `/components/DemoTour.tsx` | Triggered but tour steps not defined |

---

## 4️⃣ FEATURES EXISTING BUT NOT VISIBLE/ACCESSIBLE 🔒

| Feature | Backend Ready | Frontend Block | Fix |
|---|---|---|---|
| **Admin Dashboard** | ✅ Full API | No admin app routes, no nav | Build `/admin/*` routes in admin app |
| **Merchant Registration** | ✅ `POST /merchants` | No public merchant signup page | Add `/merchant/register` flow |
| **Merchant KYC** | ✅ `POST /kyc/start` | Only consumer KYC modal exists | Add merchant KYC step in registration |
| **Campaign Edit/Status** | ✅ `PATCH /campaigns/:id`, `POST /activate` | Read-only detail page | Add edit page + status buttons |
| **Transaction Detail** | ✅ `GET /transactions/:id` | History links to `?tx=id` but no detail page | Create `/history/[id]` page |
| **Tax Report** | ✅ `GET /transactions/me/tax-report` | No UI | Add "Download Tax Report" in history |
| **Referral Code Gen** | ✅ `POST /referrals` | Hardcoded `CRYPTO-2026-X8F` | Wire real `generateReferralCode()` |
| **Wallet List/Manager** | ✅ `GET/POST/PATCH/DELETE /wallets` | Only shows connected Freighter | Add multi-wallet manager page |
| **AML Screening** | ✅ `POST /aml/screen` | No UI | Admin + merchant risk view |
| **Settlement Tracking** | ✅ `SettlementInstruction` model | No UI | Merchant settlement dashboard |

---

## 5️⃣ MISSING NAVIGATION, PAGES & USER FLOWS 🗺️

### 5.1 Current Navigation (web app)
```
Landing (/)
├─ Dashboard (/dashboard)
├─ Pay (/pay)
├─ Wallet (/wallet)
│  ├─ Onramp (/wallet/onramp)
│  ├─ Offramp (/wallet/offramp)
│  └─ Trustlines (/wallet/trust) — NOT IMPLEMENTED
├─ Rewards (/rewards)
│  ├─ History (/rewards/history)
│  ├─ Campaigns (/rewards/campaigns)
│  ├─ Referrals (/rewards/referrals)
│  └─ Analytics (/rewards/analytics)
├─ History (/history) — needs detail page
├─ Profile (/profile)
│  └─ Trust (/profile/trust)
└─ Merchant (/merchant) — role-gated
   ├─ Dashboard (/merchant)
   ├─ Analytics (/merchant/analytics) — NOT IMPLEMENTED
   ├─ Campaigns (/merchant/campaigns)
   │  ├─ Create (/merchant/campaigns/create)
   │  └─ Detail (/merchant/campaigns/[id])
   └─ Transactions (/merchant/transactions)
```

### 5.2 Required Navigation Additions

| Route | Role | Purpose |
|---|---|---|
| `/admin/*` | ADMIN | Full admin dashboard (new app or section) |
| `/merchant/register` | MERCHANT_OPERATOR | Merchant onboarding wizard |
| `/merchant/kyc` | MERCHANT_OPERATOR | KYC document upload |
| `/merchant/profile` | MERCHANT_OPERATOR | Edit merchant details |
| `/merchant/qr-codes` | MERCHANT_OPERATOR | Generate/manage QR codes |
| `/merchant/settlements` | MERCHANT_OPERATOR | Settlement tracking |
| `/history/[id]` | CONSUMER | Transaction detail with event timeline |
| `/wallet/manage` | CONSUMER | Multi-wallet list, labels, primary |
| `/wallet/trust` | CONSUMER | Trustline management (USDC, custom assets) |
| `/rewards/referrals/create` | CONSUMER | Generate new referral code |
| `/campaigns/[id]/edit` | MERCHANT_OPERATOR | Edit campaign |
| `/transactions/tax-report` | CONSUMER | Annual tax report generator |
| `/aml/dashboard` | ADMIN/MERCHANT | Risk screening results |

---

## 6️⃣ MISSING UI COMPONENTS REQUIRED 🧩

| Component | Purpose | Backend Integration |
|---|---|---|
| `AdminLayout` / `AdminSidebar` | Admin app shell | `/admin/*` routes |
| `UserManagementTable` | List users, filter, paginate | `GET /admin/users` |
| `UserStatusBadge` + `UserStatusAction` | Toggle active/suspended/deleted | `PATCH /admin/users/:id/status` |
| `MerchantApprovalQueue` | Pending/approved/rejected tabs | `GET /admin/merchants/pending`, `POST /admin/merchants/:id/approve` |
| `TransactionMonitorTable` | All transactions, filters | `GET /admin/transactions` |
| `RewardMonitorTable` | All rewards, filter by status | `GET /admin/rewards` |
| `AuditLogViewer` | Paginated, searchable logs | `GET /admin/logs` |
| `MerchantRegistrationWizard` | Multi-step: business info → KYC → QR | `POST /merchants`, `POST /kyc/start` |
| `MerchantKycStep` | Document upload, KYCAID iframe | `POST /kyc/start` |
| `MerchantProfileForm` | Edit legal name, display name, VPA, address | `PATCH /merchants/:id` |
| `QrCodeManager` | List, create, toggle active | `POST /merchants/:id/qrs`, `GET /merchants/:id` |
| `CampaignEditForm` | Edit all campaign fields | `PATCH /campaigns/:id` |
| `CampaignStatusActions` | Activate/Pause/Complete buttons | `POST /campaigns/:id/activate` etc |
| `CampaignMerchantLinker` | Search & link merchants | `POST /campaigns/:id/merchants/:merchantId` |
| `TransactionDetailView` | Full txn + events timeline + settlement | `GET /transactions/:id` |
| `TaxReportGenerator` | Year selector, download CSV/PDF | `GET /transactions/me/tax-report` |
| `ReferralCodeGenerator` | Create code, copy link, share | `POST /referrals` |
| `ReferralAcceptFlow` | Enter code, confirm | `POST /referrals/accept` |
| `WalletManager` | List, add label, set primary, disconnect | `GET/POST/PATCH/DELETE /wallets` |
| `TrustlineManager` | Add/remove USDC, custom assets | `POST /stellar/trustline` (needs backend) |
| `AmlRiskBadge` | Display risk score/flags on txn/merchant | `POST /aml/screen` |
| `SettlementTimeline` | Visual timeline of settlement states | `SettlementInstruction` model |
| `TransactionEventTimeline` | Visual event log (created→quoted→authorized→...) | `TransactionEvent[]` in detail |

---

## 7️⃣ RECOMMENDED APPLICATION STRUCTURE & PAGE HIERARCHY 🏗️

### 7.1 Web App (Consumer) — Next.js App Router

```
apps/web/src/app/
├── layout.tsx                 # Root layout + providers
├── page.tsx                   # Landing (exists)
├── dashboard/page.tsx         # Consumer dashboard (exists)
├── pay/page.tsx               # Scan & pay (exists)
├── wallet/
│   ├── page.tsx               # Wallet overview (exists)
│   ├── onramp/page.tsx        # MoneyGram deposit (exists)
│   ├── offramp/page.tsx       # MoneyGram withdrawal (exists)
│   ├── trust/page.tsx         # Trustline manager (NEW)
│   └── manage/page.tsx        # Multi-wallet manager (NEW)
├── history/
│   ├── page.tsx               # Transaction list (exists)
│   └── [id]/page.tsx          # Transaction detail (NEW)
├── rewards/
│   ├── page.tsx               # Rewards overview (exists)
│   ├── history/page.tsx       # Reward list (exists)
│   ├── campaigns/page.tsx     # Active campaigns (exists)
│   ├── campaigns/[id]/page.tsx # Campaign detail (exists)
│   ├── referrals/
│   │   ├── page.tsx           # Referral list (exists)
│   │   └── create/page.tsx    # Generate code (NEW)
│   └── analytics/page.tsx     # Analytics (exists)
├── profile/
│   ├── page.tsx               # Profile (exists)
│   └── trust/page.tsx         # Trust center (exists)
├── kyc/
│   ├── page.tsx               # KYC status + start (NEW - consumer)
│   └── pending/page.tsx       # KYC pending state (NEW)
└── transactions/
    └── tax-report/page.tsx    # Tax report generator (NEW)
```

### 7.2 Merchant App (Sub-app or Role-Gated Routes)

```
apps/web/src/app/merchant/
├── layout.tsx                 # Merchant shell + sidebar
├── page.tsx                   # Dashboard (exists)
├── register/page.tsx          # Onboarding wizard (NEW)
├── kyc/page.tsx               # KYC upload (NEW)
├── profile/page.tsx           # Edit merchant details (NEW)
├── qr-codes/page.tsx          # QR code manager (NEW)
├── settlements/page.tsx       # Settlement tracking (NEW)
├── analytics/page.tsx         # Detailed analytics (NEW)
├── campaigns/
│   ├── page.tsx               # List (exists)
│   ├── create/page.tsx        # Create (exists)
│   ├── [id]/page.tsx          # Detail (exists)
│   └── [id]/edit/page.tsx     # Edit (NEW)
└── transactions/page.tsx      # Filtered list (exists)
```

### 7.3 Admin App (Separate Next.js App)

```
apps/admin/src/app/
├── layout.tsx                 # Admin shell + sidebar
├── page.tsx                   # Overview dashboard (NEW)
├── users/
│   ├── page.tsx               # User management table (NEW)
│   └── [id]/page.tsx          # User detail + status (NEW)
├── merchants/
│   ├── page.tsx               # All merchants (NEW)
│   ├── pending/page.tsx       # Approval queue (NEW)
│   └── [id]/page.tsx          # Merchant detail + actions (NEW)
├── transactions/page.tsx      # All transactions monitor (NEW)
├── rewards/page.tsx           # All rewards monitor (NEW)
├── logs/page.tsx              # Audit logs (NEW)
└── aml/page.tsx               # Risk screening dashboard (NEW)
```

---

## 8️⃣ COMPLETE FRONTEND BLUEPRINT — MVP PRIORITY ORDER 📦

### 🔴 PHASE 1: CRITICAL MVP (Must Have for Launch)

| # | Feature | Backend Ready | Frontend Effort | Pages/Components |
|---|---------|---------------|-----------------|------------------|
| 1 | **Admin Dashboard** | ✅ | 2-3 weeks | 7 pages + 10 components |
| 2 | **Merchant Onboarding Wizard** | ✅ | 1-2 weeks | 4 steps + KYC integration |
| 3 | **Transaction Detail Page** | ✅ | 3-5 days | 1 page + event timeline |
| 4 | **Merchant Profile/QR/Settings** | ✅ | 1 week | 3 pages |
| 5 | **Tax Report Generator** | ✅ | 3-5 days | 1 page + CSV export |
| 6 | **Referral Code Generator** | ✅ | 2-3 days | 1 page + share modal |
| 7 | **KYC Status in Profile/Nav** | ✅ | 1-2 days | Badge + CTA integration |

### 🟡 PHASE 2: POST-MVP ENHANCEMENTS (2-4 weeks)

| # | Feature | Backend Ready | Frontend Effort |
|---|---------|---------------|-----------------|
| 8 | Campaign Edit + Status Controls | ✅ | 1 week |
| 9 | Campaign Merchant Linking UI | ✅ | 3-5 days |
| 10 | Wallet Manager (multi-wallet) | ✅ | 1 week |
| 11 | Trustline Manager | ⚠️ Needs backend | 1 week |
| 12 | Merchant Settlement Dashboard | ✅ | 1 week |
| 13 | AML Risk Dashboard (Admin) | ✅ | 1 week |
| 14 | Referral Accept Flow | ✅ | 3-5 days |

### 🟢 PHASE 3: POLISH & ADVANCED (4+ weeks)

| # | Feature | Backend Ready |
|---|---------|---------------|
| 15 | Transaction Cancel/Refund Flow | ✅ |
| 16 | Batch Settlement Reconciliation | ✅ |
| 17 | Advanced Analytics (charts, exports) | ✅ |
| 18 | White-label Merchant Portal | ❌ Needs work |
| 19 | Webhook/Callback Debugger | ✅ |
| 20 | Mobile App (React Native) | ❌ New platform |

---

## 9️⃣ DATA MODEL → UI MAPPING (For Component Design)

| Prisma Model | Primary UI Representation | Key Fields for Display |
|---|---|---|
| `User` | Profile card, Admin user row | `displayName`, `email`, `role`, `status`, `kycStatus`, `referralCode` |
| `Wallet` | Wallet list item | `provider`, `address` (truncated), `label`, `isPrimary`, `status` |
| `Merchant` | Merchant card, Admin row | `displayName`, `merchantCode`, `defaultUpiVpa`, `status`, `riskLevel` |
| `Transaction` | Transaction row, Detail view | `publicId`, `amountInPaise`, `assetIn`, `status`, `merchantName`, `rewardAmount`, `createdAt` |
| `TransactionEvent` | Timeline step | `eventType`, `status`, `payload`, `createdAt` |
| `Reward` | Reward row, Detail | `reason`, `starAmount`, `status`, `formulaVersion`, `mintedAt` |
| `Campaign` | Campaign card, Detail | `name`, `status`, `rewardType`, `multiplier`, `budgetStar`, `spentStar`, `startsAt`, `endsAt` |
| `Referral` | Referral row | `code`, `status`, `invitedUser`, `rewardAmountStar`, `qualifiedAt` |
| `SettlementInstruction` | Settlement row | `amountPaise`, `rail`, `status`, `mockReference`, `confirmedAt` |
| `AdminLog` | Audit log row | `action`, `targetType`, `targetId`, `actor`, `createdAt` |
| `AmlScreeningResult` | Risk badge | `riskScore`, `riskLevel`, `flags[]`, `provider` |

---

## 🔟 SDK → FRONTEND INTEGRATION CHECKLIST

| SDK Method | Used in Frontend | Missing Usage |
|---|---|---|
| `auth.mockLogin` | ✅ Landing, demo | — |
| `auth.walletChallenge` | ❌ | Real wallet auth flow |
| `auth.walletLogin` | ❌ | Real wallet auth flow |
| `auth.getCurrentUser` | ✅ Providers | — |
| `users.getProfile` | ❌ | Profile page |
| `wallets.connectWallet` | ✅ Freighter flow | — |
| `wallets.listWallets` | ⚠️ Dashboard only | Wallet manager page |
| `wallets.disconnect` | ⚠️ Profile button | Wallet manager |
| `merchants.getMyMerchant` | ✅ Merchant dashboard | — |
| `merchants.getMerchantAnalytics` | ✅ Merchant dashboard | — |
| `transactions.createTransaction` | ✅ Pay page | — |
| `transactions.getQuote` | ✅ Pay page | — |
| `transactions.listTransactions` | ✅ History, Merchant, Dashboard | — |
| `transactions.getTransaction` | ❌ | Transaction detail page |
| `transactions.cancelTransaction` | ❌ | Detail page action |
| `rewards.getRewards` | ✅ Dashboard, Rewards | — |
| `rewards.listRewards` | ✅ Reward history | — |
| `campaigns.listCampaigns` | ✅ Consumer + Merchant | — |
| `campaigns.createCampaign` | ✅ Merchant create | — |
| `campaigns.updateCampaign` | ❌ | Campaign edit page |
| `campaigns.activateCampaign` | ❌ | Campaign detail actions |
| `referrals.generateReferralCode` | ❌ | Referral create page |
| `referrals.listReferrals` | ✅ Referral page | — |
| `analytics.getDashboardMetrics` | ✅ Merchant dashboard | — |
| `analytics.getConsumerRewardMetrics` | ✅ Rewards page | — |
| `admin.listUsers` | ❌ | Admin user management |
| `admin.listPendingMerchants` | ❌ | Admin merchant queue |
| `admin.approveMerchant` | ❌ | Admin merchant actions |
| `ramps.authenticate` | ✅ On/Off ramp | — |
| `ramps.initiateDeposit` | ✅ On-ramp | — |
| `ramps.initiateWithdrawal` | ✅ Off-ramp | — |
| `kyc.start` | ✅ KycOnboarding modal | — |
| `kyc.getStatus` | ✅ Store sync | — |
| `stellar.getStarBalance` | ✅ StarBalance component | — |
| `stellar.getMerchantStatus` | ❌ | MerchantStatus component (unused) |

---

## 🎯 IMMEDIATE NEXT STEPS

1. **Create Admin App** — Scaffold `/admin/*` routes in `apps/admin` with sidebar navigation
2. **Build Merchant Onboarding** — Multi-step wizard in `apps/web/src/app/merchant/register/`
3. **Implement Transaction Detail** — Create `/history/[id]/page.tsx` with event timeline
4. **Wire Referral Generation** — Replace hardcoded code with `referrals.generateReferralCode()`
5. **Add KYC Status to Nav/Profile** — Show badge, link to `/kyc` page
6. **Build Campaign Edit Page** — `/merchant/campaigns/[id]/edit/page.tsx`
7. **Create Wallet Manager** — `/wallet/manage/page.tsx` with list, label, primary, disconnect
8. **Add Tax Report Button** — In history page, link to `/transactions/tax-report`

---

## 📊 COVERAGE SUMMARY

| Layer | Backend Capability | Frontend Coverage | Gap |
|-------|-------------------|-------------------|-----|
| **Auth** | JWT, Mock, Wallet (SEP-10) | Mock + Freighter | Wallet login flow incomplete |
| **Consumer Core** | Pay, History, Rewards, Wallet, KYC | 85% | Tax report, Tx detail, Referral gen |
| **Merchant Core** | Dashboard, Campaigns, Txns, Analytics | 60% | Onboarding, Profile, QR, Settlements, Campaign edit |
| **Admin** | Users, Merchants, Txns, Rewards, Logs | 0% | **Entire admin app missing** |
| **Ramps** | SEP-10/24 Deposit/Withdraw | 90% | Merchant reconciliation |
| **Stellar** | STAR balance, Contract status | 70% | Merchant status, Trustlines |
| **AML** | Screen, Batch, Sanctions | 0% | **Entire feature missing** |
| **Referrals** | Invite, Accept, Qualify, Reward | 40% | Code gen, accept flow |

**Total Backend Endpoints**: ~90+  
**Frontend-Connected Endpoints**: ~45  
**Coverage**: **~50%**

---

*The backend is production-ready with comprehensive domain logic. The frontend needs systematic investment in **Admin**, **Merchant Onboarding**, and **Transaction Detail** to achieve parity.*