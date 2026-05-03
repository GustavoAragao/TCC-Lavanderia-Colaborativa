import { BaseService } from './BaseService';
import { Machine } from '../types/machine';

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

  // UC03 - Cadastrar Máquina
  async create(machineData: Partial<Machine>): Promise<Machine> {
    const { data } = await this.api.post<Machine>('/machines', machineData);
    return data;
  }
}

export const machineService = MachineService.getInstance();