import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Building } from '../buildings/entities/building.entity';
import { Agency } from './entities/agency.entity';
import { AgencyContract } from './entities/agency-contract.entity';
import { AgencyEmployee } from './entities/agency-employee.entity';
import { InternalEmployee } from './entities/internal-employee.entity';
import { WorkforceAssignment } from './entities/workforce-assignment.entity';
import { WorkforceAttendance } from './entities/workforce-attendance.entity';
import { WorkforceLeaveRequest } from './entities/workforce-leave-request.entity';
import {
  AttendanceStatus,
  LeaveStatus,
  WorkforcePersonType,
  WorkforceStatus,
} from './entities/enums';

@Injectable()
export class WorkforceService {
  constructor(
    @InjectRepository(Agency)
    private readonly agencyRepo: Repository<Agency>,
    @InjectRepository(AgencyContract)
    private readonly contractRepo: Repository<AgencyContract>,
    @InjectRepository(AgencyEmployee)
    private readonly agencyEmployeeRepo: Repository<AgencyEmployee>,
    @InjectRepository(InternalEmployee)
    private readonly internalEmployeeRepo: Repository<InternalEmployee>,
    @InjectRepository(WorkforceAssignment)
    private readonly assignmentRepo: Repository<WorkforceAssignment>,
    @InjectRepository(WorkforceAttendance)
    private readonly attendanceRepo: Repository<WorkforceAttendance>,
    @InjectRepository(WorkforceLeaveRequest)
    private readonly leaveRepo: Repository<WorkforceLeaveRequest>,
    @InjectRepository(Building)
    private readonly buildingRepo: Repository<Building>,
  ) {}

  async overview() {
    const today = new Date().toISOString().slice(0, 10);
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const [
      agencies,
      agencyEmployees,
      internalEmployees,
      assignments,
      todayAttendance,
      pendingLeaves,
      expiringContracts,
      expiringLicenses,
    ] = await Promise.all([
      this.agencyRepo.count({ where: { status: WorkforceStatus.ACTIVE } }),
      this.agencyEmployeeRepo.count(),
      this.internalEmployeeRepo.count(),
      this.assignmentRepo.count({ where: { is_active: true } }),
      this.attendanceRepo.count({ where: { attendance_date: today } }),
      this.leaveRepo.count({ where: { status: LeaveStatus.PENDING } }),
      this.contractRepo.count({ where: { end_date: LessThanOrEqual(in30Days) } }),
      this.agencyRepo.count({ where: { license_expiry_date: LessThanOrEqual(in30Days) } }),
    ]);

    return {
      active_agencies: agencies,
      agency_employees: agencyEmployees,
      internal_employees: internalEmployees,
      active_assignments: assignments,
      today_attendance: todayAttendance,
      pending_leaves: pendingLeaves,
      contracts_expiring_soon: expiringContracts,
      licenses_expiring_soon: expiringLicenses,
    };
  }

  listAgencies() {
    return this.agencyRepo.find({
      relations: ['contracts', 'employees'],
      order: { created_at: 'DESC' },
    });
  }

  createAgency(dto: Partial<Agency>) {
    return this.agencyRepo.save(this.agencyRepo.create(dto));
  }

  async updateAgency(id: string, dto: Partial<Agency>) {
    const agency = await this.agencyRepo.preload({ id, ...dto });
    if (!agency) throw new NotFoundException('Agency not found');
    return this.agencyRepo.save(agency);
  }

  async deleteAgency(id: string) {
    const agency = await this.agencyRepo.findOne({ where: { id } });
    if (!agency) throw new NotFoundException('Agency not found');
    await this.agencyRepo.remove(agency);
    return { deleted: true };
  }

  listContracts() {
    return this.contractRepo.find({
      relations: ['agency'],
      order: { end_date: 'ASC' },
    });
  }

  async createContract(dto: Partial<AgencyContract>) {
    if (!dto.agency_id) throw new BadRequestException('Agency is required');
    await this.assertAgency(dto.agency_id);
    return this.contractRepo.save(this.contractRepo.create(dto));
  }

  async updateContract(id: string, dto: Partial<AgencyContract>) {
    if (dto.agency_id) await this.assertAgency(dto.agency_id);
    const contract = await this.contractRepo.preload({ id, ...dto });
    if (!contract) throw new NotFoundException('Contract not found');
    return this.contractRepo.save(contract);
  }

  async deleteContract(id: string) {
    const contract = await this.contractRepo.findOne({ where: { id } });
    if (!contract) throw new NotFoundException('Contract not found');
    await this.contractRepo.remove(contract);
    return { deleted: true };
  }

  listAgencyEmployees() {
    return this.agencyEmployeeRepo.find({
      relations: ['agency', 'assignments', 'assignments.building'],
      order: { created_at: 'DESC' },
    });
  }

  async createAgencyEmployee(dto: Partial<AgencyEmployee>) {
    if (!dto.agency_id) throw new BadRequestException('Agency is required');
    const agency = await this.assertAgency(dto.agency_id);
    if (agency.status !== WorkforceStatus.ACTIVE) {
      throw new BadRequestException('Cannot register staff under inactive agency');
    }
    return this.agencyEmployeeRepo.save(this.agencyEmployeeRepo.create(dto));
  }

  async updateAgencyEmployee(id: string, dto: Partial<AgencyEmployee>) {
    if (dto.agency_id) await this.assertAgency(dto.agency_id);
    const employee = await this.agencyEmployeeRepo.preload({ id, ...dto });
    if (!employee) throw new NotFoundException('Agency employee not found');
    return this.agencyEmployeeRepo.save(employee);
  }

  async deleteAgencyEmployee(id: string) {
    const employee = await this.agencyEmployeeRepo.findOne({ where: { id } });
    if (!employee) throw new NotFoundException('Agency employee not found');
    await this.agencyEmployeeRepo.remove(employee);
    return { deleted: true };
  }

  listInternalEmployees() {
    return this.internalEmployeeRepo.find({
      relations: ['assignments', 'assignments.building', 'leave_requests'],
      order: { created_at: 'DESC' },
    });
  }

  createInternalEmployee(dto: Partial<InternalEmployee>) {
    return this.internalEmployeeRepo.save(this.internalEmployeeRepo.create(dto));
  }

  async updateInternalEmployee(id: string, dto: Partial<InternalEmployee>) {
    const employee = await this.internalEmployeeRepo.preload({ id, ...dto });
    if (!employee) throw new NotFoundException('Internal employee not found');
    return this.internalEmployeeRepo.save(employee);
  }

  async deleteInternalEmployee(id: string) {
    const employee = await this.internalEmployeeRepo.findOne({ where: { id } });
    if (!employee) throw new NotFoundException('Internal employee not found');
    await this.internalEmployeeRepo.remove(employee);
    return { deleted: true };
  }

  listAssignments() {
    return this.assignmentRepo.find({
      relations: ['agency_employee', 'agency_employee.agency', 'internal_employee', 'building'],
      order: { created_at: 'DESC' },
    });
  }

  async createAssignment(dto: Partial<WorkforceAssignment>) {
    await this.validateAssignment(dto);
    await this.closeExistingActiveAssignment(dto);
    return this.assignmentRepo.save(this.assignmentRepo.create({ ...dto, is_active: dto.is_active ?? true }));
  }

  async updateAssignment(id: string, dto: Partial<WorkforceAssignment>) {
    const current = await this.assignmentRepo.findOne({ where: { id } });
    if (!current) throw new NotFoundException('Assignment not found');
    const next = { ...current, ...dto };
    await this.validateAssignment(next);
    return this.assignmentRepo.save({ ...current, ...dto });
  }

  async deleteAssignment(id: string) {
    const assignment = await this.assignmentRepo.findOne({ where: { id } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.assignmentRepo.remove(assignment);
    return { deleted: true };
  }

  listAttendance() {
    return this.attendanceRepo.find({
      relations: ['agency_employee', 'internal_employee', 'assignment', 'assignment.building'],
      order: { attendance_date: 'DESC', created_at: 'DESC' },
    });
  }

  async checkIn(dto: Partial<WorkforceAttendance>) {
    const attendanceDate = dto.attendance_date || new Date().toISOString().slice(0, 10);
    const person = this.personWhere(dto);
    const existing = await this.attendanceRepo.findOne({
      where: { ...person, attendance_date: attendanceDate } as any,
    });
    if (existing?.check_in_at) {
      throw new BadRequestException('This staff member already checked in today');
    }

    const assignment = await this.findActiveAssignment(dto);
    const checkInAt = dto.check_in_at ? new Date(dto.check_in_at) : new Date();
    const lateMinutes = this.calculateLateMinutes(checkInAt, assignment?.shift_start);
    const status = lateMinutes > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

    const record = existing || this.attendanceRepo.create({
      person_type: dto.person_type,
      agency_employee_id: dto.agency_employee_id,
      internal_employee_id: dto.internal_employee_id,
      attendance_date: attendanceDate,
    });

    Object.assign(record, {
      assignment_id: assignment?.id || dto.assignment_id || null,
      check_in_at: checkInAt,
      late_minutes: lateMinutes,
      status,
      notes: dto.notes,
    });
    return this.attendanceRepo.save(record);
  }

  async checkOut(id: string, dto: Partial<WorkforceAttendance>) {
    const record = await this.attendanceRepo.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Attendance record not found');
    record.check_out_at = dto.check_out_at ? new Date(dto.check_out_at) : new Date();
    record.status = record.status === AttendanceStatus.LATE ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
    if (dto.notes !== undefined) record.notes = dto.notes;
    return this.attendanceRepo.save(record);
  }

  async markAbsent(dto: Partial<WorkforceAttendance>) {
    const attendanceDate = dto.attendance_date || new Date().toISOString().slice(0, 10);
    const assignment = await this.findActiveAssignment(dto);
    return this.attendanceRepo.save(this.attendanceRepo.create({
      person_type: dto.person_type,
      agency_employee_id: dto.agency_employee_id,
      internal_employee_id: dto.internal_employee_id,
      assignment_id: assignment?.id || dto.assignment_id || null,
      attendance_date: attendanceDate,
      status: AttendanceStatus.ABSENT,
      notes: dto.notes,
    }));
  }

  listLeaves() {
    return this.leaveRepo.find({
      relations: ['employee'],
      order: { created_at: 'DESC' },
    });
  }

  async createLeave(dto: Partial<WorkforceLeaveRequest>) {
    if (!dto.employee_id) throw new BadRequestException('Employee is required');
    await this.assertInternalEmployee(dto.employee_id);
    const days = dto.days || this.calculateLeaveDays(dto.start_date, dto.end_date);
    return this.leaveRepo.save(this.leaveRepo.create({ ...dto, days }));
  }

  async decideLeave(id: string, dto: { status: LeaveStatus; decision_note?: string }) {
    const leave = await this.leaveRepo.findOne({ where: { id }, relations: ['employee'] });
    if (!leave) throw new NotFoundException('Leave request not found');
    if (![LeaveStatus.APPROVED, LeaveStatus.REJECTED, LeaveStatus.CANCELLED].includes(dto.status)) {
      throw new BadRequestException('Invalid leave decision');
    }

    if (leave.status === LeaveStatus.APPROVED && dto.status !== LeaveStatus.APPROVED) {
      leave.employee.annual_leave_balance += leave.days;
      await this.internalEmployeeRepo.save(leave.employee);
    }

    if (leave.status !== LeaveStatus.APPROVED && dto.status === LeaveStatus.APPROVED) {
      if (leave.employee.annual_leave_balance < leave.days) {
        throw new BadRequestException('Insufficient leave balance');
      }
      leave.employee.annual_leave_balance -= leave.days;
      await this.internalEmployeeRepo.save(leave.employee);
    }

    leave.status = dto.status;
    leave.decision_note = dto.decision_note || null;
    leave.decided_at = new Date();
    return this.leaveRepo.save(leave);
  }

  private async assertAgency(id: string) {
    const agency = await this.agencyRepo.findOne({ where: { id } });
    if (!agency) throw new NotFoundException('Agency not found');
    return agency;
  }

  private async assertInternalEmployee(id: string) {
    const employee = await this.internalEmployeeRepo.findOne({ where: { id } });
    if (!employee) throw new NotFoundException('Internal employee not found');
    return employee;
  }

  private async validateAssignment(dto: Partial<WorkforceAssignment>) {
    if (!dto.person_type) throw new BadRequestException('Person type is required');
    if (!dto.building_id) throw new BadRequestException('Building is required');
    const building = await this.buildingRepo.findOne({ where: { id: dto.building_id } });
    if (!building) throw new NotFoundException('Building not found');

    if (dto.person_type === WorkforcePersonType.AGENCY) {
      if (!dto.agency_employee_id) throw new BadRequestException('Agency employee is required');
      const employee = await this.agencyEmployeeRepo.findOne({
        where: { id: dto.agency_employee_id },
        relations: ['agency'],
      });
      if (!employee) throw new NotFoundException('Agency employee not found');
      if (employee.agency?.status !== WorkforceStatus.ACTIVE) {
        throw new BadRequestException('Cannot assign staff from inactive agency');
      }
    }

    if (dto.person_type === WorkforcePersonType.INTERNAL) {
      if (!dto.internal_employee_id) throw new BadRequestException('Internal employee is required');
      await this.assertInternalEmployee(dto.internal_employee_id);
    }
  }

  private async closeExistingActiveAssignment(dto: Partial<WorkforceAssignment>) {
    const where =
      dto.person_type === WorkforcePersonType.AGENCY
        ? { person_type: dto.person_type, agency_employee_id: dto.agency_employee_id, is_active: true }
        : { person_type: dto.person_type, internal_employee_id: dto.internal_employee_id, is_active: true };
    await this.assignmentRepo.update(where as any, { is_active: false, end_date: new Date().toISOString().slice(0, 10) });
  }

  private personWhere(dto: Partial<WorkforceAttendance>) {
    if (dto.person_type === WorkforcePersonType.AGENCY && dto.agency_employee_id) {
      return { person_type: dto.person_type, agency_employee_id: dto.agency_employee_id };
    }
    if (dto.person_type === WorkforcePersonType.INTERNAL && dto.internal_employee_id) {
      return { person_type: dto.person_type, internal_employee_id: dto.internal_employee_id };
    }
    throw new BadRequestException('Valid staff member is required');
  }

  private async findActiveAssignment(dto: Partial<WorkforceAttendance>) {
    const where =
      dto.person_type === WorkforcePersonType.AGENCY
        ? { person_type: dto.person_type, agency_employee_id: dto.agency_employee_id, is_active: true }
        : { person_type: dto.person_type, internal_employee_id: dto.internal_employee_id, is_active: true };
    return this.assignmentRepo.findOne({ where: where as any });
  }

  private calculateLateMinutes(checkInAt: Date, shiftStart?: string | null) {
    if (!shiftStart) return 0;
    const [hours, minutes] = shiftStart.split(':').map((v) => parseInt(v, 10));
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
    const expected = new Date(checkInAt);
    expected.setHours(hours, minutes, 0, 0);
    return Math.max(0, Math.ceil((checkInAt.getTime() - expected.getTime()) / 60000));
  }

  private calculateLeaveDays(start?: string, end?: string) {
    if (!start || !end) throw new BadRequestException('Leave dates are required');
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    if (diff <= 0) throw new BadRequestException('Invalid leave date range');
    return diff;
  }
}
