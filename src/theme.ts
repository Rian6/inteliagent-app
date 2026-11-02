import { configureFonts, MD3LightTheme } from "react-native-paper";

export const colors = {
  blue: "#0066D6",
  lavender: "#EDE9FE",
  mint: "#E8F5EE",
  brand: "#1C1C1C",
  cyan: "#007AFF",
  graphite: "#1C1C1C",
  primary: "#1C1C1C",
  onPrimary: "#FFFFFF",
  primaryContainer: "#E6F1FD",
  onPrimaryContainer: "#1C1C1C",
  secondary: "#575760",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#F1F1F4",
  onSecondaryContainer: "#45454D",
  background: "#F5F5F7",
  onBackground: "#1C1C1C",
  surface: "#FFFFFF",
  onSurface: "#1C1C1C",
  surfaceVariant: "#F0F1F5",
  onSurfaceVariant: "#6B6B73",
  surfaceDisabled: "#EDEDF0",
  onSurfaceDisabled: "#777780",
  outline: "#878790",
  outlineVariant: "#E8E8ED",
  error: "#B42318",
  onError: "#FFFFFF",
  errorContainer: "#FEECE9",
  onErrorContainer: "#77251B",
};
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const shape = { field: 12, card: 20, button: 16 };
const fonts = configureFonts({
  config: { fontFamily: "Inter-Regular", fontWeight: "400" },
});
for (const key of [
  "displayLarge",
  "displayMedium",
  "displaySmall",
  "headlineLarge",
  "headlineMedium",
  "headlineSmall",
  "titleLarge",
  "titleMedium",
  "titleSmall",
] as const) {
  fonts[key] = {
    ...fonts[key],
    fontFamily: "Inter-SemiBold",
    fontWeight: "400",
  };
}
for (const key of ["labelLarge", "labelMedium", "labelSmall"] as const) {
  fonts[key] = {
    ...fonts[key],
    fontFamily: "Inter-SemiBold",
    fontWeight: "400",
  };
}
export const theme = {
  ...MD3LightTheme,
  roundness: 5,
  fonts,
  colors: {
    ...MD3LightTheme.colors,
    ...colors,
    inverseSurface: "#263238",
    inverseOnSurface: "#FFFFFF",
    inversePrimary: "#BFE4D9",
    elevation: {
      level0: "transparent",
      level1: "#F7F7F9",
      level2: "#F3F3F6",
      level3: "#F0F1F5",
      level4: "#EBEBF0",
      level5: "#E6E6EC",
    },
  },
};
export const navigationTheme = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.onBackground,
  headerShadowVisible: false,
  headerTitleStyle: { fontFamily: "Inter-SemiBold" },
  contentStyle: { backgroundColor: colors.background },
};
