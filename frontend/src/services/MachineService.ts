import { BaseService } from './BaseService';
import { Machine, MachineAvailability } from '../types/machine';

// Interface para bater com o SetMachineAvailabilityDto do Back-end
export interface SetAvailabilityData {
  availabilities: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
}

class MachineService extends BaseService {
  private static instance: MachineService;

  private constructor() {
    super();
  }

  public static getInstance(): MachineService {
    if (!MachineService.instance) {
      MachineService.instance = new MachineService();
    }
    return MachineService.instance;
  }

  // UC05 - Pesquisar Máquinas (Listagem)
  async getAll(): Promise<Machine[]> {
    const { data } = await this.api.get<Machine[]>('/machines');
    return data;
  }

  async getById(id: string): Promise<Machine> {
      const { data } = await this.api.get<Machine>(`/machines/${id}`);
      return data;
  }

  // Buscar máquinas apenas do provedor logado
  async getMyMachines(): Promise<Machine[]> {
    const { data } = await this.api.get<Machine[]>('/machines/me');
    return data;
  }

  // UC03 - Cadastrar Máquina
  async create(machineData: Partial<Machine>): Promise<Machine> {
    const { data } = await this.api.post<Machine>('/machines', machineData);
    return data;
  }

  // Atualizar dados da máquina
  async update(id: string, machineData: Partial<Machine>): Promise<Machine> {
    const { data } = await this.api.patch<Machine>(`/machines/${id}`, machineData);
    return data;
  }

  async delete(id: string): Promise<void> {
    await this.api.delete(`/machines/${id}`);
  }

  // Ver disponibilidade de uma máquina específica
  async getAvailability(machineId: string): Promise<MachineAvailability[]> {
    const { data } = await this.api.get<MachineAvailability[]>(`/machines/${machineId}/availability`);
    return data;
  }

  // UC04 - Configurar agenda semanal da máquina
  async setAvailability(machineId: string, availabilityData: SetAvailabilityData): Promise<void> {
    await this.api.post(`/machines/${machineId}/availability`, availabilityData);
  }
}

export const machineService = MachineService.getInstance();