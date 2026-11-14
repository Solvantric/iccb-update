"use client";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils/cn";
import { m } from "./motion";

/** Brand scale + neutral greys. Status colors are reserved for status. */
export const CHART = {
  brand: "#EB2127",
  scale: ["#EB2127", "#F16A6E", "#F7A3A6", "#AC090A", "#740F12", "#FBCBCD"],
  grey: ["#55525A", "#8A8690", "#B9B5BE", "#D9D6DC"],
  grid: "var(--crm-line)",
  axis: "var(--crm-muted)",
};
export const SERIES = [CHART.scale[0], CHART.grey[0], CHART.scale[1], CHART.grey[1], CHART.scale[3], CHART.grey[2], CHART.scale[2]];

type TipRow = { name?: string | number; value?: number | string; color?: string; payload?: Record<string, unknown> };
function ChartTip({ active, payload, label, format }: { active?: boolean; payload?: TipRow[]; label?: string | number; format?: (n: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-crm-line bg-crm-surface px-3 py-2 text-[12px] shadow-[var(--crm-shadow-lg)]">
      {label !== undefined && <p className="mb-1 font-semibold text-crm-ink">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-crm-ink-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-crm-ink tabular">{format && typeof p.value === "number" ? format(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

const axisProps = { tick: { fill: "var(--crm-muted)", fontSize: 11 }, axisLine: false, tickLine: false } as const;

export type ChartRow = Record<string, string | number>;

export function AreaTrend({ data, x, series, height = 240, format }: { data: ChartRow[]; x: string; series: { key: string; label: string; color?: string }[]; height?: number; format?: (n: number) => string }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.key} id={`area-${s.key}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={s.color ?? SERIES[i]} stopOpacity={0.25} />
                <stop offset="100%" stopColor={s.color ?? SERIES[i]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={CHART.grid} vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey={x} {...axisProps} />
          <YAxis {...axisProps} width={56} tickFormatter={format ? (v: number) => format(v) : undefined} />
          <Tooltip content={(p) => <ChartTip {...(p as object)} format={format} />} cursor={{ stroke: "var(--crm-line)" }} />
          {series.map((s, i) => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color ?? SERIES[i]} strokeWidth={2} fill={`url(#area-${s.key})`} animationDuration={900} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Bars({ data, x, series, height = 240, format, horizontal, stacked }: { data: ChartRow[]; x: string; series: { key: string; label: string; color?: string }[]; height?: number; format?: (n: number) => string; horizontal?: boolean; stacked?: boolean }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: 8, left: horizontal ? 8 : 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} vertical={!!horizontal} horizontal={!horizontal} strokeDasharray="3 3" />
          {horizontal ? (
            <>
              <XAxis type="number" {...axisProps} tickFormatter={format ? (v: number) => format(v) : undefined} />
              <YAxis type="category" dataKey={x} {...axisProps} width={110} />
            </>
          ) : (
            <>
              <XAxis dataKey={x} {...axisProps} />
              <YAxis {...axisProps} width={56} tickFormatter={format ? (v: number) => format(v) : undefined} />
            </>
          )}
          <Tooltip content={(p) => <ChartTip {...(p as object)} format={format} />} cursor={{ fill: "var(--crm-surface-2)" }} />
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color ?? SERIES[i]} radius={stacked ? 0 : horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} stackId={stacked ? "a" : undefined} maxBarSize={36} animationDuration={800} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Donut({ data, height = 200, format, center }: { data: { name: string; value: number; color?: string }[]; height?: number; format?: (n: number) => string; center?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div style={{ height, width: height }} className="relative shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={2} startAngle={90} endAngle={-270} animationDuration={900} stroke="none">
              {data.map((d, i) => (
                <Cell key={d.name} fill={d.color ?? SERIES[i % SERIES.length]} />
              ))}
            </Pie>
            <Tooltip content={(p) => <ChartTip {...(p as object)} format={format} />} />
          </PieChart>
        </ResponsiveContainer>
        {center && <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">{center}</div>}
      </div>
      <ul className="w-full space-y-1.5 text-[12.5px]">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-crm-ink-2 min-w-0">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color ?? SERIES[i % SERIES.length] }} />
              <span className="truncate">{d.name}</span>
            </span>
            <span className="font-semibold text-crm-ink tabular">{format ? format(d.value) : d.value.toLocaleString("en-US")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal funnel bars with step conversion. */
export function Funnel({ steps, colors }: { steps: { label: string; value: number }[]; colors?: string[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <div className="space-y-2.5">
      {steps.map((s, i) => {
        const prev = steps[i - 1]?.value;
        const conv = prev ? Math.round((s.value / prev) * 100) : null;
        return (
          <div key={s.label}>
            <div className="mb-1 flex items-center justify-between text-[12.5px]">
              <span className="text-crm-ink-2">{s.label}</span>
              <span className="tabular text-crm-ink font-semibold">
                {s.value.toLocaleString("en-US")}
                {conv !== null && <span className="ms-2 font-normal text-crm-muted">{conv}%</span>}
              </span>
            </div>
            <div className="h-7 rounded-md bg-crm-surface-2 overflow-hidden">
              <m.div
                className="h-full rounded-md"
                style={{ background: colors?.[i] ?? CHART.scale[Math.min(i, CHART.scale.length - 1)], opacity: 1 - i * 0.08 }}
                initial={{ width: 0 }}
                animate={{ width: `${(s.value / max) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Heatmap grid: rows × cols, cells fade in diagonally. */
export function Heatmap({ rows, cols, value, cell, onCellClick, max: maxProp, selected }: { rows: { id: string; label: string }[]; cols: { id: string; label: string }[]; value: (r: string, c: string) => number; cell?: (r: string, c: string, v: number) => React.ReactNode; onCellClick?: (r: string, c: string) => void; max?: number; selected?: { r: string; c: string } | null }) {
  const vals = rows.flatMap((r) => cols.map((c) => value(r.id, c.id)));
  const max = maxProp ?? Math.max(1, ...vals);
  return (
    <div className="overflow-x-auto crm-scroll">
      <table className="w-full border-separate border-spacing-1 text-[11.5px]">
        <thead>
          <tr>
            <th />
            {cols.map((c) => (
              <th key={c.id} className="px-1 pb-1 font-medium text-crm-muted whitespace-nowrap">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={r.id}>
              <th className="pe-2 text-start font-medium text-crm-ink-2 whitespace-nowrap">{r.label}</th>
              {cols.map((c, ci) => {
                const v = value(r.id, c.id);
                const t = v / max;
                const isSel = selected?.r === r.id && selected?.c === c.id;
                return (
                  <td key={c.id} className="p-0">
                    <m.button
                      type="button"
                      onClick={onCellClick ? () => onCellClick(r.id, c.id) : undefined}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (ri + ci) * 0.025, duration: 0.3 }}
                      className={cn("grid h-10 w-full min-w-[52px] place-items-center rounded-md font-semibold tabular transition-shadow", onCellClick && "hover:ring-2 hover:ring-crm-brand/40", isSel && "ring-2 ring-crm-brand")}
                      style={{ background: t === 0 ? "var(--crm-surface-2)" : `color-mix(in srgb, #EB2127 ${Math.round(12 + t * 78)}%, var(--crm-surface))`, color: t > 0.55 ? "#fff" : "var(--crm-ink)" }}
                    >
                      {cell ? cell(r.id, c.id, v) : v}
                    </m.button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
