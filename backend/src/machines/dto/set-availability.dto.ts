import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, Max, Matches, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAvailabilityDto {
  @ApiProperty({ description: 'Dia da semana (0-6, onde 0 é Domingo)', example: 1 })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ description: 'Horário de início', example: '08:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato de hora deve ser HH:mm' })
  startTime: string;

  @ApiProperty({ description: 'Horário de término', example: '18:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato de hora deve ser HH:mm' })
  endTime: string;
}

export class SetMachineAvailabilityDto {
  @ApiProperty({ type: [CreateAvailabilityDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAvailabilityDto)
  availabilities: CreateAvailabilityDto[];
}