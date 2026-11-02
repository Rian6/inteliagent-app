import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@root/theme";
import { useThemeStore } from "@root/service/theme/themeStore";
export function useTabOptions() {
  useThemeStore((state) => state.mode);
  const { fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 8);
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.onSurface,
    tabBarInactiveTintColor: colors.onSurfaceVariant,
    tabBarHideOnKeyboard: true,
    tabBarLabelPosition: "below-icon" as const,
    tabBarLabelStyle: {
      fontFamily: "Inter-SemiBold",
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "400" as const,
      marginTop: 2,
    },
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.outlineVariant,
      elevation: 0,
      height: Math.ceil(56 + 8 * Math.max(1, fontScale)) + bottom,
      paddingTop: 8,
      paddingBottom: bottom,
    },
    sceneStyle: { backgroundColor: colors.background },
  };
}
