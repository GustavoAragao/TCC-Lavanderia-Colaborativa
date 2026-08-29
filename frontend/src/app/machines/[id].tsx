import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { machineService } from '../../services/MachineService';
import { Machine } from '../../types/machine';
import { DAYS_OF_WEEK } from '../../utils/constants';


export default function MachineFormScreen() {
  const { id } = useLocalSearchParams();
  const isEdit = id !== 'new';
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  // Estados do Formulário (Sincronizados com o Supabase)
  const [name, setName] = useState('');
  const [description, setDescription] = useState(''); // Campo novo
  const [imageUrl, setImageUrl] = useState(''); // Campo novo
  const [capacityKg, setCapacityKg] = useState('');
  const [pricePerLoad, setPricePerLoad] = useState('');
  const [isWasherDryer, setIsWasherDryer] = useState(false);
  const [washDuration, setWashDuration] = useState('30');
  const [fullCycleDuration, setFullCycleDuration] = useState('');

  const [availabilities, setAvailabilities] = useState<any[]>([]);

  useEffect(() => {
    if (isEdit) loadMachineData();
  }, [id]);

  const loadMachineData = async () => {
    try {
      setLoading(true);
      const machine = await machineService.getById(id as string);
      const agenda = await machineService.getAvailability(id as string);

      setName(machine.name);
      setDescription(machine.description || ''); //
      setImageUrl(machine.imageUrl || ''); //
      setCapacityKg(machine.capacityKg.toString());
      setPricePerLoad(machine.pricePerLoad);
      setIsWasherDryer(machine.isWasherDryer);
      setWashDuration(machine.washDuration.toString());
      setFullCycleDuration(machine.fullCycleDuration?.toString() || '');
      setAvailabilities(agenda);
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar dados da máquina.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !capacityKg || !pricePerLoad) {
      Alert.alert("Erro", "Nome, Capacidade e Preço são obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const payload: Partial<Machine> = {
        name,
        description, //
        imageUrl, //
        capacityKg: parseInt(capacityKg),
        pricePerLoad,
        isWasherDryer,
        washDuration: parseInt(washDuration),
        fullCycleDuration: isWasherDryer ? parseInt(fullCycleDuration) : undefined,
      };

      if (isEdit) {
        await machineService.update(id as string, payload);
        await machineService.setAvailability(id as string, { availabilities });
        Alert.alert("Sucesso", "Dados atualizados!");
      } else {
        await machineService.create(payload);
        Alert.alert("Sucesso", "Máquina cadastrada!");
      }
      router.back();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar os dados.");
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = (index: number, field: string, value: any) => {
    const newAgenda = [...availabilities];
    newAgenda[index][field] = value;
    setAvailabilities(newAgenda);
  };

  if (loading && isEdit) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#4CC9F0" /></View>;
  }

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="close" size={26} color="#0A1D47" />
        </TouchableOpacity>
        <Text style={styles.title}>{isEdit ? 'Gerenciar Equipamento' : 'Nova Máquina'}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>

        {/* SECÇÃO 1: DADOS BÁSICOS E IMAGEM */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Gerais</Text>

          <Text style={styles.label}>Nome da Máquina</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ex: Samsung EcoBubble 11kg" />

          <Text style={styles.label}>Descrição (Opcional)</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Conte detalhes sobre a máquina, como ela lava, etc."
            multiline
          />

          <Text style={styles.label}>Link da Imagem</Text>
          <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl} placeholder="https://exemplo.com/imagem.png" />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>Capacidade (kg)</Text>
              <TextInput style={styles.input} value={capacityKg} onChangeText={setCapacityKg} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>R$ por Ciclo</Text>
              <TextInput style={styles.input} value={pricePerLoad} onChangeText={setPricePerLoad} keyboardType="decimal-pad" />
            </View>
          </View>
        </View>

        {/* SECÇÃO 2: CONFIGURAÇÕES TÉCNICAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações de Ciclo</Text>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Possui função secagem?</Text>
            <Switch value={isWasherDryer} onValueChange={setIsWasherDryer} trackColor={{ true: '#4CC9F0' }} />
          </View>

          <Text style={styles.label}>Duração média da Lavagem (min)</Text>
          <TextInput style={styles.input} value={washDuration} onChangeText={setWashDuration} keyboardType="numeric" />

          {isWasherDryer && (
            <>
              <Text style={styles.label}>Duração do Ciclo Completo (min)</Text>
              <TextInput style={styles.input} value={fullCycleDuration} onChangeText={setFullCycleDuration} keyboardType="numeric" />
            </>
          )}
        </View>

        {/* SECÇÃO 3: AGENDA E HORÁRIOS */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Horários de Funcionamento</Text>
          </View>

          {availabilities.map((item, index) => (
            <View key={index} style={styles.availabilityCard}>
              <View style={styles.daySelectorRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.labelSmall}>Dia da Semana</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
                    {DAYS_OF_WEEK.map((day) => (
                      <TouchableOpacity
                        key={day.id}
                        style={[styles.dayOption, item.dayOfWeek === day.id && styles.dayOptionSelected]}
                        onPress={() => updateAvailability(index, 'dayOfWeek', day.id)}
                      >
                        <Text style={[styles.dayOptionText, item.dayOfWeek === day.id && styles.dayOptionTextSelected]}>
                          {day.label.split('-')[0]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.timeRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.labelSmall}>Das</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={item.startTime}
                    onChangeText={(val) => updateAvailability(index, 'startTime', val)}
                    placeholder="00:00"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.labelSmall}>Até as</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={item.endTime}
                    onChangeText={(val) => updateAvailability(index, 'endTime', val)}
                    placeholder="00:00"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => setAvailabilities(availabilities.filter((_, i) => i !== index))}
                  style={styles.deleteBtn}
                >
                  <MaterialCommunityIcons name="delete-outline" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity
              style={styles.addTimeBtn}
              onPress={() => setAvailabilities([...availabilities, { dayOfWeek: 1, startTime: '08:00', endTime: '18:00' }])}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#4CC9F0" />
              <Text style={styles.addTimeText}>Adicionar Horário</Text>
            </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveText}>{isEdit ? 'Salvar Configurações' : 'Cadastrar Máquina'}</Text>}
        </TouchableOpacity>

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  backBtn: { padding: 5, marginRight: 15 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0A1D47' },

  section: { marginBottom: 30, backgroundColor: 'white', padding: 15, borderRadius: 16, elevation: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0A1D47', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
  label: { fontSize: 13, color: '#64748b', marginBottom: 6, fontWeight: '600' },
  labelSmall: { fontSize: 11, color: '#94a3b8', fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' },
  input: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 15, fontSize: 15, color: '#1e293b' },

  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 15 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },

  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  addTimeText: { marginLeft: 6, color: '#4CC9F0', fontWeight: 'bold', fontSize: 14},

  availabilityCard: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  daySelectorRow: { marginBottom: 12 },
  daysScroll: { flexDirection: 'row', marginTop: 5 },
  dayOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#E2E8F0', marginRight: 8 },
  dayOptionSelected: { backgroundColor: '#0A1D47' },
  dayOptionText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  dayOptionTextSelected: { color: 'white' },

  timeRow: { flexDirection: 'row', alignItems: 'flex-end' },
  timeInput: { backgroundColor: 'white', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#CBD5E1', fontSize: 14, textAlign: 'center' },
  deleteBtn: { padding: 8, marginLeft: 5 },

  saveButton: { backgroundColor: '#0A1D47', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOpacity: 0.2, elevation: 4 },
  saveText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});