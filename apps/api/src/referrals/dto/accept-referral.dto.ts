import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class AcceptReferralDto {
  @ApiProperty({ example: "A1B2C3D4E5", maxLength: 32 })
  @IsString()
  @MaxLength(32)
  code!: string;
}
