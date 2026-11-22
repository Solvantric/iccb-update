"use client";
import { AnimatePresence } from "framer-motion";
import type { BookingStatus, MeetingStatus } from "@/types/crm";
import { MEETING_STATUS_LABELS, STATUS_LABELS } from "@/types/crm";
import { cn } from "@/lib/utils/cn";
import { m } from "./motion";

export const STATUS_STYLE: Record<BookingStatus, { pill: string; dot: string; chip: string }> = {
  reserved: { pill: "bg-crm-reserved-bg text-crm-reserved-ink", dot: "bg-crm-reserved", chip: "bg-crm-reserved-bg text-crm-reserved-ink border-s-crm-reserved" },
  booked: { pill: "bg-crm-booked-bg text-crm-booked-ink", dot: "bg-crm-booked", chip: "bg-crm-booked-bg text-crm-booked-ink border-s-crm-booked" },
  closed: { pill: "bg-crm-closed-bg text-crm-muted", dot: "bg-crm-closed", chip: "bg-crm-closed-bg text-crm-muted border-s-crm-closed" },
  cancelled: { pill: "bg-transparent text-crm-muted line-through ring-1 ring-inset ring-crm-line", dot: "bg-crm-line", chip: "" },
};

/** Soft tinted pill + small dot; crossfades when the status changes. */
export function StatusPill({ status, className }: { status: BookingStatus; className?: string }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={cn("relative inline-grid", className)}>
      <AnimatePresence initial={false} mode="popLayout">
        <m.span
          key={status}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={cn("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium", s.pill)}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
          {STATUS_LABELS[status]}
        </m.span>
      </AnimatePresence>
    </span>
  );
}

const MEETING_STYLE: Record<MeetingStatus, string> = {
  scheduled: "bg-crm-reserved-bg text-crm-reserved-ink",
  done: "bg-crm-success-bg text-crm-success",
  cancelled: "bg-crm-closed-bg text-crm-muted",
};

export function MeetingPill({ status }: { status: MeetingStatus }) {
  return <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium", MEETING_STYLE[status])}>{MEETING_STATUS_LABELS[status]}</span>;
}

export function StatusLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-crm-muted", className)}>
      {(["reserved", "booked", "closed"] as BookingStatus[]).map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full", STATUS_STYLE[s].dot)} />
          {STATUS_LABELS[s]}
        </span>
      ))}
    </div>
  );
}
