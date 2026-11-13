import type { Notification } from "@/types/crm";
import { notificationsSeed as generated } from "./_generated";
import { base, isoFromToday } from "./_helpers";

const S = { isSample: true };
export const notificationsSeed: Notification[] = [
  { ...base("ntf-hot-1", { ...S, createdAt: isoFromToday(0, 9) }), title: "Hot lead", body: "Meghna Textiles asked about a 3-day expo for 5,000 visitors", kind: "hot_lead", href: "/dashboard/marketing/leads", read: false, userId: null },
  { ...base("ntf-radar-1", { ...S, createdAt: isoFromToday(-1, 16) }), title: "Opportunity Radar", body: "3 new high-score opportunities this week", kind: "system", href: "/dashboard/marketing/opportunity-radar", read: false, roles: ["marketing", "admin", "sales_manager"] },
  ...generated,
];
