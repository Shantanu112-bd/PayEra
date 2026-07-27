import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedPrincipal } from '../common/decorators/current-user.decorator';
import { RampsService } from './ramps.service';
import { InitiateRampDto } from './dto/initiate-ramp.dto';
import { ListRampsDto } from './dto/list-ramps.dto';

@ApiTags('ramps')
@Controller('ramps')
@UseGuards(JwtAuthGuard)
export class RampsController {
  constructor(private readonly rampsService: RampsService) {}

  @Get('providers')
  @ApiOperation({ summary: 'List registered fiat ramp providers and capabilities' })
  listProviders() {
    return this.rampsService.listProviders();
  }

  // Ramp INITIATION is money-movement and hits the anchor (SEP-10 + SEP-24),
  // so it is rate-limited well below the global 100/min: 5 per minute per
  // client. Mirrors the strict limit on sensitive auth endpoints.
  @Post('onramp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Initiate a fiat -> crypto on-ramp (cash-in)' })
  initiateOnRamp(@CurrentUser() user: AuthenticatedPrincipal, @Body() dto: InitiateRampDto) {
    return this.rampsService.initiateOnRamp({
      userId: user.id,
      providerId: dto.providerId,
      userStellarAddress: dto.userStellarAddress,
      amount: dto.amount,
      assetCode: dto.assetCode,
    });
  }

  @Post('offramp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Initiate a crypto -> fiat off-ramp (cash-out / pickup)' })
  initiateOffRamp(@CurrentUser() user: AuthenticatedPrincipal, @Body() dto: InitiateRampDto) {
    return this.rampsService.initiateOffRamp({
      userId: user.id,
      providerId: dto.providerId,
      userStellarAddress: dto.userStellarAddress,
      amount: dto.amount,
      assetCode: dto.assetCode,
    });
  }

  // NOTE: literal routes declared BEFORE the ":id" param route so they are
  // not shadowed by it.
  @Get('history')
  @ApiOperation({ summary: 'Paginated ramp history for the current user' })
  listRamps(@CurrentUser() user: AuthenticatedPrincipal, @Query() query: ListRampsDto) {
    return this.rampsService.listRamps(user.id, query.page ?? 1, query.limit ?? 20);
  }

  // Status read triggers a provider poll (SEP-10 + /transaction fetch); capped
  // at 30/min per client so a client cannot hammer the anchor via read-through.
  @Get(':id')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Get a single ramp (refreshes status from provider)' })
  async getRamp(@CurrentUser() user: AuthenticatedPrincipal, @Param('id') id: string) {
    // Read-through: refresh from provider (poll), then return persisted state.
    const ramp = await this.rampsService.getRamp(user.id, id);
    return ramp;
  }
}
