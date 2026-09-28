import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateUnitTypeDto {
  @ApiProperty({ description: 'Unit type display name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Whether the unit type is active', required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({ description: 'Whether the unit type is commercial', required: false })
  @IsBoolean()
  @IsOptional()
  is_commercial?: boolean;

  @ApiProperty({ description: 'Description of the unit type', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
