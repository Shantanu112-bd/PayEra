import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

import { PaginationDto } from "../../common/dto/pagination.dto";
import { CampaignStatus, CampaignRewardType } from "../../generated/prisma";

export class ListCampaignsDto extends PaginationDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ enum: CampaignStatus })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional({ enum: CampaignRewardType })
  @IsOptional()
  @IsEnum(CampaignRewardType)
  rewardType?: CampaignRewardType;

  @ApiPropertyOptional({ example: "launch", maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  search?: string;
}
