import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { machineService } from '../../services/MachineService';
import { bookingService } from '../../services/BookingService';
import { Machine } from '../../types/machine';

// Lista de dias hardcoded igual fizemos na outra tela
const DAYS_OF_WEEK = [
  { id: 0, label: 'Domingo' },
  { id: 1, label: 'Segunda-feira' },
  { id: 2, label: 'Terça-feira' },
  { id: 3, label: 'Quarta-feira' },
  { id: 4, label: 'Quinta-feira' },
  { id: 5, label: 'Sexta-feira' },
  { id: 6, label: 'Sábado' },
];

enum BookingType {
  WASH = 'WASH',
  FULL_CYCLE = 'FULL_CYCLE'
}

export default function BookingCheckoutScreen() {
  const { machineId, date, startTime } = useLocalSearchParams();
  const router = useRouter();

  const [loadingMachine, setLoadingMachine] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [machine, setMachine] = useState<Machine | null>(null);
  const [bookingType, setBookingType] = useState<BookingType>(BookingType.WASH);

  useEffect(() => {
    const loadMachineDetails = async () => {
      try {
        setLoadingMachine(true);
        const data = await machineService.getById(machineId as string);
        setMachine(data);
        
        if (data.isWasherDryer) {
          setBookingType(BookingType.FULL_CYCLE);
        }
      } catch (error) {
        console.error(error);
        Alert.alert("Erro", "Não foi possível obter os detalhes do equipamento.");
        router.back();
      } finally {
        setLoadingMachine(false);
      }
    };

    if (machineId) loadMachineDetails();
  }, [machineId]);

  const formattedDate = React.useMemo(() => {
    if (!date) return '';
    const [year, month, day] = (date as string).split('-');
    // Atenção aos meses no JS: 0 é Janeiro
    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    const dayName = DAYS_OF_WEEK.find(d => d.id === dateObj.getDay())?.label || '';
    return `${dayName.split('-')[0]}, ${day}/${month}`;
  }, [date]);

  const handleConfirmPayment = async () => {
    if (!machine) return;

    try {
        setSubmitting(true);
        const scheduledAt = `${date}T${startTime}:00.000-03:00`; //Garantir o fuso do Brasil

        const payload = {
            machineId: machine.id,
            scheduledAt,
            type: bookingType,
        };

        console.log("A enviar agendamento para a API:", payload);
        
        const result = await bookingService.create(payload as any);
        console.log("Resposta da API:", result);

        const url = result?.checkoutUrl || result?.data?.checkoutUrl;

        if (url) {
        console.log("A abrir o Mercado Pago com WebBrowser:", url);
        const browserResult = await WebBrowser.openBrowserAsync(url);
        console.log("O utilizador fechou o WebBrowser. Resultado:", browserResult.type);
        
        Alert.alert(
            "Reserva Iniciada", 
            "O fluxo de pagamento foi encerrado. Acompanhe o estado da sua reserva na aba de agendamentos."
        );

        router.replace('/home'); 
        } else {
        throw new Error("CHECKOUT_URL_MISSING");
        }

    } catch (error: any) {
        console.log("Motivo do erro 400:", error.response?.data);
        
        if (error?.response?.status === 409) {
          Alert.alert("Horário Indisponível", "Este horário acabou de ser reservado por outra pessoa.");
        } else {
         Alert.alert("Erro no Agendamento",  error.response?.data);
        }
    } finally {
        setSubmitting(false);
    }
    };

  if (loadingMachine) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CC9F0" />
        <Text style={styles.loadingText}>Preparando seu resumo...</Text>
      </View>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#0A1D47" />
        </TouchableOpacity>
        <Text style={styles.title}>Confirmar Reserva</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="calendar-clock" size={24} color="#0A1D47" />
            <Text style={styles.cardSectionTitle}>Data e Horário</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Dia selecionado:</Text>
            <Text style={styles.detailValue}>{formattedDate}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Horário do ciclo:</Text>
            <Text style={styles.detailValue}>{startTime} h</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="washing-machine" size={24} color="#0A1D47" />
            <Text style={styles.cardSectionTitle}>Equipamento</Text>
          </View>
          <Text style={styles.machineName}>{machine?.name}</Text>
          <Text style={styles.machineSub}>{machine?.capacityKg}kg de capacidade • Salobrinho</Text>
        </View>

        {machine?.isWasherDryer && (
          <View style={styles.infoCard}>
            <View style={styles.cardHeaderRow}>
              <MaterialCommunityIcons name="cog-outline" size={24} color="#0A1D47" />
              <Text style={styles.cardSectionTitle}>Opções do Ciclo</Text>
            </View>
            <Text style={styles.helperText}>Este equipamento possui dupla função. Escolha o serviço ideal:</Text>
            
            <View style={styles.selectorContainer}>
              <TouchableOpacity 
                style={[styles.selectorOption, bookingType === BookingType.WASH && styles.selectorOptionSelected]}
                onPress={() => setBookingType(BookingType.WASH)}
              >
                <MaterialCommunityIcons name="water-outline" size={20} color={bookingType === BookingType.WASH ? 'white' : '#0A1D47'} />
                <Text style={[styles.selectorText, bookingType === BookingType.WASH && styles.selectorTextSelected]}>Apenas Lavar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.selectorOption, bookingType === BookingType.FULL_CYCLE && styles.selectorOptionSelected]}
                onPress={() => setBookingType(BookingType.FULL_CYCLE)}
              >
                <MaterialCommunityIcons name="weather-sunny" size={20} color={bookingType === BookingType.FULL_CYCLE ? 'white' : '#0A1D47'} />
                <Text style={[styles.selectorText, bookingType === BookingType.FULL_CYCLE && styles.selectorTextSelected]}>Lavar e Secar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.priceCard}>
          <Text style={styles.priceTitle}>Resumo do Pagamento</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Valor do ciclo</Text>
            <Text style={styles.priceValue}>R$ {machine?.pricePerLoad}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total a pagar</Text>
            <Text style={styles.totalValue}>R$ {machine?.pricePerLoad}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.payButton} 
          onPress={handleConfirmPayment}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialCommunityIcons name="credit-card-outline" size={22} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.payButtonText}>Ir para o Pagamento</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.secureNotice}>
          <MaterialCommunityIcons name="shield-check" size={12} color="#64748b" /> Pagamento processado de forma segura via Mercado Pago.
        </Text>

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  loadingText: { marginTop: 10, color: '#64748b', fontWeight: '500' },
  header: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  backBtn: { padding: 5, marginRight: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0A1D47' },
  scrollContent: { paddingBottom: 40 },

  infoCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#F1F5F9', elevation: 1 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  cardSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0A1D47', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  detailLabel: { fontSize: 14, color: '#64748b' },
  detailValue: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },

  machineName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  machineSub: { fontSize: 13, color: '#64748b', marginTop: 4 },

  helperText: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  selectorContainer: { flexDirection: 'row', gap: 10 },
  selectorOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F1F5F9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  selectorOptionSelected: { backgroundColor: '#0A1D47', borderColor: '#0A1D47' },
  selectorText: { fontSize: 13, fontWeight: '700', color: '#0A1D47' },
  selectorTextSelected: { color: 'white' },

  priceCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 25, borderWidth: 1, borderColor: '#E2E8F0' },
  priceTitle: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginBottom: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 14, color: '#64748b' },
  priceValue: { fontSize: 14, color: '#475569', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  totalLabel: { fontSize: 15, fontWeight: 'bold', color: '#0A1D47' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#0A1D47' },

  payButton: { backgroundColor: '#10b981', padding: 18, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1 },
  payButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  secureNotice: { textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 12 }
});