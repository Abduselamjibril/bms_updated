import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('unit_types')
export class UnitType {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string; // e.g. STUDIO, 1BR, OFFICE

  @Column()
  name!: string; // e.g. Studio, One Bedroom, Office

  @Column({ default: true })
  is_active!: boolean;

  @Column({ default: false })
  is_commercial!: boolean;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
