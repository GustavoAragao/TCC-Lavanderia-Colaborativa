import { Controller, Post, Body, BadRequestException, NotFoundException, ConflictException, Get, Patch, Param, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/auth.service';


@ApiTags('agendamentos')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Post()
    @ApiOperation({ summary: 'Criar um novo agendamento' })
    async create(
        @Body() dto: CreateBookingDto,
        @CurrentUser() user: JwtPayload,
    ) {
        const result = await this.bookingsService.create(user.sub, dto);

        if (!result.success) {
            switch (result.error) {
                case 'MACHINE_NOT_FOUND':
                    throw new NotFoundException('Máquina não encontrada.');
                case 'MACHINE_CLOSED_AT_THIS_TIME':
                    throw new BadRequestException('A máquina está fechada no horário selecionado.');
                case 'TIME_SLOT_BUSY':
                    throw new ConflictException('Este horário já está ocupado por outro usuário.');
                case 'PAYMENT_SERVICE_ERROR':
                    throw new BadRequestException('Erro ao processar pagamento');
                default:
                    throw new BadRequestException('Erro ao processar o agendamento.');
            }
        }

        return {
            message: 'Agendamento realizado com sucesso!',
            data: result.data,
        };
    }

    @Get('me')
    @ApiOperation({ summary: 'Listar agendamentos do usuario logado' })
    async findAll(@CurrentUser() user: JwtPayload) {
        const result = await this.bookingsService.findAllByUser(user.sub);
        return result.data;
    }

    @Get('provider')
    @ApiOperation({ summary: 'Listar agendamentos que eu, como provedor, preciso atender' })
    async getProviderAgenda(@CurrentUser() user: JwtPayload) {
        const result = await this.bookingsService.getProviderBookings(user.sub);
        
        if (!result.success) {
            throw new BadRequestException('Erro ao buscar sua agenda de serviços.');
        }

        return result.data;
    }

    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Cancelar um agendamento' })
    async cancel(
        @Param('id') id: string,
        @CurrentUser() user: JwtPayload,
    ) {
        const result = await this.bookingsService.cancel(id, user.sub);

        if (!result.success) {
            if (result.error === 'BOOKING_NOT_FOUND') throw new NotFoundException('Agendamento não encontrado.');
            if (result.error === 'FORBIDDEN') throw new ForbiddenException('Você não tem permissão para cancelar este agendamento.');
            if (result.error === 'CANNOT_CANCEL_STATUS') throw new BadRequestException('Este agendamento ja foi concluído ou cancelado e não pode mais ser cancelado.');
            if (result.error === 'REFUND_FAILED_TRY_AGAIN') throw new BadRequestException('Falha ao realizar estorno, tente novamente.');
            throw new BadRequestException('Erro ao cancelar agendamento.');
        }

        return { message: 'Agendamento cancelado com sucesso.' };
    }

    @Patch(':id/finish')
    @ApiOperation({ summary: 'Marcar um agendamento como concluído' })
    async finish(
        @Param('id') id: string,
        @CurrentUser() user: JwtPayload,
    ) {
        const result = await this.bookingsService.finish(id, user.sub);

        if (!result.success) {
            if (result.error === 'BOOKING_NOT_FOUND') throw new NotFoundException('Agendamento não encontrado.');
            if (result.error === 'FORBIDDEN') throw new ForbiddenException('Apenas o dono da máquina pode finalizar o serviço.');
            if (result.error === 'INVALID_STATUS') throw new BadRequestException('Apenas agendamentos pagos/confirmados podem ser finalizados.');
            throw new BadRequestException('Erro ao finalizar agendamento.');
        }
        return { message: 'Serviço finalizado com sucesso!' };
    }
}