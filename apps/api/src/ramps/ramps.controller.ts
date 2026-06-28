import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../generated/prisma';
import { CurrentUser, AuthenticatedPrincipal } from '../common/decorators/current-user.decorator';
import { RampsService } from './ramps.service';

@Controller('ramps')
@UseGuards(JwtAuthGuard)
export class RampsController {
  constructor(private readonly rampsService: RampsService) {}

  @Post('authenticate')
  async authenticate(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() body: { userPublicKey: string }
  ) {
    const token = await this.rampsService.authenticateSep10(body.userPublicKey);
    return { jwtToken: token };
  }

  @Post('deposit')
  async initiateDeposit(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() body: { userPublicKey: string; amount?: string; jwtToken: string }
  ) {
    return this.rampsService.initiateDeposit(body);
  }

  @Post('withdraw')
  async initiateWithdrawal(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() body: { userPublicKey: string; amount: string; jwtToken: string }
  ) {
    return this.rampsService.initiateWithdrawal(body);
  }

  @Get('transaction/:id')
  async getStatus(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('id') id: string,
    @Query('jwt') jwt: string
  ) {
    return this.rampsService.getTransactionStatus({ transactionId: id, jwtToken: jwt });
  }
}
