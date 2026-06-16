import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString, MaxLength } from "class-validator";

import { UserRole } from "../../generated/prisma";

export class MockLoginDto {
  @ApiPropertyOptional({ example: "user@example.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "+919876543210" })
  @IsOptional()
  @IsPhoneNumber()
  phoneE164?: string;

  @ApiPropertyOptional({ example: "Asha Rao", maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  displayName?: string;

  @ApiProperty({
    default: UserRole.CONSUMER,
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
