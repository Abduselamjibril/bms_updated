import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document, DocumentVersion } from './entities/document.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Lease } from '../leases/entities/lease.entity';
import { TenantDocument } from '../tenants/entities/tenant-document.entity';
import { Owner } from '../owners/entities/owner.entity';
import { Building } from '../buildings/entities/building.entity';
import { OrganizationSettings } from '../settings/entities/organization-settings.entity';
import { UserSignature } from '../users/entities/user-signature.entity';
import { DocumentService } from './document.service';
import { DocumentTemplateService } from './template.service';
import { DocumentGeneratorService } from './document-generator.service';
import { DocumentController } from './document.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Document,
      DocumentVersion,
      User,
      UserRole,
      Tenant,
      Lease,
      TenantDocument,
      Owner,
      Building,
      OrganizationSettings,
      UserSignature,
    ]),
    NotificationsModule,
  ],
  providers: [
    DocumentService,
    DocumentTemplateService,
    DocumentGeneratorService,
  ],
  exports: [
    DocumentService,
    DocumentTemplateService,
    DocumentGeneratorService,
  ],
  controllers: [DocumentController],
})
export class DocumentModule {}
