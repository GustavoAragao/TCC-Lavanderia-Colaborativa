// src/machines/availability.controller.ts
import {
    Controller, Get, Post, Body, Param,
    NotFoundException, ForbiddenException, InternalServerErrorException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { SetMachineAvailabilityDto } from './dto/set-availability.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/auth.service';

@ApiTags('disponibilidade')
@ApiBearerAuth()
@Controller('machines/:machineId/availability')
export class AvailabilityController {
    constructor(private readonly availabilityService: AvailabilityService) { }

    @Post()
    @ApiOperation({ summary: 'Configurar agenda semanal da máquina' })
    async set(
        @Param('machineId') machineId: string,
        @Body() dto: SetMachineAvailabilityDto,
        @CurrentUser() user: JwtPayload,
    ) {
        const result = await this.availabilityService.setAvailability(machineId, user.sub, dto);

        if (!result.success) {
            if (result.error === 'MACHINE_NOT_FOUND') throw new NotFoundException('Máquina não encontrada');
            if (result.error === 'FORBIDDEN') throw new ForbiddenException('Acesso negado');
            throw new InternalServerErrorException('Erro ao salvar disponibilidade');
        }

        return { message: 'Agenda atualizada com sucesso!' };
    }

    @Get()
    @ApiOperation({ summary: 'Ver horários disponíveis de uma máquina' })
    async get(@Param('machineId') machineId: string) {
        const result = await this.availabilityService.getByMachine(machineId);
        return result.data;
    }
}