import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";

import { PaginationDto } from "../../common/dto/pagination.dto";
import { ReferralStatus } from "../../generated/prisma";

export class ListReferralsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ReferralStatus })
  @IsOptional()
  @IsEnum(ReferralStatus)
  status?: ReferralStatus;
}
