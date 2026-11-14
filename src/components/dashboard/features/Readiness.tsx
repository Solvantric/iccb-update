"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { CheckCircle, Clock, ShieldWarning, WarningCircle } from "@phosphor-icons/react";
import type { Booking } from "@/types/crm";
import { LEVEL_COLORS, LEVEL_LABELS, type ReadinessLevel, type ReadinessResult } from "@/lib/crm/readiness";
import { firstEventDate } from "@/lib/crm/pricing";
import { fmtDate, todayYmd } from "@/lib/crm/format";
import { readinessOf } from "@/services/crm/features.service";
import { cn } from "@/lib/utils/cn";
import { m } from "../ui/motion";
import { Badge, Card, CardHeader, EmptyState } from "../ui/core";

/** Ring that fills on load; the colour crossfades when the level changes. */
export function ReadinessRing({ score, level, size = 40, stroke = 4.5, className }: { score: number; level: ReadinessLevel; size?: number; stroke?: number; className?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className={cn("relative inline-grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--crm-line)" strokeWidth={stroke} />
        <m.circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c, stroke: LEVEL_COLORS[level] }} animate={{ strokeDashoffset: c - (score / 100) * c, stroke: LEVEL_COLORS[level] }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], stroke: { duration: 0.35 } }} />
      </svg>
      <span className="absolute font-display text-[12px] font-semibold tabular text-crm-ink" style={{ fontSize: Math.max(10, size * 0.3) }}>
        {score}
      </span>
    </span>
  );
}

export function LevelBadge({ level }: { level: ReadinessLevel }) {
  return <Badge tone={level === "ready" ? "green" : level === "attention" ? "amber" : "red"} dot>{LEVEL_LABELS[level]}</Badge>;
}

const STATE_ICON = {
  done: <CheckCircle size={15} weight="fill" className="text-[#12B76A]" />,
  on_track: <Clock size={15} weight="fill" className="text-[#F79009]" />,
  overdue: <WarningCircle size={15} weight="fill" className="text-[#D92D20]" />,
};

export function ReadinessBreakdown({ r }: { r: ReadinessResult }) {
  return (
    <ul className="space-y-2">
      {r.items.map((i) => (
        <li key={i.area} className="flex items-start gap-2 text-[12.5px]">
          <span className="mt-0.5">{STATE_ICON[i.state]}</span>
          <span className="min-w-0 flex-1">
            <span className="flex justify-between gap-2">
              <span className="font-semibold text-crm-ink">{i.label}</span>
              <span className="tabular text-crm-muted">
                {Math.round(i.credit * i.weight)}/{i.weight}
              </span>
            </span>
            <span className="block text-crm-muted">
              {i.state === "done" ? i.detail : i.open.map((o) => `${o.label}${o.dueDate ? ` · ${o.state === "overdue" ? "overdue since" : "due"} ${fmtDate(o.dueDate, "dd MMM")}` : ""}`).join(" · ")}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Ring + hover popover with the 5 areas. Only meaningful for Confirmed bookings. */
export function ReadinessChip({ b, size = 40, showLabel = true, pulse }: { b: Booking; size?: number; showLabel?: boolean; pulse?: boolean }) {
  const r = useMemo(() => readinessOf(b), [b]);
  const [open, setOpen] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = () => {
    if (t.current) clearTimeout(t.current);
    setOpen(true);
  };
  const hide = () => {
    t.current = setTimeout(() => setOpen(false), 120);
  };
  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      <button type="button" aria-label={`Readiness ${r.score} — ${LEVEL_LABELS[r.level]}`} className={cn("inline-flex items-center gap-2 rounded-[var(--radius-btn)]", pulse && r.level === "risk" && "crm-pulse-once")} style={{ ["--pulse" as string]: LEVEL_COLORS.risk }}>
        <ReadinessRing score={r.score} level={r.level} size={size} />
        {showLabel && (
          <span className="text-start leading-tight">
            <span className="block text-[11px] text-crm-muted">Readiness</span>
            <span className="block text-[12.5px] font-semibold" style={{ color: LEVEL_COLORS[r.level] }}>
              {LEVEL_LABELS[r.level]}
            </span>
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <m.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }} className="absolute start-0 top-full z-40 mt-2 w-72 rounded-[var(--radius-card-lg)] border border-crm-line bg-crm-surface p-4 shadow-[var(--crm-shadow-lg)]">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-crm-ink">Event readiness</span>
              <LevelBadge level={r.level} />
            </div>
            <ReadinessBreakdown r={r} />
            {r.nextDeadline && <p className="mt-3 border-t border-crm-line pt-2 text-[12px] text-crm-muted">Next deadline {fmtDate(r.nextDeadline)} · event in {r.daysToEvent} days</p>}
          </m.div>
        )}
      </AnimatePresence>
    </span>
  );
}

/** Overview widget: confirmed events in the next 30 days that are at risk or need attention. */
export function EventsAtRisk({ bookings }: { bookings: Booking[] }) {
  const today = todayYmd();
  const rows = useMemo(() => {
    return bookings
      .filter((b) => !b.closed && b.status === "confirmed" && firstEventDate(b) >= today)
      .map((b) => ({ b, r: readinessOf(b, today) }))
      .filter((x) => x.r.daysToEvent <= 30 && x.r.level !== "ready")
      .sort((a, b) => a.r.score - b.r.score);
  }, [bookings, today]);
  return (
    <Card>
      <CardHeader icon={ShieldWarning} title="Events at risk" description="Confirmed events in the next 30 days, lowest readiness first." action={<Link href="/dashboard/operations/events" className="text-[12.5px] font-medium text-crm-brand hover:underline">Events board</Link>} />
      {rows.length === 0 ? (
        <EmptyState icon={CheckCircle} title="Every upcoming event is ready" className="py-8" />
      ) : (
        <ul className="divide-y divide-crm-line px-5 pb-3">
          {rows.slice(0, 6).map(({ b, r }) => (
            <li key={b.id}>
              <Link href={`/dashboard/sales/bookings/${b.id}`} className="flex items-center gap-3 py-2.5 hover:text-crm-brand">
                <ReadinessRing score={r.score} level={r.level} size={38} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-crm-ink">{b.eventTitle}</span>
                  <span className="text-[12px] text-crm-muted">
                    {fmtDate(firstEventDate(b))} · in {r.daysToEvent} days · {r.items.filter((i) => i.state === "overdue").map((i) => i.label).join(", ") || "items due soon"}
                  </span>
                </span>
                <LevelBadge level={r.level} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
