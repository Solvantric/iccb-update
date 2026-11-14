"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import {
  ArrowArcLeft,
  ArrowCounterClockwise,
  CalendarBlank,
  CalendarCheck,
  CalendarX,
  ChatsCircle,
  ClipboardText,
  ClockCountdown,
  Copy,
  CurrencyCircleDollar,
  DotsThreeVertical,
  FileText,
  Files,
  ListChecks,
  MapPin,
  Package,
  SealCheck,
  Star,
  Trash,
  UserCircle,
  XCircle,
  CheckCircle,
  ArrowsLeftRight,
  Globe,
} from "@phosphor-icons/react";
import { openFindings } from "@/lib/crm/leakage";
import { findingsFor } from "@/services/crm/bookings.service";
import { markPortalSeen } from "@/services/crm/features.service";
import { ReadinessChip } from "../features/Readiness";
import { PortalDrawer } from "../features/PortalPanel";
import { toast } from "sonner";
import { differenceInCalendarDays } from "date-fns";
import { STATUS_LABELS } from "@/types/crm";
import { getRates, useCurrentUser } from "@/lib/crm/db";
import { can } from "@/lib/crm/permissions";
import { firstEventDate, lastEventDate, parseYmd } from "@/lib/crm/pricing";
import { checklistFor, type WorkspaceTab } from "@/lib/crm/workflow";
import { fmtDate, taka } from "@/lib/crm/format";
import { closeBooking, duplicateBooking, estimateFor, flowContext, notify, reopenBooking } from "@/services/crm/bookings.service";
import { useBooking, useClients, useCrmAction, useCrmRemove, useHalls, useInvoices, usePayments, useTasks, useUsers } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { m } from "../ui/motion";
import { Avatar, Badge, Button, EmptyState, Skeleton } from "../ui/core";
import { ClosedTag, StatusPill } from "../ui/status";
import { ProgressRing } from "../ui/kpi";
import { Tabs } from "../ui/tabs";
import { useConfirm } from "../ui/overlay";
import { useClickOutside } from "../ui/hooks";
import { useStatusChange } from "../bookings/shared";
import { Ctx, type WorkspaceCtx } from "./context";
import { StatusStepper } from "./StatusStepper";
import { RightRail } from "./RightRail";
import { OverviewTab } from "./tabs/OverviewTab";
import { ServicesTab } from "./tabs/ServicesTab";
import { EstimateTab } from "./tabs/EstimateTab";
import { PaymentsTab } from "./tabs/PaymentsTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { PpmTab } from "./tabs/PpmTab";
import { EventDayTab } from "./tabs/EventDayTab";
import { FeedbackTab } from "./tabs/FeedbackTab";
import { ActivityTab } from "./tabs/ActivityTab";
import { ScheduleMeetingModal, ShiftModal } from "./modals";

export function BookingWorkspace() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
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
  const params = useSearchParams();
  const TAB_IDS: WorkspaceTab[] = ["overview", "services", "estimate", "payments", "documents", "ppm", "event", "feedback", "activity"];
  const [tab, setTab] = useState<WorkspaceTab>(() => (TAB_IDS.includes(params.get("tab") as WorkspaceTab) ? (params.get("tab") as WorkspaceTab) : "overview"));
  const [portalOpen, setPortalOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const closeMore = useCallback(() => setMore(false), []);
  useClickOutside(moreRef, more, closeMore);

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
      goTab: setTab,
    };
  }, [booking.data, halls.data, users.data, payments.data, invoices.data, tasks.data, clients.data, me]);

  if (booking.isLoading || (!ws && !booking.isError && booking.data !== null))
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
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
  const daysTo = event ? differenceInCalendarDays(parseYmd(event), new Date()) : 0;
  const hallLabel = [...new Set(b.days.map((d) => ws.halls.find((h) => h.id === d.hallId)?.name))].filter(Boolean).join(", ");
  const rep = ws.users.find((u) => u.id === b.assignedTo);
  const paidPct = est.grandTotal ? Math.round((est.received / est.grandTotal) * 100) : 0;
  const isManager = me.role === "sales_manager" || me.role === "admin";

  const primary = (() => {
    if (b.closed) return { label: "Reopen booking", icon: ArrowCounterClockwise, run: () => reopen.mutate(undefined), show: ws.canEdit };
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
  const tabs = [
    { value: "overview" as const, label: "Overview", icon: ListChecks },
    { value: "services" as const, label: "Services & Bill", icon: Package, count: leakOpen },
    { value: "estimate" as const, label: "Estimate & invoice", icon: FileText },
    { value: "payments" as const, label: "Payments", icon: CurrencyCircleDollar, count: ws.payments.length },
    { value: "documents" as const, label: "Documents", icon: Files, count: b.documents.filter((d) => d.state === "pending").length },
    { value: "ppm" as const, label: "PPM", icon: ClipboardText },
    { value: "event" as const, label: "Event day", icon: CalendarCheck },
    { value: "feedback" as const, label: "Feedback & damage", icon: Star },
    { value: "activity" as const, label: "Activity", icon: ChatsCircle, count: b.activity.length },
  ];

  const missing = checklistFor(b.status, b, ws.flow).filter((i) => i.required && !i.done).length;
  const openPortal = () => {
    setPortalOpen(true);
    void markPortalSeen(b.id);
  };

  return (
    <Ctx.Provider value={ws}>
      {/* Header */}
      <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="crm-card mb-6 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[12.5px] text-crm-muted">
              <Link href="/dashboard/sales/bookings" className="hover:text-crm-ink">
                Bookings
              </Link>
              <span>/</span>
              <button
                className="inline-flex items-center gap-1 font-mono text-crm-ink-2 hover:text-crm-ink"
                onClick={() => {
                  void navigator.clipboard?.writeText(b.bfNo);
                  toast.success("BF No copied");
                }}
              >
                {b.bfNo} <Copy size={12} />
              </button>
              {b.programRegNo && <Badge tone="grey">Reg. {b.programRegNo}</Badge>}
              {b.isSample && <Badge tone="grey">Sample</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[22px] font-bold leading-tight tracking-[-0.01em] text-crm-ink">{b.eventTitle}</h1>
              <StatusPill status={b.status} />
              <ClosedTag closed={b.closed} />
              {b.status === "confirmed" && !b.closed && <ReadinessChip b={b} size={38} pulse />}
              {!!b.portalUnread && (
                <button onClick={openPortal} className="crm-pulse-once rounded-full">
                  <Badge tone="brand" dot>
                    {b.portalUnread} new from client
                  </Badge>
                </button>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-crm-ink-2">
              <span className="inline-flex items-center gap-1.5">
                <UserCircle size={15} /> {b.contact.name}
                {b.contact.organization ? ` · ${b.contact.organization}` : ""}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} /> {hallLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarBlank size={15} /> {fmtDate(event)}
                {lastEventDate(b) !== event ? ` → ${fmtDate(lastEventDate(b))}` : ""}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            {!b.closed && b.status !== "completed" && (
              <div className={cn("flex items-center gap-2 rounded-xl border px-3 py-2", daysTo < 0 ? "border-crm-line" : daysTo <= 15 ? "border-[#FDE7C2] bg-[#FEF6E7] dark:bg-[#2B2010] dark:border-[#4A3510]" : "border-crm-line")}>
                <ClockCountdown size={20} className={daysTo <= 15 && daysTo >= 0 ? "text-[#DC6803]" : "text-crm-muted"} />
                <div>
                  <p className="text-[16px] font-bold leading-none text-crm-ink tabular">{daysTo < 0 ? Math.abs(daysTo) : daysTo}</p>
                  <p className="text-[11px] text-crm-muted">{daysTo < 0 ? "days ago" : daysTo === 0 ? "today" : "days to event"}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-xl border border-crm-line px-3 py-1.5">
              <ProgressRing value={paidPct} size={42} color={paidPct >= 100 ? "#12B76A" : "var(--crm-brand)"} />
              <div>
                <p className="text-[13px] font-semibold text-crm-ink tabular">{taka(est.received)}</p>
                <p className="text-[11px] text-crm-muted tabular">of {taka(est.grandTotal)}</p>
              </div>
            </div>
            {rep ? (
              <span className="flex items-center gap-2 rounded-xl border border-crm-line px-3 py-2" title="Assigned representative">
                <Avatar name={rep.name} color={rep.color} size={26} />
                <span className="text-[12.5px] text-crm-ink-2">{rep.name}</span>
              </span>
            ) : (
              <Badge tone="amber">Unassigned</Badge>
            )}
            {primary?.show && (
              <Button variant="primary" icon={primary.icon} onClick={(e) => primary.run(e)}>
                {primary.label}
              </Button>
            )}
            {b.status === "completed" && !b.closed && (
              <Badge tone="green" className="py-1.5">
                <CheckCircle size={14} weight="fill" /> Completed
              </Badge>
            )}
            <div ref={moreRef} className="relative">
              <Button variant="secondary" size="icon" aria-label="More actions" onClick={() => setMore((v) => !v)}>
                <DotsThreeVertical size={18} weight="bold" />
              </Button>
              <AnimatePresence>
                {more && (
                  <m.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute end-0 top-11 z-30 w-60 rounded-xl border border-crm-line bg-crm-surface p-1.5 shadow-[var(--crm-shadow-lg)]">
                    {[
                      { icon: Globe, label: "Client portal", show: can(me.role, "view", "portal") && !b.closed, run: openPortal },
                      { icon: ArrowsLeftRight, label: "Shift / postpone date", show: ws.canEdit && !b.closed && b.status !== "completed", run: () => setShiftOpen(true) },
                      {
                        icon: ArrowArcLeft,
                        label: `Move back to ${b.status === "completed" ? STATUS_LABELS.confirmed : STATUS_LABELS.requested}`,
                        show: isManager && b.status !== "requested" && !b.closed,
                        run: () => changeStatus(b, b.status === "completed" ? "confirmed" : "requested"),
                      },
                      {
                        icon: XCircle,
                        label: "Cancel booking",
                        show: ws.canEdit && !b.closed && b.status !== "completed",
                        run: async () => {
                          const r = await confirm({ title: "Cancel this booking?", description: b.status === "requested" ? "No cancellation charge for requests." : "A cancellation charge from the ICCB chart is calculated automatically.", tone: "danger", confirmLabel: "Cancel booking", reason: { label: "Reason", required: true } });
                          if (r.ok && r.reason) close.mutate({ kind: "cancelled", reason: r.reason });
                        },
                      },
                      {
                        icon: CalendarX,
                        label: "Mark as lost",
                        show: ws.canEdit && !b.closed && b.status === "requested",
                        run: async () => {
                          const r = await confirm({ title: "Mark as lost?", tone: "danger", confirmLabel: "Mark lost", reason: { label: "Lost reason", required: true, placeholder: "Budget, chose another venue, date not available…" } });
                          if (r.ok && r.reason) close.mutate({ kind: "lost", reason: r.reason });
                        },
                      },
                      { icon: Copy, label: "Duplicate booking", show: can(me.role, "create", "bookings"), run: () => dup.mutate(undefined) },
                      {
                        icon: Trash,
                        label: "Delete",
                        show: can(me.role, "delete", "bookings"),
                        danger: true,
                        run: async () => {
                          const r = await confirm({ title: `Delete ${b.bfNo}?`, description: "It moves to Trash and can be restored.", tone: "danger", confirmLabel: "Delete" });
                          if (r.ok) {
                            remove.mutate(b.id);
                            router.push("/dashboard/sales/bookings");
                          }
                        },
                      },
                    ]
                      .filter((x) => x.show)
                      .map((x) => (
                        <button
                          key={x.label}
                          onClick={() => {
                            setMore(false);
                            void x.run();
                          }}
                          className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-[13px] hover:bg-crm-surface-2", "danger" in x && x.danger ? "text-[#D92D20]" : "text-crm-ink-2")}
                        >
                          <x.icon size={16} /> {x.label}
                        </button>
                      ))}
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        {b.closed && (
          <p className="mt-4 rounded-lg bg-crm-surface-2 px-3 py-2 text-[13px] text-crm-ink-2">
            <strong className="text-crm-ink">{b.closed.kind === "cancelled" ? "Cancelled" : "Lost"}</strong> on {fmtDate(b.closed.at)} — {b.closed.reason}
            {b.closed.charge ? ` · Cancellation charge ${taka(b.closed.charge)}` : ""}
          </p>
        )}
        {b.shiftRequest?.status === "pending" && (
          <p className="mt-4 rounded-lg bg-[#FEF6E7] px-3 py-2 text-[13px] text-[#B54708] dark:bg-[#2B2010]">
            Shift to {fmtDate(b.shiftRequest.newDate)} requested — charge {taka(b.shiftRequest.charge)} ({b.shiftRequest.pct}%). Waiting for approval.
          </p>
        )}
      </m.div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)_300px]">
        <div className="order-2 lg:order-1">
          <StatusStepper />
        </div>
        <div className="order-1 min-w-0 lg:order-2">
          <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-5" />
          <AnimatePresence mode="wait" initial={false}>
            <m.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {tab === "overview" && <OverviewTab />}
              {tab === "services" && <ServicesTab />}
              {tab === "estimate" && <EstimateTab />}
              {tab === "payments" && <PaymentsTab />}
              {tab === "documents" && <DocumentsTab />}
              {tab === "ppm" && <PpmTab />}
              {tab === "event" && <EventDayTab />}
              {tab === "feedback" && <FeedbackTab />}
              {tab === "activity" && <ActivityTab />}
            </m.div>
          </AnimatePresence>
        </div>
        <div className="order-3 lg:col-span-2 2xl:col-span-1">
          <RightRail />
        </div>
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

function centerOf(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
