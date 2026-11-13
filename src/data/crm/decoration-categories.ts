import type { DecorationCategory } from "@/types/crm";
import { base, EFFECTIVE } from "./_helpers";

/** Fee when the client brings an OUTSIDE decoration firm. ICCB Events is the default provider. */
export const decorationSeed: DecorationCategory[] = [
  { ...base("deco-a"), key: "A", effectiveFrom: EFFECTIVE, code: "A", description: "Full ceiling, thematic, heavy", rateHall14: 120000, rateHall5: 50000 },
  { ...base("deco-b"), key: "B", effectiveFrom: EFFECTIVE, code: "B", description: "Wooden backdrop, heavy sound & light", rateHall14: 75000, rateHall5: 50000 },
  { ...base("deco-c"), key: "C", effectiveFrom: EFFECTIVE, code: "C", description: "Simple decoration, small stage", rateHall14: 50000, rateHall5: 50000 },
];
