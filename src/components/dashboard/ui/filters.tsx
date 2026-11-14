"use client";
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowsDownUp, FunnelSimple, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { Input, Select, type Option } from "./core";
import { m } from "./motion";

/** Filter state with a reset and a count of active (non-default) filters. */
export function useFilters<T extends Record<string, string | boolean>>(initial: T) {
  const [f, setF] = useState<T>(initial);
  const set = useCallback(<K extends keyof T>(k: K, v: T[K]) => setF((s) => ({ ...s, [k]: v })), []);
  const reset = useCallback(() => setF(initial), [initial]);
  const active = useMemo(() => (Object.keys(initial) as (keyof T)[]).filter((k) => k !== "sort" && k !== "q" && f[k] !== initial[k]).length + (f.q ? 1 : 0), [f, initial]);
  return { f, set, reset, active };
}

/** yyyy-MM-dd inclusive range check; empty bounds are open. */
export const inRange = (date: string, from?: string, to?: string) => (!from || date >= from) && (!to || date <= to);

export function DateRange({ from, to, onFrom, onTo, label = "Date" }: { from: string; to: string; onFrom: (v: string) => void; onTo: (v: string) => void; label?: string }) {
  return (
    <div className="flex w-full items-center gap-1.5 sm:w-auto" role="group" aria-label={`${label} range`}>
      <Input type="date" aria-label={`${label} from`} value={from} onChange={(e) => onFrom(e.target.value)} className="sm:w-[150px]" />
      <span className="text-crm-muted">–</span>
      <Input type="date" aria-label={`${label} to`} value={to} onChange={(e) => onTo(e.target.value)} className="sm:w-[150px]" />
    </div>
  );
}

export function SortSelect({ value, onChange, options, className }: { value: string; onChange: (v: string) => void; options: readonly Option[]; className?: string }) {
  return (
    <div className={cn("relative w-full sm:w-auto", className)}>
      <ArrowsDownUp size={15} className="pointer-events-none absolute start-3 top-1/2 z-[1] -translate-y-1/2 text-crm-muted" />
      <Select aria-label="Sort" value={value} onChange={onChange} options={options} className="ps-8 sm:w-48" />
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options, all, className }: { label: string; value: string; onChange: (v: string) => void; options: readonly (Option | string)[]; all?: string; className?: string }) {
  return <Select aria-label={label} value={value} onChange={onChange} placeholder={all ?? `All ${label.toLowerCase()}`} options={options.map((o) => (typeof o === "string" ? { value: o, label: o } : o))} className={cn("w-full sm:w-44", className)} />;
}

/** "3 filters · Clear" chip + result count, shown under the filter row. */
export function FilterSummary({ active, onClear, count, noun, plural }: { active: number; onClear: () => void; count: number; noun: string; plural?: string }) {
  return (
    <div className="-mt-2 mb-4 flex min-h-6 flex-wrap items-center gap-3 text-[13px] text-crm-muted">
      <span className="tabular">
        {count} {count === 1 ? noun : (plural ?? `${noun}s`)}
      </span>
      <AnimatePresence>
        {active > 0 && (
          <m.button type="button" initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} onClick={onClear} className="inline-flex h-6 items-center gap-1.5 rounded-full bg-crm-surface-2 px-2.5 text-[12.5px] text-crm-ink-2 ring-1 ring-crm-line transition-colors hover:text-crm-ink">
            <FunnelSimple size={13} />
            {active} filter{active === 1 ? "" : "s"}
            <X size={12} />
          </m.button>
        )}
      </AnimatePresence>
    </div>
  );
}
