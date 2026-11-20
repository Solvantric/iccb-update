"use client";
import { useMemo, useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import { CaretRight, Plus, Tray } from "@phosphor-icons/react";
import type { Lead, LeadSource, LeadStage } from "@/types/crm";
import { LEAD_SOURCE_LABELS, LEAD_STAGE_HINTS, LEAD_STAGE_LABELS, LEAD_STAGES } from "@/types/crm";
import { useLeads, useUsers } from "@/lib/crm/hooks";
import { fmtDate, num, todayYmd } from "@/lib/crm/format";
import { assignLead } from "@/services/crm";
import { cn } from "@/lib/utils/cn";
import { Button, EmptyState, PageHeader, SearchInput } from "../ui/core";
import { DataTable, RowActions, Tabs, type Column } from "../ui/data";
import { FilterSelect, FilterSummary, SortSelect, useFilters } from "../ui/filters";
import { AnimatedNumber, m } from "../ui/motion";
import { LeadDrawer } from "../leads/LeadDrawer";
import { AddLeadModal } from "../leads/AddLeadModal";
import { TeamPerformance } from "../leads/TeamPerformance";
import { STAT_META, StatDetails, type StatKind } from "../leads/StatDetails";
import { AssignPicker, assignees, AvatarStack, isOpen, isOverdue, isWon, lakh, pct, reached, SOURCE_STYLE, SourceIcon, STAGE_ICON, stageColor, StageDots, sum } from "../leads/shared";

const SOURCES: LeadSource[] = ["ai", "website", "manual"];

export function LeadsPage() {
  const leads = useLeads();
  const users = useUsers();
  const [tab, setTab] = useState<"leads" | "team">("leads");
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [stat, setStat] = useState<StatKind | null>(null);
  const { f, set, reset, active } = useFilters({ q: "", stage: "", source: "", owner: "", status: "", sort: "newest" });

  // The funnel follows the source and person filters, so it can show one channel's or one person's funnel.
  const byOwner = useMemo(() => leads.filter((l) => !f.owner || (f.owner === "none" ? !l.ownerIds.length : l.ownerIds.includes(f.owner))), [leads, f.owner]);
  const base = useMemo(() => byOwner.filter((l) => !f.source || l.source === f.source), [byOwner, f.source]);

  const rows = useMemo(() => {
    const n = f.q.trim().toLowerCase();
    const list = base.filter(
      (l) =>
        (!f.stage || l.stage === f.stage) &&
        (!f.status || (f.status === "open" ? isOpen(l) : f.status === "won" ? isWon(l) : f.status === "lost" ? !!l.lost : isOverdue(l))) &&
        (!n || [l.name, l.organization, l.mobile, l.eventName, l.code].join(" ").toLowerCase().includes(n))
    );
    return [...list].sort((a, b) =>
      f.sort === "follow"
        ? (isOpen(a) && a.nextAt ? a.nextAt : "9999").localeCompare(isOpen(b) && b.nextAt ? b.nextAt : "9999")
        : f.sort === "value"
          ? b.value - a.value
          : f.sort === "stage"
            ? LEAD_STAGES.indexOf(b.stage) - LEAD_STAGES.indexOf(a.stage)
            : b.createdAt.localeCompare(a.createdAt)
    );
  }, [base, f]);

  const team = assignees(users);

  const columns: Column<Lead>[] = [
    {
      key: "lead",
      header: "Lead",
      className: "max-w-[320px]",
      cell: (l) => (
        <span className="block min-w-0 py-2.5">
          <span className="flex items-center gap-2">
            <SourceIcon source={l.source} />
            <span className="truncate font-medium text-crm-ink">{l.organization ?? l.name}</span>
          </span>
          <span className="mt-0.5 block truncate ps-7 text-[12.5px] text-crm-muted">
            {l.eventName} · {num(l.guests)} guests
          </span>
        </span>
      ),
    },
    { key: "stage", header: "Step", cell: (l) => <StageDots lead={l} /> },
    {
      key: "owner",
      header: "Assigned to",
      cell: (l) => (
        <RowActions className="justify-start">
          <AssignPicker value={l.ownerIds} users={users} onChange={(ids) => assignLead(l.id, ids)} />
        </RowActions>
      ),
    },
    { key: "next", header: "Next follow-up", cell: (l) => <FollowUp lead={l} /> },
    { key: "value", header: "Value", align: "end", cell: (l) => <span className={cn("tabular", isWon(l) ? "font-medium text-crm-success" : l.lost ? "text-crm-muted" : "text-crm-ink")}>{lakh(l.value)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Leads"
        description="Every lead, from first contact to customer."
        action={
          <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>
            Add lead
          </Button>
        }
      />

      <Funnel leads={base} stage={f.stage as LeadStage | ""} onStage={(s) => set("stage", f.stage === s ? "" : s)} onStat={setStat} />

      <Tabs
        id="leads"
        value={tab}
        onChange={setTab}
        className="mb-5"
        tabs={[
          { value: "leads", label: "Leads" },
          { value: "team", label: "Team performance" },
        ]}
      />

      {/* Source filter: shared by both tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SourceChip label="All sources" count={byOwner.length} on={!f.source} onClick={() => set("source", "")} />
        {SOURCES.map((s) => {
          const list = byOwner.filter((l) => l.source === s);
          return <SourceChip key={s} source={s} label={LEAD_SOURCE_LABELS[s]} count={list.length} title={`${SOURCE_STYLE[s].hint} · ${pct(list.filter(isWon).length, list.length)}% became customers`} on={f.source === s} onClick={() => set("source", f.source === s ? "" : s)} />;
        })}
      </div>

      {tab === "leads" ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2.5">
            <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Search name, company, event…" />
            <FilterSelect label="People" value={f.owner} onChange={(v) => set("owner", v)} all="Everyone" options={[{ value: "none", label: "Not assigned" }, ...team.map((u) => ({ value: u.id, label: u.name }))]} />
            <FilterSelect label="Status" value={f.status} onChange={(v) => set("status", v)} all="Any status" options={[{ value: "open", label: "Open" }, { value: "overdue", label: "Follow-up overdue" }, { value: "won", label: "Customers" }, { value: "lost", label: "Lost" }]} />
            <SortSelect value={f.sort} onChange={(v) => set("sort", v)} options={[{ value: "newest", label: "Newest first" }, { value: "follow", label: "Follow-up (soonest)" }, { value: "value", label: "Highest value" }, { value: "stage", label: "Furthest step" }]} className="sm:ms-auto" />
          </div>
          <FilterSummary active={active} onClear={reset} count={rows.length} noun={f.stage ? `lead at ${LEAD_STAGE_LABELS[f.stage as LeadStage]}` : "lead"} plural={f.stage ? `leads at ${LEAD_STAGE_LABELS[f.stage as LeadStage]}` : undefined} />
          <DataTable
            rows={rows}
            columns={columns}
            onRowClick={(l) => setOpenId(l.id)}
            empty={<EmptyState icon={Tray} text={active ? "No leads match these filters." : "No leads yet. Add one, or wait for the website and AI search to bring some in."} action={<Button onClick={() => setAdding(true)}>Add lead</Button>} />}
            mobileCard={(l) => (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2">
                  <SourceIcon source={l.source} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-crm-ink">{l.organization ?? l.name}</p>
                    <p className="truncate text-[13px] text-crm-muted">{l.eventName}</p>
                  </div>
                  <span className="tabular text-[13px] text-crm-ink">{lakh(l.value)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <StageDots lead={l} />
                  {l.ownerIds.length ? <AvatarStack ids={l.ownerIds} users={users} size={22} /> : <span className="text-[12.5px] text-crm-muted">Not assigned</span>}
                </div>
                <FollowUp lead={l} />
              </div>
            )}
          />
        </>
      ) : (
        <TeamPerformance
          leads={leads.filter((l) => !f.source || l.source === f.source)}
          users={users}
          onPick={(id) => {
            set("owner", id);
            setTab("leads");
          }}
          onUnassigned={() => {
            set("owner", "none");
            set("status", "open");
            setTab("leads");
          }}
        />
      )}

      <LeadDrawer lead={leads.find((l) => l.id === openId)} onClose={() => setOpenId(null)} />
      <StatDetails
        kind={stat}
        leads={base}
        users={users}
        onClose={() => setStat(null)}
        onOpenLead={(id) => {
          setStat(null);
          setOpenId(id);
        }}
      />
      <AddLeadModal open={adding} onOpenChange={setAdding} onCreated={setOpenId} />
    </>
  );
}

function SourceChip({ source, label, count, on, onClick, title }: { source?: LeadSource; label: string; count: number; on: boolean; onClick: () => void; title?: string }) {
  const I = source ? SOURCE_STYLE[source].icon : null;
  return (
    <button type="button" onClick={onClick} aria-pressed={on} title={title} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors", on ? "bg-crm-ink text-crm-surface" : "bg-crm-surface text-crm-ink-2 ring-1 ring-inset ring-crm-line hover:bg-crm-surface-2")}>
      {I && <I size={13} weight="bold" />}
      {label}
      <span className={cn("tabular text-[12px]", on ? "opacity-70" : "text-crm-muted")}>{count}</span>
    </button>
  );
}

/* ─── Funnel ─────────────────────────────────────────────────────────────── */

function Funnel({ leads, stage, onStage, onStat }: { leads: Lead[]; stage: LeadStage | ""; onStage: (s: LeadStage) => void; onStat: (k: StatKind) => void }) {
  const total = leads.length;
  const counts = LEAD_STAGES.map((s) => reached(leads, s));
  const here = LEAD_STAGES.map((s) => leads.filter((l) => l.stage === s && !l.lost).length);
  const won = leads.filter(isWon);
  const open = leads.filter(isOpen);
  const drops = counts.slice(1).map((c, i) => ({ from: i, lost: counts[i] - c }));
  const worst = drops.reduce((a, b) => (b.lost > a.lost ? b : a), drops[0]);

  return (
    <section className="crm-card mb-6">
      {/* Summary */}
      <div className="grid gap-3 border-b border-crm-line p-3 sm:grid-cols-3">
        <Stat kind="conversion" onClick={onStat} value={<AnimatedNumber value={pct(won.length, total)} format={(n) => `${Math.round(n)}%`} />} hint={`${won.length} of ${total} leads became customers`} progress={pct(won.length, total)} />
        <Stat kind="booked" onClick={onStat} value={lakh(sum(won))} hint={`From ${won.length} customer${won.length === 1 ? "" : "s"}`} />
        <Stat kind="expected" onClick={onStat} value={lakh(sum(open))} hint={`From ${open.length} open lead${open.length === 1 ? "" : "s"}, not booked yet`} />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-2 gap-1 p-3 sm:grid-cols-5">
        {LEAD_STAGES.map((s, i) => {
          const on = stage === s;
          const last = i === 4;
          const I = STAGE_ICON[s];
          const c = stageColor(i);
          return (
            <button
              key={s}
              type="button"
              onClick={() => onStage(s)}
              aria-pressed={on}
              title={`${LEAD_STAGE_HINTS[s]} · ${pct(counts[i], total)}% of all leads reached this step · ${here[i]} here now. Click to list them.`}
              className={cn("rounded-[10px] p-3 text-start transition-colors", !on && "hover:bg-crm-surface-2", last && "col-span-2 sm:col-span-1")}
              style={on ? { background: c.tint } : undefined}
            >
              <span className="flex items-center gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] transition-colors" style={on ? { background: c.fill, color: "#fff" } : { background: c.tint, color: c.ink }}>
                  <I size={15} weight={on ? "fill" : "bold"} />
                </span>
                <span className={cn("text-[13px]", on ? "font-medium text-crm-ink" : "text-crm-muted")}>{LEAD_STAGE_LABELS[s]}</span>
              </span>
              <AnimatedNumber value={counts[i]} className="mt-2 block text-[26px] font-semibold leading-tight text-crm-ink" />
              <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-crm-surface-2">
                <m.span className="block h-full origin-left rounded-full rtl:origin-right" style={{ width: "100%", background: c.fill }} initial={{ scaleX: 0 }} animate={{ scaleX: total ? counts[i] / total : 0 }} transition={{ duration: 0.6, delay: i * 0.06 }} />
              </span>
              <span className="tabular mt-2 block text-[12px] text-crm-muted">{i === 0 ? "All leads" : `${pct(counts[i], counts[i - 1])}% moved on`}</span>
            </button>
          );
        })}
      </div>

      {worst && worst.lost > 0 && (
        <p className="border-t border-crm-line px-5 py-3 text-[12.5px] text-crm-muted">
          Most leads drop between <span className="text-crm-ink-2">{LEAD_STAGE_LABELS[LEAD_STAGES[worst.from]]}</span> and <span className="text-crm-ink-2">{LEAD_STAGE_LABELS[LEAD_STAGES[worst.from + 1]]}</span> ({worst.lost} leads). Click a step to see its leads.
        </p>
      )}
    </section>
  );
}

function Stat({ kind, value, hint, progress, onClick }: { kind: StatKind; value: React.ReactNode; hint: string; progress?: number; onClick: (k: StatKind) => void }) {
  const m = STAT_META[kind];
  const I = m.icon;
  return (
    <button type="button" onClick={() => onClick(kind)} className="group flex items-start gap-3.5 rounded-[12px] p-3.5 text-start transition-colors hover:bg-crm-surface-2" title="Click to see details">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px]" style={{ background: m.tint, color: m.ink }}>
        <I size={22} weight="duotone" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2 text-[13px] text-crm-muted">
          {m.label}
          <span className="inline-flex items-center gap-0.5 text-[12px] font-medium text-crm-brand-text opacity-0 transition-opacity group-hover:opacity-100">
            Details <CaretRight size={11} weight="bold" className="rtl:rotate-180" />
          </span>
        </span>
        <span className="tabular mt-0.5 block text-[24px] font-semibold leading-tight" style={{ color: kind === "conversion" ? m.ink : undefined }}>
          {value}
        </span>
        {progress != null && (
          <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-crm-surface-2">
            <span className="block h-full rounded-full" style={{ width: `${progress}%`, background: m.fill }} />
          </span>
        )}
        <span className="mt-1 block truncate text-[12px] text-crm-muted">{hint}</span>
      </span>
    </button>
  );
}

function FollowUp({ lead }: { lead: Lead }) {
  if (!isOpen(lead) || !lead.nextAt) return <span className="text-[13px] text-crm-muted">{lead.lost ? lead.lostReason : isWon(lead) ? "Converted" : "—"}</span>;
  const d = differenceInCalendarDays(new Date(`${lead.nextAt}T00:00:00`), new Date(`${todayYmd()}T00:00:00`));
  const when = d < 0 ? `${-d} day${d === -1 ? "" : "s"} late` : d === 0 ? "Today" : d === 1 ? "Tomorrow" : fmtDate(lead.nextAt, "d MMM");
  return (
    <span className="block min-w-0">
      <span className={cn("block text-[13px]", d < 0 ? "font-medium text-crm-danger" : d === 0 ? "font-medium text-crm-reserved-ink" : "text-crm-ink-2")}>{when}</span>
      {lead.nextAction && <span className="block max-w-[180px] truncate text-[12px] text-crm-muted">{lead.nextAction}</span>}
    </span>
  );
}
