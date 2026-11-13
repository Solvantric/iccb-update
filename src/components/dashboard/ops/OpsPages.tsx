"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { CalendarCheck, CheckCircle, ClipboardText, Clock, FileText, ShieldWarning, Star, Users, Warning, ChatCircleText } from "@phosphor-icons/react";
import type { Booking } from "@/types/crm";
import { DAMAGE_DEPARTMENTS } from "@/types/crm";
import { useCurrentUser } from "@/lib/crm/db";
import { can } from "@/lib/crm/permissions";
import { firstEventDate, lastEventDate, parseYmd } from "@/lib/crm/pricing";
import { EVALUATION_CRITERIA, isDocOverdue, ppmDueDate } from "@/lib/crm/rules";
import { fmtDate, fmtTime, taka, takaShort, todayYmd } from "@/lib/crm/format";
import { useBookings, useHalls } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { Item, Stagger } from "../ui/motion";
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader, Segmented, Skeleton } from "../ui/core";
import { DataTable, type Column } from "../ui/data-table";
import { Drawer } from "../ui/overlay";
import { KpiCard, ProgressRing } from "../ui/kpi";
import { AreaTrend, Bars, Donut } from "../ui/charts";
import { Tabs } from "../ui/tabs";
import { StatusPill } from "../ui/status";
import { PpmForm } from "../ppm/PpmForm";
import { FactSheetForm } from "./FactSheetForm";
import { DamageForm, EvaluationForm } from "./FeedbackForms";

type Panel = { b: Booking; kind: "ppm" | "fact" | "damage" | "evaluation" } | null;

function OpsDrawer({ panel, onClose, readonly }: { panel: Panel; onClose: () => void; readonly: boolean }) {
  if (!panel) return null;
  const { b, kind } = panel;
  const title = { ppm: "PPM Minutes", fact: "Program Fact Sheet", damage: "Damage claim", evaluation: "Evaluation of Service" }[kind];
  return (
    <Drawer open onOpenChange={(v) => !v && onClose()} title={title} description={`${b.bfNo} · ${b.eventTitle}`} width={880}>
      {kind === "ppm" && <PpmForm b={b} readonly={readonly} onSaved={onClose} />}
      {kind === "fact" && <FactSheetForm b={b} readonly={readonly} onSaved={onClose} />}
      {kind === "damage" && <DamageForm b={b} readonly={readonly} />}
      {kind === "evaluation" && <EvaluationForm b={b} readonly={readonly} />}
    </Drawer>
  );
}

/* ─── Events board ───────────────────────────────────────────────────────── */

export function EventsBoardPage() {
  const bookings = useBookings();
  const halls = useHalls();
  const me = useCurrentUser();
  const [range, setRange] = useState<"today" | "week" | "upcoming">("week");
  const [panel, setPanel] = useState<Panel>(null);
  const today = todayYmd();
  const readonly = !can(me.role, "update", "events");

  const events = useMemo(() => {
    const end = range === "today" ? today : format(addDays(new Date(), range === "week" ? 7 : 45), "yyyy-MM-dd");
    return (bookings.data ?? [])
      .filter((b) => !b.closed && b.status !== "requested" && lastEventDate(b) >= today && firstEventDate(b) <= end)
      .sort((a, b) => firstEventDate(a).localeCompare(firstEventDate(b)));
  }, [bookings.data, range, today]);

  const byDay = useMemo(() => {
    const m = new Map<string, Booking[]>();
    for (const b of events) {
      const d = firstEventDate(b) < today ? today : firstEventDate(b);
      m.set(d, [...(m.get(d) ?? []), b]);
    }
    return [...m.entries()];
  }, [events, today]);

  const hallName = (id: string) => halls.data?.find((h) => h.id === id)?.name ?? "—";
  const warn = (b: Booking) => {
    const w: string[] = [];
    const overdue = b.documents.filter((d) => isDocOverdue(d, today));
    if (overdue.length) w.push(`${overdue.length} document${overdue.length > 1 ? "s" : ""} overdue`);
    const pend = b.documents.filter((d) => d.state === "pending" && !isDocOverdue(d, today)).length;
    if (pend) w.push(`${pend} pending`);
    if (!b.ppm?.done) w.push("PPM not done");
    return w;
  };

  return (
    <Stagger>
      <Item>
        <PageHeader
          eyebrow="Operations"
          title="Event-day board"
          description="Confirmed events per day and hall. Open the PPM, fill the Program Fact Sheet and record damages."
          actions={<Segmented value={range} onChange={setRange} options={[{ value: "today", label: "Today" }, { value: "week", label: "This week" }, { value: "upcoming", label: "Upcoming" }]} />}
        />
      </Item>
      <Item>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Events in range" value={events.length} icon={CalendarCheck} loading={bookings.isLoading} />
          <KpiCard label="Expected guests" value={events.reduce((s, b) => s + b.guests.optimum, 0)} icon={Users} tone="blue" loading={bookings.isLoading} />
          <KpiCard label="PPM pending" value={events.filter((b) => !b.ppm?.done).length} icon={ClipboardText} tone="amber" loading={bookings.isLoading} />
          <KpiCard label="Docs overdue" value={events.reduce((s, b) => s + b.documents.filter((d) => isDocOverdue(d, today)).length, 0)} icon={Warning} tone="brand" loading={bookings.isLoading} />
        </div>
      </Item>
      <Item>
        {bookings.isLoading ? (
          <Skeleton className="h-96 rounded-xl" />
        ) : byDay.length === 0 ? (
          <Card>
            <EmptyState icon={CalendarCheck} title="No confirmed events in this range" />
          </Card>
        ) : (
          <div className="space-y-6">
            {byDay.map(([day, list]) => (
              <section key={day}>
                <h3 className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-crm-ink">
                  {day === today ? <Badge tone="brand">Today</Badge> : <Badge tone="neutral">{differenceInCalendarDays(parseYmd(day), new Date())} days</Badge>}
                  {fmtDate(day, "EEEE, dd MMM yyyy")}
                </h3>
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {list.map((b) => {
                    const w = warn(b);
                    const day0 = b.days.find((d) => d.date === day) ?? b.days[0];
                    return (
                      <Card key={b.id} className="flex flex-col p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link href={`/dashboard/sales/bookings/${b.id}`} className="block truncate text-[14.5px] font-semibold text-crm-ink hover:text-crm-brand">
                              {b.eventTitle}
                            </Link>
                            <p className="text-[12px] text-crm-muted">
                              {hallName(day0.hallId)} · {fmtTime(day0.start)}–{fmtTime(day0.end)} · {b.guests.optimum} guests
                            </p>
                          </div>
                          <StatusPill status={b.status} size="sm" />
                        </div>
                        {w.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {w.map((x) => (
                              <Badge key={x} tone={x.includes("overdue") ? "red" : "amber"}>
                                {x.includes("overdue") && <Warning size={11} weight="fill" />} {x}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 flex items-center gap-1 text-[12px] text-[#067647]">
                            <CheckCircle size={14} weight="fill" /> Documents & PPM complete
                          </p>
                        )}
                        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-crm-line pt-3">
                          <Button size="sm" variant={b.ppm?.done ? "soft" : "secondary"} icon={ClipboardText} onClick={() => setPanel({ b, kind: "ppm" })}>
                            PPM
                          </Button>
                          <Button size="sm" variant={b.factSheet?.done ? "soft" : "secondary"} icon={FileText} onClick={() => setPanel({ b, kind: "fact" })}>
                            Fact sheet
                          </Button>
                          <Button size="sm" variant={b.damage?.done ? "soft" : "secondary"} icon={ShieldWarning} onClick={() => setPanel({ b, kind: "damage" })}>
                            Damage
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </Item>
      <OpsDrawer key={panel ? `${panel.b.id}-${panel.kind}` : "none"} panel={panel} onClose={() => setPanel(null)} readonly={readonly} />
    </Stagger>
  );
}

/* ─── PPM ────────────────────────────────────────────────────────────────── */

interface PpmRow {
  id: string;
  createdAt: string;
  b: Booking;
  event: string;
  due: string;
  state: "done" | "scheduled" | "due" | "upcoming";
}

export function PpmPage() {
  const bookings = useBookings();
  const me = useCurrentUser();
  const [panel, setPanel] = useState<Panel>(null);
  const [filter, setFilter] = useState<"all" | PpmRow["state"]>("all");
  const today = todayYmd();
  const soon = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const rows = useMemo<PpmRow[] | undefined>(() => {
    if (!bookings.data) return undefined;
    return bookings.data
      .filter((b) => !b.closed && b.status === "confirmed")
      .map((b) => {
        const event = firstEventDate(b);
        const due = ppmDueDate(event);
        const state: PpmRow["state"] = b.ppm?.done ? "done" : b.ppm ? "scheduled" : due <= soon ? "due" : "upcoming";
        return { id: b.id, createdAt: b.createdAt, b, event, due, state };
      })
      .filter((r) => filter === "all" || r.state === filter);
  }, [bookings.data, filter, soon]);

  const tone = { done: "green", scheduled: "blue", due: "red", upcoming: "neutral" } as const;
  const columns: Column<PpmRow>[] = [
    { id: "event", header: "Event", primary: true, pinned: true, value: (r) => r.b.eventTitle, cell: (r) => <div><p className="font-semibold text-crm-ink">{r.b.eventTitle}</p><p className="text-[12px] text-crm-muted">{r.b.bfNo} · {r.b.contact.name}</p></div> },
    { id: "date", header: "Event date", value: (r) => r.event, cell: (r) => fmtDate(r.event) },
    { id: "due", header: "PPM due by", value: (r) => r.due, cell: (r) => <span className={cn(r.due < today && r.state !== "done" && "font-semibold text-[#D92D20]")}>{fmtDate(r.due)}</span> },
    { id: "ppm", header: "PPM date", value: (r) => r.b.ppm?.date ?? "", cell: (r) => (r.b.ppm ? fmtDate(r.b.ppm.date) : "—") },
    { id: "state", header: "Status", value: (r) => r.state, cell: (r) => <Badge tone={tone[r.state]}>{r.state === "due" ? "Due / overdue" : r.state}</Badge> },
    { id: "filled", header: "Agenda filled", align: "end", value: (r) => Object.values(r.b.ppm?.agenda ?? {}).filter(Boolean).length, cell: (r) => <span className="tabular">{Object.values(r.b.ppm?.agenda ?? {}).filter(Boolean).length}/24</span> },
  ];

  return (
    <Stagger>
      <Item>
        <PageHeader eyebrow="Operations" title="Program Preparation Meetings" description="Every confirmed booking needs a PPM at least 15 days before the event, using the fixed 24-item agenda." />
      </Item>
      <Item>
        <div className="mb-4">
          <Segmented size="sm" value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, { value: "due", label: "Due" }, { value: "scheduled", label: "Scheduled" }, { value: "upcoming", label: "Upcoming" }, { value: "done", label: "Done" }]} />
        </div>
      </Item>
      <Item>
        <DataTable rows={rows} loading={bookings.isLoading} columns={columns} initialSort={{ id: "due", dir: "asc" }} onRowClick={(r) => setPanel({ b: r.b, kind: "ppm" })} exportName="iccb-ppm" empty={{ icon: ClipboardText, title: "No PPMs in this view" }} />
      </Item>
      <OpsDrawer key={panel ? `${panel.b.id}-${panel.kind}` : "none"} panel={panel} onClose={() => setPanel(null)} readonly={!can(me.role, "update", "ppm")} />
    </Stagger>
  );
}

/* ─── Quality ────────────────────────────────────────────────────────────── */

export function QualityPage() {
  const bookings = useBookings();
  const halls = useHalls();
  const me = useCurrentUser();
  const [tab, setTab] = useState<"evaluations" | "damage">("evaluations");
  const [panel, setPanel] = useState<Panel>(null);
  const evaluated = useMemo(() => (bookings.data ?? []).filter((b) => b.evaluation).sort((a, b) => b.evaluation!.submittedAt.localeCompare(a.evaluation!.submittedAt)), [bookings.data]);
  const damaged = useMemo(() => (bookings.data ?? []).filter((b) => b.damage?.done), [bookings.data]);

  const avg = evaluated.length ? Math.round(evaluated.reduce((s, b) => s + b.evaluation!.score, 0) / evaluated.length) : 0;
  const perCriterion = EVALUATION_CRITERIA.map((c, i) => {
    const vals = evaluated.map((b) => b.evaluation!.ratings[i + 1]).filter((v) => v !== undefined);
    return { criterion: c.length > 22 ? `${c.slice(0, 21)}…` : c, score: vals.length ? Math.round((vals.reduce<number>((s, v) => s + v, 0) / (vals.length * 3)) * 100) : 0 };
  });
  const months = [...new Set(evaluated.map((b) => b.evaluation!.submittedAt.slice(0, 7)))].sort();
  const hallIds = [...new Set(evaluated.map((b) => b.days[0]?.hallId))].filter(Boolean) as string[];
  const trend = months.map((mo) => {
    const row: Record<string, string | number> = { month: format(parseYmd(`${mo}-01`), "MMM yy") };
    for (const h of hallIds) {
      const list = evaluated.filter((b) => b.evaluation!.submittedAt.startsWith(mo) && b.days[0]?.hallId === h);
      if (list.length) row[h] = Math.round(list.reduce((s, b) => s + b.evaluation!.score, 0) / list.length);
    }
    return row;
  });
  const deptTotals = DAMAGE_DEPARTMENTS.map((d) => ({ name: d, value: damaged.reduce((s, b) => s + (b.damage?.rows ?? []).filter((r) => r.department === d).reduce((x, r) => x + r.qty * r.rate, 0), 0) }));
  const damageTotal = deptTotals.reduce((s, d) => s + d.value, 0);

  return (
    <Stagger>
      <Item>
        <PageHeader eyebrow="Operations" title="Quality" description="Client evaluations (14 criteria, score 0–100) and damage claims deducted from security money." />
      </Item>
      <Item>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Average score" value={avg} format={(n) => `${Math.round(n)}/100`} icon={Star} tone="green" loading={bookings.isLoading} />
          <KpiCard label="Evaluations" value={evaluated.length} icon={ChatCircleText} tone="blue" loading={bookings.isLoading} />
          <KpiCard label="Damage claims" value={damaged.filter((b) => !b.damage?.noDamage).length} icon={ShieldWarning} tone="amber" loading={bookings.isLoading} />
          <KpiCard label="Deducted from security" value={damageTotal} format={(n) => takaShort(n)} icon={Clock} tone="brand" loading={bookings.isLoading} />
        </div>
      </Item>
      <Item>
        <Tabs tabs={[{ value: "evaluations", label: "Evaluations", icon: Star, count: evaluated.length }, { value: "damage", label: "Damage claims", icon: ShieldWarning, count: damaged.length }]} value={tab} onChange={setTab} className="mb-5" />
      </Item>
      {tab === "evaluations" ? (
        <>
          <Item>
            <div className="mb-5 grid gap-5 xl:grid-cols-2">
              <Card>
                <CardHeader title="Score per criterion" description="Average across all evaluations (0–100)." />
                <div className="px-3 pb-4">
                  <Bars data={perCriterion} x="criterion" series={[{ key: "score", label: "Score" }]} horizontal height={420} />
                </div>
              </Card>
              <Card>
                <CardHeader title="Score per hall over time" />
                <div className="px-3 pb-4">
                  <AreaTrend data={trend} x="month" series={hallIds.map((h) => ({ key: h, label: halls.data?.find((x) => x.id === h)?.name ?? h }))} height={420} />
                </div>
              </Card>
            </div>
          </Item>
          <Item>
            <Card>
              <CardHeader title="Comments" description="Latest client feedback." />
              <ul className="divide-y divide-crm-line">
                {evaluated.slice(0, 20).map((b) => (
                  <li key={b.id} className="flex items-start gap-4 px-5 py-3.5">
                    <ProgressRing value={b.evaluation!.score} size={42} color={b.evaluation!.score >= 75 ? "#12B76A" : b.evaluation!.score >= 50 ? "#F59E0B" : "#D92D20"} label={String(b.evaluation!.score)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-crm-ink">{b.eventTitle}</p>
                      <p className="text-[12px] text-crm-muted">
                        {b.contact.name} · {fmtDate(b.evaluation!.submittedAt)} · {b.evaluation!.submittedVia === "public" ? "client form" : "staff"}
                      </p>
                      {b.evaluation!.suggestion && <p className="mt-1 text-[13px] italic text-crm-ink-2">“{b.evaluation!.suggestion}”</p>}
                    </div>
                    <Button size="sm" onClick={() => setPanel({ b, kind: "evaluation" })}>
                      Open
                    </Button>
                  </li>
                ))}
                {!evaluated.length && <EmptyState icon={Star} title="No evaluations yet" />}
              </ul>
            </Card>
          </Item>
        </>
      ) : (
        <Item>
          <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Card>
              <CardHeader title="By department" />
              <div className="px-5 pb-5">
                <Donut data={deptTotals} format={(n) => taka(n)} center={<div><p className="text-[11px] text-crm-muted">Total</p><p className="text-[15px] font-bold text-crm-ink">{takaShort(damageTotal)}</p></div>} />
              </div>
            </Card>
            <Card>
              <CardHeader title="Claims" description="Each total is deducted from the event's security money." />
              <ul className="divide-y divide-crm-line">
                {damaged.map((b) => {
                  const total = (b.damage?.rows ?? []).reduce((s, r) => s + r.qty * r.rate, 0);
                  return (
                    <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-medium text-crm-ink">{b.eventTitle}</p>
                        <p className="text-[12px] text-crm-muted">
                          {b.bfNo} · certified by {b.damage?.certifiedBy || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {b.damage?.noDamage ? <Badge tone="green">No damage</Badge> : <span className="font-semibold text-crm-ink tabular">{taka(total)}</span>}
                        <Button size="sm" onClick={() => setPanel({ b, kind: "damage" })}>
                          Open
                        </Button>
                      </div>
                    </li>
                  );
                })}
                {!damaged.length && <EmptyState icon={ShieldWarning} title="No damage claims" />}
              </ul>
            </Card>
          </div>
        </Item>
      )}
      <OpsDrawer key={panel ? `${panel.b.id}-${panel.kind}` : "none"} panel={panel} onClose={() => setPanel(null)} readonly={!can(me.role, "update", "quality")} />
    </Stagger>
  );
}
