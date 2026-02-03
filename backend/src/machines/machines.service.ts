import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMachineDto } from './dto/create-machine.dto';

@Injectable()
export class MachinesService {
  constructor(private prisma: PrismaService) {}

  async create(createMachineDto: CreateMachineDto, providerId: string) {
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
          select: { name: true, email: true }, // Traz dados básicos do dono da máquina
        },
      },
    });
  }
}