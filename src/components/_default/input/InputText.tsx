import { View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { colors } from '@root/theme';
export default function InputText({ label, value = '', onChangeText = () => {}, placeholder = '', secureTextEntry = false, readOnly = false, style, styleContainer, ...props }: {label: string; value?: any; onChangeText?: (text: string) => void; placeholder?: string; secureTextEntry?: boolean; readOnly?: boolean; style?: any; styleContainer?: any; [key: string]: any}) {
  const isEmail = /e-?mail/i.test(label);
  return <View style={[{ width: '100%', maxWidth: 480 }, styleContainer]}><TextInput keyboardType={isEmail ? 'email-address' : 'default'} autoCorrect={!isEmail && !secureTextEntry} {...props} mode="outlined" label={label} value={value == null ? '' : String(value)} onChangeText={onChangeText} placeholder={placeholder}
    secureTextEntry={secureTextEntry} editable={!readOnly} autoCapitalize={props.autoCapitalize ?? (secureTextEntry || isEmail || /senha/i.test(label) ? 'none' : 'sentences')}
    outlineStyle={{ borderRadius: 12 }}
    accessibilityLabel={label} style={[{ backgroundColor: colors.surface, minHeight: 56 }, style]}/></View>;
}
