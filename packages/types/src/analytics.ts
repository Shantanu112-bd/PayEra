export interface AnalyticsEventPayload {
  eventName: string;
  userId?: string;
  sessionId?: string;
  properties: Record<string, any>;
  timestamp?: number;
  source?: "web" | "admin" | "api" | "worker";
}

export interface DashboardMetricsDto {
  totalVolumeInr: number;
  totalTransactions: number;
  totalRewardsMinted: number;
  activeCampaigns: number;
}

export interface RevenueDataPoint {
  date: string;
  volume: number;
  count: number;
}

export interface TransactionDataPoint {
  date: string;
  usdc: number;
  xlm: number;
}

export interface RevenueMetricsDto {
  timeSeries: RevenueDataPoint[];
  transactionSeries: TransactionDataPoint[];
  totalVolume: number;
  averageOrderValueInr: number;
}

export interface RewardDistributionPoint {
  name: string;
  value: number;
}

export interface RewardMetricsDto {
  totalMinted: number;
  campaignDistribution: RewardDistributionPoint[];
  byReason: {
    SPEND: number;
    REFERRAL: number;
    CAMPAIGN: number;
    MERCHANT: number;
  };
}

export interface CampaignMetricsDto {
  totalBudget: number;
  totalSpent: number;
  activeCampaignsCount: number;
  merchantsParticipating: number;
}

export interface ConsumerRewardMetricsDto {
  totalEarned: number;
  timeSeries: { month: string; earned: number }[];
  byReason: {
    SPEND: number;
    REFERRAL: number;
    CAMPAIGN: number;
    MERCHANT: number;
  };
}
