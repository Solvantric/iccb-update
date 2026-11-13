"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Booking, BookingStatus, Hall, Payment, User } from "@/types/crm";
import { STATUS_LABELS } from "@/types/crm";
import { db, useCurrentUser } from "@/lib/crm/db";
import { firstEventDate, lastEventDate, type Estimate } from "@/lib/crm/pricing";
import { seesOnlyOwn } from "@/lib/crm/permissions";
import { changeStatus, estimateFor, GuardError } from "@/services/crm/bookings.service";
import { useBookings, useHalls, usePayments, useUsers, errorText } from "@/services/crm/hooks";
import { toast } from "sonner";
import { useConfirm } from "../ui/overlay";
import { fireConfetti } from "../ui/misc";

export interface BookingRow {
  id: string;
  createdAt: string;
  b: Booking;
  eventDate: string;
  endDate: string;
  halls: Hall[];
  hallLabel: string;
  rep?: User;
  est: Estimate;
  payments: Payment[];
  paidPct: number;
}

export function hallNames(b: Booking, halls: Hall[]) {
  const ids = [...new Set(b.days.map((d) => d.hallId))];
  return ids.map((id) => halls.find((h) => h.id === id)).filter(Boolean) as Hall[];
}

/** Bookings joined with halls, rep, payments and a live estimate. */
export function useBookingRows(opts: { includeDeleted?: boolean } = {}) {
  const bookings = useBookings();
  const halls = useHalls();
  const users = useUsers();
  const payments = usePayments();
  const me = useCurrentUser();
  // Trash view reads straight from the store (the service hides deleted rows).
  const trash = db.bookings.store((s) => s.items);

  const rows = useMemo<BookingRow[] | undefined>(() => {
    if (!bookings.data || !halls.data || !users.data || !payments.data) return undefined;
    const source = opts.includeDeleted ? trash.filter((b) => b.deletedAt) : bookings.data;
    return source
      .filter((b) => !seesOnlyOwn(me.role) || b.assignedTo === me.id)
      .map((b) => {
        const ps = payments.data!.filter((p) => p.bookingId === b.id);
        const est = estimateFor(b, ps);
        const hs = hallNames(b, halls.data!);
        return {
          id: b.id,
          createdAt: b.createdAt,
          b,
          eventDate: firstEventDate(b),
          endDate: lastEventDate(b),
          halls: hs,
          hallLabel: hs.map((h) => h.name).join(", ") || "—",
          rep: users.data!.find((u) => u.id === b.assignedTo),
          est,
          payments: ps,
          paidPct: est.grandTotal ? Math.min(100, Math.round((est.received / est.grandTotal) * 100)) : 0,
        };
      });
  }, [bookings.data, halls.data, users.data, payments.data, me, opts.includeDeleted, trash]);

  return { rows, loading: bookings.isLoading || halls.isLoading || users.isLoading || payments.isLoading, error: bookings.error };
}

/**
 * Status change with checklist guard, backward-move reason, admin override,
 * confetti on Confirmed. Shared by Kanban, list and workspace.
 */
export function useStatusChange() {
  const confirm = useConfirm();
  const router = useRouter();
  const me = useCurrentUser();

  return async (b: Booking, target: BookingStatus, origin?: { x: number; y: number }) => {
    if (b.status === target) return false;
    if (b.closed) {
      toast.error("This booking is closed. Reopen it first.");
      return false;
    }
    const order: BookingStatus[] = ["requested", "confirmed", "completed"];
    const backward = order.indexOf(target) < order.indexOf(b.status);
    let reason: string | undefined;
    if (backward) {
      const r = await confirm({
        title: `Move back to ${STATUS_LABELS[target]}?`,
        description: "Moving a booking backward is logged in the audit trail.",
        confirmLabel: "Move back",
        reason: { label: "Reason", required: true, placeholder: "e.g. client changed the hall — needs a new estimate" },
      });
      if (!r.ok) return false;
      reason = r.reason;
    }
    try {
      await changeStatus(b.id, target, { reason });
    } catch (e) {
      if (e instanceof GuardError) {
        const isAdmin = me.role === "admin";
        const r = await confirm({
          title: `Can't move to ${STATUS_LABELS[target]} yet`,
          description: (
            <span className="block">
              <span className="block mb-2">These checklist items are missing:</span>
              <ul className="list-disc ps-5 space-y-0.5 text-crm-ink">
                {e.missing.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              {isAdmin && <span className="mt-3 block">As Admin you can override with a written reason (audit-logged).</span>}
            </span>
          ),
          confirmLabel: isAdmin ? "Override & move" : "Open checklist",
          tone: "primary",
          reason: isAdmin ? { label: "Override reason", required: true } : undefined,
        });
        if (!r.ok) return false;
        if (!isAdmin) {
          router.push(`/dashboard/sales/bookings/${b.id}`);
          return false;
        }
        try {
          await changeStatus(b.id, target, { override: true, reason: r.reason });
        } catch (e2) {
          toast.error(errorText(e2));
          return false;
        }
      } else {
        toast.error(errorText(e));
        return false;
      }
    }
    toast.success(`${b.bfNo} → ${STATUS_LABELS[target]}`);
    if (target === "confirmed" && !backward) fireConfetti(origin);
    return true;
  };
}

export const SOURCE_TONE = { website: "blue", walk_in: "neutral", phone: "neutral", whatsapp: "green", chatbot: "purple", referral: "amber", radar: "brand" } as const;
