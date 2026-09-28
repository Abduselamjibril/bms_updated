import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { Lease } from '../leases/entities/lease.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { DocumentTemplateService } from './template.service';
import { diskStorage } from 'multer';
import { Auth } from '../../common/decorators/auth.decorator';
import { DocumentService } from './document.service';
import { TenantDocument } from '../tenants/entities/tenant-document.entity';
import { UserRole } from '../roles/entities/user-role.entity';
// removed duplicate imports
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { DocumentGeneratorService } from './document-generator.service';
import { DataSource } from 'typeorm';

@ApiTags('Documents')
@Controller('documents')
@Auth()
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    @InjectRepository(Lease)
    private readonly leaseRepo: Repository<Lease>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(TenantDocument)
    private readonly tenantDocumentRepo: Repository<TenantDocument>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    private readonly templateService: DocumentTemplateService,
    private readonly generatorService: DocumentGeneratorService,
    private readonly dataSource: DataSource,
  ) {}

  @Post('upload')
  @Permissions('documents:upload')
  @ApiOperation({ summary: 'Upload document (hybrid storage)' })
  @ApiResponse({ status: 201, description: 'Document uploaded.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file to upload',
        },
        module_type: {
          type: 'string',
          example: 'lease',
          description:
            'Module type (e.g., lease, tenant, maintenance, payment)',
        },
        module_id: {
          type: 'string',
          example: 'test-lease-id',
          description: 'Module ID (e.g., lease ID, tenant ID, etc.)',
        },
      },
      required: ['file', 'module_type', 'module_id'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/documents',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + '-' + file.originalname);
        },
      }),
    }),
  )
  async uploadDocument(
    @Body() dto: any,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.documentService.uploadDocument(dto, file, req.user.id);
  }

  @Get('search')
  @Permissions('documents:search')
  @ApiOperation({ summary: 'Search documents by module_type, name, or date' })
  @ApiResponse({ status: 200, description: 'Documents list.' })
  @ApiQuery({
    name: 'module_type',
    required: false,
    description: 'Module type (lease, tenant, maintenance, payment)',
    example: 'lease',
  })
  @ApiQuery({
    name: 'module_id',
    required: false,
    description: 'Module ID (UUID or string)',
    example: 'c6ae50a4-1053-470e-afe4-73403c914cbc',
  })
  @ApiQuery({
    name: 'file_name',
    required: false,
    description: 'File name',
    example: 'file.pdf',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Upload date (YYYY-MM-DD)',
    example: '2026-02-25',
  })
  async searchDocuments(@Query() filters: any, @Req() req: any) {
    return this.documentService.searchDocuments(filters, req.user);
  }

  @Get(':id/history')
  @Permissions('documents:history')
  @ApiOperation({ summary: 'Get document version history' })
  @ApiResponse({ status: 200, description: 'Document history.' })
  async getDocumentHistory(@Param('id') id: string, @Req() req: any) {
    return this.documentService.getDocumentHistory(id, req.user);
  }

  @Delete(':id')
  @Permissions('documents:delete')
  @ApiOperation({ summary: 'Soft delete document' })
  @ApiResponse({ status: 200, description: 'Document deleted.' })
  async softDeleteDocument(@Param('id') id: string, @Req() req: any) {
    return this.documentService.softDeleteDocument(id, req.user);
  }

  @Post('generate-contract')
  @ApiOperation({ summary: 'Generate lease agreement from template' })
  @Permissions('documents:create')
  async generateContract(
    @Body() dto: { lease_id: string; template_id: string },
    @Req() req: any,
  ) {
    const template = await this.documentRepo.findOne({
      where: { id: dto.template_id, is_template: true },
    });
    if (!template || !template.template_content) {
      throw new NotFoundException('Template not found');
    }

    const lease = await this.leaseRepo.findOne({
      where: { id: dto.lease_id },
      relations: ['tenant', 'unit'],
    });
    if (!lease) throw new NotFoundException('Lease not found');

    let isJsonTemplate = false;
    try {
      JSON.parse(template.template_content);
      isJsonTemplate = true;
    } catch (e) {
      // not a json template
    }

    if (isJsonTemplate) {
      const placeHolderData = {
        tenant_name: `${lease.tenant.first_name} ${lease.tenant.last_name}`,
        tenant_id: lease.tenant.id,
        unit_number: lease.unit?.unit_number || 'N/A',
        lease_start: new Date(lease.start_date).toLocaleDateString(),
        lease_end: new Date(lease.end_date).toLocaleDateString(),
        rent_amount: lease.rent_amount.toString(),
        date: new Date().toLocaleDateString(),
      };

      const pdfBuffer = await this.generatorService.generatePdf(
        template.template_content,
        placeHolderData,
        req.user.id,
      );

      const fs = require('fs');
      const path = require('path');
      const targetDir = path.join(process.cwd(), 'uploads', 'generated_contracts');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const fileName = `Lease_Agreement_${lease.tenant.last_name}_${Date.now()}.pdf`;
      const relativePath = `uploads/generated_contracts/${fileName}`;
      fs.writeFileSync(path.join(process.cwd(), relativePath), pdfBuffer);

      // Simple permission checks to auto-seal if user has permission
      const userRoles = await this.userRoleRepo.find({
        where: { user: { id: req.user.id } },
        relations: ['role'],
      });
      const roles = userRoles.map((ur) => ur.role.name);
      const canSeal = roles.includes('super_admin') || roles.includes('admin');

      const newDoc = this.documentRepo.create({
        file_name: fileName,
        mime_type: 'application/pdf',
        file_size: pdfBuffer.length,
        storage_path: relativePath,
        module_type: 'lease',
        module_id: lease.id,
        version: 1,
        category: 'CONTRACT',
        template_content: template.template_content,
        sealed_by_user_id: canSeal ? req.user.id : undefined,
        sealed_at: canSeal ? new Date() : undefined,
      });

      return this.documentRepo.save(newDoc);
    } else {
      const compiledContent = this.templateService.compile(
        template.template_content,
        { lease, tenant: lease.tenant },
      );

      const newDoc = this.documentRepo.create({
        file_name: `Lease_Agreement_${lease.tenant.last_name}.html`,
        mime_type: 'text/html',
        file_size: Buffer.byteLength(compiledContent),
        storage_path: `generated_contracts/lease_${lease.id}.html`,
        module_type: 'lease',
        module_id: lease.id,
        version: 1,
        category: 'CONTRACT',
        template_content: compiledContent,
      });

      return this.documentRepo.save(newDoc);
    }
  }

  @Post('generate-receipt')
  @ApiOperation({ summary: 'Generate receipt from payment record' })
  @Permissions('documents:create')
  async generateReceipt(
    @Body() dto: { payment_id: string; template_id?: string },
    @Req() req: any,
  ) {
    const payment = await this.dataSource.getRepository('Payment').findOne({
      where: { id: dto.payment_id },
      relations: ['invoice', 'invoice.tenant', 'invoice.unit'],
    }) as any;
    if (!payment) throw new NotFoundException('Payment not found');

    let template: Document | null = null;
    if (dto.template_id) {
      template = await this.documentRepo.findOne({
        where: { id: dto.template_id, is_template: true },
      });
    } else {
      template = await this.documentRepo.findOne({
        where: { module_type: 'payment', category: 'RECEIPT', is_template: true },
      });
    }

    if (!template || !template.template_content) {
      throw new NotFoundException('Receipt template not found');
    }

    const placeHolderData = {
      receipt_number: `RCPT-${new Date().getFullYear()}-${payment.id.slice(0, 6).toUpperCase()}`,
      tenant_name: `${payment.invoice?.tenant?.first_name || 'N/A'} ${payment.invoice?.tenant?.last_name || ''}`.trim(),
      unit_number: payment.invoice?.unit?.unit_number || 'N/A',
      payment_date: new Date(payment.payment_date || payment.created_at).toLocaleDateString(),
      payment_method: payment.payment_method || 'Telebirr',
      payment_type: payment.payment_type || 'Rent Payment',
      payment_amount: payment.amount.toString(),
      date: new Date().toLocaleDateString(),
    };

    const pdfBuffer = await this.generatorService.generatePdf(
      template.template_content,
      placeHolderData,
      req.user.id,
    );

    const fs = require('fs');
    const path = require('path');
    const targetDir = path.join(process.cwd(), 'uploads', 'generated_receipts');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fileName = `Receipt_${placeHolderData.receipt_number}.pdf`;
    const relativePath = `uploads/generated_receipts/${fileName}`;
    fs.writeFileSync(path.join(process.cwd(), relativePath), pdfBuffer);

    const userRoles = await this.userRoleRepo.find({
      where: { user: { id: req.user.id } },
      relations: ['role'],
    });
    const roles = userRoles.map((ur) => ur.role.name);
    const canSeal = roles.includes('super_admin') || roles.includes('admin') || roles.includes('finance');

    const newDoc = this.documentRepo.create({
      file_name: fileName,
      mime_type: 'application/pdf',
      file_size: pdfBuffer.length,
      storage_path: relativePath,
      module_type: 'payment',
      module_id: payment.id,
      version: 1,
      category: 'RECEIPT',
      template_content: template.template_content,
      sealed_by_user_id: canSeal ? req.user.id : undefined,
      sealed_at: canSeal ? new Date() : undefined,
    });

    return this.documentRepo.save(newDoc);
  }

  @Post(':id/promote-to-tenant/verify')
  @Permissions('documents:verify')
  @ApiOperation({ summary: 'Promote an existing document to tenant document and auto-verify' })
  async promoteToTenantAndVerify(
    @Param('id') id: string,
    @Body() body: { tenant_id: string; type: string },
  ) {
    const doc = await this.documentRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');

    const tenant = await this.tenantRepo.findOne({ where: { id: body.tenant_id } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const fileUrl = doc.storage_path.startsWith('/') ? doc.storage_path : `/${doc.storage_path}`;

    const tenantDoc = this.tenantDocumentRepo.create({
      tenant,
      type: body.type as any,
      file_url: fileUrl,
      verified: true,
    });

    return this.tenantDocumentRepo.save(tenantDoc);
  }
}
