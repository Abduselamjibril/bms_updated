import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
// There are two service files: notification.service.ts and notifications.service.ts. Only one should be used as the main provider. Ensure the correct one is imported below.
import { NotificationService } from './notification.service';
import { NotificationsController } from './notifications.controller';
import { TelegramController } from './telegram.controller';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { PushNotificationService } from './push-notification.service';
import { DeviceTokenService } from './device-token.service';
import { MailService } from './mail.service';
import { NotificationProcessor } from './notification.processor';
import { TelegramService } from './telegram.service';
import { BullModule } from '@nestjs/bullmq';
import { Notification } from './entities/notification.entity';
import { TelegramChatTarget } from './entities/telegram-chat-target.entity';
import { TelegramLinkToken } from './entities/telegram-link-token.entity';
import { UserDeviceToken } from './entities/user-device-token.entity';
import { UserTelegramAccount } from './entities/user-telegram-account.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { SettingsModule } from '../settings/settings.module';
import { Lease } from '../leases/entities/lease.entity';
import { Building } from '../buildings/entities/building.entity';
import { Site } from '../sites/entities/site.entity';
import { Tenant } from '../tenants/entities/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      TelegramChatTarget,
      TelegramLinkToken,
      UserTelegramAccount,
      UserDeviceToken,
      User,
      Lease,
      Building,
      Site,
      Tenant,
    ]),
    UsersModule,
    SettingsModule,
    BullModule.registerQueue({
      name: 'notification',
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      },
    }),
  ],
  providers: [
    NotificationsService,
    PushNotificationService,
    DeviceTokenService,
    MailService,
    TelegramService,
    NotificationService,
    NotificationProcessor,
  ],
  controllers: [
    NotificationsController,
    TelegramController,
    TelegramWebhookController,
  ],
  exports: [NotificationsService, MailService, TelegramService],
})
export class NotificationsModule { }
// If you have both notification.service.ts and notifications.service.ts, this can cause confusion and only one will be registered. Remove or rename one to avoid issues.
