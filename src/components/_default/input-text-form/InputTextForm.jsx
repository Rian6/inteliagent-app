import React, { useState } from "react";
import { TextInput } from "react-native-paper";
import { View, Text, StyleSheet } from "react-native";
import { backgroudPrimary, primaryColor } from "@root/components/_default/colors";

const InputTextForm = ({
  label,
  value,
  onChangeText,
  invalid,
  style,
  isCep,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

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

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    if (value === "") {
      setIsFocused(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        label={label}
        value={value}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        mode="outlined"
        error={invalid}
        style={[styles.input]}
        activeOutlineColor={invalid ? "red" : primaryColor} // Defina a cor de outline ativa quando houver erro
        textColor={invalid ? "red" : "black"}
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
    height: 56,
    borderRadius: 5,
    backgroundColor: backgroudPrimary,
    marginVertical: 5,
  },
  invalidInput: {
  },
  errorText: {
    color: "red",
    fontSize: 12,
  },
});

export default InputTextForm;
