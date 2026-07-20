import { Module } from '@nestjs/common';
import { ZebpayService } from './zebpay.service';
import { ZebpayController } from './zebpay.controller';

@Module({
  controllers: [ZebpayController],
  providers: [ZebpayService],
  exports: [ZebpayService],
})
export class ZebpayModule {}
