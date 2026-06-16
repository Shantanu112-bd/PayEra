import { ApiProperty } from "@nestjs/swagger";

import { IsPositiveBigIntString } from "../../common/validators/is-bigint-string.validator";

export class CalculateSpendRewardDto {
  @ApiProperty({ example: "50000" })
  @IsPositiveBigIntString()
  amountInPaise!: string;
}
