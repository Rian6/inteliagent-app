import { textPrimaryColor } from '@root/components/_default/colors';
import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

const CodeInput = ({ length, onCodeFilled, style }) => {
  const [code, setCode] = useState(Array(length).fill(''));

  const handleChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;

    if (text && index < length - 1) {
      // Mover para o próximo input
      setTimeout(() => {
        this[`input_${index + 1}`].focus();
      }, 100);
    }

    setCode(newCode);

    if (newCode.every((digit) => digit)) {
      onCodeFilled(newCode.join(''));
    }
  };

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => { this[`input_${index}`] = ref; }}
          style={styles.input}
          keyboardType="numeric"
          maxLength={1}
          value={code[index]}
          onChangeText={(text) => handleChange(text, index)}
          onFocus={() => { this[`input_${index}`].setNativeProps({ style: { borderColor: '#000' } }) }}
          onBlur={() => { this[`input_${index}`].setNativeProps({ style: { borderColor: '#ccc' } }) }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    width: 60,
    height: 60,
    borderWidth: 1,
    backgroundColor: '#F5F9FE',
    borderColor: textPrimaryColor,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 18,
    margin: 5,
  },
});

export default CodeInput;
