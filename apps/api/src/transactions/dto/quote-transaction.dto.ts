import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

import { IsPositiveBigIntString } from "../../common/validators/is-bigint-string.validator";
import { AssetCode } from "../../generated/prisma";

export class QuoteTransactionDto {
  @ApiProperty({ enum: AssetCode, example: AssetCode.USDC })
  @IsEnum(AssetCode)
  assetIn!: AssetCode;

  @ApiProperty({ example: "50000" })
  @IsPositiveBigIntString()
  amountInPaise!: string;
}
