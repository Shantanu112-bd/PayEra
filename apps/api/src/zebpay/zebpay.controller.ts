import { Controller, Get, Post, Body, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ZebpayService } from './zebpay.service';

@ApiTags('Zebpay')
@Controller('zebpay')
export class ZebpayController {
  private readonly logger = new Logger(ZebpayController.name);

  constructor(private readonly zebpayService: ZebpayService) {}

  @Get('callback')
  @ApiOperation({ summary: 'Zebpay OAuth callback' })
  async handleCallback(@Query('code') code: string, @Query('state') state: string) {
    this.logger.log('Received Zebpay callback');
    return this.zebpayService.handleCallback(code, state);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Zebpay webhook' })
  async handleWebhook(@Body() payload: any) {
    this.logger.log('Received Zebpay webhook');
    return this.zebpayService.processWebhook(payload);
  }
}
