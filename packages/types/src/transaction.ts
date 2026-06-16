import {
  AssetCode,
  PaymentRail,
  SettlementLayer,
  SettlementStatus,
  TransactionStatus,
  TransactionType,
} from "./enums";

export interface Transaction {
  id: string;
  publicId: string;
  userId: string;
  walletId: string | null;
  merchantId: string;
  merchantQrCodeId: string | null;
  campaignId: string | null;
  type: TransactionType;
  status: TransactionStatus;
  rail: PaymentRail;
  settlementLayer: SettlementLayer;
  assetIn: AssetCode;
  amountInCrypto: string | null;
  amountInPaise: string;
  quoteRateInrPerAsset: string | null;
  usdcAmount: string | null;
  networkFeePaise: string;
  merchantSettlementPaise: string;
  merchantUpiVpa: string;
  qrPayloadHash: string | null;
  stellarLedger: string | null;
  stellarTransactionHash: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  expiresAt: Date | string | null;
  authorizedAt: Date | string | null;
  completedAt: Date | string | null;
  metadata: any;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TransactionEvent {
  id: string;
  transactionId: string;
  sequence: number;
  status: TransactionStatus | null;
  eventType: string;
  payload: any;
  createdAt: Date | string;
}

export interface SettlementInstruction {
  id: string;
  transactionId: string;
  merchantId: string;
  amountPaise: string;
  currency: AssetCode;
  rail: PaymentRail;
  status: SettlementStatus;
  mockReference: string | null;
  attemptedAt: Date | string | null;
  confirmedAt: Date | string | null;
  failureReason: string | null;
  metadata: any;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// DTO Interfaces matching backend
export interface CreateTransactionRequest {
  walletId?: string;
  merchantId: string;
  merchantQrCodeId?: string;
  campaignId?: string;
  assetIn: AssetCode;
  amountInPaise: string;
  merchantUpiVpa?: string;
  qrPayload?: string;
}

export interface QuoteTransactionRequest {
  assetIn: AssetCode;
  amountInPaise: string;
}

export interface SimulateTransactionRequest {
  networkFeePaise?: string;
}

export interface FailTransactionRequest {
  failureCode: string;
  failureMessage?: string;
}
