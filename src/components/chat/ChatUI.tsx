import { type ComponentProps } from "react";
import { View, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import Svg, { Defs, Pattern, Circle, Path, Rect } from "react-native-svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "@root/components/ui";
import { colors as c } from "@root/theme";
import { chatInitials } from "@root/data/chat-presentation";
export function ChatIcon({
  icon,
  label,
  onPress,
  disabled = false,
  loading = false,
  filled = false,
  size = 44,
  testID,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  filled?: boolean;
  size?: number;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: filled ? c.primary : "transparent",
        opacity: disabled ? 0.4 : pressed ? 0.65 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={filled ? "white" : c.onSurfaceVariant} />
      ) : (
        <MaterialCommunityIcons
          name={icon}
          size={filled ? 22 : 24}
          color={filled ? c.onPrimary : "#626974"}
          accessible={false}
        />
      )}
    </Pressable>
  );
}
export function ContactAvatar({
  name,
  size = 46,
}: {
  name: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#E6EBF2",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: size * 0.31,
          color: "#626974",
          fontFamily: "Inter-Medium",
        }}
      >
        {chatInitials(name)}
      </Text>
    </View>
  );
}
export function ChatWallpaper() {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: "#EEF2F6" }]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id="chatWallpaper"
            width={96}
            height={96}
            patternUnits="userSpaceOnUse"
          >
            <Circle
              cx={16}
              cy={18}
              r={2}
              stroke="#CAD3E0"
              fill="none"
              opacity={0.46}
            />
            <Path
              d="M64 20h14v10H68l-4 4V20zM20 63l6-6 6 6v9H20zM42 38l3 3m0-3l-3 3"
              stroke="#CAD3E0"
              strokeWidth={1}
              fill="none"
              opacity={0.46}
            />
            <Circle
              cx={71}
              cy={73}
              r={3}
              stroke="#CAD3E0"
              fill="none"
              opacity={0.46}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#chatWallpaper)" />
      </Svg>
    </View>
  );
}
