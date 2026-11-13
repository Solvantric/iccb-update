import type { CancellationRule } from "@/types/crm";
import { base, EFFECTIVE } from "./_helpers";

/** % of total venue rent, by days before the event. */
export const cancellationSeed: CancellationRule[] = [
  { ...base("cx-90"), key: "90+", effectiveFrom: EFFECTIVE, minDays: 90, maxDays: null, shiftPct: 0, cancelPct: 12 },
  { ...base("cx-46"), key: "46-89", effectiveFrom: EFFECTIVE, minDays: 46, maxDays: 89, shiftPct: 5, cancelPct: 15 },
  { ...base("cx-30"), key: "30-45", effectiveFrom: EFFECTIVE, minDays: 30, maxDays: 45, shiftPct: 10, cancelPct: 25 },
  { ...base("cx-16"), key: "16-29", effectiveFrom: EFFECTIVE, minDays: 16, maxDays: 29, shiftPct: 12, cancelPct: 30 },
  { ...base("cx-0"), key: "0-15", effectiveFrom: EFFECTIVE, minDays: 0, maxDays: 15, shiftPct: 15, cancelPct: 50 },
];
