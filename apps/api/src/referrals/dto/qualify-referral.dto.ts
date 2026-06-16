import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class QualifyReferralDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  firstTransactionId!: string;
}
