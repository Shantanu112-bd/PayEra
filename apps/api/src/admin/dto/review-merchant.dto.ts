import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsObject, IsOptional } from "class-validator";

import { RiskLevel } from "../../generated/prisma";

export class ReviewMerchantDto {
  @ApiPropertyOptional({ enum: RiskLevel })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @ApiPropertyOptional({ additionalProperties: true, type: "object" })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
