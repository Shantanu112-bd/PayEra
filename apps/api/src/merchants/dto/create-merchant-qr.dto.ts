import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString, MaxLength } from "class-validator";

import { IsPositiveBigIntString } from "../../common/validators/is-bigint-string.validator";
import { IsUpiVpa } from "../../common/validators/is-upi-vpa.validator";

export class CreateMerchantQrDto {
  @ApiProperty({ example: "raofresh@upi", maxLength: 120 })
  @IsUpiVpa()
  @MaxLength(120)
  upiVpa!: string;

  @ApiPropertyOptional({ example: "50000" })
  @IsOptional()
  @IsPositiveBigIntString()
  defaultAmountPaise?: string;

  @ApiPropertyOptional({ additionalProperties: true, type: "object" })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: "Override generated mock UPI payload.",
    example: "upi://pay?pa=raofresh@upi&pn=Rao%20Fresh%20Mart",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  qrPayload?: string;
}
