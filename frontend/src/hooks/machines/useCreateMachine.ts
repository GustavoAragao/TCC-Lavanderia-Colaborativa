import { useState } from 'react';
import { useRouter } from 'expo-router';
import { machineService } from '../../services/MachineService';
import { Machine } from '../../types/machine';

export function useCreateMachine() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const createMachine = async (data: Partial<Machine>) => {
    setLoading(true);
    try {
      // Chama o service que criamos antes
      await machineService.create(data);
      router.back(); // Volta para a listagem após criar
    } catch (error) {
      console.error("Erro ao criar máquina:", error);
      alert("Erro ao salvar a máquina. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  };

  return { createMachine, loading };
}