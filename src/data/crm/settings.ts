import type { Settings } from "@/types/crm";
import { base } from "./_helpers";
import { seedCounters } from "./_generated";

export const settingsSeed: Settings[] = [
  {
    ...base("settings"),
    orgName: "International Convention City Bashundhara (ICCB)",
    orgAddress: "Kuril Bishwa Road, next to 300 ft. Purbachal Express Highway, Dhaka-1229, Bangladesh",
    orgPhone: "+88-02-41091551, +88-01991-197719",
    orgEmail: "iccb@bga-bd.com",
    numberFormats: {
      booking: { prefix: "ICCB", digits: 6, monthly: true },
      client: { prefix: "C", digits: 4, monthly: true },
      mr: { prefix: "MR", digits: 7, monthly: true },
      invoice: { prefix: "INV", digits: 5, monthly: true },
      estimate: { prefix: "EST", digits: 5, monthly: true },
      refund: { prefix: "SRN", digits: 5, monthly: true },
      doc: { prefix: "DOC", digits: 5, monthly: true },
    },
    programRegStart: 1067300,
    counters: { ...seedCounters },
    balanceDueDays: 15,
    advancePct: 60,
    discountApprovalThreshold: 25000,
    holdHours: 48,
    firstResponseTargetHours: 2,
    hotLeadScore: 75,
    holidays: [
      { date: "2026-12-16", name: "Victory Day" },
      { date: "2027-02-21", name: "International Mother Language Day" },
      { date: "2027-03-26", name: "Independence Day" },
      { date: "2027-04-14", name: "Pohela Boishakh" },
    ],
    notifyHotLead: true,
    notifyOverdue: true,
    digitGrouping: "intl",
    roundRobinCursor: 0,
  },
];
