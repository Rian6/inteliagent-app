import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, shape } from '@root/theme';

export default function PageIntro({title,description,eyebrow}:{title:string;description:string;eyebrow?:string}) {
  return <View style={{gap:8}}>
    {eyebrow&&<Text variant="labelMedium" style={{color:colors.onSurfaceVariant}}>{eyebrow}</Text>}
    <Text variant="headlineSmall" accessibilityRole="header">{title}</Text>
    <Text variant="bodyMedium" style={{color:colors.onSurfaceVariant}}>{description}</Text>
  </View>;
}
