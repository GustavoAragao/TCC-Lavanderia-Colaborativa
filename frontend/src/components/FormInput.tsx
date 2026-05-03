import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import { Control, Controller, FieldError } from 'react-hook-form';

interface FormInputProps {
  name: string;
  control: Control<any>;
  label: string;
  error?: FieldError;
  rules?: object;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
}

export function FormInput({ name, control, label, error, rules, ...rest }: FormInputProps) {
  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={label}
            mode="outlined"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={!!error}
            {...rest}
          />
        )}
      />
      <HelperText type="error" visible={!!error}>
        {error?.message}
      </HelperText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 5 },
});