import { Module } from "@nestjs/common";

import { CampaignsController } from "./campaigns.controller";
import { CampaignsService } from "./campaigns.service";

@Module({
  controllers: [CampaignsController],
  exports: [CampaignsService],
  providers: [CampaignsService],
})
export class CampaignsModule {}
