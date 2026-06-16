import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

import { WalletNetwork, WalletProvider } from "../../generated/prisma";

export class CreateWalletDto {
  @ApiProperty({ enum: WalletProvider, example: WalletProvider.FREIGHTER })
  @IsEnum(WalletProvider)
  provider!: WalletProvider;

  @ApiProperty({ enum: WalletNetwork, example: WalletNetwork.STELLAR })
  @IsEnum(WalletNetwork)
  network!: WalletNetwork;

  @ApiProperty({ example: "GDUKMGUGDZQK6Y5RXG..." })
  @IsString()
  @MaxLength(191)
  address!: string;

  @ApiPropertyOptional({ example: "Primary Freighter", maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;

  @ApiPropertyOptional({ example: "GDUKMGUGDZQK6Y5RXG...", maxLength: 191 })
  @IsOptional()
  @IsString()
  @MaxLength(191)
  publicKey?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ additionalProperties: true, type: "object" })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
