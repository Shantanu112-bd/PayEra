import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

import { WalletStatus } from "../../generated/prisma";

export class UpdateWalletDto {
  @ApiPropertyOptional({ example: "Primary Freighter", maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ enum: WalletStatus })
  @IsOptional()
  @IsEnum(WalletStatus)
  status?: WalletStatus;

  @ApiPropertyOptional({ additionalProperties: true, type: "object" })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
