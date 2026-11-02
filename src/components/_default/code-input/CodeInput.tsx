import { useState } from 'react';
import { View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { colors } from '@root/theme';
export default function CodeInput({ length = 6, onCodeFilled, style }) {
  const [code, setCode] = useState('');
  return <View style={[{ width: '100%', maxWidth: 480 }, style]}>
    <TextInput outlineStyle={{ borderRadius: 8 }} mode="outlined" label={`C\u00f3digo de ${length} d\u00edgitos`} accessibilityLabel={`C\u00f3digo de ${length} d\u00edgitos`}
      value={code} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={length}
      onChangeText={text => { const digits = text.replace(/\D/g, '').slice(0, length); setCode(digits); onCodeFilled(digits.length === length ? digits : ''); }}
      style={{ backgroundColor: colors.surface }}/>
  </View>;
}
