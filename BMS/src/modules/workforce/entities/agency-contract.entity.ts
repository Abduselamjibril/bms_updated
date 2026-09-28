import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Agency } from './agency.entity';

export enum ContractStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  RENEWAL_DUE = 'renewal_due',
  TERMINATED = 'terminated',
}

@Entity('workforce_agency_contracts')
export class AgencyContract {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  agency_id!: string;

  @ManyToOne(() => Agency, (agency) => agency.contracts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_id' })
  agency!: Agency;

  @Column({ length: 150 })
  title!: string;

  @Column({ type: 'date' })
  start_date!: string;

  @Column({ type: 'date' })
  end_date!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  contract_value?: number | null;

  @Column({ type: 'text', nullable: true })
  sla_definition?: string | null;

  @Column({ type: 'enum', enum: ContractStatus, default: ContractStatus.ACTIVE })
  status!: ContractStatus;

  @Column({ type: 'int', default: 30 })
  alert_days_before_expiry!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
