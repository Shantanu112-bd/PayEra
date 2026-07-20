import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { StellarModule } from '../stellar/stellar.module';
import { TransactionProcessorService } from './transaction-processor.service';

@Module({
  imports: [
    ScheduleModule,
    PrismaModule,
    StellarModule,
  ],
  providers: [TransactionProcessorService],
})
export class TransactionProcessorModule {}
