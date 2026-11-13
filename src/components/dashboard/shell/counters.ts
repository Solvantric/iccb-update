"use client";
import { useMemo } from "react";
import { db, getSettings, useCurrentUser } from "@/lib/crm/db";
import { seesOnlyOwn } from "@/lib/crm/permissions";
import { todayYmd } from "@/lib/crm/format";
import { ppmDueDate } from "@/lib/crm/rules";
import { firstEventDate } from "@/lib/crm/pricing";
import type { CounterKey } from "./nav";

/** Live sidebar counters straight from the stores (no latency). */
export function useCounters(): Record<CounterKey, number> {
  const bookings = db.bookings.store((s) => s.items);
  const enquiries = db.enquiries.store((s) => s.items);
  const tasks = db.tasks.store((s) => s.items);
  const leads = db.leads.store((s) => s.items);
  const radar = db.radar.store((s) => s.items);
  const user = useCurrentUser();

  return useMemo(() => {
    const today = todayYmd();
    const nowIso = new Date().toISOString();
    const own = seesOnlyOwn(user.role);
    const live = bookings.filter((b) => !b.deletedAt && !b.closed && (!own || b.assignedTo === user.id));
    const hotScore = getSettings()?.hotLeadScore ?? 75;
    return {
      requested: live.filter((b) => b.status === "requested").length,
      enquiries: enquiries.filter((e) => !e.deletedAt && e.status === "new").length,
      overdue: tasks.filter((t) => !t.deletedAt && t.status === "open" && t.dueAt < nowIso && (!own || t.assignedTo === user.id)).length,
      approvals:
        user.role === "sales_manager" || user.role === "admin"
          ? live.filter((b) => b.discount.approval === "pending" || b.shiftRequest?.status === "pending").length
          : 0,
      hot: leads.filter((l) => !l.deletedAt && l.score >= hotScore && (l.stage === "new" || l.stage === "contacted")).length,
      ppmDue: live.filter((b) => b.status === "confirmed" && !b.ppm?.done && firstEventDate(b) >= today && ppmDueDate(firstEventDate(b)) <= today).length,
      radarNew: radar.filter((r) => !r.deletedAt && r.isNew).length,
      refundDue: bookings.filter((b) => !b.deletedAt && b.refund && !b.refund.refundedAt && b.refund.dueDate <= today).length,
    };
  }, [bookings, enquiries, tasks, leads, radar, user]);
}
