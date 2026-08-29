import { Module } from '@nestjs/common';
import { MachinesService } from './machines.service';
import { MachinesController } from './machines.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Importante para usar o PrismaService
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';


@Module({
  imports: [PrismaModule],
  controllers: [MachinesController, AvailabilityController],
  providers: [MachinesService, AvailabilityService],
  exports: [MachinesService, AvailabilityService],
})
export class MachinesModule {}