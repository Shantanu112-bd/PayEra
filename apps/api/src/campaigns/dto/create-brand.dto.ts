import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateBrandDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @ApiProperty({ example: "Starbucks India", maxLength: 160 })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: "starbucks-india", maxLength: 80 })
  @IsString()
  @MaxLength(80)
  slug!: string;

  @ApiPropertyOptional({ additionalProperties: true, type: "object" })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
