import { Module } from '@nestjs/common';
import { RampsController } from './ramps.controller';
import { RampsService } from './ramps.service';
import { RampReconciliationService } from './ramp-reconciliation.service';
import { RampProviderRegistry } from './providers/ramp-provider.registry';
import { MoneyGramProvider } from './providers/moneygram.provider';
import { RAMP_PROVIDERS } from './providers/fiat-ramp-provider.interface';
import { PrismaModule } from '../prisma/prisma.module';
import { KycModule } from '../kyc/kyc.module';

/**
 * To add a provider (Onramp.money, Transak, Alchemy Pay, ...):
 *   1. Implement FiatRampProvider in providers/<name>.provider.ts
 *   2. Add its class here (both as a provider and in the RAMP_PROVIDERS factory)
 *   3. Add its id to the RampProvider Prisma enum
 * Nothing else in the app changes.
 */
@Module({
  imports: [PrismaModule, KycModule],
  controllers: [RampsController],
  providers: [
    RampsService,
    RampReconciliationService,
    RampProviderRegistry,
    MoneyGramProvider,
    {
      provide: RAMP_PROVIDERS,
      useFactory: (moneygram: MoneyGramProvider) => [moneygram],
      inject: [MoneyGramProvider],
    },
  ],
  exports: [RampsService],
})
export class RampsModule {}
