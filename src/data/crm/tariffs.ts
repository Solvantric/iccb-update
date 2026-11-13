import type { HallTariff, TaxRule } from "@/types/crm";
import { base, EFFECTIVE } from "./_helpers";

/** Per day, BDT, excluding VAT. Weekend = Thu, Fri, Sat. Peak = Dec–Jan. */
export const tariffsSeed: HallTariff[] = [
  { ...base("tariff-h123"), key: "h123", effectiveFrom: EFFECTIVE, group: "h123", label: "Hall 1 / 2 / 3", peakWeekend: 450000, peakWeekday: 400000, offPeak: 400000, extraHour: 15000 },
  { ...base("tariff-h4"), key: "h4", effectiveFrom: EFFECTIVE, group: "h4", label: "Hall 4", peakWeekend: 600000, peakWeekday: 550000, offPeak: 550000, extraHour: 25000 },
  { ...base("tariff-h5"), key: "h5", effectiveFrom: EFFECTIVE, group: "h5", label: "Hall 5", peakWeekend: 200000, peakWeekday: 200000, offPeak: 200000, extraHour: 10000 },
  { ...base("tariff-seminar", { isSample: true }), key: "seminar", effectiveFrom: EFFECTIVE, group: "seminar", label: "Seminar Hall", peakWeekend: 0, peakWeekday: 0, offPeak: 0, extraHour: 0, note: "TBD" },
];

export const taxesSeed: TaxRule[] = [
  { ...base("tax-food-vat"), key: "food_vat", effectiveFrom: EFFECTIVE, label: "Food VAT", pct: 15 },
  { ...base("tax-ait"), key: "ait", effectiveFrom: EFFECTIVE, label: "AIT (on actual rate)", pct: 5 },
];
