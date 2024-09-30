import { backgroudPrimary, textPrimaryColor } from '@root/components/_default/colors';
import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

const InputText = ({
  label, 
  value, 
  onChangeText, 
  placeholder, 
  secureTextEntry, 
  style,
  styleContainer
}) => {
  return (
    <View>
      {label && <Text style={[styles.label, styleContainer]}>{label}</Text>}
      <TextInput
        style={[styles.input, style]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={textPrimaryColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: textPrimaryColor,
  },
  input: {
    height: 50,
    borderColor: textPrimaryColor,
    borderWidth: 1,
    backgroundColor: '#F5F9FE',
    borderRadius: 5,
    marginTop: 5,
    paddingHorizontal: 10,
    fontSize: 16,
  },
});

export default InputText;
