import { configureFonts, MD3DarkTheme, MD3LightTheme } from "react-native-paper";

export const lightColors = {
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
  chatBackground: "#EEF2F6",
  chatPattern: "#CAD3E0",
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
  success: "#386A20",
  successContainer: "#E8F5EE",
  warning: "#7A4A00",
  warningContainer: "#FFF2DD",
};
export const darkColors = {
  blue: "#5EA0FF",
  lavender: "#2E2A45",
  mint: "#1E2F26",
  brand: "#F2F2F6",
  cyan: "#5EA0FF",
  graphite: "#F2F2F6",
  primary: "#F2F2F6",
  onPrimary: "#1C1C1C",
  primaryContainer: "#22344D",
  onPrimaryContainer: "#DCE9FA",
  secondary: "#A1A1AA",
  onSecondary: "#1C1C1C",
  secondaryContainer: "#2C2C33",
  onSecondaryContainer: "#D4D4D8",
  background: "#121216",
  onBackground: "#F2F2F6",
  chatBackground: "#16161D",
  chatPattern: "#2C3648",
  surface: "#1C1C21",
  onSurface: "#F2F2F6",
  surfaceVariant: "#26262D",
  onSurfaceVariant: "#A6A6B0",
  surfaceDisabled: "#2A2A31",
  onSurfaceDisabled: "#6F6F78",
  outline: "#6E6E78",
  outlineVariant: "#2E2E36",
  error: "#F2B8B5",
  onError: "#601410",
  errorContainer: "#8C1D18",
  onErrorContainer: "#F9DEDC",
  success: "#A9D3AB",
  successContainer: "#1E2F26",
  warning: "#F2C14E",
  warningContainer: "#332A10",
};
export type ThemeMode = "light" | "dark";
// Shared palette read across the app. applyThemeToShared() swaps its values
// in place so existing StyleSheet/inline styles observe the active mode.
export const colors = { ...lightColors };
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
    ...lightColors,
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
export const darkTheme = {
  ...MD3DarkTheme,
  roundness: 5,
  fonts,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors,
    inverseSurface: "#E6E6EC",
    inverseOnSurface: "#1C1C21",
    inversePrimary: "#1C1C1C",
    elevation: {
      level0: "transparent",
      level1: "#1E1E24",
      level2: "#232329",
      level3: "#29292F",
      level4: "#2E2E35",
      level5: "#34343B",
    },
  },
};
export const lightNavigationTheme = {
  headerStyle: { backgroundColor: lightColors.background },
  headerTintColor: lightColors.onBackground,
  headerShadowVisible: false,
  headerTitleStyle: { fontFamily: "Inter-SemiBold" },
  contentStyle: { backgroundColor: lightColors.background },
};
export const darkNavigationTheme = {
  headerStyle: { backgroundColor: darkColors.background },
  headerTintColor: darkColors.onBackground,
  headerShadowVisible: false,
  headerTitleStyle: { fontFamily: "Inter-SemiBold" },
  contentStyle: { backgroundColor: darkColors.background },
};
// Mutable navigation theme kept for existing imports; prefer
// navigationThemeFor() in new code.
export const navigationTheme = { ...lightNavigationTheme };
export const paperThemeFor = (mode: ThemeMode) => mode === "dark" ? darkTheme : theme;
export const navigationThemeFor = (mode: ThemeMode) => mode === "dark" ? darkNavigationTheme : lightNavigationTheme;
export function applyThemeToShared(mode: ThemeMode) {
  Object.assign(colors, mode === "dark" ? darkColors : lightColors);
  const nav = navigationThemeFor(mode);
  navigationTheme.headerStyle = { ...nav.headerStyle };
  navigationTheme.headerTintColor = nav.headerTintColor;
  navigationTheme.headerShadowVisible = nav.headerShadowVisible;
  navigationTheme.headerTitleStyle = { ...nav.headerTitleStyle };
  navigationTheme.contentStyle = { ...nav.contentStyle };
}
