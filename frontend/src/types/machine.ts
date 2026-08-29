export interface Machine {
  id: string;
  providerId: string;
  name: string;
  description?: string | null;
  isWasherDryer: boolean;
  imageUrl?: string | null;
  capacityKg: number;
  pricePerLoad: string; // Decimal no Prisma, recebido como string no JSON
  status: 'available' | 'maintenance' | 'busy'; // Conforme o default do schema 
  washDuration: number; // default: 30
  fullCycleDuration?: number | null; // Só se for lava e seca
  createdAt: string;
  updatedAt: string;
  
  // Relacionamento opcional incluído no findAll do service no back end
  provider?: {
    name: string;
    email: string;
  };
}

// Para a UC04 - Regras de disponibilidade
export interface MachineAvailability {
  id: string;
  machineId: string;
  dayOfWeek: number; // 0 a 6 (domingo ... sábado)
  startTime: string; // Ex: "08:00"
  endTime: string;   // Ex: "12:00"
}