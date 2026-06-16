import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsUUID } from "class-validator";

import { PaginationDto } from "../../common/dto/pagination.dto";
import { RewardReason, RewardStatus } from "../../generated/prisma";

export class ListRewardsDto extends PaginationDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ enum: RewardReason })
  @IsOptional()
  @IsEnum(RewardReason)
  reason?: RewardReason;

  @ApiPropertyOptional({ enum: RewardStatus })
  @IsOptional()
  @IsEnum(RewardStatus)
  status?: RewardStatus;
}
