import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateUnitTypeDto {
  @ApiProperty({ description: 'Unit type unique code (e.g. 1BR)', example: '1BR' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ description: 'Unit type display name (e.g. 1 Bedroom)', example: '1 Bedroom' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Whether the unit type is commercial', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  is_commercial?: boolean;

  @ApiProperty({ description: 'Description of the unit type', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
