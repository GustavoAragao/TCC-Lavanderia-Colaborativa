import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsDateString, IsEnum } from 'class-validator';

export enum BookingType {
  WASH = 'WASH',
  FULL_CYCLE = 'FULL_CYCLE'
}

export class CreateBookingDto {
  @ApiProperty({ example: 'uuid-da-maquina' })
  @IsUUID()
  machineId: string;

  @ApiProperty({ description: 'Data e hora do início', example: '2026-03-05T08:00:00Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiProperty({ enum: BookingType, example: 'WASH' })
  @IsEnum(BookingType)
  type: BookingType;
}