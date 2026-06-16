import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

import { IsPositiveBigIntString } from "../../common/validators/is-bigint-string.validator";
import { CampaignRewardType } from "../../generated/prisma";

export class CreateCampaignDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  brandId!: string;

  @ApiProperty({ example: "Spend INR 500, earn 50 STAR", maxLength: 160 })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ example: "Brand-funded launch campaign." })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    enum: CampaignRewardType,
    default: CampaignRewardType.SPEND_AND_EARN,
  })
  @IsOptional()
  @IsEnum(CampaignRewardType)
  rewardType?: CampaignRewardType;

  @ApiProperty({ example: "50000" })
  @IsPositiveBigIntString()
  thresholdAmountPaise!: string;

  @ApiProperty({ example: "50" })
  @IsPositiveBigIntString()
  rewardAmountStar!: string;

  @ApiProperty({ example: "100000" })
  @IsPositiveBigIntString()
  budgetStar!: string;

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
