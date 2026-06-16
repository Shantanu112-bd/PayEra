import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsObject, IsOptional } from "class-validator";

export class MetadataDto {
  @ApiPropertyOptional({
    additionalProperties: true,
    example: {},
    type: "object",
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
