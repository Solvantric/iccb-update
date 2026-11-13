import type { SecurityRule } from "@/types/crm";
import { base, EFFECTIVE } from "./_helpers";

/** Refundable within 15 working days after the event, minus damages. */
export const securitySeed: SecurityRule[] = [
  { ...base("sec-personal"), key: "personal", effectiveFrom: EFFECTIVE, label: "Personal", amount: 75000 },
  { ...base("sec-cultural"), key: "cultural", effectiveFrom: EFFECTIVE, label: "Cultural", amount: 300000 },
  { ...base("sec-exhibition"), key: "exhibition", effectiveFrom: EFFECTIVE, label: "Exhibition / Fair (2+ days)", amount: 150000 },
  { ...base("sec-corporate"), key: "corporate", effectiveFrom: EFFECTIVE, label: "Corporate", amount: 100000 },
  { ...base("sec-others"), key: "others", effectiveFrom: EFFECTIVE, label: "Others", amount: 100000 },
  { ...base("sec-hall5"), key: "hall5", effectiveFrom: EFFECTIVE, label: "Any event in Hall-5 (overrides)", amount: 50000 },
];
