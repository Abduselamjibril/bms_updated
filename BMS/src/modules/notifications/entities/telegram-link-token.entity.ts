import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('telegram_link_tokens')
@Index('idx_telegram_link_user', ['user_id'])
@Index('idx_telegram_link_hash', ['token_hash'])
export class TelegramLinkToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ length: 128, unique: true })
  token_hash!: string;

  @Column({ type: 'timestamp' })
  expires_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  used_at?: Date | null;

  @CreateDateColumn()
  created_at!: Date;
}
