import { backgroudPrimary, black, textBlackColor, textPrimaryColor } from '@root/components/_default/colors';
import * as React from 'react';
import { TextInput, Text, View, StyleSheet } from 'react-native';

const InputTextForm = ({ label, value, onChangeText, invalid, style, ...rest }) => {
  return (
    <View style={[styles.container, style]}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        mode="outlined"
        textColor={textBlackColor}
        style={[
          style,
          styles.input,
          invalid ? styles.invalidInput : {},
        ]}
        activeOutlineColor={invalid ? 'red' : textPrimaryColor}
        {...rest}
      />
      {invalid && <Text style={styles.errorText}>Este campo é obrigatório.</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 5,
  },
  input: {
    height: 56,
    borderColor: textPrimaryColor,
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: backgroudPrimary,
  },
  invalidInput: {
    borderColor: 'red',
    borderWidth: 1,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 1
  },
});

export default InputTextForm;
