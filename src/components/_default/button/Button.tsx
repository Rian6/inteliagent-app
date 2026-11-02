import MaterialButton from './ActionButton';
import { StyleSheet } from 'react-native';
export default function Button({ title, styleLabel, styleText, onPress, disabled = false, loading = false }: {title: string; styleLabel?: any; styleText?: any; onPress: (...args: any[]) => any; disabled?: boolean; loading?: boolean}) {
  return <MaterialButton mode={StyleSheet.flatten(styleLabel)?.backgroundColor ? 'contained' : 'text'} onPress={onPress} disabled={disabled || loading} loading={loading}
    accessibilityLabel={title} style={[{ minHeight: 48, justifyContent: 'center', borderRadius: 16 }, styleLabel]}
    contentStyle={{ minHeight: 48 }} labelStyle={[{ flexShrink: 1 }, styleText]}>{title}</MaterialButton>;
}
