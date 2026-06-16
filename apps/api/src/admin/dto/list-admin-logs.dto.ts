import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

import { PaginationDto } from "../../common/dto/pagination.dto";

export class ListAdminLogsDto extends PaginationDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @ApiPropertyOptional({ example: "merchant.approve", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  action?: string;

  @ApiPropertyOptional({ example: "merchant", maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  targetType?: string;
}
