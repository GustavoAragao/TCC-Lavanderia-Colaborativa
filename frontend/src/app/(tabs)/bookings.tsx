import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from 'expo-router';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { bookingService } from '../../services/BookingService';
import { reviewService } from '../../services/ReviewService'; // Importa o novo service de review
import { DAYS_OF_WEEK } from '../../utils/constants';

type ViewMode = 'client' | 'provider';

export default function BookingsScreen() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('client');
  const [isProvider, setIsProvider] = useState<boolean>(false);

  // Estados para o Modal de Avaliação
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [bookingToRate, setBookingToRate] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [viewMode])
  );

  const loadBookings = async () => {
    try {
      setLoading(true);

      const userData = await SecureStore.getItemAsync('user_data');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setIsProvider(!!parsedUser.isProvider);
      }

      let result;
      if (viewMode === 'client') {
        result = await bookingService.getMyBookings();
      } else {
        result = await bookingService.getProviderBookings();
      }

      const data = result || [];
      setBookings(data);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayAgain = async (booking: any) => {
    const preferenceId = booking.payment?.[0]?.mpPreferenceId || booking.payment?.mpPreferenceId;
    
    if (!preferenceId) {
      Alert.alert("Erro", "Link de pagamento não encontrado para este pedido.");
      return;
    }

    const checkoutUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${preferenceId}`;
    await WebBrowser.openBrowserAsync(checkoutUrl);
    loadBookings();
  };

  const handleCancel = (bookingId: string) => {
    Alert.alert(
      "Cancelar Reserva",
      "Tem certeza que deseja cancelar este agendamento? O horário será liberado para outras pessoas.",
      [
        { text: "Não", style: "cancel" },
        { 
          text: "Sim, Cancelar", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await bookingService.cancelBooking(bookingId);
              await loadBookings();
              Alert.alert("Sucesso", "O seu agendamento foi cancelado.");
            } catch (error: any) {
              const errorMessage = error?.response?.data?.message || "Não foi possível cancelar este agendamento agora.";
              Alert.alert("Erro", errorMessage);
              setLoading(false);
            } 
          } 
        }
      ]
    );
  };

  const handleFinishService = (bookingId: string) => {
    Alert.alert(
      "Finalizar Serviço",
      "Confirma que este ciclo de lavagem foi concluído?",
      [
        { text: "Não", style: "cancel" },
        { 
          text: "Sim, Finalizar", 
          onPress: async () => {
            try {
              setLoading(true);
              await bookingService.finishBooking(bookingId);
              await loadBookings();
              Alert.alert("Sucesso", "Serviço finalizado com sucesso!");
            } catch (error: any) {
              const errorMessage = error?.response?.data?.message || "Erro ao finalizar o serviço.";
              Alert.alert("Erro", errorMessage);
              setLoading(false);
            } 
          } 
        }
      ]
    );
  };

  // Funções para controle do Modal de Avaliação
  const openRatingModal = (booking: any) => {
    setBookingToRate(booking);
    setRatingValue(5);
    setRatingComment('');
    setRatingModalVisible(true);
  };

  const submitRating = async () => {
    if (!bookingToRate) return;
    
    try {
      setLoading(true);
      
      // Envia os dados no padrão exato do seu CreateReviewDto no backend
      await reviewService.createReview({
        bookingId: bookingToRate.id,
        rating: ratingValue,
        comment: ratingComment.trim() || undefined
      });
      
      setRatingModalVisible(false);
      Alert.alert("Obrigado!", "Sua avaliação foi registrada com sucesso.");
      await loadBookings();
    } catch (error: any) {
      console.error("Erro ao avaliar:", error);
      const msg = error?.response?.data?.message || "Não foi possível registrar sua avaliação.";
      Alert.alert("Erro", msg);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const dayName = DAYS_OF_WEEK.find(dw => dw.id === d.getDay())?.label.split('-')[0];
    
    return `${dayName}, ${day}/${month} às ${hours}:${minutes}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Aguardando Pagamento', color: '#f59e0b', icon: 'clock-outline' };
      case 'confirmed':
        return { label: 'Confirmado', color: '#3b82f6', icon: 'check-circle-outline' };
      case 'cancelled':
        return { label: 'Cancelado', color: '#ef4444', icon: 'close-circle-outline' };
      case 'finished':
        return { label: 'Finalizado', color: '#10b981', icon: 'washing-machine' };
      default:
        return { label: status, color: '#64748b', icon: 'help-circle-outline' };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusInfo = getStatusBadge(item.status);

    // Mapeamento dinâmico dos dados de contato com base no viewMode
    const contactName = viewMode === 'provider' 
      ? (item.client?.name || 'Cliente') 
      : (item.machine?.provider?.name || 'Lavanderia parceira');

    const contactPhone = viewMode === 'provider'
      ? (item.client?.phone || item.client?.telefone || 'Não informado')
      : (item.machine?.provider?.phone || item.machine?.provider?.telefone || 'Não informado');

    const contactEmail = viewMode === 'provider'
      ? (item.client?.email || 'Não informado')
      : (item.machine?.provider?.email || 'Não informado');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
            <MaterialCommunityIcons name={statusInfo.icon as any} size={16} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
          <Text style={styles.price}>R$ {item.payment?.amount || item.payment?.[0]?.amount || '0.00'}</Text>
        </View>

        <View style={styles.body}>
          {viewMode === 'provider' ? (
             <Text style={styles.machineName}>Cliente: {contactName}</Text>
          ) : (
             <Text style={styles.machineName}>{item.machine?.name || 'Sem nome'}</Text>
          )}

          {/* Seção Dinâmica de Contato e Informação do Estabelecimento */}
          <View style={styles.contactContainer}>
            <Text style={styles.contactText}>
              <MaterialCommunityIcons name={viewMode === 'provider' ? "washing-machine" : "map-marker-outline"} size={14} color="#64748b" /> 
              {' '}{viewMode === 'provider' ? item.machine?.name : item.machine?.provider?.address}
            </Text>
            
            <View style={styles.contactRow}>
              <MaterialCommunityIcons name="phone-outline" size={13} color="#64748b" />
              <Text style={styles.contactText}>{contactPhone}</Text>
              <Text style={styles.contactDivider}>|</Text>
              <MaterialCommunityIcons name="email-outline" size={13} color="#64748b" />
              <Text style={styles.contactText} numberOfLines={1}>{contactEmail}</Text>
            </View>
          </View>
          
          <View style={styles.dateBox}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color="#0A1D47" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.dateLabel}>Horário agendado:</Text>
              <Text style={styles.dateValue}>{formatDateTime(item.scheduledAt)}</Text>
            </View>
          </View>
        </View>

        {/* BOTÕES DE AÇÃO*/}
        {item.status !== 'finished' && item.status !== 'cancelled' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

            {viewMode === 'client' &&item.status !== 'confirmed' &&
            <TouchableOpacity style={styles.payBtn} onPress={() => handlePayAgain(item)}>
              <MaterialCommunityIcons name="credit-card-outline" size={18} color="white" />
              <Text style={styles.payBtnText}>Pagar Agora</Text>
            </TouchableOpacity>
            }
          </View>
        )}

        {/* SEÇÃO DE AVALIAÇÃO: Aparece se finalizado */}
        {item.status === 'finished' && (
          <View style={styles.actionsRow}>
            {!item.review ? (
              // Se ainda NÃO tem avaliação, mostra o botão de avaliar (apenas para o cliente)
              viewMode === 'client' && (
                <TouchableOpacity style={styles.rateBtn} onPress={() => openRatingModal(item)}>
                  <MaterialCommunityIcons name="star-outline" size={18} color="#d97706" />
                  <Text style={styles.rateBtnText}>Avaliar Serviço</Text>
                </TouchableOpacity>
              )
            ) : (
              // Se JÁ TEM avaliação, mostra as estrelas e o comentário (para ambos verem)
              <View style={styles.reviewDisplayContainer}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewTitle}>
                    {viewMode === 'client' ? 'Sua avaliação: ' : 'Avaliação do cliente: '}
                  </Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <MaterialCommunityIcons 
                        key={star}
                        name={item.review.rating >= star ? "star" : "star-outline"} 
                        size={16} 
                        color={item.review.rating >= star ? "#f59e0b" : "#cbd5e1"} 
                      />
                    ))}
                  </View>
                </View>
                {item.review.comment && (
                  <Text style={styles.reviewComment}>"{item.review.comment}"</Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* BOTÕES DE AÇÃO DO PROVEDOR */}
        {viewMode === 'provider' && item.status === 'confirmed' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.finishBtn} onPress={() => handleFinishService(item.id)}>
              <MaterialCommunityIcons name="check-all" size={18} color="white" />
              <Text style={styles.finishBtnText}>Finalizar Serviço</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>
          {viewMode === 'client' ? 'Painel de Agendamentos' : 'Painel do Provedor'}
        </Text>
      </View>

      {isProvider && (
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'client' && styles.toggleBtnActive]}
            onPress={() => setViewMode('client')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="basket-outline" size={18} color={viewMode === 'client' ? '#0A1D47' : '#64748b'} />
            <Text style={[styles.toggleText, viewMode === 'client' && styles.toggleTextActive]}>Meus Pedidos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'provider' && styles.toggleBtnActive]}
            onPress={() => setViewMode('provider')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="store-cog-outline" size={18} color={viewMode === 'provider' ? '#0A1D47' : '#64748b'} />
            <Text style={[styles.toggleText, viewMode === 'provider' && styles.toggleTextActive]}>Agenda de Serviços</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#4CC9F0" /></View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name={viewMode === 'client' ? "calendar-blank-outline" : "clipboard-text-off-outline"} size={50} color="#CBD5E1" />
              <Text style={styles.emptyText}>
                {viewMode === 'client' 
                  ? "Ainda não possui nenhum pedido." 
                  : "Nenhum serviço agendado para os seus equipamentos."}
              </Text>
            </View>
          }
        />
      )}

      {/* MODAL INTERATIVO DE AVALIAÇÃO */}
      <Modal visible={ratingModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Avaliar Serviço</Text>
              <TouchableOpacity onPress={() => setRatingModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Como foi sua experiência com o equipamento {bookingToRate?.machine?.name}? Sua opinião ajuda a manter a qualidade.
            </Text>

            {/* SELETOR DE ESTRELAS CLICÁVEIS */}
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRatingValue(star)} activeOpacity={0.7}>
                  <MaterialCommunityIcons 
                    name={ratingValue >= star ? "star" : "star-outline"} 
                    size={42} 
                    color={ratingValue >= star ? "#f59e0b" : "#cbd5e1"} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* INPUT DE COMENTÁRIO ADICIONAL */}
            <TextInput
              style={styles.commentInput}
              placeholder="Deixe um comentário sobre a lavagem (opcional)..."
              value={ratingComment}
              onChangeText={setRatingComment}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.submitRateBtn} onPress={submitRating} activeOpacity={0.9}>
              <Text style={styles.submitRateBtnText}>Enviar Avaliação</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  header: { marginBottom: 15, marginTop: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0A1D47' },
  
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', padding: 4, borderRadius: 12, marginBottom: 20 },
  toggleBtn: { flex: 1, flexDirection: 'row', paddingVertical: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 10, gap: 6 },
  toggleBtnActive: { backgroundColor: 'white', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  toggleTextActive: { color: '#0A1D47' },

  listContainer: { paddingBottom: 100 },

  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  price: { fontSize: 16, fontWeight: 'bold', color: '#0A1D47' },

  body: { marginBottom: 15 },
  machineName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  
  // Estilização dos Contatos
  contactContainer: { marginTop: 4, marginBottom: 12 },
  providerName: { fontSize: 13, fontWeight: '500', color: '#475569' },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4, flexWrap: 'wrap' },
  contactText: { fontSize: 12, color: '#64748b' },
  contactDivider: { fontSize: 12, color: '#cbd5e1', marginHorizontal: 2 },
  
  dateBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  dateLabel: { fontSize: 12, color: '#64748b' },
  dateValue: { fontSize: 14, fontWeight: 'bold', color: '#0A1D47', marginTop: 2 },

  actionsRow: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 15 },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#Fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  cancelBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
  
  payBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', borderRadius: 10, paddingVertical: 12, gap: 6 },
  payBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

  finishBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A1D47', borderRadius: 10, paddingVertical: 12, gap: 6 },
  finishBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

  rateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fffbeb', borderRadius: 10, paddingVertical: 12, gap: 6, borderWidth: 1, borderColor: '#fde68a' },
  rateBtnText: { color: '#b45309', fontWeight: 'bold', fontSize: 14 },

  // Estilos do Modal de Avaliação
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0A1D47' },
  modalSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 20 },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 22 },
  commentInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 15, fontSize: 14, color: '#1e293b', minHeight: 90, marginBottom: 22 },
  submitRateBtn: { backgroundColor: '#0A1D47', padding: 16, borderRadius: 12, alignItems: 'center' },
  submitRateBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  reviewDisplayContainer: { flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center' },
  reviewTitle: { fontSize: 13, fontWeight: 'bold', color: '#475569' },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: 13, color: '#64748b', fontStyle: 'italic', marginTop: 6, lineHeight: 18 },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 15, fontSize: 15, paddingHorizontal: 20 }
});