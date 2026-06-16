import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString, MaxLength } from "class-validator";

import { WalletNetwork, WalletProvider } from "../../generated/prisma";

export class WalletChallengeDto {
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
}
