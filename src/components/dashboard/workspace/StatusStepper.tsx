"use client";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CaretDown } from "@phosphor-icons/react";
import type { BookingStatus } from "@/types/crm";
import { BOOKING_STATUSES, STATUS_LABELS } from "@/types/crm";
import { checklistFor, STATUS_COLORS } from "@/lib/crm/workflow";
import { toggleChecklist } from "@/services/crm/bookings.service";
import { useCrmAction } from "@/services/crm/hooks";
import { ago } from "@/lib/crm/format";
import { cn } from "@/lib/utils/cn";
import { m } from "../ui/motion";
import { DrawnCheck } from "../ui/status";
import { useWs } from "./context";

const ORDER: BookingStatus[] = ["requested", "confirmed", "completed"];

export function StatusStepper() {
  const { b, flow, goTab, canEdit } = useWs();
  const current = ORDER.indexOf(b.status);
  const [openStage, setOpenStage] = useState<BookingStatus | "none" | null>(null);
  const toggle = useCrmAction((a: { key: string; done: boolean }) => toggleChecklist(b.id, a.key, a.done));

  return (
    <div className="crm-card p-4 lg:sticky lg:top-4">
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-crm-muted">Booking flow</p>
      <ol className="space-y-1">
        {BOOKING_STATUSES.map((s, i) => {
          const items = checklistFor(s, b, flow);
          const done = items.filter((x) => x.done).length;
          const state = i < current ? "done" : i === current ? "current" : "upcoming";
          const expanded = openStage === null ? state === "current" : openStage === s;
          return (
            <li key={s} className="relative">
              {i < BOOKING_STATUSES.length - 1 && <span className="absolute start-[13px] top-8 bottom-0 w-0.5 rounded-full" style={{ background: i < current ? STATUS_COLORS[ORDER[i + 1]] : "var(--crm-line)" }} />}
              <button type="button" onClick={() => setOpenStage(expanded ? "none" : s)} className="relative flex w-full items-center gap-3 rounded-lg py-1.5 text-start">
                <m.span
                  initial={false}
                  animate={{ backgroundColor: state === "upcoming" ? "var(--crm-surface)" : STATUS_COLORS[s], borderColor: state === "upcoming" ? "var(--crm-line)" : STATUS_COLORS[s], scale: state === "current" ? 1.06 : 1 }}
                  className="z-[1] grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-[12px] font-bold"
                  style={{ color: state === "upcoming" ? "var(--crm-muted)" : "#fff" }}
                >
                  {state === "done" ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                      <m.path d="M6 12.5l4 4 8-9" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35 }} />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </m.span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[14px] font-semibold", state === "upcoming" ? "text-crm-muted" : "text-crm-ink")}>{STATUS_LABELS[s]}</span>
                  <span className="block text-[11.5px] text-crm-muted tabular">
                    {done}/{items.length} done
                  </span>
                </span>
                <CaretDown size={14} className={cn("text-crm-muted transition-transform", expanded && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {expanded && (
                  <m.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden ps-10">
                    {items.map((it) => {
                      const highlight = state === "current" && !it.done && items.find((x) => !x.done)?.key === it.key;
                      return (
                        <li key={it.key} className={cn("my-1 flex items-start gap-2 rounded-lg px-2 py-1.5", highlight && "bg-crm-tint")}>
                          <button
                            type="button"
                            disabled={it.mode !== "manual" || !canEdit}
                            onClick={() => toggle.mutate({ key: it.key, done: !it.done })}
                            className="mt-px shrink-0 disabled:cursor-default"
                            title={it.mode === "manual" ? "Click to toggle" : "Completes automatically"}
                          >
                            <DrawnCheck done={it.done} size={17} color={STATUS_COLORS[s]} />
                          </button>
                          <button type="button" onClick={() => it.tab && goTab(it.tab)} className="min-w-0 text-start">
                            <span className={cn("block text-[12.5px] leading-snug", it.done ? "text-crm-ink-2" : "text-crm-ink", highlight && "font-semibold")}>
                              {it.label}
                              {!it.required && <span className="ms-1 text-[11px] text-crm-muted">(optional)</span>}
                            </span>
                            {(it.hint || it.at) && <span className="block text-[11px] text-crm-muted">{it.done && it.at ? `${it.by ?? ""} · ${ago(it.at)}` : it.hint}</span>}
                          </button>
                        </li>
                      );
                    })}
                  </m.ul>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>
      {b.status === "requested" && <p className="mt-3 rounded-lg bg-crm-surface-2 px-3 py-2 text-[11.5px] text-crm-muted">The calendar shows this date as <strong className="text-[#B54708]">Tentative</strong> until it&apos;s confirmed.</p>}
    </div>
  );
}
