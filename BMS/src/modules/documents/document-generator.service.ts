import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
import { join } from 'path';
import * as fs from 'fs';
import { OrganizationSettings } from '../settings/entities/organization-settings.entity';
import { UserSignature } from '../users/entities/user-signature.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class DocumentGeneratorService {
  constructor(
    @InjectRepository(OrganizationSettings)
    private readonly settingsRepo: Repository<OrganizationSettings>,
    @InjectRepository(UserSignature)
    private readonly signatureRepo: Repository<UserSignature>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private resolvePath(dbPath: string): string | null {
    if (!dbPath) return null;
    const normalized = dbPath.startsWith('/') ? dbPath.slice(1) : dbPath;
    const absolutePath = join(process.cwd(), normalized);
    return fs.existsSync(absolutePath) ? absolutePath : null;
  }

  private mapFont(fontName: string): string {
    const name = (fontName || '').toLowerCase();
    if (name.includes('times') || name.includes('serif')) {
      return 'Times-Roman';
    }
    if (name.includes('courier') || name.includes('mono')) {
      return 'Courier';
    }
    return 'Helvetica';
  }

  private getBoldFont(fontName: string): string {
    if (fontName === 'Times-Roman') return 'Times-Bold';
    if (fontName === 'Courier') return 'Courier-Bold';
    return 'Helvetica-Bold';
  }

  private getBoldObliqueFont(fontName: string): string {
    if (fontName === 'Times-Roman') return 'Times-BoldItalic';
    if (fontName === 'Courier') return 'Courier-BoldOblique';
    return 'Helvetica-BoldOblique';
  }

  private drawImageWithFit(
    doc: any,
    filePath: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fitMode: 'contain' | 'cover' | 'fill'
  ) {
    try {
      const img = doc.openImage(filePath);
      const imgWidth = img.width;
      const imgHeight = img.height;

      if (fitMode === 'fill') {
        doc.image(filePath, x, y, { width: w, height: h });
      } else if (fitMode === 'cover') {
        const scale = Math.max(w / imgWidth, h / imgHeight);
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        const dx = x + (w - scaledWidth) / 2;
        const dy = y + (h - scaledHeight) / 2;

        doc.save();
        doc.rect(x, y, w, h).clip();
        doc.image(filePath, dx, dy, { width: scaledWidth });
        doc.restore();
      } else {
        // 'contain'
        const scale = Math.min(w / imgWidth, h / imgHeight);
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        const dx = x + (w - scaledWidth) / 2;
        const dy = y + (h - scaledHeight) / 2;

        doc.image(filePath, dx, dy, { width: scaledWidth });
      }
    } catch (err) {
      doc.image(filePath, x, y, { width: w, height: h });
    }
  }

  async generatePdf(
    templateContentJson: string,
    data: Record<string, string>,
    executingUserId?: string,
  ): Promise<Buffer> {
    const settings = await this.settingsRepo.findOne({ where: {} });
    
    let template: any;
    try {
      template = JSON.parse(templateContentJson);
    } catch (e) {
      throw new Error('Invalid document template JSON structure');
    }

    const theme = template.theme || {};
    const primaryColor = theme.primaryColor || settings?.primary_color || '#4F46E5';
    const secondaryColor = theme.secondaryColor || settings?.secondary_color || '#1E293B';
    const fontName = this.mapFont(theme.fontFamily || settings?.font_family || 'Helvetica');
    const padding = parseInt(theme.padding || '50', 10);

    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: padding });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));

        const contentWidth = doc.page.width - 2 * padding;
        const replaceTokens = (text: string): string => {
          if (!text) return '';
          let result = text;
          Object.entries(data).forEach(([key, value]) => {
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
          });
          return result;
        };

        const structure = template.structure || [];
        for (const block of structure) {
          doc.font(fontName);
          
          if (block.type === 'header_image') {
            const headerPath = this.resolvePath(settings?.header_image_path || '');
            if (headerPath) {
              const h = block.maxHeight || 80;
              const fitMode = block.objectFit || 'contain';
              const startY = doc.y;
              this.drawImageWithFit(doc, headerPath, padding, startY, contentWidth, h, fitMode);
              doc.y = startY + h;
              doc.moveDown(1.5);
            } else {
              // Draw fallback standard header
              const logoPath = this.resolvePath(settings?.logo_path || '');
              let leftMargin = padding;
              
              if (logoPath) {
                doc.image(logoPath, leftMargin, doc.y, { width: 60 });
                leftMargin += 80;
              }

              const headerY = doc.y;
              doc.font(this.getBoldFont(fontName)).fontSize(18).fillColor(primaryColor);
              doc.text(settings?.company_name || 'BMS', leftMargin, headerY);
              
              doc.font(fontName).fontSize(9).fillColor('#666666');
              doc.text(settings?.company_address || 'Addis Ababa, Ethiopia', leftMargin);
              doc.text(`TIN: ${settings?.tin_number || 'N/A'} | VAT: ${settings?.vat_number || 'N/A'}`, leftMargin);
              if (settings?.company_email) doc.text(settings.company_email, leftMargin);
              
              doc.y = Math.max(doc.y, headerY + 65);
              doc.moveDown(1.5);
            }
          }

          else if (block.type === 'title') {
            doc.font(this.getBoldFont(fontName)).fontSize(15).fillColor(primaryColor);
            doc.text(replaceTokens(block.text), { align: block.align || 'center' });
            doc.moveDown(1);
          }

          else if (block.type === 'paragraph') {
            doc.font(fontName).fontSize(10).fillColor('#333333');
            doc.text(replaceTokens(block.text), { align: block.align || 'left', lineGap: 4 });
            doc.moveDown(1);
          }

          else if (block.type === 'table') {
            const rows = block.rows || [];
            const colWidth = contentWidth / 2;
            const startX = padding;
            const startY = doc.y;
            const isBordered = block.style === 'bordered';

            if (isBordered) {
              // Draw a card with rounded corners, a colored header background, and row boundaries
              let tableHeight = 25; // Header row height
              for (const row of rows) {
                const label = row.label;
                const val = replaceTokens(row.value);
                const labelHeight = doc.heightOfString(label, { width: colWidth - 20 });
                const valHeight = doc.heightOfString(val, { width: colWidth - 20 });
                tableHeight += Math.max(labelHeight, valHeight) + 16;
              }

              doc.save();
              doc.roundedRect(startX, startY, contentWidth, tableHeight, 8).lineWidth(1).strokeColor(primaryColor).stroke().clip();

              // Draw header background block (8% opacity primaryColor)
              doc.fillColor(primaryColor).fillOpacity(0.08).rect(startX, startY, contentWidth, 25).fill();
              doc.fillOpacity(1.0); // Reset opacity

              // Draw header texts
              doc.font(this.getBoldFont(fontName)).fontSize(9).fillColor(secondaryColor);
              doc.text('Description Label', startX + 10, startY + 8);
              doc.text('Binding Value', startX + colWidth + 10, startY + 8);

              // Draw separator line under header
              doc.lineWidth(0.5).strokeColor(primaryColor + '40').moveTo(startX, startY + 25).lineTo(startX + contentWidth, startY + 25).stroke();

              // Draw rows
              let currentY = startY + 25;
              for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const label = row.label;
                const val = replaceTokens(row.value);
                const labelHeight = doc.heightOfString(label, { width: colWidth - 20 });
                const valHeight = doc.heightOfString(val, { width: colWidth - 20 });
                const rowHeight = Math.max(labelHeight, valHeight) + 16;

                // Draw label
                doc.font(this.getBoldFont(fontName)).fontSize(9).fillColor(secondaryColor);
                doc.text(label, startX + 10, currentY + 8, { width: colWidth - 20 });

                // Draw value
                doc.font(fontName).fontSize(9).fillColor('#333333');
                doc.text(val, startX + colWidth + 10, currentY + 8, { width: colWidth - 20 });

                currentY += rowHeight;

                if (i < rows.length - 1) {
                  doc.lineWidth(0.5).strokeColor('#E2E8F0').moveTo(startX, currentY).lineTo(startX + contentWidth, currentY).stroke();
                }
              }
              doc.restore();
              doc.y = startY + tableHeight + 15;
            } else {
              // Minimal style table
              doc.lineWidth(1.5).strokeColor(primaryColor).moveTo(startX, doc.y).lineTo(startX + contentWidth, doc.y).stroke();
              doc.moveDown(0.3);

              for (const row of rows) {
                const label = row.label;
                const val = replaceTokens(row.value);
                const rowY = doc.y;

                doc.font(this.getBoldFont(fontName)).fontSize(10).fillColor(secondaryColor);
                doc.text(label, startX + 10, rowY, { width: colWidth - 20 });

                doc.font(fontName).fontSize(10).fillColor('#333333');
                doc.text(val, startX + colWidth + 10, rowY, { width: colWidth - 20 });

                doc.moveDown(0.8);
                doc.lineWidth(0.5).strokeColor('#E2E8F0').moveTo(startX, doc.y).lineTo(startX + contentWidth, doc.y).stroke();
                doc.moveDown(0.3);
              }
              doc.moveDown(0.8);
            }
          }

          else if (block.type === 'signatures') {
            doc.moveDown(1);
            const startY = doc.y;
            const colWidth = contentWidth / 2;
            const sealWidth = block.sealSize || 60;

            // Render Sign-off lines
            if (block.layout === 'single_seal') {
              const sealPath = this.resolvePath(settings?.company_seal_path || '');
              if (sealPath) {
                doc.image(sealPath, padding + (contentWidth - sealWidth) / 2, startY, { width: sealWidth });
              }
              doc.y = startY + sealWidth + 10;
              doc.font(this.getBoldFont(fontName)).fontSize(10).fillColor(secondaryColor);
              doc.text(block.approvedBy?.title || 'Authorized Seal', padding, doc.y, { width: contentWidth, align: 'center' });
              doc.y += 15;
            } 
            
            else if (block.layout === 'double_sign_seal') {
              // Left Column: Seal centered in the left column
              const sealPath = this.resolvePath(settings?.company_seal_path || '');
              if (sealPath) {
                doc.image(sealPath, padding + (colWidth - sealWidth) / 2, startY, { width: sealWidth });
              }
              
              // Right Column: Signature centered in the right column
              const sigWidth = 120;
              const sigX = padding + colWidth + (colWidth - sigWidth) / 2;
              let signerName = 'Authorized Representative';
              let isSuperAdmin = false;

              if (executingUserId) {
                const user = await this.userRepo.findOne({
                  where: { id: executingUserId },
                  relations: ['userRoles', 'userRoles.role'],
                });
                if (user) {
                  signerName = user.name;
                  const roleNames = user.userRoles.map((ur) => ur.role.name);
                  isSuperAdmin = roleNames.includes('super_admin');
                }
              }

              if (isSuperAdmin && executingUserId) {
                const signature = await this.signatureRepo.findOne({
                  where: { user: { id: executingUserId } },
                });
                const sigPath = this.resolvePath(signature?.signature_png_path || '');
                if (sigPath) {
                  doc.image(sigPath, sigX, startY + 10, { width: sigWidth });
                } else {
                  // Fallback to stylized name signature if image not present
                  doc.font(this.getBoldObliqueFont(fontName)).fontSize(14).fillColor('#1A365D');
                  doc.text(signerName, sigX, startY + 20, { width: sigWidth, align: 'center' });
                }
              } else {
                // Printed Manager Name signature
                doc.font(`Courier-Oblique`).fontSize(14).fillColor('#1A365D');
                doc.text(signerName, sigX, startY + 20, { width: sigWidth, align: 'center' });
              }

              const textY = startY + Math.max(sealWidth, 50) + 10;
              doc.y = textY;
              
              doc.font(this.getBoldFont(fontName)).fontSize(10).fillColor(secondaryColor);
              doc.text(block.approvedBy?.title || 'Lessor Sign-off', padding + colWidth, textY, { width: colWidth, align: 'center' });
              doc.text('Corporate Seal', padding, textY, { width: colWidth, align: 'center' });
              doc.y += 15;
            }
            doc.moveDown(1.5);
          }

          else if (block.type === 'footer_image') {
            const footerPath = this.resolvePath(settings?.footer_image_path || '');
            if (footerPath) {
              const h = block.maxHeight || 50;
              const footerY = doc.page.height - padding - h;
              if (doc.y > footerY - 20) {
                doc.addPage();
              }
              const fitMode = block.objectFit || 'contain';
              this.drawImageWithFit(doc, footerPath, padding, footerY, contentWidth, h, fitMode);
            } else {
              // Render standard footer
              const footerY = doc.page.height - padding - 20;
              doc.fontSize(8).fillColor('#999999');
              doc.text(settings?.company_name || 'BMS', padding, footerY, { continued: true });
              doc.text(' | Document generated securely.', { align: 'right' });
            }
          }
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

