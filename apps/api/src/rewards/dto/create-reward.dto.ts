import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

import { IsPositiveBigIntString } from "../../common/validators/is-bigint-string.validator";
import { RewardReason, RewardStatus } from "../../generated/prisma";

export class CreateRewardDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  transactionId?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  referralId?: string;

  @ApiProperty({ enum: RewardReason, example: RewardReason.CAMPAIGN })
  @IsEnum(RewardReason)
  reason!: RewardReason;

  @ApiProperty({ example: "50" })
  @IsPositiveBigIntString()
  starAmount!: string;

  @ApiPropertyOptional({ enum: RewardStatus, example: RewardStatus.PENDING })
  @IsOptional()
  @IsEnum(RewardStatus)
  status?: RewardStatus;

  @ApiPropertyOptional({ example: "STAR_SPEND_V1", maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  formulaVersion?: string;

  @ApiPropertyOptional({ additionalProperties: true, type: "object" })
  @IsOptional()
  @IsObject()
  ruleSnapshot?: Record<string, unknown>;

  @ApiPropertyOptional({ additionalProperties: true, type: "object" })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
