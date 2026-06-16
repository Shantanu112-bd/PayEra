import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsUUID } from "class-validator";

import { PaginationDto } from "../../common/dto/pagination.dto";
import { AssetCode, TransactionStatus } from "../../generated/prisma";

export class ListTransactionsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({ enum: AssetCode })
  @IsOptional()
  @IsEnum(AssetCode)
  assetIn?: AssetCode;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  merchantId?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  campaignId?: string;
}
