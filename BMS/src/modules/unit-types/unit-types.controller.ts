import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { Auth } from '../../common/decorators/auth.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UnitTypesService } from './unit-types.service';
import { CreateUnitTypeDto } from './dto/create-unit-type.dto';
import { UpdateUnitTypeDto } from './dto/update-unit-type.dto';

@ApiTags('Unit Types')
@Controller('unit-types')
@Auth()
export class UnitTypesController {
  constructor(private readonly unitTypesService: UnitTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new unit type' })
  @Permissions('settings:manage')
  create(@Body() dto: CreateUnitTypeDto) {
    return this.unitTypesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all unit types' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'active_only', required: false, type: Boolean })
  findAll(
    @Query('search') search?: string,
    @Query('active_only') activeOnly?: string,
  ) {
    const active = activeOnly === 'true';
    return this.unitTypesService.findAll(search, active);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get unit type by id' })
  findOne(@Param('id') id: string) {
    return this.unitTypesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update unit type by id' })
  @Permissions('settings:manage')
  update(@Param('id') id: string, @Body() dto: UpdateUnitTypeDto) {
    return this.unitTypesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete unit type by id' })
  @Permissions('settings:manage')
  remove(@Param('id') id: string) {
    return this.unitTypesService.remove(id);
  }
}
