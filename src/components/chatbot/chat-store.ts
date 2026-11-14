"use client";
import { create } from "zustand";

/** Open state shared by the floating dock button and the chat panel. */
export const useChatStore = create<{ open: boolean; setOpen: (v: boolean) => void; toggle: () => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
