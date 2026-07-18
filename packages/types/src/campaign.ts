import { BrandStatus, CampaignRewardType, CampaignStatus } from "./enums";

export interface Brand {
  id: string;
  ownerUserId: string | null;
  name: string;
  slug: string;
  status: BrandStatus;
  metadata: any;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Campaign {
  id: string;
  brandId: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  rewardType: CampaignRewardType;
  thresholdAmountPaise: string;
  rewardAmountStar: string;
  budgetStar: string;
  spentStar: string;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
  metadata: any;
  merchants?: any[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CampaignMerchant {
  campaignId: string;
  merchantId: string;
  isActive: boolean;
  joinedAt: Date | string;
}
