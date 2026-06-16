import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

import { UserStatus } from "../../generated/prisma";

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus })
  @IsEnum(UserStatus)
  status!: UserStatus;
}
