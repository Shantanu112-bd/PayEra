import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";

import { PaginationDto } from "../../common/dto/pagination.dto";
import { WalletNetwork, WalletProvider, WalletStatus } from "../../generated/prisma";

export class ListWalletsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: WalletProvider })
  @IsOptional()
  @IsEnum(WalletProvider)
  provider?: WalletProvider;

  @ApiPropertyOptional({ enum: WalletNetwork })
  @IsOptional()
  @IsEnum(WalletNetwork)
  network?: WalletNetwork;

  @ApiPropertyOptional({ enum: WalletStatus })
  @IsOptional()
  @IsEnum(WalletStatus)
  status?: WalletStatus;
}
