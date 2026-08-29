import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { machineService } from '../../services/MachineService';
import { User } from '../../types/auth';
import { Machine } from '../../types/machine';

interface LaundryGroup {
  providerId: string;
  providerName: string;
  machines: Machine[];
}

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const initData = async () => {
      try {
        const userData = await SecureStore.getItemAsync('user_data');
        if (userData) setUser(JSON.parse(userData));

        const data = await machineService.getAll();
        setMachines(data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Lógica de Agrupamento por Provedor
  const laundryGroups = useMemo(() => {
    const groups: Record<string, LaundryGroup> = {};

    machines.forEach((m) => {
      // Filtro de busca por nome da lavanderia ou modelo da máquina
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           m.provider?.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (matchesSearch) {
        if (!groups[m.providerId]) {
          groups[m.providerId] = {
            providerId: m.providerId,
            providerName: m.provider?.name || 'Lavanderia Parceira',
            machines: [],
          };
        }
        groups[m.providerId].machines.push(m);
      }
    });

    return Object.values(groups);
  }, [machines, searchQuery]);

  const renderLaundryCard = ({ item }: { item: LaundryGroup }) => (
    <TouchableOpacity 
      style={styles.laundryCard} 
      activeOpacity={0.8}
      onPress={() => router.push({ pathname: `/machines/provider/${item.providerId}`})}
    >
      <View style={styles.cardHeader}>
        <View style={styles.laundryIcon}>
          <MaterialCommunityIcons name="storefront-outline" size={26} color="#0A1D47" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.laundryName}>Lavanderia do {item.providerName.split(' ')[0]}</Text>
          <Text style={styles.laundryStatus}>
            {item.machines.length} {item.machines.length === 1 ? 'máquina disponível' : 'máquinas disponíveis'}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#CBD5E1" />
      </View>

      {/* Mini-Badges das Capacidades */}
      <View style={styles.machineRow}>
        {item.machines.slice(0, 4).map((m) => (
          <View key={m.id} style={styles.miniBadge}>
            <MaterialCommunityIcons name="weight-kilogram" size={14} color="#4CC9F0" />
            <Text style={styles.miniBadgeText}>{m.capacityKg}kg</Text>
          </View>
        ))}
        {item.machines.length > 4 && (
          <Text style={styles.moreCount}>+{item.machines.length - 4}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.appTitle}>Salobrinho<Text style={styles.highlight}>Wash</Text></Text>
          <Text style={styles.welcomeText}>Olá, {user?.name.split(' ')[0] || 'Usuário'}!</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={22} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar lavanderias ou máquinas..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <Text style={styles.sectionTitle}>Pontos de Lavagem no Bairro</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#4CC9F0" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={laundryGroups}
          keyExtractor={(item) => item.providerId}
          renderItem={renderLaundryCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="washing-machine-off" size={60} color="#E2E8F0" />
              <Text style={styles.emptyText}>Nenhuma lavanderia encontrada por aqui.</Text>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  appTitle: { fontSize: 24, fontWeight: 'bold', color: '#0A1D47' },
  highlight: { color: '#4CC9F0' },
  welcomeText: { fontSize: 16, color: '#64748b' },
  notificationBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 12 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 52,
    marginBottom: 25,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1e293b' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0A1D47', marginBottom: 15 },
  listContainer: { paddingBottom: 30 },

  laundryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    // Sombra suave para o estilo clean
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  laundryIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerInfo: { flex: 1 },
  laundryName: { fontSize: 17, fontWeight: 'bold', color: '#0f172a' },
  laundryStatus: { fontSize: 13, color: '#10b981', fontWeight: '600', marginTop: 2 },

  machineRow: { flexDirection: 'row', marginTop: 15, alignItems: 'center' },
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniBadgeText: { fontSize: 12, fontWeight: '700', color: '#475569', marginLeft: 4 },
  moreCount: { fontSize: 12, color: '#94a3b8', fontWeight: 'bold', marginLeft: 5 },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 15, fontSize: 15 },
});