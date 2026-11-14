"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import {
  ArrowArcLeft,
  ArrowCounterClockwise,
  ArrowsLeftRight,
  CalendarBlank,
  CalendarCheck,
  CalendarX,
  CheckCircle,
  Copy,
  CurrencyCircleDollar,
  DotsThreeVertical,
  Files,
  Globe,
  ListChecks,
  MapPin,
  Receipt,
  SealCheck,
  Trash,
  Users as UsersIcon,
  XCircle,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { differenceInCalendarDays } from "date-fns";
import { STATUS_LABELS } from "@/types/crm";
import { getRates, useCurrentUser } from "@/lib/crm/db";
import { can } from "@/lib/crm/permissions";
import { firstEventDate, lastEventDate, parseYmd } from "@/lib/crm/pricing";
import { checklistFor, type WorkspaceTab } from "@/lib/crm/workflow";
import { openFindings } from "@/lib/crm/leakage";
import { fmtDate, taka } from "@/lib/crm/format";
import { closeBooking, duplicateBooking, estimateFor, findingsFor, flowContext, notify, reopenBooking } from "@/services/crm/bookings.service";
import { markPortalSeen } from "@/services/crm/features.service";
import { useBooking, useClients, useCrmAction, useCrmRemove, useHalls, useInvoices, usePayments, useTasks, useUsers } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { m } from "../ui/motion";
import { Badge, Button, EmptyState, Skeleton } from "../ui/core";
import { ClosedTag, StatusPill } from "../ui/status";
import { Tabs } from "../ui/tabs";
import { useConfirm } from "../ui/overlay";
import { useClickOutside } from "../ui/hooks";
import { useStatusChange } from "../bookings/shared";
import { ReadinessChip } from "../features/Readiness";
import { PortalDrawer } from "../features/PortalPanel";
import { Ctx, type WorkspaceCtx } from "./context";
import { Aside } from "./Aside";
import { OverviewTab } from "./tabs/OverviewTab";
import { BillTab } from "./tabs/BillTab";
import { PaymentsTab } from "./tabs/PaymentsTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { EventTab, type EventSub } from "./tabs/EventTab";
import { ScheduleMeetingModal, ShiftModal } from "./modals";

type MainTab = "overview" | "bill" | "payments" | "documents" | "event";

/** Older deep links and checklist targets → the 5 tabs. */
function route(t: string | null | undefined): { tab: MainTab; sub?: EventSub } {
  switch (t as WorkspaceTab | MainTab | null) {
    case "services":
    case "estimate":
    case "bill":
      return { tab: "bill" };
    case "payments":
      return { tab: "payments" };
    case "documents":
      return { tab: "documents" };
    case "ppm":
      return { tab: "event", sub: "ppm" };
    case "event":
      return { tab: "event", sub: "fact" };
    case "feedback":
      return { tab: "event", sub: "feedback" };
    default:
      return { tab: "overview" };
  }
}

export function BookingWorkspace() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const params = useSearchParams();
  const me = useCurrentUser();
  const confirm = useConfirm();
  const changeStatus = useStatusChange();
  const booking = useBooking(id);
  const halls = useHalls();
  const users = useUsers();
  const payments = usePayments();
  const invoices = useInvoices();
  const tasks = useTasks();
  const clients = useClients();
  const initial = route(params.get("tab"));
  const [tab, setTab] = useState<MainTab>(initial.tab);
  const [eventSub, setEventSub] = useState<EventSub>(initial.sub ?? "ppm");
  const [portalOpen, setPortalOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const closeMore = useCallback(() => setMore(false), []);
  useClickOutside(moreRef, more, closeMore);

  const goTab = useCallback((t: WorkspaceTab) => {
    const r = route(t);
    setTab(r.tab);
    if (r.sub) setEventSub(r.sub);
  }, []);

  const remove = useCrmRemove("bookings", "Booking");
  const close = useCrmAction((a: { kind: "cancelled" | "lost"; reason: string }) => closeBooking(id, a.kind, a.reason), { success: (b) => (b.closed?.kind === "cancelled" ? "Booking cancelled" : "Marked as lost") });
  const reopen = useCrmAction(() => reopenBooking(id), { success: "Booking reopened" });
  const dup = useCrmAction(() => duplicateBooking(id), { success: (b) => `Duplicated as ${b.bfNo}`, onSuccess: (b) => router.push(`/dashboard/sales/bookings/${b.id}`) });

  const ws = useMemo<WorkspaceCtx | null>(() => {
    const b = booking.data;
    if (!b || !halls.data || !users.data || !payments.data || !invoices.data || !tasks.data) return null;
    const ps = payments.data.filter((p) => p.bookingId === b.id);
    return {
      b,
      est: estimateFor(b, ps),
      flow: flowContext(b),
      rates: getRates(b.priceVersion),
      halls: halls.data,
      users: users.data,
      client: clients.data?.find((c) => c.id === b.clientId),
      payments: ps,
      docs: invoices.data.filter((d) => d.bookingId === b.id),
      tasks: tasks.data.filter((t) => t.bookingId === b.id),
      me,
      canEdit: can(me.role, "update", "bookings") && (me.role !== "sales_executive" || b.assignedTo === me.id || !b.assignedTo),
      canApprove: can(me.role, "approve", "bookings"),
      canPay: can(me.role, "create", "payments") || me.role === "sales_executive" || me.role === "sales_manager",
      canOps: can(me.role, "update", "ppm") || me.role === "admin",
      goTab,
    };
  }, [booking.data, halls.data, users.data, payments.data, invoices.data, tasks.data, clients.data, me, goTab]);

  if (booking.isLoading || (!ws && !booking.isError && booking.data !== null))
    return (
      <div className="space-y-5">
        <Skeleton className="h-32 w-full rounded-[var(--radius-card-lg)]" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Skeleton className="h-96 rounded-[var(--radius-card-lg)]" />
          <Skeleton className="h-72 rounded-[var(--radius-card-lg)]" />
        </div>
      </div>
    );

  if (!ws)
    return (
      <div className="crm-card">
        <EmptyState icon={CalendarX} title="Booking not found" description="It may have been deleted. Check the Trash in Bookings." action={<Link href="/dashboard/sales/bookings"><Button variant="primary">Back to bookings</Button></Link>} />
      </div>
    );

  const { b, est } = ws;
  const event = firstEventDate(b);
  const last = lastEventDate(b);
  const daysTo = event ? differenceInCalendarDays(parseYmd(event), new Date()) : 0;
  const hallLabel = [...new Set(b.days.map((d) => ws.halls.find((h) => h.id === d.hallId)?.name))].filter(Boolean).join(", ");
  const isManager = me.role === "sales_manager" || me.role === "admin";
  const balance = Math.max(0, est.balance);

  const primary = (() => {
    if (b.closed) return { label: "Reopen", icon: ArrowCounterClockwise, run: () => reopen.mutate(undefined), show: ws.canEdit };
    if (b.status === "requested" && !b.meetingAt) return { label: "Schedule meeting", icon: CalendarBlank, run: () => setMeetingOpen(true), show: ws.canEdit };
    if (b.status === "requested")
      return isManager
        ? { label: "Approve & confirm", icon: SealCheck, run: (e?: React.MouseEvent<HTMLElement>) => changeStatus(b, "confirmed", e ? centerOf(e.currentTarget) : undefined), show: true }
        : {
            label: "Request approval",
            icon: SealCheck,
            run: () => {
              notify({ title: "Approval requested", body: `${me.name} asks to confirm ${b.bfNo} · ${b.eventTitle}`, kind: "approval", href: `/dashboard/sales/bookings/${b.id}`, roles: ["sales_manager", "admin"] });
              toast.success("Sales Manager notified");
            },
            show: ws.canEdit,
          };
    if (b.status === "confirmed") return { label: "Mark completed", icon: CheckCircle, run: () => changeStatus(b, "completed"), show: ws.canEdit || ws.canPay };
    return null;
  })();

  const leakOpen = b.status !== "requested" && !b.closed ? openFindings(findingsFor(b)).length : 0;
  const docsPending = b.documents.filter((d) => d.state === "pending").length;
  const tabs = [
    { value: "overview" as const, label: "Overview", icon: ListChecks },
    { value: "bill" as const, label: "Bill", icon: Receipt, count: leakOpen },
    { value: "payments" as const, label: "Payments", icon: CurrencyCircleDollar },
    { value: "documents" as const, label: "Documents", icon: Files, count: docsPending },
    { value: "event" as const, label: "Event", icon: CalendarCheck, hidden: b.status === "requested" },
  ];
  const missing = checklistFor(b.status, b, ws.flow).filter((i) => i.required && !i.done).length;
  const openPortal = () => {
    setPortalOpen(true);
    void markPortalSeen(b.id);
  };

  const menu = [
    { icon: Globe, label: "Client portal", show: can(me.role, "view", "portal") && !b.closed, run: openPortal },
    { icon: ArrowsLeftRight, label: "Shift / postpone date", show: ws.canEdit && !b.closed && b.status !== "completed", run: () => setShiftOpen(true) },
    {
      icon: ArrowArcLeft,
      label: `Move back to ${b.status === "completed" ? STATUS_LABELS.confirmed : STATUS_LABELS.requested}`,
      show: isManager && b.status !== "requested" && !b.closed,
      run: () => changeStatus(b, b.status === "completed" ? "confirmed" : "requested"),
    },
    { icon: Copy, label: "Duplicate booking", show: can(me.role, "create", "bookings"), run: () => dup.mutate(undefined) },
    {
      icon: XCircle,
      label: "Cancel booking",
      danger: true,
      show: ws.canEdit && !b.closed && b.status !== "completed",
      run: async () => {
        const r = await confirm({ title: "Cancel this booking?", description: b.status === "requested" ? "No cancellation charge for requests." : "A cancellation charge from the ICCB chart is calculated automatically.", tone: "danger", confirmLabel: "Cancel booking", reason: { label: "Reason", required: true } });
        if (r.ok && r.reason) close.mutate({ kind: "cancelled", reason: r.reason });
      },
    },
    {
      icon: CalendarX,
      label: "Mark as lost",
      danger: true,
      show: ws.canEdit && !b.closed && b.status === "requested",
      run: async () => {
        const r = await confirm({ title: "Mark as lost?", tone: "danger", confirmLabel: "Mark lost", reason: { label: "Lost reason", required: true, placeholder: "Budget, chose another venue, date not available…" } });
        if (r.ok && r.reason) close.mutate({ kind: "lost", reason: r.reason });
      },
    },
    {
      icon: Trash,
      label: "Delete",
      danger: true,
      show: can(me.role, "delete", "bookings"),
      run: async () => {
        const r = await confirm({ title: `Delete ${b.bfNo}?`, description: "It moves to Trash and can be restored.", tone: "danger", confirmLabel: "Delete" });
        if (r.ok) {
          remove.mutate(b.id);
          router.push("/dashboard/sales/bookings");
        }
      },
    },
  ].filter((x) => x.show);

  return (
    <Ctx.Provider value={ws}>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="crm-card mb-5 overflow-hidden">
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2 text-[12px] text-crm-muted">
              <Link href="/dashboard/sales/bookings" className="hover:text-crm-ink">
                Bookings
              </Link>
              <span>/</span>
              <button
                className="inline-flex items-center gap-1 font-mono hover:text-crm-ink"
                onClick={() => {
                  void navigator.clipboard?.writeText(b.bfNo);
                  toast.success("BF No copied");
                }}
              >
                {b.bfNo} <Copy size={11} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="crm-display text-[24px] font-semibold leading-tight text-crm-ink">{b.eventTitle}</h1>
              <StatusPill status={b.status} />
              <ClosedTag closed={b.closed} />
              {!!b.portalUnread && (
                <button onClick={openPortal} className="rounded-full">
                  <Badge tone="brand" dot>
                    {b.portalUnread} new from client
                  </Badge>
                </button>
              )}
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-crm-ink-2">
              <span className="inline-flex items-center gap-1.5">
                <CalendarBlank size={14} /> {fmtDate(event, "EEE, dd MMM yyyy")}
                {last !== event ? ` → ${fmtDate(last, "dd MMM")}` : ""}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} /> {hallLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UsersIcon size={14} /> {b.guests.optimum.toLocaleString("en-US")} guests
              </span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {primary?.show && (
              <Button variant="primary" icon={primary.icon} onClick={(e) => primary.run(e)}>
                {primary.label}
              </Button>
            )}
            {menu.length > 0 && (
              <div ref={moreRef} className="relative">
                <Button variant="secondary" size="icon" aria-label="More actions" onClick={() => setMore((v) => !v)}>
                  <DotsThreeVertical size={18} weight="bold" />
                </Button>
                <AnimatePresence>
                  {more && (
                    <m.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute end-0 top-11 z-30 w-56 rounded-[var(--radius-card-lg)] border border-crm-line bg-crm-surface p-1.5 shadow-[var(--crm-shadow-lg)]">
                      {menu.map((x) => (
                        <button
                          key={x.label}
                          onClick={() => {
                            setMore(false);
                            void x.run();
                          }}
                          className={cn("flex w-full items-center gap-2.5 rounded-[var(--radius-btn)] px-2.5 py-2 text-start text-[13px] hover:bg-crm-surface-2", x.danger ? "text-[#D92D20]" : "text-crm-ink-2")}
                        >
                          <x.icon size={16} /> {x.label}
                        </button>
                      ))}
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Key numbers */}
        <div className="grid grid-cols-2 border-t border-crm-line sm:grid-cols-4">
          <Stat label="Total" value={taka(est.grandTotal)} />
          <Stat label="Paid" value={taka(est.received)} tone={est.received > 0 ? "text-[#067647]" : undefined} />
          <Stat label="Balance" value={taka(balance)} tone={balance > 0 ? "text-crm-brand" : "text-[#067647]"} />
          <div className="flex items-center justify-between gap-2 border-s border-crm-line px-5 py-3 max-sm:border-t">
            <div>
              <p className="text-[11.5px] text-crm-muted">{b.closed ? "Status" : daysTo < 0 ? "Event was" : "Event in"}</p>
              <p className={cn("font-display text-[18px] font-semibold tabular", !b.closed && daysTo >= 0 && daysTo <= 15 ? "text-[#B54708]" : "text-crm-ink")}>
                {b.closed ? (b.closed.kind === "cancelled" ? "Cancelled" : "Lost") : daysTo === 0 ? "Today" : `${Math.abs(daysTo)} days${daysTo < 0 ? " ago" : ""}`}
              </p>
            </div>
            {b.status === "confirmed" && !b.closed && <ReadinessChip b={b} size={38} showLabel={false} pulse />}
          </div>
        </div>

        {b.closed && (
          <p className="border-t border-crm-line bg-crm-surface-2 px-5 py-2.5 text-[12.5px] text-crm-ink-2">
            <strong className="text-crm-ink">{b.closed.kind === "cancelled" ? "Cancelled" : "Lost"}</strong> on {fmtDate(b.closed.at)} — {b.closed.reason}
            {b.closed.charge ? ` · charge ${taka(b.closed.charge)}` : ""}
          </p>
        )}
        {b.shiftRequest?.status === "pending" && (
          <p className="border-t border-crm-line bg-[#FEF6E7] px-5 py-2.5 text-[12.5px] text-[#B54708] dark:bg-[#2B2010]">
            Shift to {fmtDate(b.shiftRequest.newDate)} requested — charge {taka(b.shiftRequest.charge)} ({b.shiftRequest.pct}%). Waiting for approval.
          </p>
        )}
      </m.div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-5" />
          <AnimatePresence mode="wait" initial={false}>
            <m.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {tab === "overview" && <OverviewTab />}
              {tab === "bill" && <BillTab />}
              {tab === "payments" && <PaymentsTab />}
              {tab === "documents" && <DocumentsTab />}
              {tab === "event" && <EventTab sub={eventSub} onSub={setEventSub} />}
            </m.div>
          </AnimatePresence>
        </div>
        <Aside />
      </div>

      {/* Mobile sticky action bar */}
      {primary?.show && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-crm-line bg-crm-surface/95 px-4 py-3 backdrop-blur md:hidden">
          <span className="text-[12px] text-crm-muted">{missing ? `${missing} item${missing > 1 ? "s" : ""} left` : "Ready"}</span>
          <Button variant="primary" icon={primary.icon} onClick={(e) => primary.run(e)}>
            {primary.label}
          </Button>
        </div>
      )}

      {meetingOpen && <ScheduleMeetingModal onClose={() => setMeetingOpen(false)} />}
      {shiftOpen && <ShiftModal onClose={() => setShiftOpen(false)} />}
      {portalOpen && <PortalDrawer b={b} onClose={() => setPortalOpen(false)} />}
    </Ctx.Provider>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="border-crm-line px-5 py-3 [&:not(:first-child)]:border-s max-sm:[&:nth-child(3)]:border-s-0 max-sm:[&:nth-child(n+3)]:border-t">
      <p className="text-[11.5px] text-crm-muted">{label}</p>
      <p className={cn("font-display text-[18px] font-semibold tabular text-crm-ink", tone)}>{value}</p>
    </div>
  );
}

function centerOf(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
