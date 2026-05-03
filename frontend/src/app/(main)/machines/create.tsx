import { View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MachineForm } from '../../../components/machine/MachineForm';
import { useCreateMachine } from '../../../hooks/machines/useCreateMachine';

export default function CreateMachineScreen() {
    const router = useRouter();
    const { createMachine, loading } = useCreateMachine();

    const handleOnSubmit = (data: any) => {
        // Converte para número antes de enviar para o backend 
        const formattedData = {
            ...data,
            capacityKg: Number(data.capacityKg),
        };
        createMachine(formattedData);
    };

    return (
        <View style={{ flex: 1 }}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Nova Máquina" />
            </Appbar.Header>
            <MachineForm
                onSubmit={handleOnSubmit} // Usa a função tratada
                loading={loading}
                submitLabel="Cadastrar"
            />
        </View>
    );
}