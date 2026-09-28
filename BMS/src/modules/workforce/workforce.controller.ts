import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { WorkforceService } from './workforce.service';
import { LeaveStatus } from './entities/enums';

@ApiTags('Workforce')
@Controller('workforce')
@Auth()
export class WorkforceController {
  constructor(private readonly workforceService: WorkforceService) {}

  @Get('overview')
  @Permissions('workforce:read')
  overview() {
    return this.workforceService.overview();
  }

  @Get('agencies')
  @Permissions('workforce:read')
  listAgencies() {
    return this.workforceService.listAgencies();
  }

  @Post('agencies')
  @Permissions('workforce:create')
  createAgency(@Body() dto: any) {
    return this.workforceService.createAgency(dto);
  }

  @Patch('agencies/:id')
  @Permissions('workforce:update')
  updateAgency(@Param('id') id: string, @Body() dto: any) {
    return this.workforceService.updateAgency(id, dto);
  }

  @Delete('agencies/:id')
  @Permissions('workforce:delete')
  deleteAgency(@Param('id') id: string) {
    return this.workforceService.deleteAgency(id);
  }

  @Get('contracts')
  @Permissions('workforce:read')
  listContracts() {
    return this.workforceService.listContracts();
  }

  @Post('contracts')
  @Permissions('workforce:create')
  createContract(@Body() dto: any) {
    return this.workforceService.createContract(dto);
  }

  @Patch('contracts/:id')
  @Permissions('workforce:update')
  updateContract(@Param('id') id: string, @Body() dto: any) {
    return this.workforceService.updateContract(id, dto);
  }

  @Delete('contracts/:id')
  @Permissions('workforce:delete')
  deleteContract(@Param('id') id: string) {
    return this.workforceService.deleteContract(id);
  }

  @Get('agency-employees')
  @Permissions('workforce:read')
  listAgencyEmployees() {
    return this.workforceService.listAgencyEmployees();
  }

  @Post('agency-employees')
  @Permissions('workforce:create')
  createAgencyEmployee(@Body() dto: any) {
    return this.workforceService.createAgencyEmployee(dto);
  }

  @Patch('agency-employees/:id')
  @Permissions('workforce:update')
  updateAgencyEmployee(@Param('id') id: string, @Body() dto: any) {
    return this.workforceService.updateAgencyEmployee(id, dto);
  }

  @Delete('agency-employees/:id')
  @Permissions('workforce:delete')
  deleteAgencyEmployee(@Param('id') id: string) {
    return this.workforceService.deleteAgencyEmployee(id);
  }

  @Get('internal-employees')
  @Permissions('workforce:read')
  listInternalEmployees() {
    return this.workforceService.listInternalEmployees();
  }

  @Post('internal-employees')
  @Permissions('workforce:create')
  createInternalEmployee(@Body() dto: any) {
    return this.workforceService.createInternalEmployee(dto);
  }

  @Patch('internal-employees/:id')
  @Permissions('workforce:update')
  updateInternalEmployee(@Param('id') id: string, @Body() dto: any) {
    return this.workforceService.updateInternalEmployee(id, dto);
  }

  @Delete('internal-employees/:id')
  @Permissions('workforce:delete')
  deleteInternalEmployee(@Param('id') id: string) {
    return this.workforceService.deleteInternalEmployee(id);
  }

  @Get('assignments')
  @Permissions('workforce:read')
  listAssignments() {
    return this.workforceService.listAssignments();
  }

  @Post('assignments')
  @Permissions('workforce:create')
  createAssignment(@Body() dto: any) {
    return this.workforceService.createAssignment(dto);
  }

  @Patch('assignments/:id')
  @Permissions('workforce:update')
  updateAssignment(@Param('id') id: string, @Body() dto: any) {
    return this.workforceService.updateAssignment(id, dto);
  }

  @Delete('assignments/:id')
  @Permissions('workforce:delete')
  deleteAssignment(@Param('id') id: string) {
    return this.workforceService.deleteAssignment(id);
  }

  @Get('attendance')
  @Permissions('workforce:read')
  listAttendance() {
    return this.workforceService.listAttendance();
  }

  @Post('attendance/check-in')
  @Permissions('workforce:attendance')
  checkIn(@Body() dto: any) {
    return this.workforceService.checkIn(dto);
  }

  @Patch('attendance/:id/check-out')
  @Permissions('workforce:attendance')
  checkOut(@Param('id') id: string, @Body() dto: any) {
    return this.workforceService.checkOut(id, dto);
  }

  @Post('attendance/absent')
  @Permissions('workforce:attendance')
  markAbsent(@Body() dto: any) {
    return this.workforceService.markAbsent(dto);
  }

  @Get('leaves')
  @Permissions('workforce:read')
  listLeaves() {
    return this.workforceService.listLeaves();
  }

  @Post('leaves')
  @Permissions('workforce:leave')
  createLeave(@Body() dto: any) {
    return this.workforceService.createLeave(dto);
  }

  @Patch('leaves/:id/decision')
  @Permissions('workforce:leave')
  decideLeave(
    @Param('id') id: string,
    @Body() dto: { status: LeaveStatus; decision_note?: string },
  ) {
    return this.workforceService.decideLeave(id, dto);
  }
}
