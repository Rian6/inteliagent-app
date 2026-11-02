import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { applyThemeToShared, type ThemeMode } from "@root/theme";

const STORAGE_KEY = "inteliagent-theme-mode";

type ThemeState = {
  mode: ThemeMode;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
};

export const useThemeStore = create<ThemeState>((set) => ({
  mode: "light",
  hydrated: false,
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === "dark" || stored === "light") {
        applyThemeToShared(stored);
        set({ mode: stored });
      }
    } catch {
      // Sem preferência salva, mantém o tema claro padrão.
    } finally {
      set({ hydrated: true });
    }
  },
  setMode: async (mode) => {
    applyThemeToShared(mode);
    set({ mode });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // A preferência vale para a sessão mesmo sem persistência.
    }
  },
}));
