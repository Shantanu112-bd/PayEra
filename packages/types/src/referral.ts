import { ReferralStatus } from "./enums";

export interface Referral {
  id: string;
  inviterUserId: string;
  invitedUserId: string | null;
  code: string;
  status: ReferralStatus;
  firstTransactionId: string | null;
  rewardAmountStar: string;
  qualifiedAt: Date | string | null;
  rewardedAt: Date | string | null;
  expiresAt: Date | string | null;
  metadata: any;
  createdAt: Date | string;
  updatedAt: Date | string;
}
