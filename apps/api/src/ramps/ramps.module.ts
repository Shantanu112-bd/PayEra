import { Module } from '@nestjs/common';
import { RampsController } from './ramps.controller';
import { RampsService } from './ramps.service';

@Module({
  controllers: [RampsController],
  providers: [RampsService],
  exports: [RampsService],
})
export class RampsModule {}
