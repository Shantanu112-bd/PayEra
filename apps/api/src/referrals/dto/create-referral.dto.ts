import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsObject, IsOptional } from "class-validator";

export class CreateReferralDto {
  @ApiPropertyOptional({ example: "2026-08-01T00:00:00.000Z" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;

  @ApiPropertyOptional({ additionalProperties: true, type: "object" })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
