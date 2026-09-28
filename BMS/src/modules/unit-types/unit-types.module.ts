import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitType } from './entities/unit-type.entity';
import { Unit } from '../units/entities/unit.entity';
import { UnitTypesService } from './unit-types.service';
import { UnitTypesController } from './unit-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UnitType, Unit])],
  controllers: [UnitTypesController],
  providers: [UnitTypesService],
  exports: [UnitTypesService, TypeOrmModule],
})
export class UnitTypesModule {}
