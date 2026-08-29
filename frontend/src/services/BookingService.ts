import { BaseService } from './BaseService';

export interface CreateBookingPayload {
  machineId: string;
  date: string; // Formato ISO "YYYY-MM-DD"
  startTime: string; // Formato "HH:MM"
}

export interface BookingResponse {
  id: string;
  machineId: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

class BookingService extends BaseService {
  private static instance: BookingService;

  private constructor() {
    super();
  }

  public static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService();
    }
    return BookingService.instance;
  }

  // UC06 - Criar um novo agendamento
  async create(payload: CreateBookingPayload): Promise<any> {
    const { data } = await this.api.post('/bookings', payload);
    return data;
  }

  // Buscar os agendamentos feitos pelo cliente logado
  async getMyBookings(): Promise<BookingResponse[]> {
    const { data } = await this.api.get<BookingResponse[]>('/bookings/me');
    return data;
  }

  // Buscar agendamentos de todas as máquinas de um provedor
  async getProviderBookings(): Promise<BookingResponse[]> {
    const { data } = await this.api.get<BookingResponse[]>('/bookings/provider');
    return data;
  }

  // Cancelar um agendamento
  async cancelBooking(id: string): Promise<any> {
    const { data } = await this.api.patch(`/bookings/${id}/cancel`);
    return data;
  }

  // Finalizar um agendamento (marcar como concluído)
  async finishBooking(id: string): Promise<any> {
    const { data } = await this.api.patch(`/bookings/${id}/finish`);
    return data;
  }
}

export const bookingService = BookingService.getInstance();