import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Building } from '../buildings/entities/building.entity';
import { Agency } from './entities/agency.entity';
import { AgencyContract } from './entities/agency-contract.entity';
import { AgencyEmployee } from './entities/agency-employee.entity';
import { InternalEmployee } from './entities/internal-employee.entity';
import { WorkforceAssignment } from './entities/workforce-assignment.entity';
import { WorkforceAttendance } from './entities/workforce-attendance.entity';
import { WorkforceLeaveRequest } from './entities/workforce-leave-request.entity';
import { WorkforceController } from './workforce.controller';
import { WorkforceService } from './workforce.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Agency,
      AgencyContract,
      AgencyEmployee,
      InternalEmployee,
      WorkforceAssignment,
      WorkforceAttendance,
      WorkforceLeaveRequest,
      Building,
    ]),
  ],
  controllers: [WorkforceController],
  providers: [WorkforceService],
  exports: [WorkforceService],
})
export class WorkforceModule {}
