"use client";
import { useMemo, useState } from "react";
import { subDays } from "date-fns";
import { ClipboardText, MapPin } from "@phosphor-icons/react";
import type { Lead, LeadStage, LeadStepLog, LeadStepOutcome, User } from "@/types/crm";
import { IN_PERSON_MODES, LEAD_STAGE_LABELS, LEAD_STAGES, LEAD_STEP_OUTCOMES } from "@/types/crm";
import { useCurrentUser } from "@/lib/crm/db";
import { timeAgo } from "@/lib/crm/format";
import { cn } from "@/lib/utils/cn";
import { EmptyState, Segmented } from "../ui/core";
import { FilterSelect } from "../ui/filters";
import { assignees, Face, stageColor } from "./shared";
import { OutcomePill } from "./LeadJourney";

type Row = LeadStepLog & { lead: Lead };

/**
 * Every journey update across all leads: who did what, where, at which step.
 * Admins see the whole team; everyone else sees their own work.
 */
export function WorkLog({ leads, users, onOpenLead }: { leads: Lead[]; users: User[]; onOpenLead: (id: string) => void }) {
  const me = useCurrentUser();
  const admin = me.role === "admin";
  const [person, setPerson] = useState(admin ? "" : me.id);
  const [stage, setStage] = useState("");
  const [outcome, setOutcome] = useState("");
  const [days, setDays] = useState<"7" | "30" | "all">("30");

  const all = useMemo<Row[]>(() => leads.flatMap((l) => (l.journey ?? []).map((j) => ({ ...j, lead: l }))).sort((a, b) => b.at.localeCompare(a.at)), [leads]);
  const since = days === "all" ? "" : subDays(new Date(), Number(days)).toISOString();
  const inPeriod = all.filter((r) => !since || r.at >= since);
  const rows = inPeriod.filter((r) => (!person || r.byId === person) && (!stage || r.stage === stage) && (!outcome || r.outcome === outcome));

  const team = assignees(users);
  const people = (admin ? team : team.filter((u) => u.id === me.id)).map((u) => {
    const mine = inPeriod.filter((r) => r.byId === u.id);
    return { u, updates: mine.length, visits: mine.filter((r) => IN_PERSON_MODES.includes(r.mode)).length, leads: new Set(mine.map((r) => r.lead.id)).size, good: mine.filter((r) => r.outcome === "positive").length };
  });
  const most = Math.max(1, ...people.map((p) => p.updates));

  return (
    <div className="space-y-4">
      {/* Per-person summary */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {people.map((p) => {
          const on = person === p.u.id;
          return (
            <button key={p.u.id} type="button" aria-pressed={on} onClick={() => admin && setPerson(on ? "" : p.u.id)} className={cn("crm-card flex items-start gap-3 p-4 text-start transition-colors", admin && "hover:bg-crm-surface-2", on && "ring-2 ring-crm-brand")}>
              <Face user={p.u} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-crm-ink">{p.u.name}</span>
                <span className="mt-0.5 block text-[12px] text-crm-muted">
                  {p.updates} update{p.updates === 1 ? "" : "s"} · {p.visits} visit{p.visits === 1 ? "" : "s"} · {p.leads} lead{p.leads === 1 ? "" : "s"}
                </span>
                <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-crm-surface-2">
                  <span className="block h-full rounded-full bg-crm-success" style={{ width: `${(p.updates / most) * 100}%` }} />
                </span>
                <span className="mt-1 block text-[11.5px] text-crm-muted">{p.updates ? `${Math.round((p.good / p.updates) * 100)}% went well` : "No updates in this period"}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {admin && <FilterSelect label="People" value={person} onChange={setPerson} all="Everyone" options={team.map((u) => ({ value: u.id, label: u.name }))} />}
        <FilterSelect label="Step" value={stage} onChange={setStage} all="All steps" options={LEAD_STAGES.map((s) => ({ value: s, label: LEAD_STAGE_LABELS[s] }))} />
        <FilterSelect label="Result" value={outcome} onChange={setOutcome} all="Any result" options={(Object.keys(LEAD_STEP_OUTCOMES) as LeadStepOutcome[]).map((o) => ({ value: o, label: LEAD_STEP_OUTCOMES[o] }))} />
        <Segmented
          id="worklog-days"
          value={days}
          onChange={setDays}
          options={[
            { value: "7", label: "7d" },
            { value: "30", label: "30d" },
            { value: "all", label: "All" },
          ]}
        />
        <span className="text-[12.5px] text-crm-muted sm:ms-auto">
          {rows.length} update{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="crm-card">
          <EmptyState icon={ClipboardText} text="No updates match. Open a lead and use “Add update” in its journey to log calls, visits and quotations." />
        </div>
      ) : (
        <ul className="crm-card divide-y divide-crm-line">
          {rows.slice(0, 200).map((r) => {
            const user = users.find((u) => u.id === r.byId) ?? { id: r.byId ?? r.by, name: r.by };
            const c = stageColor(r.stage as LeadStage);
            return (
              <li key={`${r.lead.id}-${r.id}`}>
                <button type="button" onClick={() => onOpenLead(r.lead.id)} className="flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-crm-surface-2">
                  <Face user={user} size={30} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[13.5px] font-medium text-crm-ink">{r.action}</span>
                      <span className="inline-flex h-5 items-center rounded-full px-2 text-[11.5px] font-medium" style={{ background: c.tint, color: c.ink }}>
                        {LEAD_STAGE_LABELS[r.stage]}
                      </span>
                      <OutcomePill outcome={r.outcome} />
                    </span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-crm-ink-2">
                      {r.lead.organization ?? r.lead.name} · {r.lead.eventName}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-crm-muted">
                      {r.by} · {r.mode}
                      {r.place && (
                        <>
                          {" · "}
                          <MapPin size={11} className="inline -mt-px" /> {r.place}
                        </>
                      )}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-[12.5px] text-crm-ink-2">{r.note}</span>
                  </span>
                  <span className="shrink-0 text-[12px] text-crm-muted" title={new Date(r.at).toLocaleString()}>
                    {timeAgo(r.at)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
