import { Text } from 'react-native-paper';
import { colors } from '@root/theme';
import { View } from 'react-native';
import Svg, { Rect, Polyline } from 'react-native-svg';
export default function LineChart({ width = 300, height = 180, labels = [], data = [], label = '' }: {width?: number; height?: number; labels?: string[]; data?: number[]; label?: string}) {
  const values = data.map(v => Math.max(0, Number(v) || 0));
  const max = Math.max(1, ...values), step = 280 / Math.max(1, values.length);
  const points = values.map((v,i) => `${10+i*step+step/2},${140-v/max*120}`).join(' ');
  return <View style={{ width, height }} accessibilityLabel={`${label}: ${labels.map((l,i) => `${l} ${values[i] || 0}`).join(', ')}`}>
    <Text style={{ fontWeight: '600', color: colors.onSurface }}>{label}</Text>
    <Svg width="100%" height="80%" viewBox="0 0 300 150">
      <Polyline points={points} fill="none" stroke={colors.primary} strokeWidth={3}/>
    </Svg>
  </View>;
}
