import Button from '@root/components/_default/button/ActionButton';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { HelperText } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function DatePickerInput({ label, placeholder = 'Selecione uma data', style, onDateChange, initialDate, value, invalid = false, disabled = false }: { label: string; placeholder?: string; style?: any; onDateChange?: (date: Date) => void; initialDate?: Date; value?: Date | string | null; invalid?: boolean; disabled?: boolean }) {
  const [localDate, setLocalDate] = useState(initialDate || new Date());
  const [show, setShow] = useState(false);
  const selected = value === undefined ? localDate : value ? new Date(typeof value === 'string' ? value.replace(' ', 'T') : value) : null;
  const valid = selected && Number.isFinite(selected.getTime()) ? selected : null;
  return <View style={[{ gap: 4 }, style]}>
    <Button mode="outlined" icon="calendar-outline" disabled={disabled} accessibilityLabel={label + ': ' + (valid ? valid.toLocaleDateString('pt-BR') : placeholder)} contentStyle={{ minHeight: 56, justifyContent: 'flex-start' }} style={{ borderRadius: 8 }} onPress={() => setShow(true)}>{label}: {valid ? valid.toLocaleDateString('pt-BR') : placeholder}</Button>
    {invalid && <HelperText type="error">Selecione uma data válida.</HelperText>}
    {show && <DateTimePicker value={valid || new Date()} mode="date" display={Platform.OS === 'ios' ? 'compact' : 'default'} onChange={(event, date) => {
      setShow(false);
      if (event.type !== 'dismissed' && date) { setLocalDate(date); onDateChange?.(date); }
    }}/>}
  </View>;
}
