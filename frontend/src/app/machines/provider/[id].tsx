import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { machineService } from '../../../services/MachineService';
import { bookingService } from '../../../services/BookingService';
import { Machine, MachineAvailability } from '../../../types/machine';
import { DAYS_OF_WEEK } from '../../../utils/constants';


interface CalendarDay {
  dateStr: string;     
  dayOfWeek: number;   
  dayOfMonth: number;  
  labelShort: string;  
}

export default function ProviderLaundriesScreen() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [providerMachines, setProviderMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [machineAvailability, setMachineAvailability] = useState<MachineAvailability[]>([]);
  const [providerBookings, setProviderBookings] = useState<any[]>([]);

  // 1. Gera os próximos 7 dias
  const calendarDays = useMemo<CalendarDay[]>(() => {
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const dayName = DAYS_OF_WEEK.find(day => day.id === dayOfWeek)?.label || '';
      
      days.push({
        dateStr,
        dayOfWeek,
        dayOfMonth: d.getDate(),
        labelShort: dayName.split('-')[0].substring(0, 3),
      });
    }
    return days;
  }, []);

  useEffect(() => {
    if (calendarDays.length > 0 && !selectedDateStr) {
      setSelectedDateStr(calendarDays[0].dateStr);
    }
  }, [calendarDays]);

  // 2. Carrega as máquinas e agendamentos
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [allMachines, bookingsRes] = await Promise.all([
          machineService.getAll(),
          bookingService.getProviderBookings()
        ]);

        const filteredMachines = allMachines.filter((m) => m.providerId === id);
        setProviderMachines(filteredMachines);
        setProviderBookings(bookingsRes || []);

        if (filteredMachines.length > 0) {
          setSelectedMachine(filteredMachines[0]);
        }
      } catch (error) {
        console.error("Erro no fetch inicial:", error);
        Alert.alert('Erro', 'Não foi possível carregar os dados da lavanderia.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id]);

  // 3. Busca a agenda da máquina
  useEffect(() => {
    if (!selectedMachine) return;

    const fetchMachineSpecs = async () => {
      try {
        const agenda = await machineService.getAvailability(selectedMachine.id);
        setMachineAvailability(agenda);
      } catch (error) {
        console.error("Erro ao buscar agenda:", error);
      }
    };

    fetchMachineSpecs();
  }, [selectedMachine]);

  // 4. FUNÇÃO DE CÁLCULO
  const computedSlots = useMemo(() => {
    if (!selectedMachine || !selectedDateStr) return [];
    
    const targetDayObj = calendarDays.find(d => d.dateStr === selectedDateStr);
    if (!targetDayObj) return [];

    const shift = machineAvailability.find(a => a.dayOfWeek === targetDayObj.dayOfWeek);
    if (!shift) return []; 

    const slots = [];
    const [startH, startM] = shift.startTime.split(':').map(Number);
    const [endH, endM] = shift.endTime.split(':').map(Number);

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const duration = Number(selectedMachine.isWasherDryer && selectedMachine.fullCycleDuration
      ? selectedMachine.fullCycleDuration
      : selectedMachine.washDuration);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    while (currentMinutes + duration <= endMinutes) {
      const hStart = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
      const mStart = (currentMinutes % 60).toString().padStart(2, '0');
      const startTimeStr = `${hStart}:${mStart}`;

      const nextMinutes = currentMinutes + duration;
      const hEnd = Math.floor(nextMinutes / 60).toString().padStart(2, '0');
      const mEnd = (nextMinutes % 60).toString().padStart(2, '0');
      const endTimeStr = `${hEnd}:${mEnd}`;

      let isAvailable = true;

      if (selectedDateStr === todayStr) {
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        if (currentMinutes <= nowMinutes) {
          isAvailable = false;
        }
      }

      if (isAvailable) {
        const hasOverlap = providerBookings.some((booking) => {
          if (booking.machineId !== selectedMachine.id || booking.status === 'cancelled' || booking.status === 'finished') return false;

          const bDate = new Date(booking.scheduledAt);
          const bDateStr = bDate.toISOString().split('T')[0];

          if (bDateStr !== selectedDateStr) return false;

          const bStartMinutes = bDate.getHours() * 60 + bDate.getMinutes();
          const bEndMinutes = bStartMinutes + booking.durationMinutes;

          return currentMinutes < bEndMinutes && nextMinutes > bStartMinutes;
        });

        if (hasOverlap) isAvailable = false;
      }

      slots.push({
        startTime: startTimeStr,
        endTime: endTimeStr,
        isAvailable,
      });

      currentMinutes = nextMinutes;
    }

    return slots;
  }, [selectedMachine, selectedDateStr, machineAvailability, providerBookings, calendarDays]);

  const handleBookingInit = (slot: any) => {
    const dayObj = calendarDays.find(d => d.dateStr === selectedDateStr);
    const dayLabel = DAYS_OF_WEEK.find(day => day.id === dayObj?.dayOfWeek)?.label;

    Alert.alert(
      "Confirmar Escolha",
      `Deseja reservar este horário na ${dayLabel} (${dayObj?.dayOfMonth}) das ${slot.startTime} às ${slot.endTime}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          onPress: () => {
            router.push({
              pathname: '/bookings/checkout',
              params: {
                machineId: selectedMachine?.id,
                date: selectedDateStr,
                startTime: slot.startTime,
              }
            });
          } 
        }
      ]
    );
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#4CC9F0" /></View>;
  }

  const firstMachine = providerMachines[0];
  const providerName = firstMachine?.provider?.name || 'Sem nome';
  // Pega o endereço dinâmico do provedor, se não houver, mostra o bairro padrão
  const providerAddress = (firstMachine as any)?.provider?.address || 'Sem endereço';

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#0A1D47" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Lavanderia do {providerName.split(' ')[0]}</Text>
          <Text style={styles.subtitle}>Selecione um equipamento e horário</Text>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* BLOCO DE ENDEREÇO DA LAVANDERIA */}
        <View style={styles.addressCard}>
          <MaterialCommunityIcons name="map-marker-radius-outline" size={20} color="#4CC9F0" />
          <Text style={styles.addressText} numberOfLines={2}>
            {providerAddress}
          </Text>
        </View>

        {/* Carrossel de Máquinas */}
        <View style={styles.machinesSection}>
          <Text style={styles.sectionTitle}>Equipamentos Disponíveis</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.machinesScroll}>
            {providerMachines.map((item) => {
              const isSelected = selectedMachine?.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.machineTab, isSelected && styles.machineTabSelected]}
                  onPress={() => setSelectedMachine(item)}
                  activeOpacity={0.9}
                >
                  <MaterialCommunityIcons name="washing-machine" size={28} color={isSelected ? "white" : "#0A1D47"} />
                  <Text style={[styles.machineTabText, isSelected && styles.machineTabTextSelected]}>{item.name}</Text>
                  <Text style={[styles.machineTabSub, isSelected && styles.machineTabSubSelected]}>{item.capacityKg}kg • R$ {item.pricePerLoad}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {selectedMachine && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Detalhes do Equipamento</Text>
            <Text style={styles.descriptionText}>{selectedMachine.description || 'Lavanderia local no bairro Salobrinho.'}</Text>
            <View style={styles.specsRow}>
              <View style={styles.specBadge}>
                <MaterialCommunityIcons name="cached" size={16} color="#4CC9F0" />
                <Text style={styles.specText}>{selectedMachine.isWasherDryer ? 'Lava e Seca' : 'Apenas Lava'}</Text>
              </View>
              
              {/* SUA LÓGICA ATUALIZADA DO TEMPO DE CICLO AQUI */}
              <View style={styles.specBadge}>
                <MaterialCommunityIcons name="timer-outline" size={16} color="#4CC9F0" />
                <Text style={styles.specText}>
                  {selectedMachine.fullCycleDuration ? selectedMachine.fullCycleDuration : selectedMachine.washDuration} min/ciclo
                </Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Escolha o Dia</Text>
        <View style={styles.calendarContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {calendarDays.map((day) => {
              const isSelected = selectedDateStr === day.dateStr;
              return (
                <TouchableOpacity
                  key={day.dateStr}
                  style={[styles.calendarDayTab, isSelected && styles.calendarDayTabSelected]}
                  onPress={() => setSelectedDateStr(day.dateStr)}
                >
                  <Text style={[styles.calendarDayLabel, isSelected && styles.calendarDayLabelSelected]}>{day.labelShort}</Text>
                  <Text style={[styles.calendarDayNumber, isSelected && styles.calendarDayNumberSelected]}>{day.dayOfMonth}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <Text style={styles.sectionTitle}>Horários Disponíveis</Text>
        
        {computedSlots.length > 0 ? (
          <View>
            {computedSlots.map((item, index) => (
              <TouchableOpacity 
                key={index}
                style={[styles.slotCard, !item.isAvailable && styles.slotCardDisabled]}
                onPress={() => item.isAvailable && handleBookingInit(item)}
                activeOpacity={item.isAvailable ? 0.7 : 1}
                disabled={!item.isAvailable}
              >
                <View style={styles.slotInfo}>
                  <MaterialCommunityIcons 
                    name={item.isAvailable ? "clock-check-outline" : "clock-remove-outline"} 
                    size={22} 
                    color={item.isAvailable ? "#0A1D47" : "#94a3b8"} 
                  />
                  <Text style={[styles.slotTime, !item.isAvailable && styles.slotTimeDisabled]}>
                    {item.startTime} às {item.endTime}
                  </Text>
                </View>
                
                <View style={[styles.bookBadge, !item.isAvailable && styles.bookBadgeDisabled]}>
                  <Text style={styles.bookBadgeText}>{item.isAvailable ? 'Reservar' : 'Ocupado'}</Text>
                  {item.isAvailable && <MaterialCommunityIcons name="chevron-right" size={16} color="white" />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptySlots}>
            <MaterialCommunityIcons name="clock-alert-outline" size={40} color="#CBD5E1" />
            <Text style={styles.emptySlotsText}>Sem expediente configurado ou horários livres para este dia.</Text>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  backBtn: { padding: 5, marginRight: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0A1D47' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },

  // Estilos do Card de Endereço
  addressCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  addressText: { fontSize: 14, color: '#475569', fontWeight: '500', flex: 1 },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#0A1D47', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  machinesSection: { marginBottom: 20 },
  machinesScroll: { paddingRight: 20 },
  machineTab: { backgroundColor: '#F1F5F9', padding: 14, borderRadius: 16, marginRight: 12, width: 140, borderWidth: 1, borderColor: '#E2E8F0' },
  machineTabSelected: { backgroundColor: '#0A1D47', borderColor: '#0A1D47' },
  machineTabText: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginTop: 8 },
  machineTabTextSelected: { color: 'white' },
  machineTabSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  machineTabSubSelected: { color: '#94a3b8' },

  detailsCard: { backgroundColor: 'white', padding: 15, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  detailsTitle: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6 },
  descriptionText: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 12 },
  specsRow: { flexDirection: 'row', gap: 10 },
  specBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  specText: { fontSize: 12, fontWeight: '600', color: '#475569' },

  calendarContainer: { marginBottom: 25 },
  calendarDayTab: { backgroundColor: '#F1F5F9', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, marginRight: 10, minWidth: 60 },
  calendarDayTabSelected: { backgroundColor: '#4CC9F0' },
  calendarDayLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' },
  calendarDayLabelSelected: { color: 'white' },
  calendarDayNumber: { fontSize: 16, fontWeight: 'bold', color: '#0A1D47', marginTop: 4 },
  calendarDayNumberSelected: { color: 'white' },

  slotCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#F1F5F9', elevation: 1 },
  slotCardDisabled: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', elevation: 0 },
  slotInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  slotTime: { fontSize: 15, color: '#0A1D47', fontWeight: '700', marginLeft: 10 },
  slotTimeDisabled: { color: '#94a3b8', fontWeight: '400' },
  bookBadge: { backgroundColor: '#0A1D47', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  bookBadgeDisabled: { backgroundColor: '#E2E8F0' },
  bookBadgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

  emptySlots: { alignItems: 'center', marginTop: 15, paddingVertical: 20 },
  emptySlotsText: { color: '#94a3b8', fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 30 }
});