import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { writeFileSync } from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationSettings } from './entities/organization-settings.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(OrganizationSettings)
    private readonly settingsRepo: Repository<OrganizationSettings>,
  ) {}

  async getSettings(): Promise<OrganizationSettings | null> {
    return this.settingsRepo.findOne({ where: {} });
  }

  async updateSettings(
    dto: Partial<OrganizationSettings>,
    files?: {
      logo?: Express.Multer.File[];
      company_seal?: Express.Multer.File[];
      header_image?: Express.Multer.File[];
      footer_image?: Express.Multer.File[];
    },
  ): Promise<OrganizationSettings> {
    let settings = await this.settingsRepo.findOne({ where: {} });
    if (!settings) {
      settings = this.settingsRepo.create(dto);
    } else {
      Object.assign(settings, dto);
    }

    const fs = require('fs');
    const saveFile = (file: Express.Multer.File, folder: string): string => {
      const targetDir = join(process.cwd(), 'uploads', folder);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
      const filePath = join(targetDir, safeName);
      fs.writeFileSync(filePath, file.buffer);
      return `/uploads/${folder}/${safeName}`;
    };

    if (files) {
      if (files.logo && files.logo[0]) {
        settings.logo_path = saveFile(files.logo[0], 'settings');
      }
      if (files.company_seal && files.company_seal[0]) {
        settings.company_seal_path = saveFile(files.company_seal[0], 'settings');
      }
      if (files.header_image && files.header_image[0]) {
        settings.header_image_path = saveFile(files.header_image[0], 'settings');
      }
      if (files.footer_image && files.footer_image[0]) {
        settings.footer_image_path = saveFile(files.footer_image[0], 'settings');
      }
    }

    return this.settingsRepo.save(settings);
  }
}
