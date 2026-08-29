import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetMachineAvailabilityDto } from './dto/set-availability.dto';
import { ServiceResult } from '../common/interfaces/service-result.interface';
import { MachineAvailability } from '@prisma/client';

@Injectable()
export class AvailabilityService {
    constructor(private prisma: PrismaService) { }

    async setAvailability(
        machineId: string,
        userId: string,
        dto: SetMachineAvailabilityDto
    ): Promise<ServiceResult<MachineAvailability>> {
        const machine = await this.prisma.machine.findUnique({
            where: { id: machineId }
        });

        if (!machine) return { success: false, error: 'MACHINE_NOT_FOUND' };
        if (machine.providerId !== userId) return { success: false, error: 'FORBIDDEN' };

        try {
            // Transação: Tudo ou nada
            await this.prisma.$transaction(async (tx) => {
                // Limpa a agenda antiga
                await tx.machineAvailability.deleteMany({ where: { machineId } });

                // Insere a agenda nova
                await tx.machineAvailability.createMany({
                    data: dto.availabilities.map((av) => ({
                        machineId,
                        ...av,
                    })),
                });
            });

            return { success: true };
        } catch (e) {
            return { success: false, error: 'INTERNAL_ERROR' };
        }
    }

    async getByMachine(machineId: string): Promise<ServiceResult<MachineAvailability[]>> {
        const data = await this.prisma.machineAvailability.findMany({
            where: { machineId },
            orderBy: { dayOfWeek: 'asc' },
        });
        return { success: true, data };
    }
}