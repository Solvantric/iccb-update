"use client";
import { CheckCircle, Circle, Lock, XCircle } from "@phosphor-icons/react";
import { AnimatePresence } from "framer-motion";
import type { ActivityItem, Booking, BookingStatus } from "@/types/crm";
import { STATUS_LABELS } from "@/types/crm";
import { STATUS_COLORS } from "@/lib/crm/workflow";
import { ago, fmtDateTime } from "@/lib/crm/format";
import { cn } from "@/lib/utils/cn";
import { m } from "./motion";

const STATUS_BG: Record<BookingStatus, string> = {
  requested: "rgba(245,158,11,0.12)",
  confirmed: "rgba(226,79,95,0.12)",
  completed: "rgba(18,183,106,0.12)",
};

/** Colored pill — crossfades when the status changes. */
export function StatusPill({ status, size = "md", className }: { status: BookingStatus; size?: "sm" | "md"; className?: string }) {
  return (
    <m.span
      layout
      animate={{ backgroundColor: STATUS_BG[status], color: STATUS_COLORS[status] }}
      transition={{ duration: 0.3 }}
      className={cn("inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap", size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]", className)}
    >
      <m.span animate={{ backgroundColor: STATUS_COLORS[status] }} className="h-1.5 w-1.5 rounded-full" />
      <AnimatePresence mode="wait" initial={false}>
        <m.span key={status} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
          {STATUS_LABELS[status]}
        </m.span>
      </AnimatePresence>
    </m.span>
  );
}

export function ClosedTag({ closed, className }: { closed: Booking["closed"]; className?: string }) {
  if (!closed) return null;
  return (
    <span title={closed.reason} className={cn("inline-flex items-center gap-1 rounded-full bg-[#F2F4F7] px-2 py-0.5 text-[11px] font-semibold text-[#475467] dark:bg-[#22252B] dark:text-[#98A2B3]", className)}>
      <XCircle size={12} weight="fill" />
      {closed.kind === "cancelled" ? "Cancelled" : "Lost"}
    </span>
  );
}

/** Horizontal 3-status progress (Requested → Confirmed → Completed). */
export function StatusTrack({ status, closed }: { status: BookingStatus; closed?: boolean }) {
  const order: BookingStatus[] = ["requested", "confirmed", "completed"];
  const idx = order.indexOf(status);
  return (
    <div className="flex items-center gap-1.5">
      {order.map((s, i) => (
        <div key={s} className="flex items-center gap-1.5">
          <m.span
            initial={false}
            animate={{ backgroundColor: i <= idx && !closed ? STATUS_COLORS[s] : "var(--crm-line)", scale: i === idx ? 1.15 : 1 }}
            className="h-2 w-2 rounded-full"
          />
          {i < order.length - 1 && <m.span initial={false} animate={{ backgroundColor: i < idx && !closed ? STATUS_COLORS[order[i + 1]] : "var(--crm-line)" }} className="h-0.5 w-5 rounded-full" />}
        </div>
      ))}
    </div>
  );
}

/** Animated check icon — the stroke draws in. */
export function DrawnCheck({ done, size = 20, color = "#12B76A" }: { done: boolean; size?: number; color?: string }) {
  if (!done) return <Circle size={size} className="text-crm-line" weight="bold" />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <m.circle cx="12" cy="12" r="10" fill={color} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 500, damping: 25 }} />
      <m.path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.08 }} />
    </svg>
  );
}

export function LockedDot() {
  return <Lock size={16} className="text-crm-muted" />;
}

/* ─── Timeline ───────────────────────────────────────────────────────────── */

const TL_COLOR: Record<ActivityItem["type"], string> = {
  status: "#E24F5F",
  note: "#8A8690",
  call: "#2E90FA",
  change: "#7A5AF8",
  payment: "#12B76A",
  document: "#0BA5EC",
  approval: "#F59E0B",
  system: "#98A2B3",
};

export function Timeline({ items, empty = "No activity yet." }: { items: ActivityItem[]; empty?: string }) {
  const sorted = [...items].sort((a, b) => b.at.localeCompare(a.at));
  if (!sorted.length) return <p className="text-[13px] text-crm-muted">{empty}</p>;
  return (
    <ol className="relative">
      <AnimatePresence initial={false}>
        {sorted.map((it, i) => (
          <m.li key={it.id} layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="relative ps-7 pb-5 last:pb-0">
            {i < sorted.length - 1 && <span className="absolute start-[7px] top-4 bottom-0 w-px bg-crm-line" />}
            <span className="absolute start-0 top-1 grid h-[15px] w-[15px] place-items-center rounded-full border-2 border-crm-surface" style={{ background: TL_COLOR[it.type] }} />
            <p className="text-[13.5px] text-crm-ink leading-snug whitespace-pre-wrap">{it.text}</p>
            <p className="mt-0.5 text-[12px] text-crm-muted" title={fmtDateTime(it.at)}>
              {it.by} · {ago(it.at)}
            </p>
          </m.li>
        ))}
      </AnimatePresence>
    </ol>
  );
}

export { CheckCircle };
