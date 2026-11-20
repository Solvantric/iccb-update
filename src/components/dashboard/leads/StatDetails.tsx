"use client";
import { ArrowRight, ChartLineUp, HourglassMedium, SealCheck, Warning, type Icon } from "@phosphor-icons/react";
import type { Lead, LeadSource, User } from "@/types/crm";
import { LEAD_SOURCE_LABELS, LEAD_STAGE_LABELS, LEAD_STAGES } from "@/types/crm";
import { fmtDate } from "@/lib/crm/format";
import { cn } from "@/lib/utils/cn";
import { Modal } from "../ui/overlay";
import { AvatarStack, isOpen, isOverdue, isWon, lakh, pct, reached, REVENUE, SOURCE_STYLE, SourceIcon, STAGE_ICON, stageColor, sum } from "./shared";

export type StatKind = "conversion" | "booked" | "expected";

export const STAT_META: Record<StatKind, { label: string; icon: Icon; fill: string; tint: string; ink: string }> = {
  conversion: { label: "Conversion", icon: ChartLineUp, fill: "var(--lead-s5, #12B76A)", tint: "color-mix(in srgb, var(--lead-s5, #12B76A) 14%, transparent)", ink: "var(--lead-s5-ink, #067647)" },
  booked: { label: REVENUE.booked.label, icon: SealCheck, fill: "var(--lead-s5, #12B76A)", tint: "color-mix(in srgb, var(--lead-s5, #12B76A) 14%, transparent)", ink: "var(--lead-s5-ink, #067647)" },
  expected: { label: REVENUE.expected.label, icon: HourglassMedium, fill: "var(--lead-s3, #EAB308)", tint: "color-mix(in srgb, var(--lead-s3, #EAB308) 18%, transparent)", ink: "var(--lead-s3-ink, #A16207)" },
};

const SOURCES: LeadSource[] = ["ai", "website", "manual"];

export function StatDetails({ kind, leads, users, onClose, onOpenLead }: { kind: StatKind | null; leads: Lead[]; users: User[]; onClose: () => void; onOpenLead: (id: string) => void }) {
  const meta = kind ? STAT_META[kind] : null;
  const won = leads.filter(isWon);
  const open = leads.filter(isOpen);
  const description = kind === "conversion" ? `${won.length} of ${leads.length} leads became customers` : kind === "booked" ? REVENUE.booked.hint : REVENUE.expected.hint;

  return (
    <Modal
      open={!!kind}
      onOpenChange={(v) => !v && onClose()}
      size="lg"
      title={
        meta && (
          <span className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[9px]" style={{ background: meta.tint, color: meta.ink }}>
              <meta.icon size={17} weight="bold" />
            </span>
            {meta.label}
          </span>
        )
      }
      description={description}
    >
      {kind === "conversion" && <Conversion leads={leads} />}
      {kind === "booked" && <LeadList leads={won} users={users} onOpenLead={onOpenLead} kind="booked" />}
      {kind === "expected" && <Expected leads={open} users={users} onOpenLead={onOpenLead} />}
    </Modal>
  );
}

/* ─── Conversion: step by step + by source ───────────────────────────────── */

function Conversion({ leads }: { leads: Lead[] }) {
  const total = leads.length;
  const counts = LEAD_STAGES.map((s) => reached(leads, s));
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-[13px] font-medium text-crm-muted">Step by step</h3>
        <ol className="space-y-2.5">
          {LEAD_STAGES.map((s, i) => {
            const c = stageColor(i);
            const I = STAGE_ICON[s];
            const lostHere = leads.filter((l) => l.lost && l.stage === s).length;
            return (
              <li key={s} className="grid grid-cols-[28px_1fr_auto] items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-[8px]" style={{ background: c.tint, color: c.ink }}>
                  <I size={14} weight="bold" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2 text-[13px]">
                    <span className="font-medium text-crm-ink">{LEAD_STAGE_LABELS[s]}</span>
                    <span className="tabular text-crm-muted">{i === 0 ? "start" : `${pct(counts[i], counts[i - 1])}% moved on`}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-crm-surface-2">
                    <div className="h-full rounded-full" style={{ width: `${pct(counts[i], total)}%`, background: c.fill }} />
                  </div>
                  {lostHere > 0 && <p className="mt-1 text-[11.5px] text-crm-muted">{lostHere} lost at this step</p>}
                </div>
                <span className="tabular w-10 text-end text-[15px] font-semibold text-crm-ink">{counts[i]}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section>
        <h3 className="mb-3 text-[13px] font-medium text-crm-muted">By source</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          {SOURCES.map((s) => {
            const list = leads.filter((l) => l.source === s);
            const w = list.filter(isWon).length;
            const I = SOURCE_STYLE[s].icon;
            return (
              <div key={s} className="rounded-[10px] border border-crm-line p-3">
                <p className="flex items-center gap-1.5 text-[13px] text-crm-ink-2">
                  <I size={14} weight="bold" /> {LEAD_SOURCE_LABELS[s]}
                </p>
                <p className="tabular mt-1.5 text-[20px] font-semibold text-crm-ink">{pct(w, list.length)}%</p>
                <p className="text-[12px] text-crm-muted">
                  {w} of {list.length} became customers
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ─── Expected revenue: value waiting at each step ───────────────────────── */

function Expected({ leads, users, onOpenLead }: { leads: Lead[]; users: User[]; onOpenLead: (id: string) => void }) {
  const total = sum(leads);
  const overdue = leads.filter(isOverdue);
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-[13px] font-medium text-crm-muted">Where the money is waiting</h3>
        <div className="space-y-2.5">
          {LEAD_STAGES.slice(0, 4).map((s, i) => {
            const list = leads.filter((l) => l.stage === s);
            const v = sum(list);
            const c = stageColor(i);
            return (
              <div key={s} className="grid grid-cols-[96px_1fr_auto] items-center gap-3 text-[13px]">
                <span className="text-crm-ink-2">{LEAD_STAGE_LABELS[s]}</span>
                <div className="h-2 overflow-hidden rounded-full bg-crm-surface-2">
                  <div className="h-full rounded-full" style={{ width: `${pct(v, total)}%`, background: c.fill }} />
                </div>
                <span className="tabular w-36 text-end text-crm-ink">
                  {lakh(v)} <span className="text-crm-muted">· {list.length}</span>
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[12px] text-crm-muted">Leads closer to Confirmed are more likely to turn into booked revenue.</p>
      </section>

      {overdue.length > 0 && (
        <p className="flex items-center gap-2 rounded-[10px] bg-crm-reserved-bg px-3 py-2.5 text-[13px] text-crm-reserved-ink">
          <Warning size={15} weight="bold" />
          {overdue.length} open lead{overdue.length === 1 ? " has" : "s have"} an overdue follow-up, worth {lakh(sum(overdue))}.
        </p>
      )}

      <LeadList leads={leads} users={users} onOpenLead={onOpenLead} kind="expected" />
    </div>
  );
}

/* ─── Shared lead list (biggest first) ───────────────────────────────────── */

function LeadList({ leads, users, onOpenLead, kind }: { leads: Lead[]; users: User[]; onOpenLead: (id: string) => void; kind: "booked" | "expected" }) {
  const rows = [...leads].sort((a, b) => b.value - a.value);
  const total = sum(rows);
  return (
    <section>
      <div className="mb-3 grid grid-cols-3 gap-2">
        <Mini label="Total" value={lakh(total)} />
        <Mini label={kind === "booked" ? "Customers" : "Open leads"} value={String(rows.length)} />
        <Mini label="Average deal" value={lakh(rows.length ? total / rows.length : 0)} />
      </div>
      <h3 className="mb-2 text-[13px] font-medium text-crm-muted">{kind === "booked" ? "Customers, biggest first" : "Open leads, biggest first"}</h3>
      {rows.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-crm-line p-6 text-center text-[13px] text-crm-muted">{kind === "booked" ? "No customers yet." : "No open leads."}</p>
      ) : (
        <ul className="divide-y divide-crm-line rounded-[10px] border border-crm-line">
          {rows.map((l) => (
            <li key={l.id}>
              <button type="button" onClick={() => onOpenLead(l.id)} className="group flex w-full items-center gap-3 px-3 py-2.5 text-start transition-colors hover:bg-crm-surface-2">
                <SourceIcon source={l.source} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-crm-ink">{l.organization ?? l.name}</span>
                  <span className="block truncate text-[12px] text-crm-muted">
                    {kind === "booked" ? `Booked ${l.stageAt.customer ? fmtDate(l.stageAt.customer.slice(0, 10), "d MMM") : ""}${l.bookingRef ? ` · ${l.bookingRef}` : ""}` : `${LEAD_STAGE_LABELS[l.stage]}${isOverdue(l) ? " · follow-up overdue" : ""}`}
                  </span>
                </span>
                {l.ownerIds.length > 0 && <AvatarStack ids={l.ownerIds} users={users} size={22} />}
                <span className={cn("tabular w-20 text-end text-[13.5px] font-medium", kind === "booked" ? "text-crm-success" : "text-crm-ink")}>{lakh(l.value)}</span>
                <ArrowRight size={13} className="text-crm-muted opacity-0 transition-opacity group-hover:opacity-100 rtl:rotate-180" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-crm-surface-2 px-3 py-2.5">
      <p className="text-[11.5px] text-crm-muted">{label}</p>
      <p className="tabular mt-0.5 text-[15px] font-semibold text-crm-ink">{value}</p>
    </div>
  );
}
