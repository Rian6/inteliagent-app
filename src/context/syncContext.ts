import { create } from "zustand";
export interface SyncState {
  phase: string; pending: number; conflicts: number; rejected: number;
  error: string; lastSync: number | null; requiresLogin: boolean;
  draftError: string; draftSaving?: boolean; draftSavedId?: string;
  update: (values: Partial<SyncState>) => void;
  [key: string]: any;
}
export const useSyncStore = create<SyncState>((set) => ({
  phase: "idle",
  pending: 0,
  conflicts: 0,
  rejected: 0,
  error: "",
  lastSync: null,
  requiresLogin: false,
  draftError: "",
  update: (values) => set(values),
}));
