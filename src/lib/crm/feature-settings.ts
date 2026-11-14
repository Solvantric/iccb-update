import type { ReadinessWeights, Settings } from "@/types/crm";

/** Defaults for the business-feature settings (older stored settings may not have them). */
export const DEFAULT_READINESS_WEIGHTS: ReadinessWeights = { payment: 30, documents: 25, ppm: 20, permissions: 15, vendors: 10 };
export const DEFAULT_VENDOR_THRESHOLDS = { active: 70, warning: 50 };

export interface FeatureSettings {
  balanceDueDays: number;
  advancePct: number;
  discountApprovalThreshold: number;
  holidays: string[];
  maxOfferDiscount: number;
  readinessWeights: ReadinessWeights;
  vendorThresholds: { active: number; warning: number };
  portalExpiryDays: number;
}

export function featureSettings(s?: Partial<Settings> | null): FeatureSettings {
  return {
    balanceDueDays: s?.balanceDueDays ?? 15,
    advancePct: s?.advancePct ?? 60,
    discountApprovalThreshold: s?.discountApprovalThreshold ?? 25000,
    holidays: (s?.holidays ?? []).map((h) => h.date),
    maxOfferDiscount: s?.maxOfferDiscount ?? 15,
    readinessWeights: { ...DEFAULT_READINESS_WEIGHTS, ...(s?.readinessWeights ?? {}) },
    vendorThresholds: { ...DEFAULT_VENDOR_THRESHOLDS, ...(s?.vendorThresholds ?? {}) },
    portalExpiryDays: s?.portalExpiryDays ?? 30,
  };
}
