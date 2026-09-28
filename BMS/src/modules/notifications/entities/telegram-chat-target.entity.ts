import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TelegramChatScopeType {
  GLOBAL = 'GLOBAL',
  SITE = 'SITE',
  BUILDING = 'BUILDING',
}

export enum TelegramChatPurpose {
  GENERAL = 'GENERAL',
  ANNOUNCEMENTS = 'ANNOUNCEMENTS',
  MAINTENANCE = 'MAINTENANCE',
  FINANCE = 'FINANCE',
  LEASES = 'LEASES',
}

@Entity('telegram_chat_targets')
@Index('idx_telegram_chat_scope', ['scope_type', 'scope_id'])
@Index('idx_telegram_chat_active', ['is_active'])
export class TelegramChatTarget {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: TelegramChatScopeType })
  scope_type!: TelegramChatScopeType;

  @Column({ type: 'uuid', nullable: true })
  scope_id?: string | null;

  @Column({ length: 150 })
  title!: string;

  @Column({ length: 80 })
  chat_id!: string;

  @Column({
    type: 'enum',
    enum: TelegramChatPurpose,
    default: TelegramChatPurpose.ANNOUNCEMENTS,
  })
  purpose!: TelegramChatPurpose;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
