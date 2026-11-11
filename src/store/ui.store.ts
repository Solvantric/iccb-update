"use client";
import { create } from "zustand";

interface UIState {
  menuOpen: boolean;
  chatOpen: boolean;
  cookieConsentShown: boolean;
  cookieConsentAccepted: boolean;
  currency: "BDT" | "USD";
  setMenuOpen: (open: boolean) => void;
  setChatOpen: (open: boolean) => void;
  setCookieConsentShown: (shown: boolean) => void;
  setCookieConsentAccepted: (accepted: boolean) => void;
  setCurrency: (currency: "BDT" | "USD") => void;
}

export const useUIStore = create<UIState>((set) => ({
  menuOpen: false,
  chatOpen: false,
  cookieConsentShown: false,
  cookieConsentAccepted: false,
  currency: "BDT",
  setMenuOpen: (open) => set({ menuOpen: open }),
  setChatOpen: (open) => set({ chatOpen: open }),
  setCookieConsentShown: (shown) => set({ cookieConsentShown: shown }),
  setCookieConsentAccepted: (accepted) => set({ cookieConsentAccepted: accepted }),
  setCurrency: (currency) => set({ currency }),
}));
