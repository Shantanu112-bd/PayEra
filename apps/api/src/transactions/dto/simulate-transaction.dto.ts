import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class SimulateTransactionDto {
  @ApiPropertyOptional({
    example: "mock_stellar_hash_123",
    maxLength: 128,
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  stellarTransactionHash?: string;
}
