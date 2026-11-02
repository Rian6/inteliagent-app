import { create } from "zustand";
export interface SessionProfile { id: number; idCede: number; nome?: string; email?: string; role?: string; [key: string]: any }
interface SessionState { profile: SessionProfile | null; setProfile: (profile: SessionProfile | null) => void }
export const useSessionStore = create<SessionState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
}));
