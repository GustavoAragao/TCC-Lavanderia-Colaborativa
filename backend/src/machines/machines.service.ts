import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';

@Injectable()
export class MachinesService {
  constructor(private prisma: PrismaService) {}

  async create(createMachineDto: CreateMachineDto, providerId: string) {
    if (createMachineDto.isWasherDryer && !createMachineDto.fullCycleDuration) {
      return { error: 'MISSING_FULL_CYCLE_DURATION' };
    }
    return this.prisma.machine.create({
      data: {
        ...createMachineDto,
        providerId, // Vincula a máquina a quem estiver logado
      },
    });
  }

  async findAll() {
    return this.prisma.machine.findMany({
      include: {
        provider: {
          select: { name: true, email: true, phone: true, address: true}, // Traz dados básicos do dono da máquina
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.machine.findUnique({
      where: { id },
      /*include: {
        provider: {
          select: { name: true, email: true }, // Traz dados básicos do dono da máquina
        },
      },*/
    });
  }

  async update(id: string, updateMachineDto: UpdateMachineDto, userId: string) {
    const machine = await this.findOne(id);

    if (!machine) return { error: 'NOT_FOUND' };
    if (machine.providerId !== userId) return { error: 'FORBIDDEN' };

    const updated = await this.prisma.machine.update({
      where: { id },
      data: updateMachineDto,
    });

    return { data: updated };
  }

  async remove(id: string, userId: string) {
    const machine = await this.findOne(id);

    if (!machine) return { error: 'NOT_FOUND' };
    if (machine.providerId !== userId) return { error: 'FORBIDDEN' };

    await this.prisma.machine.delete({ where: { id } });
    return { success: true };
  }

  async findByProvider(providerId: string) {
    return this.prisma.machine.findMany({
      where: { providerId },
      include: { provider: { select: { name: true, email: true } } },
    });
  }
}