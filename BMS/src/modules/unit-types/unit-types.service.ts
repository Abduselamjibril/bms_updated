import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { UnitType } from './entities/unit-type.entity';
import { Unit } from '../units/entities/unit.entity';
import { CreateUnitTypeDto } from './dto/create-unit-type.dto';
import { UpdateUnitTypeDto } from './dto/update-unit-type.dto';

@Injectable()
export class UnitTypesService {
  constructor(
    @InjectRepository(UnitType)
    private readonly unitTypeRepo: Repository<UnitType>,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
  ) {}

  async create(dto: CreateUnitTypeDto): Promise<UnitType> {
    const uppercaseCode = dto.code.toUpperCase().trim();
    
    const exists = await this.unitTypeRepo.findOne({
      where: { code: uppercaseCode },
    });
    if (exists) {
      throw new ConflictException(`Unit type code "${uppercaseCode}" already exists`);
    }

    const unitType = this.unitTypeRepo.create({
      ...dto,
      code: uppercaseCode,
    });
    return this.unitTypeRepo.save(unitType);
  }

  async findAll(search?: string, activeOnly?: boolean): Promise<UnitType[]> {
    const where: any = {};

    if (activeOnly) {
      where.is_active = true;
    }

    if (search) {
      const q = search.trim();
      where.name = Like(`%${q}%`);
      // In TypeORM, if we want an OR search on code, we can use an array
      return this.unitTypeRepo.find({
        where: [
          { ...where, name: Like(`%${q}%`) },
          { ...where, code: Like(`%${q.toUpperCase()}%`) },
        ],
        order: { name: 'ASC' },
      });
    }

    return this.unitTypeRepo.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<UnitType> {
    const type = await this.unitTypeRepo.findOne({ where: { id } });
    if (!type) {
      throw new NotFoundException(`Unit type with ID "${id}" not found`);
    }
    return type;
  }

  async update(id: string, dto: UpdateUnitTypeDto): Promise<UnitType> {
    const type = await this.findOne(id);

    // If deactivating, verify if it can be deactivated safely (optional, but keep it basic since activeOnly filter handles dropdowns anyway)
    await this.unitTypeRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const type = await this.findOne(id);

    // Check if any unit is currently using this unit type code
    const inUse = await this.unitRepo.findOne({
      where: { type: type.code },
    });
    if (inUse) {
      throw new ConflictException(
        `Cannot delete unit type "${type.name}" (${type.code}) because it is currently assigned to one or more units.`,
      );
    }

    await this.unitTypeRepo.delete(id);
    return { message: `Unit type "${type.name}" deleted successfully.` };
  }
}
