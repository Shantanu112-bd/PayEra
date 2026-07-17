import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AmlService, AmlScreeningResult } from './aml.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, type AuthenticatedPrincipal } from '../common/decorators/current-user.decorator';

@ApiTags('AML')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('aml')
export class AmlController {
  constructor(private readonly amlService: AmlService) {}

  @Get('screen')
  @ApiOperation({ summary: 'Screen a wallet address for AML risks' })
  @ApiQuery({ name: 'address', description: 'Stellar wallet address to screen', required: true })
  async screenWallet(@Query('address') address: string): Promise<AmlScreeningResult> {
    if (!address) {
      throw new Error('Wallet address is required');
    }
    return this.amlService.screenWallet(address);
  }
}