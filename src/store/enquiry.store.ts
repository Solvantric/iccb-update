"use client";
import { create } from "zustand";
import type { EventType } from "@/types";

interface EnquiryDraft {
  hallId?: string;
  date?: string;
  shift?: string;
  guests?: number;
  eventType?: EventType;
  cateringPackageId?: string;
  decorationTier?: string;
  addons: string[];
}

interface EnquiryStore {
  draft: EnquiryDraft;
  setDraft: (updates: Partial<EnquiryDraft>) => void;
  addAddon: (addon: string) => void;
  removeAddon: (addon: string) => void;
  resetDraft: () => void;
}

const DEFAULT_DRAFT: EnquiryDraft = { addons: [] };

export const useEnquiryStore = create<EnquiryStore>((set) => ({
  draft: { ...DEFAULT_DRAFT },
  setDraft: (updates) => set((s) => ({ draft: { ...s.draft, ...updates } })),
  addAddon: (addon) => set((s) => ({
    draft: { ...s.draft, addons: s.draft.addons.includes(addon) ? s.draft.addons : [...s.draft.addons, addon] },
  })),
  removeAddon: (addon) => set((s) => ({
    draft: { ...s.draft, addons: s.draft.addons.filter((a) => a !== addon) },
  })),
  resetDraft: () => set({ draft: { ...DEFAULT_DRAFT } }),
}));
