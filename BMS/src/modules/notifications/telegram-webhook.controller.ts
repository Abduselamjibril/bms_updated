import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';

@ApiTags('telegram-webhook')
@Controller('telegram')
export class TelegramWebhookController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook/:secret')
  @ApiOperation({ summary: 'Telegram bot webhook receiver' })
  handleWebhook(@Param('secret') secret: string, @Body() update: any) {
    return this.telegramService.handleWebhook(secret, update);
  }
}
