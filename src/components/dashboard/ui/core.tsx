"use client";
import { forwardRef } from "react";
import { CircleNotch, MagnifyingGlass, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { initials } from "@/lib/crm/format";
import { m } from "./motion";

/* ─── Button ─────────────────────────────────────────────────────────────── */

type BtnVariant = "primary" | "outline" | "ghost" | "danger";
type BtnSize = "sm" | "md" | "icon" | "icon-sm";

const VARIANT: Record<BtnVariant, string> = {
  primary: "crm-btn-primary",
  outline: "border border-crm-line bg-crm-surface text-crm-ink hover:border-crm-muted/50 hover:bg-crm-surface-2",
  ghost: "text-crm-ink-2 hover:bg-crm-surface-2 hover:text-crm-ink",
  danger: "border border-crm-line bg-crm-surface text-crm-danger hover:border-crm-danger/40 hover:bg-crm-danger/5",
};
const SIZE: Record<BtnSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-[14px] gap-2",
  icon: "h-10 w-10",
  "icon-sm": "h-8 w-8",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
  icon?: Icon;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = "outline", size = "md", loading, icon: I, className, children, disabled, type = "button", ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[8px] font-medium select-none transition-colors duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        VARIANT[variant],
        SIZE[size],
        className
      )}
      {...rest}
    >
      {loading ? <CircleNotch size={16} className="animate-spin" /> : I ? <I size={size === "sm" || size === "icon-sm" ? 15 : 17} /> : null}
      {children}
    </button>
  );
});

/** Anchor styled as a button (tel:, wa.me, links). */
export function LinkButton({ href, children, icon: I, variant = "outline", size = "sm", className, external }: { href: string; children?: React.ReactNode; icon?: Icon; variant?: BtnVariant; size?: BtnSize; className?: string; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={cn("inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[8px] font-medium transition-colors duration-200", VARIANT[variant], SIZE[size], className)}
    >
      {I && <I size={15} />}
      {children}
    </a>
  );
}

/* ─── Card & page pattern ────────────────────────────────────────────────── */

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("crm-card", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ title, action, className }: { title: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 px-5 pt-5 pb-3", className)}>
      <h2 className="text-[16px] font-semibold text-crm-ink">{title}</h2>
      {action}
    </div>
  );
}

/** Title + one-line description on the left, one primary action on the right. */
export function PageHeader({ title, description, action }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.01em] text-crm-ink">{title}</h1>
        {description && <p className="mt-1 text-[14px] text-crm-muted">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

export function FilterRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-5 flex flex-wrap items-center gap-2.5", className)}>{children}</div>;
}

export function EmptyState({ icon: I, text, action, className }: { icon: Icon; text: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-crm-surface-2 text-crm-muted">
        <I size={24} />
      </span>
      <p className="max-w-xs text-[14px] text-crm-ink-2">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("crm-skeleton", className)} />;
}

/* ─── Form controls ──────────────────────────────────────────────────────── */

const field =
  "w-full rounded-[8px] border border-crm-line bg-crm-surface text-[14px] text-crm-ink placeholder:text-crm-muted/70 transition-colors focus:border-crm-brand focus:outline-none focus:ring-[3px] focus:ring-crm-brand/15 disabled:opacity-60";

export function Field({ label, hint, required, children, className }: { label?: React.ReactNode; hint?: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block min-w-0", className)}>
      {label && (
        <span className="mb-1.5 block text-[13px] font-medium text-crm-ink-2">
          {label}
          {required && <span className="text-crm-brand"> *</span>}
        </span>
      )}
      {children}
      {hint && <span className="mt-1 block text-[12px] text-crm-muted">{hint}</span>}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn(field, "h-10 px-3", className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn(field, "min-h-[84px] px-3 py-2.5 leading-relaxed", className)} {...rest} />;
});

export interface Option {
  value: string;
  label: string;
}

export function Select({ value, onChange, options, placeholder, className, "aria-label": ariaLabel }: { value: string; onChange: (v: string) => void; options: readonly Option[]; placeholder?: string; className?: string; "aria-label"?: string }) {
  return (
    <select aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value)} className={cn(field, "h-10 cursor-pointer appearance-none bg-[length:16px] bg-[position:right_10px_center] bg-no-repeat pe-8 ps-3 rtl:bg-[position:left_10px_center]", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256' fill='%238E9096'%3E%3Cpath d='M213.66 101.66l-80 80a8 8 0 01-11.32 0l-80-80a8 8 0 0111.32-11.32L128 164.69l74.34-74.35a8 8 0 0111.32 11.32z'/%3E%3C/svg%3E\")" }}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("relative w-full sm:w-64", className)}>
      <MagnifyingGlass size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-crm-muted" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className={cn(field, "h-10 ps-9 pe-3")} />
    </div>
  );
}

export function Checkbox({ checked, onChange, label, className }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode; className?: string }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5 text-[14px] text-crm-ink-2 select-none", className)}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 cursor-pointer rounded accent-[var(--accent)]" />
      {label}
    </label>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={cn("relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full transition-colors duration-200", checked ? "bg-crm-brand" : "bg-crm-line")}>
      <m.span layout transition={{ duration: 0.2 }} className={cn("h-[18px] w-[18px] rounded-full bg-white shadow-sm", checked ? "ms-[18px]" : "ms-[2px]")} />
    </button>
  );
}

/** Small segmented control (status filters, ranges). */
export function Segmented<T extends string>({ value, onChange, options, className, id }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[]; className?: string; id: string }) {
  return (
    <div className={cn("inline-flex max-w-full overflow-x-auto rounded-[10px] border border-crm-line bg-crm-surface p-0.5 crm-scroll", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} className={cn("relative h-8 whitespace-nowrap rounded-[8px] px-3 text-[13px] font-medium transition-colors", on ? "text-crm-ink" : "text-crm-muted hover:text-crm-ink")}>
            {on && <m.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-[8px] bg-crm-surface-2 ring-1 ring-crm-line" transition={{ duration: 0.25 }} />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-full bg-crm-tint font-semibold text-crm-brand-text", className)} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials(name)}
    </span>
  );
}

export function KeyValue({ items, cols = 2 }: { items: [React.ReactNode, React.ReactNode][]; cols?: 1 | 2 | 3 }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-4", cols === 1 ? "grid-cols-1" : cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
      {items.map(([k, v], i) => (
        <div key={i} className="min-w-0">
          <dt className="text-[12px] text-crm-muted">{k}</dt>
          <dd className="mt-0.5 break-words text-[14px] text-crm-ink">{v || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-crm-surface-2", className)}>
      <m.div className="h-full origin-left rounded-full bg-crm-success rtl:origin-right" initial={{ scaleX: 0 }} animate={{ scaleX: v / 100 }} transition={{ duration: 0.5 }} />
    </div>
  );
}
