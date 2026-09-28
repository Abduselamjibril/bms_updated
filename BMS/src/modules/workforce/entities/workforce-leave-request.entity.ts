import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InternalEmployee } from './internal-employee.entity';
import { LeaveStatus, LeaveType } from './enums';

@Entity('workforce_leave_requests')
export class WorkforceLeaveRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  employee_id!: string;

  @ManyToOne(() => InternalEmployee, (employee) => employee.leave_requests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee!: InternalEmployee;

  @Column({ type: 'enum', enum: LeaveType, default: LeaveType.ANNUAL })
  leave_type!: LeaveType;

  @Column({ type: 'date' })
  start_date!: string;

  @Column({ type: 'date' })
  end_date!: string;

  @Column({ type: 'int' })
  days!: number;

  @Column({ type: 'text', nullable: true })
  reason?: string | null;

  @Column({ type: 'enum', enum: LeaveStatus, default: LeaveStatus.PENDING })
  status!: LeaveStatus;

  @Column({ type: 'text', nullable: true })
  decision_note?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  decided_at?: Date | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
