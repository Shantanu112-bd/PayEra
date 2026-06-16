import { Controller, Get, Query } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";


@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("dashboard")
  async getDashboardMetrics(@Query("merchantId") merchantId?: string) {
    return this.analyticsService.getDashboardMetrics(merchantId);
  }

  @Get("revenue")
  async getRevenueMetrics(@Query("merchantId") merchantId?: string) {
    return this.analyticsService.getRevenueMetrics(merchantId);
  }

  @Get("rewards")
  async getRewardMetrics(@Query("merchantId") merchantId?: string) {
    return this.analyticsService.getRewardMetrics(merchantId);
  }

  @Get("campaigns")
  async getCampaignMetrics(@Query("merchantId") merchantId?: string) {
    return this.analyticsService.getCampaignMetrics(merchantId);
  }

  @Get("consumer-rewards")
  async getConsumerRewardMetrics(@Query("userId") userId?: string) {
    return this.analyticsService.getConsumerRewardMetrics(userId);
  }
}
