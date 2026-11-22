"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { todayYmd } from "@/lib/crm/format";
import { m } from "./motion";

/** Date picker where reserved/booked dates (and past dates) can't be picked. */
export function DatePicker({ value, onChange, disabled, placeholder = "Pick a date", allowPast = false, id }: { value: string; onChange: (v: string) => void; disabled?: Set<string>; placeholder?: string; allowPast?: boolean; id?: string }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => (value ? new Date(`${value}T00:00:00`) : new Date()));
  const ref = useRef<HTMLDivElement>(null);
  const today = todayYmd();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const days = useMemo(() => eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) }), [month]);

  return (
    <div ref={ref} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => {
          if (!open && value) setMonth(new Date(`${value}T00:00:00`));
          setOpen((v) => !v);
        }}
        className={cn("flex h-10 w-full items-center gap-2 rounded-[8px] border border-crm-line bg-crm-surface px-3 text-start text-[14px] transition-colors focus:border-crm-brand focus:outline-none", open && "border-crm-brand ring-[3px] ring-crm-brand/15", value ? "text-crm-ink" : "text-crm-muted/80")}
      >
        <CalendarBlank size={16} className="text-crm-muted" />
        {value ? format(new Date(`${value}T00:00:00`), "EEE, d MMM yyyy") : placeholder}
      </button>
      <AnimatePresence>
        {open && (
          <m.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="absolute start-0 top-full z-50 mt-1 w-[300px] max-w-[calc(100vw-48px)] rounded-[12px] border border-crm-line bg-crm-surface p-3 shadow-[var(--crm-shadow-lg)]">
            <div className="mb-2 flex items-center justify-between">
              <button type="button" onClick={() => setMonth((d) => addMonths(d, -1))} className="grid h-8 w-8 place-items-center rounded-[8px] text-crm-muted hover:bg-crm-surface-2" aria-label="Previous month">
                <CaretLeft size={16} className="rtl:rotate-180" />
              </button>
              <span className="text-[14px] font-medium text-crm-ink">{format(month, "MMMM yyyy")}</span>
              <button type="button" onClick={() => setMonth((d) => addMonths(d, 1))} className="grid h-8 w-8 place-items-center rounded-[8px] text-crm-muted hover:bg-crm-surface-2" aria-label="Next month">
                <CaretRight size={16} className="rtl:rotate-180" />
              </button>
            </div>
            <div className="grid grid-cols-7 text-center text-[11.5px] text-crm-muted">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <span key={i} className="py-1">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {days.map((d) => {
                const key = format(d, "yyyy-MM-dd");
                const taken = disabled?.has(key);
                const past = !allowPast && key < today;
                const off = taken || past;
                const sel = key === value;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={off}
                    title={taken ? "Already reserved" : undefined}
                    onClick={() => {
                      onChange(key);
                      setOpen(false);
                    }}
                    className={cn(
                      "relative grid h-9 place-items-center rounded-[8px] text-[13px] tabular transition-colors",
                      !isSameMonth(d, month) && "opacity-40",
                      sel ? "crm-btn-primary font-semibold" : off ? "cursor-not-allowed text-crm-muted/50" : "text-crm-ink hover:bg-crm-surface-2",
                      taken && !sel && "line-through decoration-crm-reserved",
                      key === today && !sel && "font-semibold text-crm-info-ink"
                    )}
                  >
                    {format(d, "d")}
                  </button>
                );
              })}
            </div>
            {disabled && disabled.size > 0 && <p className="mt-2 text-[12px] text-crm-muted">Crossed-out dates are already reserved.</p>}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
