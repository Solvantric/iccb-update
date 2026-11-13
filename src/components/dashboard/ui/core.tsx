"use client";
import { forwardRef, useId } from "react";
import { CircleNotch, MagnifyingGlass, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { initials } from "@/lib/crm/format";
import { m } from "./motion";

/* ─── Button ─────────────────────────────────────────────────────────────── */

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type BtnSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

const BTN_VARIANT: Record<BtnVariant, string> = {
  primary: "bg-crm-brand text-white hover:bg-crm-brand-hover shadow-[0_1px_2px_rgba(226,79,95,0.3)]",
  secondary: "bg-crm-surface text-crm-ink border border-crm-line hover:bg-crm-surface-2 hover:border-crm-muted/40",
  ghost: "text-crm-ink-2 hover:bg-crm-surface-2 hover:text-crm-ink",
  danger: "bg-[#D92D20] text-white hover:bg-[#B42318]",
  soft: "bg-crm-tint text-crm-brand hover:bg-crm-tint-2",
};
const BTN_SIZE: Record<BtnSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-9 px-4 text-[13.5px] gap-2",
  lg: "h-11 px-5 text-[14.5px] gap-2",
  icon: "h-9 w-9 justify-center",
  "icon-sm": "h-8 w-8 justify-center",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
  icon?: Icon;
  iconRight?: Icon;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading, icon: I, iconRight: IR, className, children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-[6px] font-medium select-none",
        "transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:-translate-y-px active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        BTN_VARIANT[variant],
        BTN_SIZE[size],
        className
      )}
      {...rest}
    >
      {loading ? <CircleNotch size={16} className="animate-spin" /> : I ? <I size={size === "sm" || size === "icon-sm" ? 15 : 17} /> : null}
      {children}
      {IR && !loading ? <IR size={15} /> : null}
    </button>
  );
});

/* ─── Card ───────────────────────────────────────────────────────────────── */

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("crm-card", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, icon: I, className }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; icon?: Icon; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 pt-4 pb-3", className)}>
      <div className="min-w-0 flex items-start gap-2.5">
        {I && (
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-crm-tint text-crm-brand">
            <I size={16} weight="duotone" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-[14.5px] font-semibold text-crm-ink leading-tight">{title}</h3>
          {description && <p className="mt-0.5 text-[12.5px] text-crm-muted">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}

/* ─── Badge ──────────────────────────────────────────────────────────────── */

const TONES = {
  neutral: "bg-crm-surface-2 text-crm-ink-2 border-crm-line",
  brand: "bg-crm-tint text-crm-brand border-crm-tint-2",
  amber: "bg-[#FEF6E7] text-[#B54708] border-[#FDE7C2] dark:bg-[#2B2010] dark:text-[#FDB022] dark:border-[#4A3510]",
  green: "bg-[#ECFDF3] text-[#067647] border-[#ABEFC6] dark:bg-[#0E2A1C] dark:text-[#47CD89] dark:border-[#164A30]",
  blue: "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF] dark:bg-[#0F2236] dark:text-[#53B1FD] dark:border-[#16385A]",
  red: "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA] dark:bg-[#2D1414] dark:text-[#F97066] dark:border-[#4E1D1D]",
  grey: "bg-[#F2F4F7] text-[#475467] border-[#E4E7EC] dark:bg-[#22252B] dark:text-[#98A2B3] dark:border-[#333741]",
  purple: "bg-[#F4F3FF] text-[#5925DC] border-[#D9D6FE] dark:bg-[#1E1838] dark:text-[#9B8AFB] dark:border-[#2E2560]",
} as const;
export type Tone = keyof typeof TONES;

export function Badge({ tone = "neutral", children, className, dot }: { tone?: Tone; children: React.ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium leading-5 whitespace-nowrap", TONES[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function CountPill({ n, className }: { n: number; className?: string }) {
  if (!n) return null;
  return <span className={cn("min-w-[20px] h-5 px-1.5 rounded-full bg-crm-brand text-white text-[11px] font-semibold grid place-items-center tabular", className)}>{n > 99 ? "99+" : n}</span>;
}

/* ─── Form controls ──────────────────────────────────────────────────────── */

const fieldBase =
  "w-full rounded-[8px] border border-crm-line bg-crm-surface text-crm-ink placeholder:text-crm-muted/80 text-[13.5px] transition-colors focus:outline-none focus:border-crm-brand focus:ring-2 focus:ring-crm-brand/15 disabled:opacity-60";

export function Field({ label, hint, error, required, children, className }: { label?: React.ReactNode; hint?: React.ReactNode; error?: string | null; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      {label && (
        <span className="mb-1.5 block text-[12.5px] font-medium text-crm-ink-2">
          {label}
          {required && <span className="text-crm-brand"> *</span>}
        </span>
      )}
      {children}
      {error ? <span className="mt-1 block text-[12px] text-[#D92D20]">{error}</span> : hint ? <span className="mt-1 block text-[12px] text-crm-muted">{hint}</span> : null}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { icon?: Icon }>(function Input({ className, icon: I, ...rest }, ref) {
  if (I)
    return (
      <span className="relative block">
        <I size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-crm-muted" />
        <input ref={ref} className={cn(fieldBase, "h-9 ps-9 pe-3", className)} {...rest} />
      </span>
    );
  return <input ref={ref} className={cn(fieldBase, "h-9 px-3", className)} {...rest} />;
});

export function SearchInput({ value, onChange, placeholder = "Search…", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return <Input icon={MagnifyingGlass} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={className} type="search" />;
}

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn(fieldBase, "min-h-[84px] px-3 py-2 resize-y", className)} {...rest} />;
});

export interface Option {
  value: string;
  label: string;
}

export function Select({ value, onChange, options, placeholder, className, disabled }: { value: string | undefined; onChange: (v: string) => void; options: Option[] | readonly Option[]; placeholder?: string; className?: string; disabled?: boolean }) {
  return (
    <select
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(fieldBase, "h-9 ps-3 pe-8 appearance-none bg-[length:16px] bg-no-repeat bg-[right_10px_center] rtl:bg-[left_10px_center]", className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256' fill='%238A8690'%3E%3Cpath d='M213.66 101.66l-80 80a8 8 0 01-11.32 0l-80-80a8 8 0 0111.32-11.32L128 164.69l74.34-74.35a8 8 0 0111.32 11.32z'/%3E%3C/svg%3E\")" }}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function NumberInput({ value, onChange, money, min, step, className, placeholder, suffix }: { value: number | undefined; onChange: (v: number) => void; money?: boolean; min?: number; step?: number; className?: string; placeholder?: string; suffix?: string }) {
  return (
    <span className={cn("relative block", className)}>
      {money && <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-crm-muted text-[13px]">৳</span>}
      <input
        type="number"
        inputMode="decimal"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        className={cn(fieldBase, "h-9 tabular", money ? "ps-7 pe-3" : "px-3", suffix && "pe-12")}
      />
      {suffix && <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-crm-muted text-[12px]">{suffix}</span>}
    </span>
  );
}

export function Checkbox({ checked, onChange, label, description, disabled, className }: { checked: boolean; onChange: (v: boolean) => void; label?: React.ReactNode; description?: React.ReactNode; disabled?: boolean; className?: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn("flex items-start gap-2.5 cursor-pointer select-none", disabled && "opacity-60 cursor-not-allowed", className)}>
      <input id={id} type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className={cn("mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-crm-brand/30", checked ? "bg-crm-brand border-crm-brand" : "bg-crm-surface border-crm-line")}>
        {checked && (
          <svg viewBox="0 0 16 16" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <m.path d="M3.5 8.5l3 3 6-7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.25 }} />
          </svg>
        )}
      </span>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-[13.5px] text-crm-ink">{label}</span>}
          {description && <span className="block text-[12px] text-crm-muted">{description}</span>}
        </span>
      )}
    </label>
  );
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn("inline-flex items-center gap-2 text-[13px] text-crm-ink-2 disabled:opacity-50")}
    >
      <span className={cn("relative h-5 w-9 rounded-full transition-colors", checked ? "bg-crm-brand" : "bg-crm-line")}>
        <m.span layout className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow", checked ? "end-0.5" : "start-0.5")} transition={{ type: "spring", stiffness: 600, damping: 35 }} />
      </span>
      {label}
    </button>
  );
}

export function Segmented<T extends string>({ value, onChange, options, className, size = "md" }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode; icon?: Icon }[]; className?: string; size?: "sm" | "md" }) {
  const id = useId();
  return (
    <div className={cn("inline-flex rounded-[8px] border border-crm-line bg-crm-surface-2 p-0.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        const I = o.icon;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} className={cn("relative inline-flex items-center gap-1.5 rounded-[6px] font-medium transition-colors", size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-8 px-3 text-[13px]", active ? "text-crm-ink" : "text-crm-muted hover:text-crm-ink")}>
            {active && <m.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-[6px] bg-crm-surface shadow-sm border border-crm-line" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            <span className="relative inline-flex items-center gap-1.5">
              {I && <I size={15} />}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Avatar ─────────────────────────────────────────────────────────────── */

export function Avatar({ name, color = "#E24F5F", size = 28, className }: { name: string; color?: string; size?: number; className?: string }) {
  return (
    <span className={cn("inline-grid shrink-0 place-items-center rounded-full font-semibold text-white", className)} style={{ width: size, height: size, background: color, fontSize: Math.max(10, size * 0.38) }} title={name}>
      {initials(name)}
    </span>
  );
}

/* ─── Skeleton / Empty / Page header ─────────────────────────────────────── */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("crm-skeleton h-4", className)} />;
}

export function EmptyState({ icon: I, title, description, action, className }: { icon: Icon; title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center px-6 py-14", className)}>
      <m.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-crm-tint text-crm-brand">
        <I size={34} weight="duotone" />
      </m.div>
      <p className="text-[15px] font-semibold text-crm-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-crm-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-[#FECDCA] bg-[#FEF3F2] px-5 py-4 text-[13px] text-[#B42318] flex items-center justify-between gap-3">
      <span>{message ?? "Couldn't load this data."}</span>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function PageHeader({ title, description, actions, eyebrow }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; eyebrow?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-crm-brand">{eyebrow}</div>}
        <h1 className="text-[22px] sm:text-[24px] font-bold tracking-[-0.01em] text-crm-ink leading-tight">{title}</h1>
        {description && <p className="mt-1 text-[13.5px] text-crm-muted max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function FilterBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-4 flex flex-wrap items-center gap-2", className)}>{children}</div>;
}

export function Stat({ label, value, hint, className }: { label: React.ReactNode; value: React.ReactNode; hint?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="text-[11.5px] font-medium uppercase tracking-[0.08em] text-crm-muted">{label}</div>
      <div className="mt-0.5 text-[15px] font-semibold text-crm-ink tabular truncate">{value}</div>
      {hint && <div className="text-[12px] text-crm-muted">{hint}</div>}
    </div>
  );
}

export function KeyValue({ items, cols = 2 }: { items: [React.ReactNode, React.ReactNode][]; cols?: 1 | 2 | 3 }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-3", cols === 1 ? "grid-cols-1" : cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3")}>
      {items.map(([k, v], i) => (
        <div key={i} className="min-w-0">
          <dt className="text-[12px] text-crm-muted">{k}</dt>
          <dd className="text-[13.5px] text-crm-ink break-words">{v || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px bg-crm-line", className)} />;
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-crm-line bg-crm-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-crm-muted">{children}</kbd>;
}
