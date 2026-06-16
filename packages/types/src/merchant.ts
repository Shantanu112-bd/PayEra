import { MerchantStatus, RiskLevel } from "./enums";

export interface Merchant {
  id: string;
  ownerUserId: string | null;
  approvedByAdminId: string | null;
  merchantCode: string;
  legalName: string;
  displayName: string;
  defaultUpiVpa: string | null;
  category: string | null;
  status: MerchantStatus;
  riskLevel: RiskLevel;
  city: string | null;
  state: string | null;
  country: string;
  postalCode: string | null;
  gstin: string | null;
  mockKycReference: string | null;
  approvedAt: Date | string | null;
  metadata: any;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MerchantQrCode {
  id: string;
  merchantId: string;
  upiVpa: string;
  qrPayload: string;
  qrPayloadHash: string;
  defaultAmountPaise: string | null;
  isActive: boolean;
  metadata: any;
  createdAt: Date | string;
  updatedAt: Date | string;
}
