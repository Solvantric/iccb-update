"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Booking } from "@/types/crm";
import { db } from "@/lib/crm/db";
import { fmtDate, todayYmd } from "@/lib/crm/format";
import { cancelBooking, closeEvent, confirmBooking, deleteBooking, restoreBooking } from "@/services/crm";
import { useConfirm } from "../ui/overlay";

/** Status actions with the soft confirmations from the booking journey. */
export function useBookingActions() {
  const confirm = useConfirm();
  const router = useRouter();

  return {
    async confirm(b: Booking) {
      const paid = db.payments.all().some((p) => p.bookingId === b.id);
      if (!paid && !(await confirm({ title: "Confirm booking?", description: "No payment recorded yet. Confirm anyway?", confirmLabel: "Confirm booking" }))) return;
      confirmBooking(b.id);
      toast.success(`${b.ref} is now Booked`);
    },
    async close(b: Booking) {
      if (b.date > todayYmd() && !(await confirm({ title: "Close this event?", description: `The event date (${fmtDate(b.date)}) is still in the future.`, confirmLabel: "Close event" }))) return;
      closeEvent(b.id);
      toast.success(`${b.eventName} closed`);
    },
    async cancel(b: Booking) {
      if (!(await confirm({ title: "Cancel this booking?", description: `${fmtDate(b.date)} becomes free again for other clients.`, confirmLabel: "Cancel booking", danger: true }))) return;
      cancelBooking(b.id);
      toast(`${b.ref} cancelled — date released`);
    },
    async remove(b: Booking, opts: { redirect?: boolean } = {}) {
      if (!(await confirm({ title: "Delete this booking?", description: "Its payments and meetings are removed too.", confirmLabel: "Delete", danger: true }))) return;
      const snap = deleteBooking(b.id);
      if (opts.redirect) router.push("/dashboard/bookings");
      if (snap) toast(`${b.ref} deleted`, { action: { label: "Undo", onClick: () => restoreBooking(snap) } });
    },
  };
}
