"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { Binoculars, CalendarCheck, ChatsCircle, Check, ClipboardText, Globe, Handshake, Sparkle, UserPlus, type Icon } from "@phosphor-icons/react";
import type { Lead, LeadSource, LeadStage, User } from "@/types/crm";
import { LEAD_SOURCE_LABELS, LEAD_STAGE_LABELS, LEAD_STAGES } from "@/types/crm";
import { initials, todayYmd } from "@/lib/crm/format";
import { TEAM_PHOTOS } from "@/lib/crm/photos";
import { cn } from "@/lib/utils/cn";
import { m } from "../ui/motion";

/* ─── Words used across the Leads pages ──────────────────────────────────── */

/** Plain-language names for the two money figures. */
export const REVENUE = {
  booked: { label: "Booked revenue", hint: "Value of leads that became customers" },
  expected: { label: "Expected revenue", hint: "Estimated value of open leads, not booked yet" },
};

/* ─── Source ─────────────────────────────────────────────────────────────── */

export const SOURCE_STYLE: Record<LeadSource, { pill: string; icon: Icon; hint: string }> = {
  ai: { pill: "bg-crm-purple-bg text-crm-purple-ink", icon: Sparkle, hint: "Found by AI on the web" },
  website: { pill: "bg-crm-info-bg text-crm-info-ink", icon: Globe, hint: "Booking form on the website" },
  manual: { pill: "bg-crm-surface-2 text-crm-ink-2", icon: UserPlus, hint: "Added by staff" },
};

export function SourcePill({ source, className }: { source: LeadSource; className?: string }) {
  const s = SOURCE_STYLE[source];
  const I = s.icon;
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium", s.pill, className)}>
      <I size={12} weight="bold" />
      {LEAD_SOURCE_LABELS[source]}
    </span>
  );
}

/** Small round source icon, used next to a lead's name. */
export function SourceIcon({ source }: { source: LeadSource }) {
  const s = SOURCE_STYLE[source];
  const I = s.icon;
  return (
    <span title={`${LEAD_SOURCE_LABELS[source]} · ${s.hint}`} className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full", s.pill)}>
      <I size={11} weight="bold" />
      <span className="sr-only">{LEAD_SOURCE_LABELS[source]}</span>
    </span>
  );
}

/* ─── Stage ──────────────────────────────────────────────────────────────── */

/** Each step has its own colour, going from red (new) to green (customer). */
// Theme variables (globals.css) with the light-mode colour as a fallback, so the
// steps keep their colour even if the CSS variables are missing.
const STAGE_FILL = ["var(--lead-s1, #EF4444)", "var(--lead-s2, #F97316)", "var(--lead-s3, #EAB308)", "var(--lead-s4, #84CC16)", "var(--lead-s5, #12B76A)"];
const STAGE_INK = ["var(--lead-s1-ink, #C81E1E)", "var(--lead-s2-ink, #C2410C)", "var(--lead-s3-ink, #A16207)", "var(--lead-s4-ink, #4D7C0F)", "var(--lead-s5-ink, #067647)"];
export const stageColor = (s: LeadStage | number) => {
  const i = typeof s === "number" ? s : LEAD_STAGES.indexOf(s);
  return { fill: STAGE_FILL[i], ink: STAGE_INK[i], tint: `color-mix(in srgb, ${STAGE_FILL[i]} 15%, transparent)` };
};

export const STAGE_ICON: Record<LeadStage, Icon> = {
  discover: Binoculars,
  interested: ChatsCircle,
  appraisal: ClipboardText,
  confirmed: CalendarCheck,
  customer: Handshake,
};

/** Stage name + five dots showing how far along the funnel the lead is. */
export function StageDots({ lead, className }: { lead: Lead; className?: string }) {
  const at = LEAD_STAGES.indexOf(lead.stage);
  const won = lead.stage === "customer";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex gap-[3px]" aria-hidden>
        {LEAD_STAGES.map((s, i) => (
          <span key={s} className={cn("h-1.5 w-2.5 rounded-full", (i > at || lead.lost) && (i > at ? "bg-crm-line" : "bg-crm-muted/50"))} style={i <= at && !lead.lost ? { background: stageColor(i).fill } : undefined} />
        ))}
      </span>
      <span className={cn("whitespace-nowrap text-[13px]", lead.lost ? "text-crm-muted" : won ? "font-medium" : "text-crm-ink-2")} style={won && !lead.lost ? { color: stageColor(4).ink } : undefined}>{lead.lost ? "Lost" : LEAD_STAGE_LABELS[lead.stage]}</span>
    </span>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

export const isOpen = (l: Lead) => !l.lost && l.stage !== "customer";
export const isOverdue = (l: Lead) => isOpen(l) && !!l.nextAt && l.nextAt < todayYmd();
export const isWon = (l: Lead) => l.stage === "customer";

/** Leads that reached a stage (a lead at Appraisal also counts in Discover and Interested). */
export function reached(leads: Lead[], stage: LeadStage) {
  const i = LEAD_STAGES.indexOf(stage);
  return leads.filter((l) => LEAD_STAGES.indexOf(l.stage) >= i).length;
}

export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
export const sum = (leads: Lead[]) => leads.reduce((t, l) => t + l.value, 0);

/** People a lead can be assigned to. */
export const assignees = (users: User[]) => users.filter((u) => u.active && (u.role === "sales" || u.role === "admin"));

/** Compact BDT: ৳ 18.5 L / ৳ 2.1 Cr. */
export function lakh(n: number) {
  if (n >= 10_000_000) return `৳ ${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `৳ ${(n / 100_000).toFixed(1)} L`;
  return `৳ ${Math.round(n).toLocaleString("en-IN")}`;
}

/* ─── People ─────────────────────────────────────────────────────────────── */

const TONES = ["bg-crm-info-bg text-crm-info-ink", "bg-crm-purple-bg text-crm-purple-ink", "bg-crm-reserved-bg text-crm-reserved-ink", "bg-crm-success-bg text-crm-success", "bg-crm-surface-2 text-crm-ink-2"];
const tone = (id: string) => TONES[[...id].reduce((t, c) => t + c.charCodeAt(0), 0) % TONES.length];

export { TEAM_PHOTOS };

export function Face({ user, size = 24, className, style }: { user: Pick<User, "id" | "name">; size?: number; className?: string; style?: React.CSSProperties }) {
  const photo = TEAM_PHOTOS[user.id];
  if (photo)
    return (
      <span title={user.name} className={cn("relative block shrink-0 overflow-hidden rounded-full bg-crm-surface-2 ring-2 ring-crm-surface", className)} style={{ width: size, height: size, ...style }}>
        <Image src={photo} alt={user.name} width={size * 2} height={size * 2} className="h-full w-full object-cover" />
      </span>
    );
  return (
    <span title={user.name} className={cn("relative grid shrink-0 place-items-center rounded-full font-semibold ring-2 ring-crm-surface", tone(user.id), className)} style={{ width: size, height: size, fontSize: size * 0.38, ...style }}>
      {initials(user.name)}
    </span>
  );
}

/** Overlapping faces for the people on a lead. */
export function AvatarStack({ ids, users, size = 24, max = 3 }: { ids: string[]; users: User[]; size?: number; max?: number }) {
  const people = ids.map((id) => users.find((u) => u.id === id) ?? { id, name: "Former staff" });
  return (
    <span className="flex items-center">
      {people.slice(0, max).map((u, i) => (
        // Earlier faces sit on top so their initials stay readable.
        <Face key={u.id} user={u} size={size} className={i > 0 ? "-ms-1" : ""} style={{ zIndex: max - i }} />
      ))}
      {people.length > max && (
        <span className="-ms-1.5 grid place-items-center rounded-full bg-crm-surface-2 text-[11px] font-medium text-crm-muted ring-2 ring-crm-surface" style={{ width: size, height: size }}>
          +{people.length - max}
        </span>
      )}
    </span>
  );
}

/**
 * Pick one or more employees for a lead. The list opens in a portal so it is
 * never clipped by a scrolling table.
 */
export function AssignPicker({ value, onChange, users, variant = "compact" }: { value: string[]; onChange: (ids: string[]) => void; users: User[]; variant?: "compact" | "field" }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  // Inside a modal or drawer the list must live in the dialog, or the dialog blocks clicks on it.
  const [host, setHost] = useState<HTMLElement | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const team = assignees(users);
  const names = value.map((id) => users.find((u) => u.id === id)?.name ?? "Former staff");

  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const width = 240;
    setPos({ top: r.bottom + 6, left: Math.min(Math.max(8, r.left), window.innerWidth - width - 8) });
    setHost(btn.current.closest<HTMLElement>('[role="dialog"]') ?? document.body);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !btn.current?.contains(e.target as Node) && !list.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onScroll = (e: Event) => !list.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "inline-flex items-center gap-2 rounded-[8px] text-start transition-colors",
          variant === "field" ? "h-10 w-full border border-crm-line bg-crm-surface px-3 hover:border-crm-muted/50" : "-ms-1.5 h-8 px-1.5 hover:bg-crm-surface-2",
          !value.length && "text-crm-muted"
        )}
      >
        {value.length ? (
          <>
            <AvatarStack ids={value} users={users} size={26} />
            <span className="min-w-0 truncate text-[13px] text-crm-ink-2">{value.length === 1 ? names[0] : variant === "field" ? names.join(", ") : `${value.length} people`}</span>
          </>
        ) : (
          <>
            <span className="grid h-6 w-6 place-items-center rounded-full border border-dashed border-crm-muted/60">
              <UserPlus size={12} />
            </span>
            <span className="text-[13px]">Assign</span>
          </>
        )}
      </button>
      {host &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <m.div
                ref={list}
                role="listbox"
                aria-multiselectable
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
                style={{ top: pos.top, left: pos.left, width: 240 }}
                className="crm fixed z-[90] rounded-[10px] border border-crm-line bg-crm-surface p-1 shadow-[var(--crm-shadow-lg)]"
              >
                <p className="px-2.5 pt-1.5 pb-1 text-[12px] text-crm-muted">Assign to one or more people</p>
                {team.map((u) => {
                  const on = value.includes(u.id);
                  return (
                    <button key={u.id} type="button" role="option" aria-selected={on} onClick={() => toggle(u.id)} className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-start text-[13.5px] text-crm-ink-2 transition-colors hover:bg-crm-surface-2">
                      <Face user={u} size={26} />
                      <span className="min-w-0 flex-1 truncate">{u.name}</span>
                      <span className={cn("grid h-4 w-4 place-items-center rounded-[4px] border", on ? "border-crm-brand bg-crm-brand text-white" : "border-crm-line")}>{on && <Check size={11} weight="bold" />}</span>
                    </button>
                  );
                })}
                {value.length > 0 && (
                  <button type="button" onClick={() => onChange([])} className="mt-1 w-full rounded-[8px] border-t border-crm-line px-2.5 py-2 text-start text-[13px] text-crm-muted hover:text-crm-ink">
                    Remove everyone
                  </button>
                )}
              </m.div>
            )}
          </AnimatePresence>,
          host
        )}
    </>
  );
}
