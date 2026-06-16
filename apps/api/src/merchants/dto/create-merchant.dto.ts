import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString, IsUUID, Length, MaxLength } from "class-validator";

import { IsUpiVpa } from "../../common/validators/is-upi-vpa.validator";

export class CreateMerchantDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @ApiProperty({ example: "Rao Retail Private Limited", maxLength: 180 })
  @IsString()
  @MaxLength(180)
  legalName!: string;

  @ApiProperty({ example: "Rao Fresh Mart", maxLength: 120 })
  @IsString()
  @MaxLength(120)
  displayName!: string;

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

  @ApiPropertyOptional({ example: "27ABCDE1234F1Z5", maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  gstin?: string;

  @ApiPropertyOptional({ additionalProperties: true, type: "object" })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
