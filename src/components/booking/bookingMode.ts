"use client";
/** Shared "Hall events ↔ Expo Village" choice on the booking page (form + calculator follow it). */
import { create } from "zustand";

export type BookingMode = "halls" | "expo";

const fromUrl = (): BookingMode => {
  if (typeof window === "undefined") return "halls";
  const p = new URLSearchParams(window.location.search);
  const et = (p.get("eventType") ?? "").toLowerCase();
  return p.get("mode") === "expo" || et === "expo" || et === "exhibition" ? "expo" : "halls";
};

export const useBookingMode = create<{ mode: BookingMode; setMode: (m: BookingMode) => void }>((set) => ({
  mode: fromUrl(),
  setMode: (mode) => set({ mode }),
}));
