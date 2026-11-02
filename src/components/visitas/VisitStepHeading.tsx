import { View } from "react-native";
import { Text } from "react-native-paper";
import { colors } from "@root/theme";
export default function VisitStepHeading({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text variant="labelMedium" style={{ color: colors.primary }}>
        ETAPA {step} DE 4
      </Text>
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: 4, now: step }}
        accessibilityLabel={`Cadastro da visita, etapa ${step} de 4`}
        style={{ flexDirection: "row", gap: 6 }}
      >
        {[1, 2, 3, 4].map((value) => (
          <View
            key={value}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor:
                value <= step ? colors.primary : colors.outlineVariant,
            }}
          />
        ))}
      </View>
      <Text variant="headlineSmall" accessibilityRole="header">
        {title}
      </Text>
      <Text style={{ color: colors.onSurfaceVariant }}>{description}</Text>
    </View>
  );
}
