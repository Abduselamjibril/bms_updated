import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { SettingsService } from '../settings/settings.service';
import { User } from '../users/entities/user.entity';
import { MailService } from './mail.service';
import { TelegramLinkToken } from './entities/telegram-link-token.entity';
import {
  TelegramChatPurpose,
  TelegramChatScopeType,
  TelegramChatTarget,
} from './entities/telegram-chat-target.entity';
import { UserTelegramAccount } from './entities/user-telegram-account.entity';

type ChatTargetInput = {
  scope_type: TelegramChatScopeType;
  scope_id?: string | null;
  title: string;
  chat_id: string;
  purpose?: TelegramChatPurpose;
  is_active?: boolean;
};

type SendResult = {
  chat_id: string;
  title?: string;
  ok: boolean;
  error?: string;
};

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @InjectRepository(TelegramChatTarget)
    private readonly chatTargetRepo: Repository<TelegramChatTarget>,
    @InjectRepository(UserTelegramAccount)
    private readonly userTelegramRepo: Repository<UserTelegramAccount>,
    @InjectRepository(TelegramLinkToken)
    private readonly linkTokenRepo: Repository<TelegramLinkToken>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly settingsService: SettingsService,
    private readonly mailService: MailService,
  ) {}

  async listTargets(filters?: {
    scope_type?: TelegramChatScopeType;
    scope_id?: string;
    purpose?: TelegramChatPurpose;
    is_active?: boolean;
  }) {
    const where: any = {};
    if (filters?.scope_type) where.scope_type = filters.scope_type;
    if (filters?.scope_id) where.scope_id = filters.scope_id;
    if (filters?.purpose) where.purpose = filters.purpose;
    if (filters?.is_active !== undefined) where.is_active = filters.is_active;

    return this.chatTargetRepo.find({
      where,
      order: { scope_type: 'ASC', title: 'ASC' },
    });
  }

  async createTarget(dto: ChatTargetInput) {
    this.validateTarget(dto);
    const target = this.chatTargetRepo.create({
      ...dto,
      scope_id:
        dto.scope_type === TelegramChatScopeType.GLOBAL
          ? null
          : dto.scope_id,
      purpose: dto.purpose || TelegramChatPurpose.ANNOUNCEMENTS,
      is_active: dto.is_active ?? true,
    });
    return this.chatTargetRepo.save(target);
  }

  async updateTarget(id: string, dto: Partial<ChatTargetInput>) {
    const target = await this.chatTargetRepo.findOne({ where: { id } });
    if (!target) throw new NotFoundException('Telegram chat target not found');

    const next = { ...target, ...dto };
    this.validateTarget(next);

    Object.assign(target, dto);
    if (target.scope_type === TelegramChatScopeType.GLOBAL) {
      target.scope_id = null;
    }
    return this.chatTargetRepo.save(target);
  }

  async deleteTarget(id: string) {
    const target = await this.chatTargetRepo.findOne({ where: { id } });
    if (!target) throw new NotFoundException('Telegram chat target not found');
    await this.chatTargetRepo.remove(target);
    return { deleted: true };
  }

  async testBot() {
    const settings = await this.settingsService.getSettings();
    const token = settings?.telegram_bot_token;
    if (!settings?.telegram_enabled) {
      throw new BadRequestException('Telegram integration is disabled');
    }
    if (!token) {
      throw new BadRequestException('Telegram bot token is not configured');
    }

    const response = await fetch(
      `https://api.telegram.org/bot${token}/getMe`,
    );
    const data = await response.json();
    if (!response.ok || !data?.ok) {
      throw new BadRequestException(
        data?.description || 'Telegram bot test failed',
      );
    }

    return {
      ok: true,
      username: data.result?.username,
      first_name: data.result?.first_name,
    };
  }

  async testTarget(id: string) {
    const target = await this.chatTargetRepo.findOne({ where: { id } });
    if (!target) throw new NotFoundException('Telegram chat target not found');

    this.logger.log(
      `Testing Telegram target ${target.title} (${target.chat_id})`,
    );

    const result = await this.sendMessage(
      target.chat_id,
      'BMS Telegram Test',
      `Test message sent to ${target.title}.`,
    );
    this.logger.log(
      `Telegram target test result for ${target.chat_id}: ${JSON.stringify(result)}`,
    );
    return result;
  }

  async getUserStatus(userId: string) {
    const account = await this.userTelegramRepo.findOne({
      where: { user_id: userId },
    });

    return {
      connected: !!account?.telegram_chat_id && account.is_active,
      telegram_username: account?.telegram_username || null,
      linked_at: account?.linked_at || null,
      is_active: account?.is_active ?? false,
    };
  }

  async updateUserTelegramUsername(userId: string, telegramUsername?: string) {
    const normalized = this.normalizeUsername(telegramUsername);
    let account = await this.userTelegramRepo.findOne({
      where: { user_id: userId },
    });

    if (!account) {
      account = this.userTelegramRepo.create({
        user_id: userId,
        telegram_username: normalized,
        is_active: true,
      });
    } else {
      account.telegram_username = normalized;
      account.is_active = true;
    }

    return this.userTelegramRepo.save(account);
  }

  async createConnectLink(
    userId: string,
    telegramUsername?: string,
    ttlMinutes = 60,
  ) {
    const settings = await this.settingsService.getSettings();
    if (!settings?.telegram_enabled) {
      throw new BadRequestException('Telegram integration is disabled');
    }

    const botUsername = this.normalizeUsername(settings.telegram_bot_username);
    if (!botUsername) {
      throw new BadRequestException('Telegram bot username is not configured');
    }

    if (telegramUsername !== undefined) {
      await this.updateUserTelegramUsername(userId, telegramUsername);
    }

    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.linkTokenRepo.save(
      this.linkTokenRepo.create({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      }),
    );

    return {
      url: `https://t.me/${botUsername.replace(/^@/, '')}?start=${rawToken}`,
      expires_at: expiresAt,
    };
  }

  async sendConnectEmail(userId: string, telegramUsername?: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const link = await this.createConnectLink(userId, telegramUsername);
    await this.mailService.sendMail({
      to: user.email,
      subject: 'Connect Telegram to your BMS account',
      text: `Hello ${user.name},\n\nConnect your Telegram account to receive BMS notifications:\n\n${link.url}\n\nThis link expires at ${link.expires_at.toLocaleString()}.`,
      html: `
        <p>Hello ${this.escapeHtml(user.name)},</p>
        <p>Connect your Telegram account to receive BMS notifications for announcements, invoices, maintenance updates, and tenant messages.</p>
        <p><a href="${link.url}">Connect Telegram</a></p>
        <p>This link expires at ${link.expires_at.toLocaleString()}.</p>
      `,
    });

    return { sent: true, expires_at: link.expires_at };
  }

  async disconnectUser(userId: string) {
    const account = await this.userTelegramRepo.findOne({
      where: { user_id: userId },
    });
    if (!account) return { disconnected: true };

    account.telegram_chat_id = null;
    account.telegram_user_id = null;
    account.linked_at = null;
    account.is_active = false;
    await this.userTelegramRepo.save(account);
    return { disconnected: true };
  }

  async handleWebhook(secret: string, update: any) {
    const settings = await this.settingsService.getSettings();
    if (!settings?.telegram_webhook_secret) {
      throw new BadRequestException('Telegram webhook secret is not configured');
    }
    if (secret !== settings.telegram_webhook_secret) {
      throw new BadRequestException('Invalid Telegram webhook secret');
    }

    const message = update?.message;
    const text = message?.text || '';
    const chat = message?.chat;
    const from = message?.from;

    if (!text.startsWith('/start') || !chat?.id || !from?.id) {
      return { ok: true, ignored: true };
    }

    const token = text.split(/\s+/)[1];
    if (!token) {
      await this.sendRawMessage(
        String(chat.id),
        'Please open Telegram using your BMS connect link.',
      );
      return { ok: true, linked: false };
    }

    const linkToken = await this.linkTokenRepo.findOne({
      where: { token_hash: this.hashToken(token) },
    });

    if (
      !linkToken ||
      linkToken.used_at ||
      linkToken.expires_at.getTime() < Date.now()
    ) {
      await this.sendRawMessage(
        String(chat.id),
        'This BMS Telegram link is invalid or expired. Please request a new link from BMS.',
      );
      return { ok: true, linked: false };
    }

    let account = await this.userTelegramRepo.findOne({
      where: { user_id: linkToken.user_id },
    });
    if (!account) {
      account = this.userTelegramRepo.create({
        user_id: linkToken.user_id,
      });
    }

    account.telegram_user_id = String(from.id);
    account.telegram_chat_id = String(chat.id);
    account.telegram_username =
      this.normalizeUsername(from.username) || account.telegram_username;
    account.linked_at = new Date();
    account.last_verified_at = new Date();
    account.is_active = true;

    linkToken.used_at = new Date();

    await this.userTelegramRepo.save(account);
    await this.linkTokenRepo.save(linkToken);
    await this.sendRawMessage(
      String(chat.id),
      'Your Telegram account is now connected to BMS.',
    );

    return { ok: true, linked: true };
  }

  async sendPrivateUserMessage(
    userId: string,
    title: string,
    message: string,
  ) {
    const settings = await this.settingsService.getSettings();
    if (
      !settings?.telegram_enabled ||
      !settings.telegram_send_private_notifications
    ) {
      return { skipped: true, reason: 'Private Telegram notifications disabled' };
    }

    const account = await this.userTelegramRepo.findOne({
      where: { user_id: userId, is_active: true },
    });
    if (!account?.telegram_chat_id) {
      return { skipped: true, reason: 'User has not connected Telegram' };
    }

    return this.sendRawFormattedMessage(
      account.telegram_chat_id,
      this.formatPrivateTenantMessage(title, message, settings.company_name),
    );
  }

  async sendAnnouncementToScope(
    scope_type: TelegramChatScopeType,
    title: string,
    message: string,
    scope_id?: string,
  ) {
    const settings = await this.settingsService.getSettings();
    if (
      !settings?.telegram_enabled ||
      !settings.telegram_send_announcements ||
      !settings.telegram_bot_token
    ) {
      return { skipped: true, reason: 'Telegram announcements disabled' };
    }

    const where =
      scope_type === TelegramChatScopeType.GLOBAL
        ? {
            scope_type,
            scope_id: IsNull(),
            is_active: true,
          }
        : {
            scope_type,
            scope_id,
            is_active: true,
          };

    const targets = await this.chatTargetRepo.find({ where: where as any });
    if (targets.length === 0) {
      return { skipped: true, reason: 'No Telegram chat targets configured' };
    }

    const results: SendResult[] = [];
    for (const target of targets) {
      results.push(
        await this.sendMessage(target.chat_id, title, message, target.title),
      );
    }

    return {
      skipped: false,
      sent_count: results.filter((r) => r.ok).length,
      failed_count: results.filter((r) => !r.ok).length,
      results,
    };
  }

  async sendMessage(
    chatId: string,
    title: string,
    message: string,
    targetTitle?: string,
  ): Promise<SendResult> {
    const settings = await this.settingsService.getSettings();
    const token = settings?.telegram_bot_token;
    if (!settings?.telegram_enabled || !token) {
      return {
        chat_id: chatId,
        title: targetTitle,
        ok: false,
        error: 'Telegram integration is not configured',
      };
    }

    const text = this.formatMessage(title, message, settings.company_name);

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        this.logger.warn(
          `Telegram send failed for ${chatId}: ${data?.description || response.statusText}`,
        );
        return {
          chat_id: chatId,
          title: targetTitle,
          ok: false,
          error: data?.description || 'Telegram send failed',
        };
      }

      return { chat_id: chatId, title: targetTitle, ok: true };
    } catch (error: any) {
      this.logger.error('Telegram send failed', error);
      return {
        chat_id: chatId,
        title: targetTitle,
        ok: false,
        error: error?.message || 'Telegram send failed',
      };
    }
  }

  private validateTarget(dto: Partial<ChatTargetInput>) {
    if (!dto.scope_type) throw new BadRequestException('Scope type is required');
    if (!dto.title) throw new BadRequestException('Title is required');
    if (!dto.chat_id) throw new BadRequestException('Chat ID is required');
    if (
      dto.scope_type !== TelegramChatScopeType.GLOBAL &&
      !dto.scope_id
    ) {
      throw new BadRequestException('Scope ID is required for site/building');
    }
  }

  private formatMessage(title: string, message: string, companyName?: string) {
    const escape = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const company = companyName || 'BMS';
    return `<b>${escape(title)}</b>\n\n${escape(message)}\n\nSent from ${escape(company)}`;
  }

  private async sendRawMessage(chatId: string, text: string) {
    const settings = await this.settingsService.getSettings();
    const token = settings?.telegram_bot_token;
    if (!settings?.telegram_enabled || !token) return;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    }).catch((error) => this.logger.error('Telegram raw send failed', error));
  }

  private async sendRawFormattedMessage(
    chatId: string,
    text: string,
  ): Promise<SendResult> {
    const settings = await this.settingsService.getSettings();
    const token = settings?.telegram_bot_token;
    if (!settings?.telegram_enabled || !token) {
      return {
        chat_id: chatId,
        ok: false,
        error: 'Telegram integration is not configured',
      };
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        return {
          chat_id: chatId,
          ok: false,
          error: data?.description || 'Telegram send failed',
        };
      }

      return { chat_id: chatId, ok: true };
    } catch (error: any) {
      this.logger.error('Telegram private send failed', error);
      return {
        chat_id: chatId,
        ok: false,
        error: error?.message || 'Telegram send failed',
      };
    }
  }

  private normalizeUsername(username?: string | null) {
    if (!username) return null;
    const trimmed = username.trim();
    if (!trimmed) return null;
    return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private formatPrivateTenantMessage(
    title: string,
    message: string,
    companyName?: string,
  ) {
    const company = this.escapeHtml(companyName || 'BMS');
    const safeTitle = this.escapeHtml(title);
    const safeMessage = this.escapeHtml(message);

    return [
      '<b>Private Tenant Notice</b>',
      '',
      `You have received a private message from <b>${company}</b>.`,
      '',
      `<b>Subject:</b> ${safeTitle}`,
      '',
      safeMessage,
      '',
      `Sent securely via ${company}.`,
    ].join('\n');
  }
}
