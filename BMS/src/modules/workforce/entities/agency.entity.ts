import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AgencyContract } from './agency-contract.entity';
import { AgencyEmployee } from './agency-employee.entity';
import { WorkforceStatus } from './enums';

@Entity('workforce_agencies')
export class Agency {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  license_number?: string | null;

  @Column({ type: 'date', nullable: true })
  license_expiry_date?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  contact_person?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address?: string | null;

  @Column({ type: 'text', nullable: true })
  services_provided?: string | null;

  @Column({ type: 'enum', enum: WorkforceStatus, default: WorkforceStatus.ACTIVE })
  status!: WorkforceStatus;

  @OneToMany(() => AgencyContract, (contract) => contract.agency)
  contracts!: AgencyContract[];

  @OneToMany(() => AgencyEmployee, (employee) => employee.agency)
  employees!: AgencyEmployee[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
