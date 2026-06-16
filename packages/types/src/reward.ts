import { RewardReason, RewardStatus } from "./enums";

export interface Reward {
  id: string;
  userId: string;
  transactionId: string | null;
  campaignId: string | null;
  referralId: string | null;
  reason: RewardReason;
  status: RewardStatus;
  starAmount: string;
  formulaVersion: string;
  ruleSnapshot: any;
  stellarMintHash: string | null;
  mintedAt: Date | string | null;
  reversedAt: Date | string | null;
  metadata: any;
  createdAt: Date | string;
  updatedAt: Date | string;
}
