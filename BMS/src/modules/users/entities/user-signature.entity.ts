import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_signatures')
export class UserSignature {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  @Index('idx_signature_user', { unique: true })
  user!: User;

  @Column({ type: 'text', nullable: true })
  signature_svg?: string; // Storing the raw drawn vector coordinate data for front-end rendering

  @Column({ length: 250 })
  signature_png_path!: string; // Transparent PNG file stored on backend disk for PDFKit stamping

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
