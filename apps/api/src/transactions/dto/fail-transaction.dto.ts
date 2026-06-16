import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class FailTransactionDto {
  @ApiProperty({ example: "MOCK_SETTLEMENT_FAILED", maxLength: 80 })
  @IsString()
  @MaxLength(80)
  failureCode!: string;

  @ApiPropertyOptional({ example: "Mock settlement processor returned failure." })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  failureMessage?: string;
}
