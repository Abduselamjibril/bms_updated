import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

export enum LateFeeType {
  PERCENTAGE = 'PERCENTAGE',
  FLAT = 'FLAT',
}

@Entity('organization_settings')
@Index('idx_orgsettings_company', ['company_name'])
export class OrganizationSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  company_name!: string;

  @Column({ length: 50 })
  tin_number!: string;

  @Column({ length: 50 })
  vat_number!: string;

  @Column({ length: 200, nullable: true })
  logo_path?: string;

  @Column({ length: 20, default: '#4F46E5' })
  primary_color!: string;

  @Column({ length: 20, default: '#1E293B' })
  secondary_color!: string;

  @Column({ length: 50, default: 'Inter' })
  font_family!: string;

  @Column({ type: 'text', nullable: true })
  company_address?: string;

  @Column({ length: 50, nullable: true })
  company_phone?: string;

  @Column({ length: 100, nullable: true })
  company_email?: string;

  @Column({ length: 200, nullable: true })
  company_seal_path?: string;

  @Column({ length: 200, nullable: true })
  header_image_path?: string;

  @Column({ length: 200, nullable: true })
  footer_image_path?: string;

  @Column({ length: 100, nullable: true })
  authorized_signatory_name?: string;

  @Column({ length: 100, nullable: true })
  authorized_signatory_title?: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.15 })
  vat_rate!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.02 })
  withholding_rate!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 2.0 })
  late_fee_percentage!: number;

  @Column({ type: 'enum', enum: LateFeeType, default: LateFeeType.PERCENTAGE })
  late_fee_type!: LateFeeType;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  late_fee_flat_amount!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  early_termination_penalty_pct!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  rent_escalation_pct!: number;

  @Column({ type: 'int', default: 12 })
  default_lease_duration_months!: number;

  @Column({ type: 'int', default: 0 })
  late_fee_grace_period_days!: number;

  @Column({ default: false })
  telegram_enabled!: boolean;

  @Column({ type: 'text', nullable: true })
  telegram_bot_token?: string;

  @Column({ length: 100, nullable: true })
  telegram_bot_username?: string;

  @Column({ default: true })
  telegram_send_announcements!: boolean;

  @Column({ default: false })
  telegram_send_private_notifications!: boolean;

  @Column({ length: 120, nullable: true })
  telegram_webhook_secret?: string;
}
