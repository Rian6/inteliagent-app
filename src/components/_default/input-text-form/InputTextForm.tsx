import { colors } from '@root/theme';
import React from "react";
import { TextInput, Text } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { backgroudPrimary, primaryColor } from "@root/components/_default/colors";

const InputTextForm = ({
  label,
  value,
  onChangeText,
  invalid = false,
  style = undefined,
  isCep = false,
  ...rest
}: {label: string; value?: string; onChangeText?: (text: string) => void; invalid?: boolean; style?: any; isCep?: boolean; [key: string]: any}) => {


  // Função para formatar o valor como CEP (se necessário)
  const formatCep = (text) => {
    return text
      .replace(/\D/g, "") // Remove caracteres não numéricos
      .replace(/^(\d{5})(\d)/, "$1-$2") // Adiciona o traço após os 5 primeiros dígitos
      .substr(0, 9); // Limita o tamanho máximo a 9 caracteres
  };

  const handleChangeText = (text) => {
    const formattedText = isCep ? formatCep(text) : text;
    onChangeText && onChangeText(formattedText);
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        label={label}
        value={value}
        onChangeText={handleChangeText}
        mode="outlined"
        outlineStyle={{ borderRadius: 12 }}
        error={invalid}
        style={[styles.input, { backgroundColor: colors.surface }]}
        accessibilityLabel={label}
        activeOutlineColor={invalid ? "#B3261E" : primaryColor} // Defina a cor de outline ativa quando houver erro
        textColor={invalid ? "#B3261E" : colors.onSurface}
        {...rest}
      />
      {invalid && (
        <Text style={styles.errorText}>Este campo é obrigatório.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  input: {
    minHeight: 56,
    borderRadius: 8,
    marginVertical: 8,
  },
  invalidInput: {
  },
  errorText: {
    color: "#B3261E",
    fontSize: 12,
  },
});

export default InputTextForm;
