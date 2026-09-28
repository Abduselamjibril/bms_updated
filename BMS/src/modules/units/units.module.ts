import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';
import { Unit } from './entities/unit.entity';
import { UnitAmenity } from '../amenities/entities/unit-amenity.entity';
import { Amenity } from '../amenities/entities/amenity.entity';
import { Building } from '../buildings/entities/building.entity';
import { Owner } from '../owners/entities/owner.entity';
import { UnitType } from '../unit-types/entities/unit-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Unit, UnitAmenity, Amenity, Building, Owner, UnitType])],
  controllers: [UnitsController],
  providers: [UnitsService],
})
export class UnitsModule implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.dataSource.query(`ALTER TABLE units ALTER COLUMN type TYPE varchar(50)`);
      console.log('Successfully altered units.type column to varchar');
    } catch (e) {
      // Column might already be altered, ignore errors
    }
  }
}
