import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsEnum, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

import { IsPositiveBigIntString } from "../../common/validators/is-bigint-string.validator";
import { CampaignStatus } from "../../generated/prisma";

export class UpdateCampaignDto {
  @ApiPropertyOptional({ example: "Spend INR 500, earn 50 STAR", maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({ example: "Updated brand-funded campaign." })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: CampaignStatus })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional({ example: "50000" })
  @IsOptional()
  @IsPositiveBigIntString()
  thresholdAmountPaise?: string;

  @ApiPropertyOptional({ example: "50" })
  @IsOptional()
  @IsPositiveBigIntString()
  rewardAmountStar?: string;

  @ApiPropertyOptional({ example: "100000" })
  @IsOptional()
  @IsPositiveBigIntString()
  budgetStar?: string;

  @ApiPropertyOptional({ example: "2026-07-01T00:00:00.000Z" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startsAt?: Date;

  @ApiPropertyOptional({ example: "2026-08-01T00:00:00.000Z" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endsAt?: Date;

  @ApiPropertyOptional({ additionalProperties: true, type: "object" })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
