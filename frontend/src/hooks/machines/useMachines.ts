import { useState, useEffect, useCallback } from 'react';
import { machineService } from '../../services/MachineService';
import { Machine } from '../../types/machine';

export function useMachines() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMachines = useCallback(async () => {
    setLoading(true);
    try {
      const data = await machineService.getAll(); // Chama o Singleton
      setMachines(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMachines(); }, [fetchMachines]);

  return { machines, loading, refresh: fetchMachines };
}