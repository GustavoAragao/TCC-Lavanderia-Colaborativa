import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto, BookingType } from './dto/create-booking.dto';
import { ServiceResult } from '../common/interfaces/service-result.interface';
import { addMinutes, getDay, format } from 'date-fns';
import { PaymentsService } from 'src/payments/payments.service';
import { Booking } from '@prisma/client';

@Injectable()
export class BookingsService {
    constructor(private prisma: PrismaService, private paymentsService: PaymentsService) { }

    async create(userId: string, dto: CreateBookingDto): Promise<ServiceResult<Booking & { checkoutUrl: string }>> {
        try {

            const { machineId, scheduledAt, type } = dto;
            const start = new Date(scheduledAt);

            // 1. Busca dados da máquina
            const machine = await this.prisma.machine.findUnique({ where: { id: machineId } });
            if (!machine) return { success: false, error: 'MACHINE_NOT_FOUND' };

            // 2. Calcula tempos
            const duration = type === BookingType.FULL_CYCLE
                ? (machine.fullCycleDuration || machine.washDuration)
                : machine.washDuration;
            const end = addMinutes(start, duration);

            // 3. Validação: A máquina está "aberta" nesse horário?
            const isOpen = await this.validateAvailability(machineId, start, end);
            if (!isOpen) return { success: false, error: 'MACHINE_CLOSED_AT_THIS_TIME' };

            // 4. Validação: Existe outra lavagem no mesmo horário?
            const hasConflict = await this.checkConflict(machineId, start, end);
            if (hasConflict) return { success: false, error: 'TIME_SLOT_BUSY' };

            // 5. Criação atômica (Agendamento + Pagamento)
            const result = await this.saveBookingWithPayment(userId, machine, start, duration, type);

            return { success: true, data: result };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async findAllByUser(userId: string): Promise<ServiceResult<Booking[]>> {
        const bookings = await this.prisma.booking.findMany({
            where: { clientId: userId },
            include: {
                machine: { select: { provider: true, name: true, imageUrl: true } }, // Traz o nome da máquina junto
                payment: true, // Traz o status do pagamento
                review: true,
            },
            orderBy: { scheduledAt: 'desc' } // Os mais recentes primeiro
        });

        return { success: true, data: bookings };
    }

    async getProviderBookings(providerId: string): Promise<ServiceResult<any>> {
        try {
            const bookings = await this.prisma.booking.findMany({
            where: {
                machine: {
                providerId: providerId // Filtra agendamentos de máquinas que pertencem ao usuário
                }
            },
            include: {
                client:  true, // Para o provedor saber quem é o cliente
                machine: true,
                payment: true,
                review: true,
            },
            orderBy: {
                scheduledAt: 'desc' // Mais recentes primeiro
            }
            });

            return { success: true, data: bookings };
        } catch (error) {
            return { success: false, error: 'FETCH_ERROR' };
        }
    }

    async cancel(bookingId: string, userId: string): Promise<ServiceResult<Booking>> {
        // 1. Busca o agendamento e verifica se ele pertence ao usuário
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId }, include: { payment: true, machine: true }
        });

        if (!booking) return { success: false, error: 'BOOKING_NOT_FOUND' };

        if (booking.clientId !== userId && booking.machine.providerId !== userId) return { success: false, error: 'FORBIDDEN' };

        // 2. Só permite cancelar se não estiver finalizado ou já cancelado
        if (booking.status === 'finished' || booking.status === 'cancelled') return { success: false, error: 'CANNOT_CANCEL_STATUS' };

        // 3. Lógica de Estorno (Refund)
        if (booking.payment?.status === 'paid' && booking.payment.mpPaymentId) {
            const refundResult = await this.paymentsService.refundPayment(booking.payment.mpPaymentId);

            if (!refundResult.success) {
                // Se o estorno falhar (ex: falta de saldo ou erro no MP) interrompemos o cancelamento para evitar inconsistência
                return { success: false, error: 'REFUND_FAILED_TRY_AGAIN' };
            }
        }

        // 4. Atualização atômica no banco de dados
        await this.prisma.$transaction([
            this.prisma.booking.update({
                where: { id: bookingId },
                data: { status: 'cancelled' },
            }),
            // Se houver pagamento, marcamos ele como cancelado/estornado também
            ...(booking.payment
                ? [this.prisma.payment.update({
                    where: { bookingId },
                    data: { status: 'cancelled', updatedAt: new Date() }
                })]
                : [])
        ]);

        return { success: true };
    }

    async finish(bookingId: string, userId: string): Promise<ServiceResult<Booking>> {
        // Busca o agendamento e o dono da máquina (via providerId)
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { machine: true }
        });

        if (!booking) return { success: false, error: 'BOOKING_NOT_FOUND' };

        // Só o dono da máquina (provedor) pode finalizar
        if (booking.machine.providerId !== userId) {
            return { success: false, error: 'FORBIDDEN' };
        }
        // Só permite finalizar se já estiver confirmado
        if (booking.status !== 'confirmed') {
            return { success: false, error: 'INVALID_STATUS' };
        }

        // Atualiza o status
        await this.prisma.booking.update({ where: { id: bookingId }, data: { status: 'finished' }, });

        //Fazer Lógica de repasse do dinheiro para o provedor posteriormente

        return { success: true };
    }

    // --- MÉTODOS AUXILIARES (Deixam o código de create limpo) ---

    private async validateAvailability(machineId: string, start: Date, end: Date): Promise<boolean> {
        const dayOfWeek = getDay(start); // 0 (Dom) a 6 (Sáb)
        const startTimeStr = format(start, 'HH:mm');
        const endTimeStr = format(end, 'HH:mm');

        const availability = await this.prisma.machineAvailability.findFirst({
            where: {
                machineId,
                dayOfWeek,
                startTime: { lte: startTimeStr },
                endTime: { gte: endTimeStr },
            },
        });

        return !!availability;
    }

    private async checkConflict(machineId: string, start: Date, end: Date): Promise<boolean> {
        // usamos o Raw SQL porque o Prisma não faz "Data + Minutos" nativamente ainda.
        // verificamos se existe algum horario que se sobrepoe (InícioA < FimB) e (FimA > InícioB)
        const overlaps = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM "Booking"
      WHERE "machineId" = ${machineId}
      AND "status" NOT IN ('cancelled', 'expired')
      AND (${start} < "scheduledAt" + interval '1 minute' * "durationMinutes")
      AND (${end} > "scheduledAt")
    `;
        return overlaps.length > 0;
    }

    /*private async checkConflict(machineId: string, start: Date, end: Date): Promise<boolean> {
        // 1. Buscamos todos os agendamentos "vivos" daquela máquina no mesmo dia
        const bookingsDay = await this.prisma.booking.findMany({
            where: {
                machineId,
                status: { notIn: ['cancelled', 'expired'] },
                // Opcional: filtrar apenas pelo dia atual para carregar menos dados
                scheduledAt: {
                    gte: new Date(start.setHours(0, 0, 0, 0)),
                    lte: new Date(start.setHours(23, 59, 59, 999))
                }
            }
        });

        // 2. Fazemos a checagem lógica no JavaScript (mais legível!)
        const hasOverlap = bookingsDay.some(booking => {
            const bStart = booking.scheduledAt;
            const bEnd = addMinutes(bStart, booking.durationMinutes);

            // A fórmula mágica: (InícioA < FimB) && (FimA > InícioB)
            return (start < bEnd) && (end > bStart);
        });

        return hasOverlap;
    }*/

    private async saveBookingWithPayment(userId: string, machine: any, start: Date, duration: number, type: string) {
        // Definimos o valor da lavagem
        const amount = type === BookingType.FULL_CYCLE ? Number(machine.pricePerLoad) : Number(machine.pricePerLoad); // Ajustar para preços diferentes (futuramente)

        return this.prisma.$transaction(async (tx) => {
            // 1. Cria o Agendamento no banco
            const booking = await tx.booking.create({
                data: {
                    clientId: userId,
                    machineId: machine.id,
                    scheduledAt: start,
                    type,
                    durationMinutes: duration,
                    status: 'pending'
                }
            });

            // 2. Solicita a "Preferência" ao Mercado Pago
            const description = `Lavagem ${type} - Máquina ${machine.name} (Salobrinho)`;
            const paymentResult = await this.paymentsService.createPreference(
                booking.id,
                amount,
                description
            );

            if (!paymentResult.success) {
                throw new Error('PAYMENT_SERVICE_ERROR');
            }

            // 3. Cria o registro de Pagamento com o ID do Mercado Pago
            await tx.payment.create({
                data: {
                    bookingId: booking.id,
                    amount: amount,
                    status: 'pending',
                    mpPreferenceId: paymentResult.data!.preferenceId, // Salvamos o ID da preferência
                }
            });

            return {
                ...booking,
                checkoutUrl: paymentResult.data!.initPoint
            };
        });
    }
}