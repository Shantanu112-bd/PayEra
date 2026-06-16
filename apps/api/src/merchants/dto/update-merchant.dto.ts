import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsObject, IsOptional, IsString, Length, MaxLength } from "class-validator";

import { IsUpiVpa } from "../../common/validators/is-upi-vpa.validator";
import { MerchantStatus, RiskLevel } from "../../generated/prisma";

export class UpdateMerchantDto {
  @ApiPropertyOptional({ example: "Rao Fresh Mart", maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @ApiPropertyOptional({ example: "raofresh@upi", maxLength: 120 })
  @IsOptional()
  @IsUpiVpa()
  @MaxLength(120)
  defaultUpiVpa?: string;

  @ApiPropertyOptional({ example: "grocery", maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @ApiPropertyOptional({ enum: MerchantStatus })
  @IsOptional()
  @IsEnum(MerchantStatus)
  status?: MerchantStatus;

  @ApiPropertyOptional({ enum: RiskLevel })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @ApiPropertyOptional({ example: "Mumbai", maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({ example: "MH", maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @ApiPropertyOptional({ default: "IN", maxLength: 2, minLength: 2 })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @ApiPropertyOptional({ example: "400001", maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ additionalProperties: true, type: "object" })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
