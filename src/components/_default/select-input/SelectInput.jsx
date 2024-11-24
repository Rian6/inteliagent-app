import React from "react";
import { View, Text, StyleSheet } from "react-native";
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
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelContainer}>
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
      <View style={[styles.pickerContainer, invalid && styles.invalidContainer]}>
        <Picker
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
    height: 56,
    borderRadius: 5,
    marginVertical: 18,
    backgroundColor: backgroudPrimary,
  },
  labelContainer: {
    position: "absolute",
    top: -10,
    left: 20,
    backgroundColor: "white",
    zIndex: 1,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 5,  // Adicionando um pequeno espaço entre o campo e a mensagem de erro
  },
  label: {
    fontSize: 14,
    color: "black",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: textPrimaryColor,
    borderRadius: 5,
    backgroundColor: backgroudPrimary,
  },
  invalidContainer: {
    borderColor: errorColor,  // Cor da borda quando inválido
  },
  picker: {
    color: "#333",
  },
  invalidPickerText: {
    color: errorColor,  // Cor do texto do Picker quando inválido
  },
});

export default SelectInput;
