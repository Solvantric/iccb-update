import type { AuditEntry } from "@/types/crm";
import { base, isoFromToday } from "./_helpers";

export const auditLogSeed: AuditEntry[] = [
  { ...base("audit-seed-1", { isSample: true, createdAt: isoFromToday(-1, 9) }), at: isoFromToday(-1, 9), actorId: "u-admin", actorName: "Farhana Kabir", actorRole: "admin", entity: "settings", entityId: "settings", action: "update", summary: "Updated settings: discountApprovalThreshold", before: { discountApprovalThreshold: 20000 }, after: { discountApprovalThreshold: 25000 } },
  { ...base("audit-seed-2", { isSample: true, createdAt: isoFromToday(-2, 15) }), at: isoFromToday(-2, 15), actorId: "u-sm", actorName: "Tanvir Hasan", actorRole: "sales_manager", entity: "bookings", entityId: "bk-20", action: "approve", summary: "Approved booking and confirmed" },
];
