import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { IsStellarPublicKey } from '../../common/validators/is-stellar-address.validator';

/**
 * Decimal amount string, e.g. "10.5". Kept as a string to avoid float
 * precision loss across the SEP-24 boundary.
 */
const AMOUNT_REGEX = /^\d{1,12}(\.\d{1,7})?$/;

export class InitiateRampDto {
  @ApiProperty({ description: 'Registered ramp provider id', example: 'MONEYGRAM' })
  @IsString()
  @MaxLength(40)
  providerId!: string;

  @ApiProperty({ description: "User's own Stellar public key (non-custodial)" })
  @IsStellarPublicKey()
  userStellarAddress!: string;

  @ApiPropertyOptional({ description: 'Decimal amount. Required for off-ramp.', example: '10.5' })
  @IsOptional()
  @Matches(AMOUNT_REGEX, { message: 'amount must be a positive decimal string' })
  amount?: string;

  @ApiPropertyOptional({ example: 'USDC' })
  @IsOptional()
  @IsIn(['USDC'])
  assetCode?: string;
}
