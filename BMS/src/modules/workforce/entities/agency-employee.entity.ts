import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Agency } from './agency.entity';
import { WorkforceAssignment } from './workforce-assignment.entity';
import { WorkforceAttendance } from './workforce-attendance.entity';
import { Gender, StaffStatus } from './enums';

@Entity('workforce_agency_employees')
export class AgencyEmployee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  agency_id!: string;

  @ManyToOne(() => Agency, (agency) => agency.employees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_id' })
  agency!: Agency;

  @Column({ length: 80 })
  employee_code!: string;

  @Column({ length: 150 })
  full_name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  photo_url?: string | null;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender?: Gender | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  national_id?: string | null;

  @Column({ length: 100 })
  position!: string;

  @Column({ type: 'date', nullable: true })
  start_date?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  national_id_document_url?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  medical_certificate_url?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  training_certificate_url?: string | null;

  @Column({ type: 'enum', enum: StaffStatus, default: StaffStatus.ACTIVE })
  status!: StaffStatus;

  @OneToMany(() => WorkforceAssignment, (assignment) => assignment.agency_employee)
  assignments!: WorkforceAssignment[];

  @OneToMany(() => WorkforceAttendance, (attendance) => attendance.agency_employee)
  attendance!: WorkforceAttendance[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
