import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AgencyEmployee } from './agency-employee.entity';
import { InternalEmployee } from './internal-employee.entity';
import { WorkforceAssignment } from './workforce-assignment.entity';
import { AttendanceStatus, WorkforcePersonType } from './enums';

@Entity('workforce_attendance')
export class WorkforceAttendance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: WorkforcePersonType })
  person_type!: WorkforcePersonType;

  @Column({ type: 'varchar', nullable: true })
  agency_employee_id?: string | null;

  @ManyToOne(() => AgencyEmployee, (employee) => employee.attendance, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_employee_id' })
  agency_employee?: AgencyEmployee | null;

  @Column({ type: 'varchar', nullable: true })
  internal_employee_id?: string | null;

  @ManyToOne(() => InternalEmployee, (employee) => employee.attendance, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'internal_employee_id' })
  internal_employee?: InternalEmployee | null;

  @Column({ type: 'varchar', nullable: true })
  assignment_id?: string | null;

  @ManyToOne(() => WorkforceAssignment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignment_id' })
  assignment?: WorkforceAssignment | null;

  @Column({ type: 'date' })
  attendance_date!: string;

  @Column({ type: 'timestamptz', nullable: true })
  check_in_at?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  check_out_at?: Date | null;

  @Column({ type: 'int', nullable: true })
  late_minutes?: number | null;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.PRESENT })
  status!: AttendanceStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
