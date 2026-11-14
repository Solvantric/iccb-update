"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { animate, useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { taka } from "@/lib/crm/format";
import { m } from "./motion";
import { Skeleton } from "./core";

/** Animates from the previous value to the new one (count-up on mount). */
const intFmt = (n: number) => Math.round(n).toLocaleString("en-US");

export function AnimatedNumber({ value, format = intFmt, duration = 0.8, className }: { value: number; format?: (n: number) => string; duration?: number; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = format(value);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = format(v);
      },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, reduce, duration, format]);
  return (
    <span ref={ref} className={cn("tabular", className)}>
      {format(reduce ? value : 0)}
    </span>
  );
}

const moneyFmt = (n: number) => taka(Math.round(n));
export function AnimatedMoney({ value, className, duration = 0.45 }: { value: number; className?: string; duration?: number }) {
  return <AnimatedNumber value={value} format={moneyFmt} duration={duration} className={className} />;
}

/** Sparkline that draws left → right. */
export function Sparkline({ data, color = "var(--crm-brand)", height = 32, className }: { data: number[]; color?: string; height?: number; className?: string }) {
  if (data.length < 2) return null;
  const w = 100;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, height - 2 - ((v - min) / span) * (height - 4)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${d} L${w},${height} L0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={cn("w-full", className)} style={{ height }}>
      <defs>
        <linearGradient id={`spark-${color.replace(/\W/g, "")}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <m.path d={area} fill={`url(#spark-${color.replace(/\W/g, "")})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }} />
      <m.path d={d} fill="none" stroke={color} strokeWidth={1.8} vectorEffect="non-scaling-stroke" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  format,
  delta,
  deltaLabel = "vs last period",
  icon: I,
  spark,
  loading,
  href,
  tone = "brand",
  invertDelta,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  delta?: number;
  deltaLabel?: string;
  icon: Icon;
  spark?: number[];
  loading?: boolean;
  href?: string;
  tone?: "brand" | "amber" | "green" | "blue";
  invertDelta?: boolean;
}) {
  const toneCls = { brand: "bg-crm-tint text-crm-brand", amber: "bg-[#FEF6E7] text-[#DC6803] dark:bg-[#2B2010]", green: "bg-[#ECFDF3] text-[#079455] dark:bg-[#0E2A1C]", blue: "bg-[#EFF8FF] text-[#1570EF] dark:bg-[#0F2236]" }[tone];
  const sparkColor = { brand: "#EB2127", amber: "#F59E0B", green: "#12B76A", blue: "#2E90FA" }[tone];
  const good = delta === undefined ? true : invertDelta ? delta <= 0 : delta >= 0;
  const body = (
    <div className={cn("crm-card p-4 h-full flex flex-col", href && "crm-card-hover")}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[12.5px] font-medium text-crm-muted">{label}</span>
        <span className={cn("grid h-8 w-8 place-items-center rounded-[var(--radius-btn)]", toneCls)}>
          <I size={18} weight="duotone" />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-28" />
      ) : (
        <div className="mt-1 font-display text-[28px] font-semibold leading-tight text-crm-ink">
          <AnimatedNumber value={value} format={format} />
        </div>
      )}
      <div className="mt-auto pt-2 flex items-end justify-between gap-3">
        {delta !== undefined && !loading ? (
          <m.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: "spring", stiffness: 500, damping: 20 }} className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11.5px] font-semibold", good ? "bg-[#ECFDF3] text-[#067647] dark:bg-[#0E2A1C] dark:text-[#47CD89]" : "bg-[#FEF3F2] text-[#B42318] dark:bg-[#2D1414] dark:text-[#F97066]")}>
            {delta >= 0 ? <ArrowUpRight size={12} weight="bold" /> : <ArrowDownRight size={12} weight="bold" />}
            {Math.abs(delta)}%<span className="ms-1 font-normal opacity-70 hidden xl:inline">{deltaLabel}</span>
          </m.span>
        ) : (
          <span />
        )}
        {spark && !loading && <Sparkline data={spark} color={sparkColor} className="max-w-[96px]" />}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

export function ProgressRing({ value, size = 44, stroke = 5, color = "var(--crm-brand)", label, className }: { value: number; size?: number; stroke?: number; color?: string; label?: React.ReactNode; className?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <span className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--crm-line)" strokeWidth={stroke} />
        <m.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (v / 100) * c }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <span className="absolute text-[11px] font-bold text-crm-ink tabular">{label ?? `${Math.round(v)}%`}</span>
    </span>
  );
}

export function ProgressBar({ value, color = "var(--crm-brand)", className, marker }: { value: number; color?: string; className?: string; marker?: number }) {
  return (
    <div className={cn("relative h-2 w-full overflow-visible rounded-full bg-crm-line", className)}>
      <m.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
      {marker !== undefined && <span className="absolute -top-1 h-4 w-0.5 rounded bg-crm-ink-2" style={{ insetInlineStart: `${marker}%` }} title={`${marker}% required`} />}
    </div>
  );
}
