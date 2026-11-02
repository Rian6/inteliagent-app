import { create } from "zustand";

type PushState = {
  owner: number | null;
  status: "idle" | "registering" | "enabled" | "permission" | "unsupported" | "error";
  message: string;
};

export const useMessagePushState = create<PushState>(() => ({
  owner: null, status: "idle", message: "",
}));
