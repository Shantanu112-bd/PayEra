export enum UserRole {
  CONSUMER = "CONSUMER",
  MERCHANT_OPERATOR = "MERCHANT_OPERATOR",
  BRAND_OPERATOR = "BRAND_OPERATOR",
  ADMIN = "ADMIN",
}

export enum UserStatus {
  PENDING_ONBOARDING = "PENDING_ONBOARDING",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

export enum WalletProvider {
  FREIGHTER = "FREIGHTER",
  WALLET_CONNECT = "WALLET_CONNECT",
  MOCK = "MOCK",
}

export enum WalletNetwork {
  STELLAR = "STELLAR",
  ETHEREUM = "ETHEREUM",
  BITCOIN = "BITCOIN",
  SOLANA = "SOLANA",
}

export enum WalletStatus {
  ACTIVE = "ACTIVE",
  DISCONNECTED = "DISCONNECTED",
  REVOKED = "REVOKED",
}

export enum MerchantStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}

export enum BrandStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  ARCHIVED = "ARCHIVED",
}

export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  BLOCKED = "BLOCKED",
}

export enum CampaignStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum CampaignRewardType {
  SPEND_THRESHOLD = "SPEND_THRESHOLD",
  REFERRAL = "REFERRAL",
  BONUS = "BONUS",
}

export enum TransactionStatus {
  CREATED = "CREATED",
  QUOTED = "QUOTED",
  AUTHORIZED = "AUTHORIZED",
  CONVERTING = "CONVERTING",
  ROUTING_STELLAR = "ROUTING_STELLAR",
  SETTLING = "SETTLING",
  REWARDING = "REWARDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum TransactionType {
  CRYPTO_TO_FIAT = "CRYPTO_TO_FIAT",
}

export enum PaymentRail {
  UPI_MOCK = "UPI_MOCK",
}

export enum SettlementLayer {
  STELLAR = "STELLAR",
}

export enum AssetCode {
  ETH = "ETH",
  BTC = "BTC",
  SOL = "SOL",
  XLM = "XLM",
  USDC = "USDC",
  INR = "INR",
}

export enum SettlementStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  CONFIRMED = "CONFIRMED",
  FAILED = "FAILED",
}

export enum RewardReason {
  SPEND = "SPEND",
  REFERRAL = "REFERRAL",
  CAMPAIGN = "CAMPAIGN",
  MERCHANT = "MERCHANT",
}

export enum RewardStatus {
  PENDING = "PENDING",
  MINTED = "MINTED",
  FAILED = "FAILED",
  REVERSED = "REVERSED",
}

export enum ReferralStatus {
  INVITED = "INVITED",
  QUALIFIED = "QUALIFIED",
  REWARDED = "REWARDED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export enum OutboxStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  PROCESSED = "PROCESSED",
  FAILED = "FAILED",
}
