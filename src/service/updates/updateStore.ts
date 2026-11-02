import { create } from "zustand";
import type { AppRelease, UpdateSeverity } from "./appUpdates";
export const useUpdateStore = create<{
  release: AppRelease | null; severity: UpdateSeverity; dismissedBuild: number | null;
  checking: boolean; error: string;
}>(()=>({release:null,severity:"none",dismissedBuild:null,checking:false,error:""}));
// Single source of truth for the top update banner: screens use it to avoid
// applying a second top safe-area inset while the banner is visible.
export const selectUpdateBannerVisible = (state: {
  release: AppRelease | null; severity: UpdateSeverity; dismissedBuild: number | null;
}) =>
  !!state.release && state.severity !== "none" &&
  !(state.severity === "normal" && state.dismissedBuild === state.release.versionCode);
