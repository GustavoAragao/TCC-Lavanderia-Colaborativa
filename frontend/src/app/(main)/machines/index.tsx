import { FlatList, View, StyleSheet } from 'react-native';
import { ActivityIndicator, Appbar, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useMachines } from '../../../hooks/machines/useMachines';
import { MachineCard } from '../../../components/machine/MachineCard';

export default function MachinesScreen() {
    const { machines, loading, refresh } = useMachines();
    const router = useRouter();

    if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

    return (
        <View style={{ flex: 1 }}>
            <Appbar.Header>
                <Appbar.Content title="Máquinas no Salobrinho" />
            </Appbar.Header>

            <FlatList
                data={machines}
                renderItem={({ item }) => <MachineCard machine={item} />}
                keyExtractor={(item) => item.id}
                onRefresh={refresh}
                refreshing={loading}
                contentContainerStyle={{ paddingBottom: 80 }} // Espaço para o FAB não cobrir o último item
            />

            {/* Botão Flutuante para Criar Máquina (UC03) */}
            <FAB
                icon="plus"
                label="Nova Máquina"
                style={styles.fab}
                onPress={() => router.push('/machines/create')} // Navega para a tela que criamos
            />
        </View>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#E3F2FD', // Azul claro combinando com o tema
    },
});