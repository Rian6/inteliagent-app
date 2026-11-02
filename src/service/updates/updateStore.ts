import { create } from "zustand";
import type { AppRelease, UpdateSeverity } from "./appUpdates";
export const useUpdateStore = create<{
  release: AppRelease | null; severity: UpdateSeverity; dismissedBuild: number | null;
  checking: boolean; error: string;
}>(()=>({release:null,severity:"none",dismissedBuild:null,checking:false,error:""}));
