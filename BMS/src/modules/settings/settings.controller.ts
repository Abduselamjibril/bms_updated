import {
  Controller,
  Get,
  Patch,
  Body,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Auth } from '../../common/decorators/auth.decorator';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  @ApiOperation({ summary: 'Get organization public branding settings' })
  @ApiResponse({ status: 200, description: 'Organization public branding fetched.' })
  async getPublicSettings() {
    const settings = await this.settingsService.getSettings();
    return this.toPublicBranding(settings);
  }

  @Get()
  @Auth()
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Get organization settings' })
  @ApiResponse({ status: 200, description: 'Organization settings fetched.' })
  async getSettings() {
    const settings = await this.settingsService.getSettings();
    return this.toPublicSettings(settings);
  }

  @Patch()
  @Auth()
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Update organization settings' })
  @ApiResponse({ status: 200, description: 'Organization settings updated.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        company_name: { type: 'string', example: 'Acme Corp' },
        tin_number: { type: 'string', example: '123456789' },
        vat_number: { type: 'string', example: '987654321' },
        primary_color: { type: 'string', example: '#4F46E5' },
        secondary_color: { type: 'string', example: '#1E293B' },
        font_family: { type: 'string', example: 'Inter' },
        company_address: { type: 'string', example: '123 Main St' },
        company_phone: { type: 'string', example: '+251911123456' },
        company_email: { type: 'string', example: 'info@acme.com' },
        authorized_signatory_name: { type: 'string', example: 'Mussa K.' },
        authorized_signatory_title: { type: 'string', example: 'Manager' },
        logo: { type: 'string', format: 'binary' },
        company_seal: { type: 'string', format: 'binary' },
        header_image: { type: 'string', format: 'binary' },
        footer_image: { type: 'string', format: 'binary' },
      },
      required: ['company_name', 'tin_number', 'vat_number'],
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'company_seal', maxCount: 1 },
      { name: 'header_image', maxCount: 1 },
      { name: 'footer_image', maxCount: 1 },
    ]),
  )
  async updateSettings(
    @Body() dto: any,
    @UploadedFiles()
    files?: {
      logo?: Express.Multer.File[];
      company_seal?: Express.Multer.File[];
      header_image?: Express.Multer.File[];
      footer_image?: Express.Multer.File[];
    },
  ) {
    const settings = await this.settingsService.updateSettings(
      this.normalizeSettingsDto(dto),
      files,
    );
    return this.toPublicSettings(settings);
  }

  private normalizeSettingsDto(dto: any) {
    const normalized = { ...dto };
    const booleanFields = [
      'telegram_enabled',
      'telegram_send_announcements',
      'telegram_send_private_notifications',
    ];

    for (const field of booleanFields) {
      if (normalized[field] !== undefined) {
        normalized[field] =
          normalized[field] === true || normalized[field] === 'true';
      }
    }

    return normalized;
  }

  private toPublicSettings(settings: any) {
    if (!settings) return settings;
    const { telegram_bot_token, telegram_webhook_secret, ...publicSettings } = settings;
    return {
      ...publicSettings,
      telegram_bot_configured: !!telegram_bot_token,
    };
  }

  private toPublicBranding(settings: any) {
    if (!settings) return null;
    const {
      company_name,
      logo_path,
      primary_color,
      secondary_color,
      font_family,
      company_address,
      company_phone,
      company_email,
      company_seal_path,
      header_image_path,
      footer_image_path,
    } = settings;
    return {
      company_name,
      logo_path,
      primary_color,
      secondary_color,
      font_family,
      company_address,
      company_phone,
      company_email,
      company_seal_path,
      header_image_path,
      footer_image_path,
    };
  }
}
