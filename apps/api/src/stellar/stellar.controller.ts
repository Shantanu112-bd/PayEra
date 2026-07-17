import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SorobanService } from './soroban.service';

@ApiTags('Stellar')
@Controller('stellar')
export class StellarController {
  constructor(private readonly sorobanService: SorobanService) {}

  @Get('star-balance/:address')
  @ApiOperation({ summary: 'Get STAR token balance for a wallet address from Soroban contract' })
  async getStarBalance(@Param('address') address: string) {
    const balance = await this.sorobanService.getStarBalance(address);
    return {
      address,
      starBalance: balance.toString(),
      starBalanceFormatted: Number(balance).toLocaleString(),
    };
  }

  @Get('merchant/:merchantId/status')
  @ApiOperation({ summary: 'Check if a merchant is approved on-chain' })
  async getMerchantStatus(@Param('merchantId') merchantId: string) {
    const isApproved = await this.sorobanService.isMerchantApproved(merchantId);
    const merchant = await this.sorobanService.getMerchant(merchantId);
    return {
      merchantId,
      isApproved,
      onChainData: merchant,
    };
  }
}