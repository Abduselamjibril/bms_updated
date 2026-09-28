import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_telegram_accounts')
@Index('idx_user_telegram_user', ['user_id'])
@Index('idx_user_telegram_chat', ['telegram_chat_id'])
export class UserTelegramAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  user_id!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  telegram_username?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  telegram_user_id?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  telegram_chat_id?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  linked_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  last_verified_at?: Date | null;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
