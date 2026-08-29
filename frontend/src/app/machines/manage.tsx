import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { machineService } from '../../services/MachineService';
import { Machine } from '../../types/machine';

export default function ManageMachinesScreen() {
    const [machines, setMachines] = useState<Machine[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchMachines = async () => {
        try {
            setLoading(true);
            const data = await machineService.getMyMachines();
            setMachines(data);
        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Não foi possível carregar suas máquinas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMachines();
    }, []);

    const handleDelete = (id: string) => {
        Alert.alert("Excluir Máquina", "Tem certeza? Isso apagará todos os registros vinculados.", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Excluir",
                style: "destructive",
                onPress: async () => {
                    await machineService.delete(id);
                    fetchMachines();
                }
            }
        ]);
    };

    const renderMachineCard = ({ item }: { item: Machine }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/machines/${item.id}`)} // Navega para a tela [id].tsx
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="washing-machine" size={24} color="#0A1D47" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.machineName}>{item.name}</Text>
                    <Text style={styles.machineInfo}>{item.capacityKg}kg • R$ {item.pricePerLoad}/ciclo</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'available' ? '#DCFCE7' : '#FEE2E2' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'available' ? '#166534' : '#991B1B' }]}>
                        {item.status === 'available' ? 'Ativa' : 'Pausada'}
                    </Text>
                </View>
            </View>

            <View style={styles.footerInfo}>
                <Text style={styles.tapText}>Toque para editar ou ver horários</Text>
                <TouchableOpacity
                    style={styles.deleteSimpleBtn}
                    onPress={() => handleDelete(item.id)}
                >
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#0A1D47" />
                </TouchableOpacity>
                <Text style={styles.title}>Minhas Máquinas</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#4CC9F0" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={machines}
                    keyExtractor={(m) => m.id}
                    renderItem={renderMachineCard}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="plus-circle-outline" size={60} color="#E2E8F0" />
                            <Text style={styles.emptyText}>Você ainda não cadastrou nenhuma máquina.</Text>
                        </View>
                    }
                />
            )}

            {/* Botão Flutuante para Adicionar */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/machines/new')}
            >
                <MaterialCommunityIcons name="plus" size={32} color="white" />
            </TouchableOpacity>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    backBtn: { padding: 8, marginRight: 10 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#0A1D47' },

    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    iconCircle: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    machineName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    machineInfo: { fontSize: 14, color: '#64748b', marginTop: 2 },

    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: 'bold' },

    actions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
        justifyContent: 'space-between'
    },
    actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 5 },
    actionBtnText: { marginLeft: 6, fontSize: 13, color: '#64748b', fontWeight: '600' },

    fab: {
        position: 'absolute',
        right: 20,
        bottom: 30,
        backgroundColor: '#0A1D47',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { color: '#94a3b8', marginTop: 15, textAlign: 'center', paddingHorizontal: 40 },
    footerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  tapText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
  deleteSimpleBtn: { padding: 5 }
});