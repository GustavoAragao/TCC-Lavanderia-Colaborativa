import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Switch, Text } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { FormInput } from '../FormInput';
import { Machine } from '../../types/machine';

interface MachineFormProps {
  initialData?: Partial<Machine>;
  onSubmit: (data: any) => void;
  loading: boolean;
  submitLabel: string;
}

export function MachineForm({ initialData, onSubmit, loading, submitLabel }: MachineFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      name: '',
      description: '',
      capacityKg: 0,
      pricePerLoad: '0.00',
      isWasherDryer: false,
    }
  });

  return (
    <View style={styles.container}>
      <FormInput
        name="name"
        control={control}
        label="Nome da Máquina"
        error={errors.name}
        rules={{ required: 'O nome é obrigatório' }}
      />

      <FormInput
        name="description"
        control={control}
        label="Descrição (Opcional)"
        multiline
      />

      <View style={styles.row}>
        {/* Capacidade - Mínimo 1kg no DTO */}
        <FormInput
          name="capacityKg"
          control={control}
          label="Capacidade (kg)"
          keyboardType="numeric"
          error={errors.capacityKg}
          rules={{ 
            required: 'Obrigatório',
            min: { value: 1, message: 'Mínimo 1kg' }
          }}
        />
        {/* Preço - Obrigatório e Decimal */}
        <FormInput
          name="pricePerLoad"
          control={control}
          label="Preço (R$)"
          keyboardType="decimal-pad"
          error={errors.pricePerLoad}
          rules={{ required: 'Obrigatório' }}
        />
      </View>

      <View style={styles.switchRow}>
        <Text variant="bodyLarge">Máquina de Lavar e Secar?</Text>
        <Controller
          control={control}
          name="isWasherDryer"
          render={({ field: { onChange, value } }) => (
            <Switch value={value} onValueChange={onChange} />
          )}
        />
      </View>

      <Button 
        mode="contained" 
        onPress={handleSubmit(onSubmit)} 
        loading={loading}
        style={styles.button}
      >
        {submitLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  row: { flexDirection: 'row', gap: 10 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 },
  button: { marginTop: 10 }
});