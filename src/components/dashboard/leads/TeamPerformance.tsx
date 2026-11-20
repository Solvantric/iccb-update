"use client";
import { useMemo, useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import { ArrowRight, CaretDown, CaretUp, SquaresFour, Table as TableIcon, Trophy, UsersThree, Warning } from "@phosphor-icons/react";
import type { Lead, User } from "@/types/crm";
import { LEAD_STAGE_LABELS, LEAD_STAGES, ROLE_LABELS } from "@/types/crm";
import { cn } from "@/lib/utils/cn";
import { EmptyState, Segmented } from "../ui/core";
import { m } from "../ui/motion";
import { Face, isOpen, isOverdue, isWon, lakh, pct, REVENUE, stageColor, sum } from "./shared";

interface Person {
  user: Pick<User, "id" | "name"> & { role?: User["role"] };
  assigned: number;
  active: number;
  customers: number;
  lost: number;
  conversion: number;
  booked: number;
  expected: number;
  overdue: number;
  avgDays: number | null;
  shared: number;
  /** Active leads per step (Discover … Confirmed). */
  byStage: number[];
}

function useTeam(leads: Lead[], users: User[]): Person[] {
  return useMemo(() => {
    const ids = [...new Set(leads.flatMap((l) => l.ownerIds))];
    return ids
      .map((id) => {
        const mine = leads.filter((l) => l.ownerIds.includes(id));
        const won = mine.filter(isWon);
        const days = won.filter((l) => l.stageAt.customer).map((l) => differenceInCalendarDays(new Date(l.stageAt.customer!), new Date(l.createdAt)));
        const u = users.find((x) => x.id === id);
        return {
          user: u ?? { id, name: "Former staff" },
          assigned: mine.length,
          active: mine.filter(isOpen).length,
          customers: won.length,
          lost: mine.filter((l) => l.lost).length,
          conversion: pct(won.length, mine.length),
          booked: sum(won),
          expected: sum(mine.filter(isOpen)),
          overdue: mine.filter(isOverdue).length,
          avgDays: days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : null,
          shared: mine.filter((l) => l.ownerIds.length > 1).length,
          byStage: LEAD_STAGES.slice(0, 4).map((s) => mine.filter((l) => l.stage === s && !l.lost).length),
        };
      })
      .sort((a, b) => b.customers - a.customers || b.conversion - a.conversion);
  }, [leads, users]);
}

export function TeamPerformance({ leads, users, onPick, onUnassigned }: { leads: Lead[]; users: User[]; onPick: (id: string) => void; onUnassigned: () => void }) {
  const team = useTeam(leads, users);
  const [view, setView] = useState<"cards" | "table">("cards");
  const unassigned = leads.filter((l) => !l.ownerIds.length && isOpen(l)).length;

  if (!team.length)
    return (
      <div className="crm-card">
        <EmptyState icon={UsersThree} text="No one has leads yet. Open a lead and assign it to start tracking performance." />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-crm-muted">
        <p>Shared leads count for everyone working on them. Click a person to see their leads.</p>
        <div className="flex flex-wrap items-center gap-2">
          {unassigned > 0 && (
            <button type="button" onClick={onUnassigned} className="inline-flex items-center gap-1.5 rounded-full bg-crm-reserved-bg px-3 py-1 font-medium text-crm-reserved-ink transition-opacity hover:opacity-80">
              <Warning size={13} weight="bold" />
              {unassigned} open lead{unassigned === 1 ? "" : "s"} not assigned
            </button>
          )}
          <Segmented
            id="team-view"
            value={view}
            onChange={setView}
            options={[
              { value: "cards", label: <span className="inline-flex items-center gap-1.5"><SquaresFour size={14} /> Cards</span> },
              { value: "table", label: <span className="inline-flex items-center gap-1.5"><TableIcon size={14} /> Table</span> },
            ]}
          />
        </div>
      </div>

      {view === "cards" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {team.map((p, i) => (
            <PersonCard key={p.user.id} p={p} top={i === 0 && p.customers > 0} onClick={() => onPick(p.user.id)} delay={i * 0.05} />
          ))}
        </div>
      ) : (
        <TeamTable team={team} onPick={onPick} />
      )}
    </div>
  );
}

function PersonCard({ p, top, onClick, delay }: { p: Person; top: boolean; onClick: () => void; delay: number }) {
  const activeTotal = p.byStage.reduce((a, b) => a + b, 0);
  return (
    <m.button type="button" onClick={onClick} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay } }} className="crm-card crm-card-hover group flex flex-col gap-5 p-5 text-start">
      {/* Who */}
      <div className="flex items-center gap-3">
        <Face user={p.user} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-crm-ink">{p.user.name}</p>
          <p className="text-[12.5px] text-crm-muted">{p.user.role ? ROLE_LABELS[p.user.role] : "Staff"}</p>
        </div>
        {top && (
          <span className="inline-flex items-center gap-1 rounded-full bg-crm-reserved-bg px-2 py-0.5 text-[11.5px] font-medium text-crm-reserved-ink">
            <Trophy size={12} weight="fill" /> Top
          </span>
        )}
      </div>

      {/* Conversion */}
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] text-crm-muted">Conversion</span>
          <span className="tabular text-[22px] font-semibold leading-none text-crm-ink">{p.conversion}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-crm-surface-2">
          <m.div className="h-full origin-left rounded-full bg-crm-success rtl:origin-right" initial={{ scaleX: 0 }} animate={{ scaleX: p.conversion / 100 }} transition={{ duration: 0.6, delay }} />
        </div>
        <p className="mt-1.5 text-[12.5px] text-crm-muted">
          {p.customers} of {p.assigned} leads became customers
        </p>
      </div>

      {/* Counts */}
      <dl className="grid grid-cols-4 gap-2 border-y border-crm-line py-3 text-center">
        {[
          ["Leads", p.assigned],
          ["Active", p.active],
          ["Customers", p.customers],
          ["Lost", p.lost],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-[11.5px] text-crm-muted">{k}</dt>
            <dd className={cn("tabular mt-0.5 text-[16px] font-semibold", k === "Customers" ? "text-crm-success" : "text-crm-ink")}>{v}</dd>
          </div>
        ))}
      </dl>

      {/* Active leads by step */}
      <div>
        <p className="mb-2 text-[12.5px] text-crm-muted">Active leads by step</p>
        <div className="flex h-2 overflow-hidden rounded-full bg-crm-surface-2">{activeTotal > 0 && p.byStage.map((n, k) => n > 0 && <span key={k} style={{ width: `${(n / activeTotal) * 100}%`, background: stageColor(k).fill }} />)}</div>
        <div className="mt-2 grid grid-cols-4 gap-1 text-[11.5px] text-crm-muted">
          {p.byStage.map((n, k) => (
            <span key={k} className="flex items-center gap-1 truncate">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: stageColor(k).fill }} />
              <span className="truncate">{LEAD_STAGE_LABELS[LEAD_STAGES[k]]}</span>
              <span className="tabular ms-auto text-crm-ink-2">{n}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Money */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[10px] bg-crm-success-bg/60 p-3">
          <p className="text-[12px] text-crm-muted">{REVENUE.booked.label}</p>
          <p className="tabular mt-1 text-[16px] font-semibold text-crm-success">{lakh(p.booked)}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-crm-muted">From {p.customers} customer{p.customers === 1 ? "" : "s"}</p>
        </div>
        <div className="rounded-[10px] bg-crm-surface-2 p-3">
          <p className="text-[12px] text-crm-muted">{REVENUE.expected.label}</p>
          <p className="tabular mt-1 text-[16px] font-semibold text-crm-ink">{lakh(p.expected)}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-crm-muted">From {p.active} open lead{p.active === 1 ? "" : "s"}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-crm-muted">
        <span className={cn(p.overdue > 0 && "font-medium text-crm-danger")}>
          {p.overdue} overdue follow-up{p.overdue === 1 ? "" : "s"}
        </span>
        <span>{p.avgDays != null ? `~${p.avgDays} days to win` : "No wins yet"}</span>
        {p.shared > 0 && <span>{p.shared} shared</span>}
        <span className="ms-auto inline-flex items-center gap-1 font-medium text-crm-brand-text opacity-0 transition-opacity group-hover:opacity-100">
          View leads <ArrowRight size={13} className="rtl:rotate-180" />
        </span>
      </div>
    </m.button>
  );
}

/* ─── Table view: every person side by side, sortable ────────────────────── */

type SortKey = "name" | "assigned" | "active" | "customers" | "lost" | "conversion" | "booked" | "expected" | "overdue" | "avgDays";

const COLS: { key: SortKey; label: string; hint?: string; align?: "end" }[] = [
  { key: "name", label: "Employee" },
  { key: "assigned", label: "Leads", align: "end" },
  { key: "active", label: "Active", align: "end" },
  { key: "customers", label: "Customers", align: "end" },
  { key: "lost", label: "Lost", align: "end" },
  { key: "conversion", label: "Conversion" },
  { key: "booked", label: REVENUE.booked.label, hint: REVENUE.booked.hint, align: "end" },
  { key: "expected", label: REVENUE.expected.label, hint: REVENUE.expected.hint, align: "end" },
  { key: "overdue", label: "Overdue", hint: "Open leads with a late follow-up", align: "end" },
  { key: "avgDays", label: "Days to win", hint: "Average days from new lead to customer", align: "end" },
];

function TeamTable({ team, onPick }: { team: Person[]; onPick: (id: string) => void }) {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "customers", desc: true });
  const val = (p: Person, k: SortKey) => (k === "name" ? p.user.name : k === "avgDays" ? (p.avgDays ?? Infinity) : p[k]);
  const rows = [...team].sort((a, b) => {
    const x = val(a, sort.key);
    const y = val(b, sort.key);
    const c = typeof x === "string" ? x.localeCompare(y as string) : (x as number) - (y as number);
    return sort.desc ? -c : c;
  });
  const top = team[0]?.customers ? team[0].user.id : null;
  const totals = {
    assigned: team.reduce((t, p) => t + p.assigned, 0),
    customers: team.reduce((t, p) => t + p.customers, 0),
  };

  return (
    <div className="crm-card overflow-hidden">
      <div className="crm-scroll overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-[13.5px]">
          <thead>
            <tr className="border-b border-crm-line">
              {COLS.map((c) => {
                const on = sort.key === c.key;
                return (
                  <th key={c.key} title={c.hint} className={cn("h-11 px-4 text-[12.5px] font-medium text-crm-muted", c.align === "end" ? "text-end" : "text-start")}>
                    <button type="button" onClick={() => setSort({ key: c.key, desc: on ? !sort.desc : c.key !== "name" })} className={cn("inline-flex items-center gap-1 transition-colors hover:text-crm-ink", on && "text-crm-ink")}>
                      {c.label}
                      {on ? sort.desc ? <CaretDown size={11} weight="bold" /> : <CaretUp size={11} weight="bold" /> : null}
                    </button>
                  </th>
                );
              })}
              <th className="px-4 text-start text-[12.5px] font-medium text-crm-muted">Active by step</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const activeTotal = p.byStage.reduce((a, b) => a + b, 0);
              return (
                <tr key={p.user.id} onClick={() => onPick(p.user.id)} className="h-14 cursor-pointer border-b border-crm-line transition-colors last:border-0 hover:bg-crm-surface-2/70" title={`Show ${p.user.name}'s leads`}>
                  <td className="px-4">
                    <span className="flex items-center gap-2.5">
                      <Face user={p.user} size={30} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 font-medium text-crm-ink">
                          {p.user.name}
                          {top === p.user.id && <Trophy size={13} weight="fill" className="text-crm-reserved" aria-label="Top performer" />}
                        </span>
                        <span className="block text-[12px] text-crm-muted">{p.user.role ? ROLE_LABELS[p.user.role] : "Staff"}{p.shared ? ` · ${p.shared} shared` : ""}</span>
                      </span>
                    </span>
                  </td>
                  <td className="tabular px-4 text-end text-crm-ink-2">{p.assigned}</td>
                  <td className="tabular px-4 text-end text-crm-ink-2">{p.active}</td>
                  <td className="tabular px-4 text-end font-semibold" style={{ color: stageColor(4).ink }}>{p.customers}</td>
                  <td className="tabular px-4 text-end text-crm-muted">{p.lost}</td>
                  <td className="px-4">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-crm-surface-2">
                        <span className="block h-full rounded-full" style={{ width: `${p.conversion}%`, background: stageColor(4).fill }} />
                      </span>
                      <span className="tabular text-crm-ink">{p.conversion}%</span>
                    </span>
                  </td>
                  <td className="tabular px-4 text-end font-medium" style={{ color: stageColor(4).ink }}>{lakh(p.booked)}</td>
                  <td className="tabular px-4 text-end text-crm-ink">{lakh(p.expected)}</td>
                  <td className={cn("tabular px-4 text-end", p.overdue ? "font-medium text-crm-danger" : "text-crm-muted")}>{p.overdue}</td>
                  <td className="tabular px-4 text-end text-crm-ink-2">{p.avgDays ?? "—"}</td>
                  <td className="px-4">
                    <span className="flex h-2 w-28 overflow-hidden rounded-full bg-crm-surface-2" title={LEAD_STAGES.slice(0, 4).map((s, k) => `${LEAD_STAGE_LABELS[s]}: ${p.byStage[k]}`).join(" · ")}>
                      {activeTotal > 0 && p.byStage.map((n, k) => n > 0 && <span key={k} style={{ width: `${(n / activeTotal) * 100}%`, background: stageColor(k).fill }} />)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-crm-line bg-crm-surface-2/50 text-[12.5px] text-crm-muted">
              <td className="px-4 py-3">Team ({team.length})</td>
              <td colSpan={COLS.length} className="px-4 py-3">
                {totals.customers} customers from {totals.assigned} assignments. Shared leads appear under each person, so totals can be higher than the number of leads.
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
