"use client";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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

export function Kpi({ label, value, icon: I, format, hint }: { label: string; value: number; icon: Icon; format?: (n: number) => string; hint?: string }) {
  return (
    <div className="crm-card flex items-start justify-between gap-3 p-5">
      <div className="min-w-0">
        <p className="text-[13px] text-crm-muted">{label}</p>
        <AnimatedNumber value={value} format={format} className="mt-2 block text-[26px] font-semibold leading-none text-crm-ink" />
        {hint && <p className="mt-2 text-[12px] text-crm-muted">{hint}</p>}
      </div>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-crm-tint text-crm-brand-text">
        <I size={20} />
      </span>
    </div>
  );
}

/* ─── Bar chart (bars grow once) ─────────────────────────────────────────── */

export function SimpleBars({ data, height = 220, format }: { data: { label: string; value: number }[]; height?: number; format?: (n: number) => string }) {
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
          <Bar dataKey="value" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={36} animationDuration={700} animationEasing="ease-out" />
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
