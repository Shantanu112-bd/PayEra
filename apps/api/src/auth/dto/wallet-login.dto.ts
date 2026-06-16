import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

import { UserRole, WalletNetwork, WalletProvider } from "../../generated/prisma";

export class WalletLoginDto {
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

  @ApiProperty({ example: "mock_signature_for_demo" })
  @IsString()
  @MinLength(8)
  @MaxLength(512)
  signature!: string;

  @ApiProperty({ example: "CryptoPay login: ..." })
  @IsString()
  @MinLength(8)
  @MaxLength(512)
  message!: string;

  @ApiPropertyOptional({ example: "Asha Rao", maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  displayName?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.CONSUMER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
