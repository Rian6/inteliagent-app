import type { ReactNode, ComponentProps } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@root/theme";
import { Disclosure } from "@root/components/ui";
export default function FormSection({
  title,
  description,
  icon,
  children,
  collapsible = false,
}: {
  title: string;
  description?: string;
  icon?: ComponentProps<typeof MaterialCommunityIcons>["name"];
  children: ReactNode;
  collapsible?: boolean;
}) {
  if (collapsible)
    return (
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 20,
          paddingHorizontal: 16,
        }}
      >
        <Disclosure title={title} summary={description}>
          {children}
        </Disclosure>
      </View>
    );
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        padding: 16,
        gap: 16,
      }}
    >
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        {!!icon && (
          <MaterialCommunityIcons
            name={icon}
            size={24}
            color={colors.primary}
          />
        )}
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="titleMedium" accessibilityRole="header">
            {title}
          </Text>
          {!!description && (
            <Text
              variant="bodySmall"
              style={{ color: colors.onSurfaceVariant }}
            >
              {description}
            </Text>
          )}
        </View>
      </View>
      {children}
    </View>
  );
}
