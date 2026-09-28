import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Building } from '../../buildings/entities/building.entity';
import { AgencyEmployee } from './agency-employee.entity';
import { InternalEmployee } from './internal-employee.entity';
import { ShiftType, WorkforcePersonType } from './enums';

@Entity('workforce_assignments')
export class WorkforceAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: WorkforcePersonType })
  person_type!: WorkforcePersonType;

  @Column({ type: 'varchar', nullable: true })
  agency_employee_id?: string | null;

  @ManyToOne(() => AgencyEmployee, (employee) => employee.assignments, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_employee_id' })
  agency_employee?: AgencyEmployee | null;

  @Column({ type: 'varchar', nullable: true })
  internal_employee_id?: string | null;

  @ManyToOne(() => InternalEmployee, (employee) => employee.assignments, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'internal_employee_id' })
  internal_employee?: InternalEmployee | null;

  @Column()
  building_id!: string;

  @ManyToOne(() => Building, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'building_id' })
  building!: Building;

  @Column({ type: 'varchar', length: 80, nullable: true })
  floor?: string | null;

  @Column({ type: 'enum', enum: ShiftType, default: ShiftType.MORNING })
  shift!: ShiftType;

  @Column({ type: 'time', nullable: true })
  shift_start?: string | null;

  @Column({ type: 'time', nullable: true })
  shift_end?: string | null;

  @Column({ type: 'date', nullable: true })
  start_date?: string | null;

  @Column({ type: 'date', nullable: true })
  end_date?: string | null;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
