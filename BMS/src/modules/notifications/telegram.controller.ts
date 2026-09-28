import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import {
  TelegramChatPurpose,
  TelegramChatScopeType,
} from './entities/telegram-chat-target.entity';
import { TelegramService } from './telegram.service';

@ApiTags('telegram')
@Controller('telegram')
@Auth()
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Get('chat-targets')
  @Permissions('settings:read')
  @ApiOperation({ summary: 'List Telegram chat targets' })
  listTargets(
    @Query('scope_type') scope_type?: TelegramChatScopeType,
    @Query('scope_id') scope_id?: string,
    @Query('purpose') purpose?: TelegramChatPurpose,
    @Query('is_active') is_active?: string,
  ) {
    return this.telegramService.listTargets({
      scope_type,
      scope_id,
      purpose,
      is_active:
        is_active === undefined ? undefined : is_active === 'true',
    });
  }

  @Post('chat-targets')
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Create Telegram chat target' })
  createTarget(@Body() dto: any) {
    return this.telegramService.createTarget(dto);
  }

  @Patch('chat-targets/:id')
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Update Telegram chat target' })
  updateTarget(@Param('id') id: string, @Body() dto: any) {
    return this.telegramService.updateTarget(id, dto);
  }

  @Delete('chat-targets/:id')
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Delete Telegram chat target' })
  deleteTarget(@Param('id') id: string) {
    return this.telegramService.deleteTarget(id);
  }

  @Post('chat-targets/:id/test')
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Send test message to Telegram chat target' })
  testTarget(@Param('id') id: string) {
    return this.telegramService.testTarget(id);
  }

  @Post('test-bot')
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Test Telegram bot token' })
  testBot() {
    return this.telegramService.testBot();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user Telegram connection status' })
  getMyTelegram(@Req() req: any) {
    return this.telegramService.getUserStatus(req.user.id);
  }

  @Post('me/username')
  @ApiOperation({ summary: 'Update current user Telegram username' })
  updateMyTelegramUsername(
    @Req() req: any,
    @Body() body: { telegram_username?: string },
  ) {
    return this.telegramService.updateUserTelegramUsername(
      req.user.id,
      body.telegram_username,
    );
  }

  @Post('me/connect-link')
  @ApiOperation({ summary: 'Generate Telegram connect link for current user' })
  createMyConnectLink(
    @Req() req: any,
    @Body() body: { telegram_username?: string },
  ) {
    return this.telegramService.createConnectLink(
      req.user.id,
      body.telegram_username,
    );
  }

  @Post('me/resend-connect-email')
  @ApiOperation({ summary: 'Send Telegram connect email to current user' })
  resendMyConnectEmail(
    @Req() req: any,
    @Body() body: { telegram_username?: string },
  ) {
    return this.telegramService.sendConnectEmail(
      req.user.id,
      body.telegram_username,
    );
  }

  @Post('me/disconnect')
  @ApiOperation({ summary: 'Disconnect Telegram for current user' })
  disconnectMyTelegram(@Req() req: any) {
    return this.telegramService.disconnectUser(req.user.id);
  }
}
