import { Text } from 'react-native-paper';
import { colors } from '@root/theme';
import React from "react";
import { View, StyleSheet } from 'react-native';
import { Picker } from "@react-native-picker/picker";
import { backgroudPrimary, textPrimaryColor, errorColor } from "@root/components/_default/colors";

const SelectInput = ({
  label,
  items = [],
  selectedValue,
  onValueChange,
  placeholder = "Selecione uma opção",
  style,
  invalid = false,
}: {label?: string; items?: {label: string; value: string | number}[]; selectedValue?: string | number | null; onValueChange: (value: any) => void; placeholder?: string; style?: any; invalid?: boolean}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelContainer}>
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
      <View style={[styles.pickerContainer, invalid && styles.invalidContainer]}>
        <Picker
          accessibilityLabel={label || placeholder}
          selectedValue={selectedValue}
          onValueChange={(itemValue) => onValueChange(itemValue)}
          style={[styles.picker, invalid && styles.invalidPickerText]}
        >
          <Picker.Item label={placeholder} value="" />
          {items.map((item) => (
            <Picker.Item
              key={item.value}
              label={item.label}
              value={item.value}
            />
          ))}
        </Picker>
      </View>
      {invalid && (
        <Text style={styles.errorText}>Este campo é obrigatório.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  labelContainer: {
    marginBottom: 8,
  },
  errorText: {
    color: errorColor,
    fontSize: 12,
    marginTop: 5,  // Adicionando um pequeno espaço entre o campo e a mensagem de erro
  },
  label: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: textPrimaryColor,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  invalidContainer: {
    borderColor: errorColor,  // Cor da borda quando inválido
  },
  picker: {
    minHeight: 56,
    color: colors.onSurface,
  },
  invalidPickerText: {
    color: errorColor,  // Cor do texto do Picker quando inválido
  },
});

export default SelectInput;
