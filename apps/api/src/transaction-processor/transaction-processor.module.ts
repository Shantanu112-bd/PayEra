import { Module } from '@nestjs/common';
import { TransactionProcessorService } from './transaction-processor.service';
import { StellarModule } from '../stellar/stellar.module';

@Module({
  imports: [StellarModule],
  providers: [TransactionProcessorService],
})
export class TransactionProcessorModule {}
