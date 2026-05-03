import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MachinesModule } from '../machines/machines.module';
import { PaymentsModule } from 'src/payments/payments.module';

@Module({
  imports: [
    PrismaModule, 
    MachinesModule, // Importante para acessar lógica de máquinas e disponibilidade
    PaymentsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}