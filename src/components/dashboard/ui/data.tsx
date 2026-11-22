"use client";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { AnimatedNumber, m } from "./motion";
import { useIsMobile } from "./overlay";

/* ─── Tabs: underline slides between tabs ────────────────────────────────── */

export function Tabs<T extends string>({ tabs, value, onChange, id, className }: { tabs: { value: T; label: React.ReactNode }[]; value: T; onChange: (v: T) => void; id: string; className?: string }) {
  return (
    <div role="tablist" className={cn("crm-scroll flex gap-1 overflow-x-auto border-b border-crm-line", className)}>
      {tabs.map((t) => {
        const on = t.value === value;
        return (
          <button key={t.value} role="tab" aria-selected={on} type="button" onClick={() => onChange(t.value)} className={cn("relative h-11 whitespace-nowrap px-3 text-[14px] font-medium transition-colors", on ? "text-crm-ink" : "text-crm-muted hover:text-crm-ink")}>
            {t.label}
            {on && <m.span layoutId={`tab-${id}`} className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-crm-brand" transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} />}
          </button>
        );
      })}
    </div>
  );
}

/* ─── KPI card (max 4 per page) ──────────────────────────────────────────── */

/* ─── Performance colours: low = red, high = green ───────────────────────── */

const PERF_FILL = ["var(--lead-s1, #EF4444)", "var(--lead-s2, #F97316)", "var(--lead-s3, #EAB308)", "var(--lead-s4, #84CC16)", "var(--lead-s5, #12B76A)"];
const PERF_INK = ["var(--lead-s1-ink, #C81E1E)", "var(--lead-s2-ink, #C2410C)", "var(--lead-s3-ink, #A16207)", "var(--lead-s4-ink, #4D7C0F)", "var(--lead-s5-ink, #067647)"];
const perfStep = (value: number, max: number) => {
  const r = max > 0 ? value / max : 0;
  return r >= 0.8 ? 4 : r >= 0.6 ? 3 : r >= 0.4 ? 2 : r >= 0.2 ? 1 : 0;
};
/** Bar colour by how well a value does against the best (max): the best is green, the weakest red. */
export const perfFill = (value: number, max: number) => PERF_FILL[perfStep(value, max)];
/** Text colour on the same scale. */
export const perfInk = (value: number, max: number) => PERF_INK[perfStep(value, max)];

/** What a colour means: good = green, bad = red, warn = amber, info = blue, purple = AI/marketing. */
export type Tone = "good" | "bad" | "warn" | "info" | "purple" | "neutral";
export const TONE_STYLE: Record<Tone, string> = {
  good: "bg-crm-success-bg text-crm-success",
  bad: "bg-crm-danger-bg text-crm-danger",
  warn: "bg-crm-reserved-bg text-crm-reserved-ink",
  info: "bg-crm-info-bg text-crm-info-ink",
  purple: "bg-crm-purple-bg text-crm-purple-ink",
  neutral: "bg-crm-surface-2 text-crm-ink-2",
};

export function Kpi({ label, value, icon: I, format, hint, tone = "info", onClick }: { label: string; value: number; icon: Icon; format?: (n: number) => string; hint?: string; tone?: Tone; /** Makes the card a button, e.g. to open details. */ onClick?: () => void }) {
  const body = (
    <>
      <div className="min-w-0">
        <p className="text-[13px] text-crm-muted">{label}</p>
        <AnimatedNumber value={value} format={format} className={cn("mt-2 block text-[26px] font-semibold leading-none", tone === "bad" && value > 0 ? "text-crm-danger" : "text-crm-ink")} />
        {/* Same height in every card, so a row of cards lines up. */}
        <p className="mt-2 min-h-[18px] truncate text-[12px] text-crm-muted" title={hint}>{hint}</p>
        {onClick && <p className="mt-2 text-[12px] font-medium text-crm-info-ink group-hover:underline">See details →</p>}
      </div>
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-[10px]", TONE_STYLE[tone])}>
        <I size={20} />
      </span>
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="crm-card crm-card-hover group flex h-full w-full items-start justify-between gap-3 p-5 text-start">
      {body}
    </button>
  ) : (
    <div className="crm-card flex h-full items-start justify-between gap-3 p-5">{body}</div>
  );
}

/* ─── Bar chart (bars grow once) ─────────────────────────────────────────── */

export function SimpleBars({ data, height = 220, format, colorByValue }: { data: { label: string; value: number }[]; height?: number; format?: (n: number) => string; /** Colour each bar by its value: highest green, lowest red. */ colorByValue?: boolean }) {
  const max = Math.max(0, ...data.map((d) => d.value));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} stroke="var(--crm-line)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--crm-muted)", fontSize: 12 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--crm-muted)", fontSize: 12 }} tickFormatter={format} />
          <Tooltip
            cursor={{ fill: "var(--crm-surface-2)" }}
            formatter={(v) => [format ? format(Number(v)) : String(v), ""]}
            separator=""
            contentStyle={{ background: "var(--crm-surface)", border: "1px solid var(--crm-line)", borderRadius: 10, fontSize: 13, color: "var(--crm-ink)" }}
            labelStyle={{ color: "var(--crm-muted)" }}
          />
          <Bar dataKey="value" fill="var(--crm-info)" radius={[6, 6, 0, 0]} maxBarSize={36} animationDuration={700} animationEasing="ease-out">
            {colorByValue && data.map((d) => <Cell key={d.label} fill={perfFill(d.value, max)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Table: airy rows, sticky header, cards on mobile ───────────────────── */

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  align?: "start" | "end";
}

export function DataTable<T extends { id: string; createdAt?: string }>({ rows, columns, onRowClick, mobileCard, empty }: { rows: T[]; columns: Column<T>[]; onRowClick?: (row: T) => void; mobileCard: (row: T) => React.ReactNode; empty?: React.ReactNode }) {
  const mobile = useIsMobile();
  // Rows created after the page opened get a short brand-tint flash.
  const [openedAt] = useState(() => new Date().toISOString());
  const created = new Map(rows.map((r) => [r.id, r.createdAt ?? ""]));
  const isNew = (id: string) => (created.get(id) ?? "") > openedAt;

  if (!rows.length) return <div className="crm-card">{empty}</div>;

  if (mobile)
    return (
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {rows.map((r) => (
            <m.div key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }} className={cn("crm-card p-4", onRowClick && "crm-card-hover cursor-pointer", isNew(r.id) && "crm-flash")} onClick={() => onRowClick?.(r)}>
              {mobileCard(r)}
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    );

  return (
    <div className="crm-card overflow-hidden">
      <div className="crm-scroll max-h-[calc(100vh-260px)] overflow-auto">
        <table className="w-full min-w-[760px] border-collapse text-[14px]">
          <thead className="sticky top-0 z-10 bg-crm-surface">
            <tr className="border-b border-crm-line">
              {columns.map((c) => (
                <th key={c.key} className={cn("h-11 px-4 text-[12.5px] font-medium text-crm-muted", c.align === "end" ? "text-end" : "text-start", c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((r) => (
                <m.tr
                  key={r.id}
                  layout="position"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onRowClick?.(r)}
                  className={cn("group h-14 border-b border-crm-line last:border-0 transition-colors hover:bg-crm-surface-2/70", onRowClick && "cursor-pointer", isNew(r.id) && "crm-flash")}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 text-crm-ink-2", c.align === "end" && "text-end tabular", c.className)}>
                      {c.cell(r)}
                    </td>
                  ))}
                </m.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Stops row clicks when pressing buttons inside a row. */
export function RowActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-end gap-1", className)} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}
