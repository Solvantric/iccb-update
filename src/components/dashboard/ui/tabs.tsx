"use client";
import { useId } from "react";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { m } from "./motion";
import { Select } from "./core";

export interface TabDef<T extends string> {
  value: T;
  label: string;
  icon?: Icon;
  count?: number;
  hidden?: boolean;
}

/** Underline tabs with a sliding indicator; becomes a dropdown on mobile. */
export function Tabs<T extends string>({ tabs, value, onChange, className, mobileSelect = true }: { tabs: TabDef<T>[]; value: T; onChange: (v: T) => void; className?: string; mobileSelect?: boolean }) {
  const id = useId();
  const visible = tabs.filter((t) => !t.hidden);
  return (
    <>
      {mobileSelect && (
        <div className="md:hidden mb-4">
          <Select value={value} onChange={(v) => onChange(v as T)} options={visible.map((t) => ({ value: t.value, label: t.count ? `${t.label} (${t.count})` : t.label }))} />
        </div>
      )}
      <div role="tablist" className={cn("relative flex gap-1 overflow-x-auto crm-scroll border-b border-crm-line", mobileSelect && "hidden md:flex", className)}>
        {visible.map((t) => {
          const active = t.value === value;
          const I = t.icon;
          return (
            <button
              key={t.value}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(t.value)}
              className={cn("relative inline-flex shrink-0 items-center gap-1.5 px-3 pb-2.5 pt-2 text-[13.5px] font-medium transition-colors", active ? "text-crm-brand" : "text-crm-muted hover:text-crm-ink")}
            >
              {I && <I size={16} weight={active ? "fill" : "regular"} />}
              {t.label}
              {!!t.count && <span className={cn("rounded-full px-1.5 text-[11px] tabular", active ? "bg-crm-tint text-crm-brand" : "bg-crm-surface-2 text-crm-muted")}>{t.count}</span>}
              {active && <m.span layoutId={`tab-${id}`} className="absolute inset-x-1 -bottom-px h-[2px] rounded-full bg-crm-brand" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
            </button>
          );
        })}
      </div>
    </>
  );
}
