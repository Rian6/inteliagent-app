import * as SecureStore from "expo-secure-store";
import { OfflineSession } from "./session.ts";
export const offlineSession = new OfflineSession({
  store: {
    get: (key) => SecureStore.getItemAsync(key),
    set: (key, value) => SecureStore.setItemAsync(key, value),
    remove: (key) => SecureStore.deleteItemAsync(key),
  },
});
