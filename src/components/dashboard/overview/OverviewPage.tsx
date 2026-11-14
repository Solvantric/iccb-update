"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { addDays, format, startOfMonth, subMonths } from "date-fns";
import {
  ArrowRight,
  CalendarCheck,
  CalendarPlus,
  ChartLineUp,
  CheckCircle,
  Circle,
  ClipboardText,
  Clock,
  Crosshair,
  CurrencyCircleDollar,
  Fire,
  HandCoins,
  Hourglass,
  Kanban,
  Receipt,
  SealCheck,
  Timer,
  TrendUp,
  Users,
  Warning,
} from "@phosphor-icons/react";
import type { Booking, Role } from "@/types/crm";
import { ROLE_LABELS, STATUS_LABELS } from "@/types/crm";
import { getSettings, useCurrentUser } from "@/lib/crm/db";
import { seesOnlyOwn } from "@/lib/crm/permissions";
import { firstEventDate, lastEventDate } from "@/lib/crm/pricing";
import { isDocOverdue, ppmDueDate } from "@/lib/crm/rules";
import { STATUS_COLORS } from "@/lib/crm/workflow";
import { ago, fmtDate, fmtDateTime, taka, takaShort } from "@/lib/crm/format";
import { decideDiscount, decideShift, estimateFor } from "@/services/crm/bookings.service";
import { completeTask } from "@/services/crm/sales.service";
import { useAnalytics, useBookings, useCrmAction, useHalls, useLeads, usePayments, useRadar, useTasks } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { Item, Stagger } from "../ui/motion";
import { Badge, Button, Card, CardHeader, EmptyState, Skeleton } from "../ui/core";
import { KpiCard, ProgressRing } from "../ui/kpi";
import { AreaTrend, Funnel } from "../ui/charts";
import { StatusPill } from "../ui/status";
import { RoiWidget } from "../features/Roi";
import { EventsAtRisk } from "../features/Readiness";

const pctDelta = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : a ? 100 : 0);

function useOverviewData() {
  const me = useCurrentUser();
  const bookings = useBookings();
  const payments = usePayments();
  const tasks = useTasks();
  const leads = useLeads();
  const radar = useRadar();
  const analytics = useAnalytics();
  const halls = useHalls();
  const [now] = useState(() => new Date());

  const data = useMemo(() => {
    const today = format(now, "yyyy-MM-dd");
    const nowIso = now.toISOString();
    const in7 = format(addDays(now, 7), "yyyy-MM-dd");
    const own = seesOnlyOwn(me.role);
    const all = (bookings.data ?? []).filter((b) => !own || b.assignedTo === me.id);
    const live = all.filter((b) => !b.closed);
    const ps = payments.data ?? [];
    const monthKey = (d: Date) => format(d, "yyyy-MM");
    const thisMonth = monthKey(now);
    const lastMonth = monthKey(subMonths(now, 1));
    const collected = (m: string) => ps.filter((p) => p.date.startsWith(m)).reduce((s, p) => s + p.amount, 0);

    const revenue = Array.from({ length: 6 }, (_, i) => {
      const d = startOfMonth(subMonths(now, 5 - i));
      const k = monthKey(d);
      const booked = live.filter((b) => b.status !== "requested" && firstEventDate(b).startsWith(k)).reduce((s, b) => s + estimateFor(b, ps.filter((p) => p.bookingId === b.id)).grandTotal, 0);
      return { month: format(d, "MMM"), collected: collected(k), booked };
    });

    const upcoming = live.filter((b) => b.status !== "requested" && lastEventDate(b) >= today && firstEventDate(b) <= in7).sort((a, b) => firstEventDate(a).localeCompare(firstEventDate(b)));
    const approvals = live.filter((b) => b.discount.approval === "pending" || b.shiftRequest?.status === "pending");
    const myTasks = (tasks.data ?? []).filter((t) => t.status === "open" && t.assignedTo === me.id && t.dueAt.slice(0, 10) <= today).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    const overdueTasks = (tasks.data ?? []).filter((t) => t.status === "open" && t.dueAt < nowIso && (!own || t.assignedTo === me.id));
    const overdueDocs = live.filter((b) => b.status === "confirmed").flatMap((b) => b.documents.filter((d) => isDocOverdue(d, today)).map((d) => ({ b, d })));
    const awaitingResponse = live.filter((b) => b.status === "requested" && !b.firstResponseAt);
    const hot = (leads.data ?? []).filter((l) => l.score >= getSettings().hotLeadScore && (l.stage === "new" || l.stage === "contacted")).sort((a, b) => b.score - a.score);
    const funnel = (["requested", "confirmed", "completed"] as const).map((s) => ({ label: STATUS_LABELS[s], value: all.filter((b) => b.status === s && !b.closed).length }));
    const closedLost = all.filter((b) => b.closed).length;
    const ppmDue = live.filter((b) => b.status === "confirmed" && !b.ppm?.done && firstEventDate(b) >= today && ppmDueDate(firstEventDate(b)) <= in7);
    const factPending = live.filter((b) => b.status === "confirmed" && firstEventDate(b) <= today && !b.factSheet?.done);
    const refundsDue = all.filter((b) => b.refund && !b.refund.refundedAt).sort((a, b) => a.refund!.dueDate.localeCompare(b.refund!.dueDate));
    const outstanding = live.filter((b) => b.status !== "requested").reduce((s, b) => s + Math.max(0, estimateFor(b, ps.filter((p) => p.bookingId === b.id)).balance), 0);
    const visits = (analytics.data ?? []).filter((e) => e.type === "visit");
    const visits30 = visits.filter((e) => e.at >= addDays(now, -30).toISOString()).length;
    const visitsPrev = visits.filter((e) => e.at >= addDays(now, -60).toISOString() && e.at < addDays(now, -30).toISOString()).length;
    const visitSpark = Array.from({ length: 14 }, (_, i) => visits.filter((e) => e.at.slice(0, 10) === format(addDays(now, i - 13), "yyyy-MM-dd")).length);
    const confirmedThis = all.filter((b) => b.approvedAt?.startsWith(thisMonth)).length;
    const confirmedLast = all.filter((b) => b.approvedAt?.startsWith(lastMonth)).length;
    const respTimes = all.filter((b) => b.firstResponseAt).map((b) => (new Date(b.firstResponseAt!).getTime() - new Date(b.createdAt).getTime()) / 3600000);
    const avgResp = respTimes.length ? respTimes.reduce((s, x) => s + x, 0) / respTimes.length : 0;

    return {
      today,
      nowIso,
      live,
      revenue,
      upcoming,
      approvals,
      myTasks,
      overdueTasks,
      overdueDocs,
      awaitingResponse,
      hot,
      funnel,
      closedLost,
      ppmDue,
      factPending,
      refundsDue,
      outstanding,
      collectedThis: collected(thisMonth),
      collectedDelta: pctDelta(collected(thisMonth), collected(lastMonth)),
      confirmedThis,
      confirmedDelta: pctDelta(confirmedThis, confirmedLast),
      requested: live.filter((b) => b.status === "requested").length,
      visits30,
      visitsDelta: pctDelta(visits30, visitsPrev),
      visitSpark,
      radarNew: (radar.data ?? []).filter((r) => r.isNew || r.status === "new").length,
      leadsOpen: (leads.data ?? []).filter((l) => l.stage !== "confirmed" && l.stage !== "lost").length,
      avgResp,
      revSpark: revenue.map((r) => r.collected),
      eventsToday: live.filter((b) => b.status !== "requested" && b.days.some((d) => d.date === today)),
    };
  }, [bookings.data, payments.data, tasks.data, leads.data, radar.data, analytics.data, me, now]);

  return { me, data, halls: halls.data ?? [], loading: bookings.isLoading || payments.isLoading || tasks.isLoading };
}

/* ─── Widgets ────────────────────────────────────────────────────────────── */

function UpcomingEvents({ list, hallName }: { list: Booking[]; hallName: (id: string) => string }) {
  return (
    <Card>
      <CardHeader icon={CalendarCheck} title="Upcoming events (7 days)" action={<Link href="/dashboard/sales/calendar" className="text-[12.5px] font-medium text-crm-brand hover:underline">Calendar</Link>} />
      {list.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No events this week" className="py-8" />
      ) : (
        <ul className="divide-y divide-crm-line px-5 pb-3">
          {list.slice(0, 7).map((b) => (
            <li key={b.id}>
              <Link href={`/dashboard/sales/bookings/${b.id}`} className="flex items-center gap-3 py-2.5 hover:text-crm-brand">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-crm-tint text-center leading-none text-crm-brand">
                  <span className="text-[16px] font-bold">{fmtDate(firstEventDate(b), "dd")}</span>
                  <span className="text-[10px] uppercase">{fmtDate(firstEventDate(b), "MMM")}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-crm-ink">{b.eventTitle}</span>
                  <span className="text-[12px] text-crm-muted">
                    {hallName(b.days[0]?.hallId)} · {b.guests.optimum} guests
                  </span>
                </span>
                <StatusPill status={b.status} size="sm" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Approvals({ list }: { list: Booking[] }) {
  const disc = useCrmAction((a: { id: string; ok: boolean }) => decideDiscount(a.id, a.ok), { success: "Decision saved" });
  const shift = useCrmAction((a: { id: string; ok: boolean }) => decideShift(a.id, a.ok), { success: "Decision saved" });
  return (
    <Card>
      <CardHeader icon={SealCheck} title="Pending approvals" description="Discounts above the threshold and date shifts." />
      {list.length === 0 ? (
        <EmptyState icon={SealCheck} title="Nothing to approve" className="py-8" />
      ) : (
        <ul className="divide-y divide-crm-line px-5 pb-3">
          {list.map((b) => {
            const isDisc = b.discount.approval === "pending";
            return (
              <li key={b.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#FEF6E7] text-[#DC6803] dark:bg-[#2B2010]">
                  <Hourglass size={18} weight="duotone" />
                </span>
                <Link href={`/dashboard/sales/bookings/${b.id}`} className="min-w-0 flex-1 hover:text-crm-brand">
                  <span className="block truncate text-[13.5px] font-medium text-crm-ink">{isDisc ? `Discount ${b.discount.mode === "percent" ? `${b.discount.value}%` : taka(b.discount.value)}` : `Shift to ${fmtDate(b.shiftRequest?.newDate)} · ${taka(b.shiftRequest?.charge ?? 0)}`}</span>
                  <span className="text-[12px] text-crm-muted">
                    {b.bfNo} · {b.eventTitle}
                    {isDisc && b.discount.reason ? ` · ${b.discount.reason}` : ""}
                  </span>
                </Link>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="primary" onClick={() => (isDisc ? disc : shift).mutate({ id: b.id, ok: true })}>
                    Approve
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => (isDisc ? disc : shift).mutate({ id: b.id, ok: false })}>
                    Reject
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function MyTasks({ list, nowIso }: { list: ReturnType<typeof useOverviewData>["data"]["myTasks"]; nowIso: string }) {
  const done = useCrmAction((id: string) => completeTask(id), { success: "Done ✓" });
  return (
    <Card>
      <CardHeader icon={CheckCircle} title="My tasks today" action={<Link href="/dashboard/sales/follow-ups" className="text-[12.5px] font-medium text-crm-brand hover:underline">All follow-ups</Link>} />
      {list.length === 0 ? (
        <EmptyState icon={CheckCircle} title="You're clear for today" className="py-8" />
      ) : (
        <ul className="px-5 pb-3">
          {list.slice(0, 7).map((t) => (
            <li key={t.id} className="group flex items-start gap-2.5 py-2">
              <button onClick={() => done.mutate(t.id)} className="mt-0.5 text-crm-muted hover:text-[#12B76A]" aria-label="Mark done">
                <Circle size={18} className="group-hover:hidden" />
                <CheckCircle size={18} weight="fill" className="hidden group-hover:block" />
              </button>
              <span className="min-w-0">
                <span className="block text-[13px] leading-snug text-crm-ink">{t.title}</span>
                <span className={cn("text-[11.5px]", t.dueAt < nowIso ? "font-semibold text-[#D92D20]" : "text-crm-muted")}>{t.dueAt < nowIso ? `Overdue · ${ago(t.dueAt)}` : fmtDateTime(t.dueAt)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Overdue({ tasks, docs }: { tasks: number; docs: { b: Booking; d: { label: string; dueDate?: string } }[] }) {
  return (
    <Card>
      <CardHeader icon={Warning} title="Overdue" description={`${tasks} task${tasks === 1 ? "" : "s"} · ${docs.length} document${docs.length === 1 ? "" : "s"}`} />
      <ul className="px-5 pb-3">
        {docs.slice(0, 5).map(({ b, d }) => (
          <li key={b.id + d.label}>
            <Link href={`/dashboard/sales/bookings/${b.id}`} className="flex items-center justify-between gap-2 py-1.5 text-[12.5px] hover:text-crm-brand">
              <span className="truncate text-crm-ink">
                {d.label} <span className="text-crm-muted">· {b.eventTitle}</span>
              </span>
              <Badge tone="red">{fmtDate(d.dueDate, "dd MMM")}</Badge>
            </Link>
          </li>
        ))}
        {!docs.length && <li className="py-3 text-[13px] text-crm-muted">No overdue documents.</li>}
        {tasks > 0 && (
          <li className="pt-1">
            <Link href="/dashboard/sales/follow-ups" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-crm-brand hover:underline">
              {tasks} overdue task{tasks > 1 ? "s" : ""} <ArrowRight size={12} />
            </Link>
          </li>
        )}
      </ul>
    </Card>
  );
}

function HotLeads({ list }: { list: ReturnType<typeof useOverviewData>["data"]["hot"] }) {
  return (
    <Card>
      <CardHeader icon={Fire} title="Hot lead alerts" action={<Link href="/dashboard/marketing/leads" className="text-[12.5px] font-medium text-crm-brand hover:underline">Leads</Link>} />
      <ul className="px-5 pb-3">
        {list.slice(0, 5).map((l) => (
          <li key={l.id}>
            <Link href={`/dashboard/marketing/leads?lead=${l.id}`} className="flex items-center gap-3 py-2 hover:text-crm-brand">
              <ProgressRing value={l.score} size={34} stroke={4} label={String(l.score)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-crm-ink">{l.organization ?? l.name}</span>
                <span className="text-[11.5px] text-crm-muted">
                  {l.eventType} · {ago(l.createdAt)}
                </span>
              </span>
              {!l.firstResponseAt && <Badge tone="red">new</Badge>}
            </Link>
          </li>
        ))}
        {!list.length && <li className="py-3 text-[13px] text-crm-muted">No hot leads waiting.</li>}
      </ul>
    </Card>
  );
}

function RevenueChart({ data }: { data: { month: string; collected: number; booked: number }[] }) {
  return (
    <Card>
      <CardHeader icon={ChartLineUp} title="Revenue" description="Collected (money receipts) vs booked value by event month." />
      <div className="px-3 pb-4">
        <AreaTrend data={data} x="month" format={takaShort} series={[{ key: "booked", label: "Booked value" }, { key: "collected", label: "Collected" }]} height={250} />
      </div>
    </Card>
  );
}

function StatusFunnel({ steps, closed }: { steps: { label: string; value: number }[]; closed: number }) {
  return (
    <Card>
      <CardHeader icon={Kanban} title="Status funnel" description={`${closed} closed (cancelled / lost)`} action={<Link href="/dashboard/sales/bookings" className="text-[12.5px] font-medium text-crm-brand hover:underline">Board</Link>} />
      <div className="px-5 pb-5">
        <Funnel steps={steps} colors={[STATUS_COLORS.requested, STATUS_COLORS.confirmed, STATUS_COLORS.completed]} />
      </div>
    </Card>
  );
}

function SimpleList({ icon, title, items, href, empty }: { icon: typeof Receipt; title: string; items: { id: string; title: string; sub: string; right?: React.ReactNode; href: string }[]; href?: string; empty: string }) {
  return (
    <Card>
      <CardHeader icon={icon} title={title} action={href && <Link href={href} className="text-[12.5px] font-medium text-crm-brand hover:underline">Open</Link>} />
      <ul className="divide-y divide-crm-line px-5 pb-3">
        {items.slice(0, 6).map((i) => (
          <li key={i.id}>
            <Link href={i.href} className="flex items-center justify-between gap-3 py-2.5 hover:text-crm-brand">
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-crm-ink">{i.title}</span>
                <span className="text-[12px] text-crm-muted">{i.sub}</span>
              </span>
              {i.right}
            </Link>
          </li>
        ))}
        {!items.length && <li className="py-4 text-[13px] text-crm-muted">{empty}</li>}
      </ul>
    </Card>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

const GREETING = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

export function OverviewPage() {
  const { me, data: d, halls, loading } = useOverviewData();
  const [greeting] = useState(GREETING);
  const hallName = (id?: string) => halls.find((h) => h.id === id)?.name ?? "—";
  const role: Role = me.role;
  const isSales = role === "admin" || role === "sales_manager" || role === "sales_executive";
  const allBookings = useBookings();
  const allPayments = usePayments();

  const kpis = (() => {
    switch (role) {
      case "marketing":
        return [
          <KpiCard key="v" label="Website visitors (30d)" value={d.visits30} delta={d.visitsDelta} icon={Users} spark={d.visitSpark} loading={loading} href="/dashboard/marketing/analytics" />,
          <KpiCard key="l" label="Open leads" value={d.leadsOpen} icon={TrendUp} tone="blue" loading={loading} href="/dashboard/marketing/leads" />,
          <KpiCard key="h" label="Hot leads" value={d.hot.length} icon={Fire} tone="brand" loading={loading} href="/dashboard/marketing/leads" />,
          <KpiCard key="r" label="New radar items" value={d.radarNew} icon={Crosshair} tone="amber" loading={loading} href="/dashboard/marketing/opportunity-radar" />,
        ];
      case "operations":
        return [
          <KpiCard key="t" label="Events today" value={d.eventsToday.length} icon={CalendarCheck} loading={loading} href="/dashboard/operations/events" />,
          <KpiCard key="w" label="Events next 7 days" value={d.upcoming.length} icon={CalendarCheck} tone="blue" loading={loading} href="/dashboard/operations/events" />,
          <KpiCard key="p" label="PPM due" value={d.ppmDue.length} icon={ClipboardText} tone="amber" loading={loading} href="/dashboard/operations/ppm" />,
          <KpiCard key="f" label="Fact sheets pending" value={d.factPending.length} icon={Warning} tone="brand" loading={loading} href="/dashboard/operations/events" />,
        ];
      case "accounts":
        return [
          <KpiCard key="c" label="Collected this month" value={d.collectedThis} delta={d.collectedDelta} format={takaShort} icon={CurrencyCircleDollar} tone="green" spark={d.revSpark} loading={loading} href="/dashboard/sales/invoices" />,
          <KpiCard key="o" label="Outstanding balance" value={d.outstanding} format={takaShort} icon={Receipt} tone="brand" loading={loading} href="/dashboard/sales/invoices" />,
          <KpiCard key="r" label="Refunds pending" value={d.refundsDue.length} icon={HandCoins} tone="amber" loading={loading} href="/dashboard/sales/invoices" />,
          <KpiCard key="u" label="Upcoming events" value={d.upcoming.length} icon={CalendarCheck} tone="blue" loading={loading} />,
        ];
      default:
        return [
          <KpiCard key="c" label="Collected this month" value={d.collectedThis} delta={d.collectedDelta} format={takaShort} icon={CurrencyCircleDollar} tone="green" spark={d.revSpark} loading={loading} href="/dashboard/sales/invoices" />,
          <KpiCard key="b" label="Confirmed this month" value={d.confirmedThis} delta={d.confirmedDelta} icon={SealCheck} loading={loading} href="/dashboard/sales/bookings" />,
          <KpiCard key="r" label="Requests waiting" value={d.requested} icon={Hourglass} tone="amber" loading={loading} href="/dashboard/sales/bookings" />,
          <KpiCard key="t" label="Avg first response" value={d.avgResp} format={(n) => `${n.toFixed(1)} h`} icon={Timer} tone="blue" invertDelta loading={loading} />,
        ];
    }
  })();

  return (
    <Stagger>
      <Item>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-crm-brand">{ROLE_LABELS[role]} · {format(new Date(), "EEEE, dd MMMM")}</p>
            <h1 className="crm-display text-[28px] font-semibold leading-tight text-crm-ink">
              {greeting}, {me.name.split(" ")[0]}
            </h1>
            <p className="text-[13.5px] text-crm-muted">
              {d.awaitingResponse.length > 0 && isSales ? `${d.awaitingResponse.length} booking request${d.awaitingResponse.length > 1 ? "s" : ""} waiting for a first call.` : "Here's what needs your attention today."}
            </p>
          </div>
          {isSales && (
            <Link href="/dashboard/sales/bookings/new">
              <Button variant="primary" icon={CalendarPlus}>
                New booking
              </Button>
            </Link>
          )}
        </div>
      </Item>
      <Item>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{kpis}</div>
      </Item>
      {(role === "admin" || role === "sales_manager") && allBookings.data && allPayments.data && (
        <Item>
          <RoiWidget bookings={allBookings.data} payments={allPayments.data} />
        </Item>
      )}

      {loading ? (
        <Item>
          <div className="grid gap-6 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </Item>
      ) : (
        <>
          {isSales && (
            <>
              {d.awaitingResponse.length > 0 && (
                <Item>
                  <Card className="mb-6 border-[#FDE7C2]">
                    <CardHeader icon={Clock} title="First-response timer" description={`Target: call within ${getSettings().firstResponseTargetHours} hours of the request.`} />
                    <ul className="grid gap-2 px-5 pb-4 sm:grid-cols-2 xl:grid-cols-3">
                      {d.awaitingResponse.slice(0, 6).map((b) => {
                        const hrs = (new Date(d.nowIso).getTime() - new Date(b.createdAt).getTime()) / 3600000;
                        const late = hrs > getSettings().firstResponseTargetHours;
                        return (
                          <li key={b.id}>
                            <Link href={`/dashboard/sales/bookings/${b.id}`} className={cn("flex items-center gap-3 rounded-xl border p-3 hover:border-crm-brand", late ? "border-[#FECDCA] bg-[#FEF3F2]/50 dark:bg-[#2D1414]/40" : "border-crm-line")}>
                              <Clock size={20} className={late ? "text-[#D92D20]" : "text-[#DC6803]"} weight="duotone" />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] font-medium text-crm-ink">{b.contact.name}</span>
                                <span className="text-[12px] text-crm-muted">{b.eventNature} · {fmtDate(firstEventDate(b))}</span>
                              </span>
                              <Badge tone={late ? "red" : "amber"}>{hrs < 1 ? `${Math.round(hrs * 60)} min` : `${hrs.toFixed(hrs < 10 ? 1 : 0)} h`}</Badge>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </Card>
                </Item>
              )}
              <Item>
                <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                  <RevenueChart data={d.revenue} />
                  <StatusFunnel steps={d.funnel} closed={d.closedLost} />
                </div>
              </Item>
              <Item>
                <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
                  {(role === "admin" || role === "sales_manager") && <Approvals list={d.approvals} />}
                  <EventsAtRisk bookings={d.live} />
                  <MyTasks list={d.myTasks} nowIso={d.nowIso} />
                  <UpcomingEvents list={d.upcoming} hallName={hallName} />
                  <Overdue tasks={d.overdueTasks.length} docs={d.overdueDocs} />
                  <HotLeads list={d.hot} />
                </div>
              </Item>
            </>
          )}

          {role === "marketing" && (
            <Item>
              <div className="grid gap-6 lg:grid-cols-2">
                <HotLeads list={d.hot} />
                <MyTasks list={d.myTasks} nowIso={d.nowIso} />
                <EventsAtRisk bookings={d.live} />
                <StatusFunnel steps={d.funnel} closed={d.closedLost} />
                <UpcomingEvents list={d.upcoming} hallName={hallName} />
              </div>
            </Item>
          )}

          {role === "operations" && (
            <Item>
              <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
                <EventsAtRisk bookings={d.live} />
                <UpcomingEvents list={d.upcoming} hallName={hallName} />
                <SimpleList icon={ClipboardText} title="PPM due this week" href="/dashboard/operations/ppm" empty="No PPMs due." items={d.ppmDue.map((b) => ({ id: b.id, title: b.eventTitle, sub: `Event ${fmtDate(firstEventDate(b))} · PPM by ${fmtDate(ppmDueDate(firstEventDate(b)))}`, href: `/dashboard/sales/bookings/${b.id}` }))} />
                <SimpleList icon={Warning} title="Fact sheets to complete" href="/dashboard/operations/events" empty="All fact sheets done." items={d.factPending.map((b) => ({ id: b.id, title: b.eventTitle, sub: `${hallName(b.days[0]?.hallId)} · ${fmtDate(firstEventDate(b))}`, href: `/dashboard/sales/bookings/${b.id}` }))} />
                <Overdue tasks={d.overdueTasks.length} docs={d.overdueDocs} />
                <MyTasks list={d.myTasks} nowIso={d.nowIso} />
              </div>
            </Item>
          )}

          {role === "accounts" && (
            <Item>
              <div className="grid gap-6 lg:grid-cols-2">
                <RevenueChart data={d.revenue} />
                <EventsAtRisk bookings={d.live} />
                <SimpleList icon={HandCoins} title="Security refunds due" href="/dashboard/sales/invoices?tab=collections" empty="No refunds pending." items={d.refundsDue.map((b) => ({ id: b.id, title: b.contact.name, sub: `Due ${fmtDate(b.refund!.dueDate)} · ${b.bfNo}`, right: <span className="font-semibold text-crm-ink tabular">{taka(b.refund!.amount)}</span>, href: `/dashboard/sales/bookings/${b.id}` }))} />
                <UpcomingEvents list={d.upcoming} hallName={hallName} />
                <MyTasks list={d.myTasks} nowIso={d.nowIso} />
              </div>
            </Item>
          )}
        </>
      )}
    </Stagger>
  );
}
