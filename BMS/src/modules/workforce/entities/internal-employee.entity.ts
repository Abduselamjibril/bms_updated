import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkforceAssignment } from './workforce-assignment.entity';
import { WorkforceAttendance } from './workforce-attendance.entity';
import { WorkforceLeaveRequest } from './workforce-leave-request.entity';
import { Gender, StaffStatus } from './enums';

@Entity('workforce_internal_employees')
export class InternalEmployee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 80 })
  employee_code!: string;

  @Column({ length: 150 })
  full_name!: string;

  @Column({ length: 100 })
  position!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string | null;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender?: Gender | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  national_id?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  national_id_document_url?: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  emergency_contact_name?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  emergency_contact_phone?: string | null;

  @Column({ type: 'date', nullable: true })
  start_date?: string | null;

  @Column({ type: 'int', default: 20 })
  annual_leave_balance!: number;

  @Column({ type: 'enum', enum: StaffStatus, default: StaffStatus.ACTIVE })
  status!: StaffStatus;

  @OneToMany(() => WorkforceAssignment, (assignment) => assignment.internal_employee)
  assignments!: WorkforceAssignment[];

  @OneToMany(() => WorkforceAttendance, (attendance) => attendance.internal_employee)
  attendance!: WorkforceAttendance[];

  @OneToMany(() => WorkforceLeaveRequest, (leave) => leave.employee)
  leave_requests!: WorkforceLeaveRequest[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
