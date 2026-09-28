# Telegram Notifications Implementation Plan

## Goal

Add Telegram as a configurable notification delivery channel for BMS announcements and tenant-specific messages.

The feature must be dynamic because BMS is a customer-based product. Bot credentials, Telegram groups, and tenant Telegram links must be configured inside the system instead of being hardcoded for one customer.

Telegram will not replace the existing notification system. It will extend the current delivery flow:

```text
BMS notification -> in-app notification -> email/push -> Telegram
```

## Current System We Can Reuse

Backend:

- `NotificationsModule`
- `NotificationsService.notify()`
- `NotificationsService.announce()`
- `NotificationProcessor`
- `MailService`
- `PushNotificationService`
- `OrganizationSettings`
- Existing site/building/tenant/lease relationships
- Existing announcement targets: everyone, site, building, target user IDs

Frontend:

- `Notifications.tsx` communication hub
- Settings page
- Site and building management pages
- Existing announcement form with everyone/site/building targeting

## High-Level Design

Add three Telegram areas:

1. Organization Telegram settings
2. Telegram chat targets for multiple groups
3. Tenant/user Telegram account linking

## Phase 1: Organization Telegram Settings

### Backend Database Fields

Add Telegram configuration fields to `organization_settings`.

Recommended fields:

```text
telegram_enabled boolean default false
telegram_bot_token text nullable
telegram_bot_username varchar nullable
telegram_send_announcements boolean default true
telegram_send_private_notifications boolean default false
telegram_webhook_secret varchar nullable
```

Security note:

- Do not expose the full bot token in API responses.
- Either encrypt the token in the database or mask it in responses.
- Allow admins to replace the token.

### Backend Settings API

Update:

```text
GET /settings
PATCH /settings
```

The response should return:

```text
telegram_enabled
telegram_bot_username
telegram_send_announcements
telegram_send_private_notifications
telegram_bot_configured: true/false
```

Avoid returning the full `telegram_bot_token`.

### Frontend Settings UI

Add a new section:

```text
Settings -> Integrations -> Telegram
```

Fields:

```text
Enable Telegram notifications
Bot token
Bot username
Send announcements to Telegram
Send private tenant notifications
Test Telegram connection
```

The token field should show an empty/password-style input when editing. If a token already exists, show:

```text
Bot token configured
```

## Phase 2: Multiple Telegram Groups

One site or building can have multiple Telegram groups, so do not store only one `telegram_chat_id` directly on site/building.

Create a new table:

```text
telegram_chat_targets
```

Recommended columns:

```text
id uuid primary key
scope_type enum: GLOBAL | SITE | BUILDING
scope_id uuid nullable
chat_id varchar not null
title varchar not null
purpose enum: GENERAL | ANNOUNCEMENTS | MAINTENANCE | FINANCE | LEASES
is_active boolean default true
created_at timestamp
updated_at timestamp
```

Examples:

```text
GLOBAL   null          -1001111111111  General Announcements
SITE     site-id-1     -1002222222222  Site 1 Tenant Group
SITE     site-id-1     -1003333333333  Site 1 Maintenance Group
BUILDING building-id-1 -1004444444444  Building A Residents
BUILDING building-id-1 -1005555555555  Building A Finance Notices
```

### Backend API

Add endpoints:

```text
GET    /telegram/chat-targets
POST   /telegram/chat-targets
PATCH  /telegram/chat-targets/:id
DELETE /telegram/chat-targets/:id
POST   /telegram/chat-targets/:id/test
```

Filtering:

```text
GET /telegram/chat-targets?scope_type=SITE&scope_id=<siteId>
GET /telegram/chat-targets?scope_type=BUILDING&scope_id=<buildingId>
```

Permissions:

```text
settings:read
settings:update
announcements:create
```

### Frontend UI

Add Telegram group management in settings:

```text
Telegram Groups
- Add group
- Edit group
- Disable group
- Send test message
```

Fields:

```text
Scope: Global / Site / Building
Site selector
Building selector
Group title
Telegram chat ID
Purpose
Active
```

## Phase 3: Telegram Service

Create:

```text
BMS/src/modules/notifications/telegram.service.ts
```

Responsibilities:

```text
sendMessage(chatId, title, message, metadata?)
sendToTargets(targets, title, message)
sendAnnouncement(body, resolvedTarget)
sendPrivateUserMessage(userId, title, message)
testBotConnection()
testChatTarget(chatTargetId)
```

Implementation:

Use Telegram Bot API:

```text
POST https://api.telegram.org/bot<BOT_TOKEN>/sendMessage
```

Payload:

```json
{
  "chat_id": "<chat_id>",
  "text": "<formatted message>",
  "parse_mode": "HTML"
}
```

Message format example:

```text
<b>{title}</b>

{message}

Sent from {company_name}
```

Failure handling:

- Log failed Telegram deliveries.
- Do not fail the whole announcement if Telegram fails.
- Return Telegram delivery summary separately.

## Phase 4: Hook Telegram Into Announcements

Update:

```text
NotificationsService.announce()
```

Current behavior:

```text
resolve users -> create in-app notifications -> queue email/push
```

New behavior:

```text
resolve users -> create in-app notifications -> queue email/push -> send Telegram group message
```

Telegram target resolution:

```text
if buildingId:
  send to active BUILDING chat targets for that building

else if siteId:
  send to active SITE chat targets for that site

else if targetUserIds:
  send private Telegram messages only to linked users

else:
  send to active GLOBAL chat targets
```

Optional enhancement:

Allow announcement form to choose:

```text
Send Telegram: yes/no
Telegram groups: all matching groups / selected groups
```

## Phase 5: Tenant Telegram Account Linking

Do not manually ask tenants for Telegram chat ID. Most users do not know it.

Admins or tenants can enter Telegram username, but username alone is not enough for private bot messages.

The real private delivery key is:

```text
telegram_chat_id
```

We get it when the tenant starts the bot using a secure link.

### New Table: User Telegram Accounts

Create:

```text
user_telegram_accounts
```

Recommended columns:

```text
id uuid primary key
user_id uuid not null
telegram_username varchar nullable
telegram_user_id varchar not null
telegram_chat_id varchar not null
linked_at timestamp
is_active boolean default true
last_verified_at timestamp nullable
```

### New Table: Telegram Link Tokens

Create:

```text
telegram_link_tokens
```

Recommended columns:

```text
id uuid primary key
user_id uuid not null
token_hash varchar not null
expires_at timestamp not null
used_at timestamp nullable
created_at timestamp
```

Token rules:

- Random
- Hard to guess
- Single-use
- Expires after 15-60 minutes
- Store hash, not raw token

### Tenant Linking Flow

1. Tenant user is created in BMS.
2. BMS generates a Telegram link token.
3. BMS sends email:

```text
Connect Telegram:
https://t.me/<bot_username>?start=<secure_token>
```

4. Tenant opens Telegram and taps Start.
5. Telegram sends webhook update to BMS.
6. BMS reads the `/start <secure_token>` payload.
7. BMS validates token.
8. BMS stores:

```text
user_id
telegram_username
telegram_user_id
telegram_chat_id
linked_at
```

9. BMS marks Telegram connected for that user.

### Username Handling

Username can be collected during registration:

```text
telegram_username = @tenantname
```

But matching must not rely only on username.

Correct matching:

```text
secure_token -> BMS user
```

Optional verification:

```text
entered telegram_username == incoming telegram username
```

If usernames do not match, the system can still link by token, but should show a warning to admin/user.

## Phase 6: Telegram Webhook

Add endpoint:

```text
POST /telegram/webhook/:secret
```

Webhook responsibilities:

- Receive Telegram updates.
- Detect `/start <token>`.
- Validate token.
- Link Telegram chat to BMS user.
- Reply to the user in Telegram:

```text
Your Telegram account is now connected to BMS.
```

Webhook setup:

```text
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<BACKEND_URL>/telegram/webhook/<secret>
```

Need dynamic admin action:

```text
POST /telegram/webhook/register
POST /telegram/webhook/remove
```

## Phase 7: Tenant Registration Email

When tenant user is created:

1. Generate Telegram link token.
2. Build connect URL.
3. Include it in the welcome email.

Email example:

```text
Welcome to BMS.

To receive Telegram updates for announcements, invoices, maintenance, and tenant messages, connect your Telegram account:

Connect Telegram:
https://t.me/<bot_username>?start=<secure_token>
```

If SMTP is not configured:

- Keep the link available on tenant profile.
- Admin can resend later.

## Phase 8: Private Tenant Telegram Notifications

After tenant linking is complete, private Telegram messages can be sent for:

- Direct tenant messages
- New invoice issued
- Payment received
- Overdue invoice
- Maintenance started/updated
- Utility bill/reading
- Lease reminders

Update notification processor:

```text
process-notification job:
  send email
  send push
  send private Telegram if enabled and user is linked
```

If user is not linked:

- Do not fail.
- Log as skipped.
- Continue email/push/in-app delivery.

## Phase 9: Delivery Logs

Create optional delivery log table:

```text
notification_deliveries
```

Recommended columns:

```text
id uuid primary key
notification_id uuid nullable
channel enum: EMAIL | PUSH | TELEGRAM
recipient_user_id uuid nullable
telegram_chat_id varchar nullable
status enum: SENT | FAILED | SKIPPED
error_message text nullable
created_at timestamp
```

This helps admins know what happened when a tenant says they did not receive a message.

## Phase 10: Frontend Updates

### Settings Page

Add Telegram Integration section:

```text
Enable Telegram
Bot token
Bot username
Webhook status
Register webhook
Remove webhook
Test bot
```

### Telegram Groups UI

Add group management:

```text
Scope
Site
Building
Group title
Purpose
Chat ID
Active
Test
```

### Tenant/User Profile UI

Add:

```text
Telegram username
Telegram connection status
Connect Telegram button
Resend Telegram connect email
Disconnect Telegram
```

### Tenant Registration UI

Add optional field:

```text
Telegram username
```

After save:

```text
Send Telegram connect email automatically
```

## Phase 11: Testing Checklist

Backend:

- Save Telegram settings.
- Mask bot token in settings response.
- Create multiple chat targets for one site.
- Create multiple chat targets for one building.
- Send test message to a Telegram group.
- Send global announcement.
- Send site announcement.
- Send building announcement.
- Generate tenant link token.
- Webhook links tenant chat ID correctly.
- Expired token fails.
- Used token cannot be reused.
- Private Telegram skips unlinked users safely.

Frontend:

- Settings form saves Telegram config.
- Group manager can add/edit/disable groups.
- Announcement sends with Telegram enabled.
- Tenant profile shows connected/not connected.
- Connect button opens correct Telegram URL.
- Resend connect email works.

Security:

- Bot token not exposed in frontend response.
- Webhook secret required.
- Link token hashed and expires.
- User can disconnect Telegram.
- Admin actions require proper permissions.

## Implementation Order

Recommended order:

1. Add Telegram settings fields.
2. Add `telegram_chat_targets` table and CRUD API.
3. Add `TelegramService`.
4. Add group announcement sending.
5. Add Settings UI for Telegram config.
6. Add Telegram group manager UI.
7. Add tenant Telegram tables.
8. Add connect token generation.
9. Add webhook endpoint.
10. Add tenant registration email link.
11. Add private tenant Telegram delivery.
12. Add delivery logs and admin visibility.

## Final Recommended Rollout

Start with group announcements:

```text
Bot settings -> multiple groups -> announcement delivery
```

Then add tenant private linking:

```text
tenant username -> secure connect link -> webhook -> private messages
```

This keeps the first release simple while still designing the database correctly for the full feature.
