import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TransactionProcessorService } from './transaction-processor.service';
import { StellarModule } from '../stellar/stellar.module';
import { SettlementModule } from '../settlement/settlement.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ScheduleModule,
    forwardRef(() => StellarModule),
    SettlementModule,
    PrismaModule,
  ],
  providers: [TransactionProcessorService],
})
export class TransactionProcessorModule {}
