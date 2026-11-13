"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { CalendarBlank, CaretLeft, CaretRight, Columns, GridFour, Rows, Plus } from "@phosphor-icons/react";
import type { Booking, Hall } from "@/types/crm";
import { db, useCurrentUser } from "@/lib/crm/db";
import { can } from "@/lib/crm/permissions";
import { firstEventDate, isPeakSeason, isWeekend, parseYmd } from "@/lib/crm/pricing";
import { DAY_STATE_LABEL, hallDayState, type DayState } from "@/lib/crm/availability";
import { fmtDate, taka, todayYmd } from "@/lib/crm/format";
import { requestShift, shiftPreview } from "@/services/crm/bookings.service";
import { useBookings, useCrmAction, useHalls } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { Item, Stagger } from "../ui/motion";
import { Badge, Button, Field, PageHeader, Segmented, Select, Skeleton, Textarea } from "../ui/core";
import { Modal } from "../ui/overlay";

type View = "month" | "week" | "timeline";
const ymd = (d: Date) => format(d, "yyyy-MM-dd");

const STATE_CLS: Record<DayState, string> = {
  free: "",
  tentative: "border-2 border-[#F59E0B] bg-[#FEF6E7] text-[#B54708] dark:bg-[#2B2010] dark:text-[#FDB022]",
  booked: "bg-crm-brand text-white border border-crm-brand",
  completed: "bg-[#E4E7EC] text-[#475467] border border-[#D0D5DD] dark:bg-[#2A2D33] dark:text-[#98A2B3] dark:border-[#333741]",
};

interface DragData {
  booking: Booking;
  date: string;
}

function Chip({ b, date, state, prep, compact, draggable }: { b: Booking; date: string; state: DayState; prep?: boolean; compact?: boolean; draggable: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `${b.id}|${date}`, data: { booking: b, date } satisfies DragData, disabled: !draggable });
  return (
    <Link
      ref={setNodeRef}
      href={`/dashboard/sales/bookings/${b.id}`}
      {...(draggable ? { ...attributes, ...listeners } : {})}
      title={`${b.eventTitle} · ${DAY_STATE_LABEL[state]}${prep ? " · preparation day" : ""}`}
      className={cn("block truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-4 transition-opacity", STATE_CLS[state], prep && "crm-striped", isDragging && "opacity-40", draggable && "cursor-grab active:cursor-grabbing touch-none")}
    >
      {compact ? b.eventTitle.split(" ")[0] : b.eventTitle}
    </Link>
  );
}

function DropCell({ id, children, className, onEmptyClick, empty }: { id: string; children?: React.ReactNode; className?: string; onEmptyClick?: () => void; empty: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} onClick={empty ? onEmptyClick : undefined} className={cn("group relative transition-colors", empty && onEmptyClick && "cursor-pointer hover:bg-crm-tint/50", isOver && "bg-crm-tint ring-2 ring-inset ring-crm-brand", className)}>
      {children}
      {empty && onEmptyClick && <Plus size={12} className="absolute inset-0 m-auto text-crm-brand opacity-0 transition-opacity group-hover:opacity-60" />}
    </div>
  );
}

function ShiftConfirm({ data, onClose }: { data: { booking: Booking; fromDate: string; toDate: string; hall: Hall }; onClose: () => void }) {
  const { booking: b, fromDate, toDate, hall } = data;
  const first = firstEventDate(b);
  const delta = Math.round((parseYmd(toDate).getTime() - parseYmd(fromDate).getTime()) / 86400000);
  const newFirst = ymd(addDays(parseYmd(first), delta));
  const preview = shiftPreview(b);
  const me = useCurrentUser();
  const isManager = me.role === "admin" || me.role === "sales_manager";
  const [reason, setReason] = useState("");
  const conflict = hallDayState(db.bookings.all(), hall.id, toDate, b.id);
  const go = useCrmAction(() => requestShift(b.id, newFirst, hall.id, reason), { success: isManager ? "Date shifted" : "Shift requested — waiting for approval", onSuccess: onClose });
  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      title={`Shift ${b.bfNo}?`}
      description={`${b.eventTitle}: ${fmtDate(first)} → ${fmtDate(newFirst)} · ${hall.name}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!reason.trim()} loading={go.isPending} onClick={() => go.mutate(undefined)}>
            {isManager ? "Shift now" : "Request approval"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {conflict.state !== "free" && (
          <Badge tone="red" dot>
            Target date is {DAY_STATE_LABEL[conflict.state].toLowerCase()}: {conflict.booking?.eventTitle}
          </Badge>
        )}
        <div className="rounded-xl border border-crm-line bg-crm-surface-2 p-4 text-[13px]">
          <div className="flex justify-between">
            <span className="text-crm-ink-2">Days before event (today)</span>
            <span className="tabular text-crm-ink">{preview.daysBefore}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-crm-ink-2">Venue rent</span>
            <span className="tabular text-crm-ink">{taka(preview.venueRent)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-crm-line pt-2 text-[14px]">
            <span className="font-semibold text-crm-ink">Shift charge ({preview.pct}%)</span>
            <span className="font-bold text-crm-brand tabular">{taka(preview.charge)}</span>
          </div>
        </div>
        <Field label="Reason" required>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

export function CalendarPage() {
  const router = useRouter();
  const me = useCurrentUser();
  const bookings = useBookings();
  const halls = useHalls();
  const [view, setView] = useState<View>("timeline");
  const [cursor, setCursor] = useState(() => new Date());
  const [hallFilter, setHallFilter] = useState("");
  const [shift, setShift] = useState<{ booking: Booking; fromDate: string; toDate: string; hall: Hall } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const canCreate = can(me.role, "create", "bookings");
  const canShift = can(me.role, "update", "bookings");
  const today = todayYmd();

  const hallList = useMemo(() => (halls.data ?? []).filter((h) => h.active && (!hallFilter || h.id === hallFilter)).sort((a, b) => a.order - b.order), [halls.data, hallFilter]);
  const live = useMemo(() => (bookings.data ?? []).filter((b) => !b.closed), [bookings.data]);

  const days = useMemo(() => {
    if (view === "week") return eachDayOfInterval({ start: startOfWeek(cursor, { weekStartsOn: 6 }), end: endOfWeek(cursor, { weekStartsOn: 6 }) });
    if (view === "month") return eachDayOfInterval({ start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 6 }), end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 6 }) });
    return eachDayOfInterval({ start: startOfMonth(cursor), end: endOfMonth(cursor) });
  }, [view, cursor]);

  const move = (dir: 1 | -1) => setCursor((c) => (view === "week" ? addDays(c, 7 * dir) : dir === 1 ? addMonths(c, 1) : subMonths(c, 1)));
  const newBooking = (hallId: string, date: string) => canCreate && date >= today && router.push(`/dashboard/sales/bookings/new?hall=${hallId}&date=${date}`);

  const onDragEnd = (e: DragEndEvent) => {
    const data = e.active.data.current as DragData | undefined;
    const over = e.over?.id ? String(e.over.id) : null;
    if (!data || !over) return;
    const [hallId, date] = over.split("|");
    if (!date || (date === data.date && hallId === data.booking.days.find((d) => d.date === data.date)?.hallId)) return;
    const hall = (halls.data ?? []).find((h) => h.id === hallId);
    if (hall) setShift({ booking: data.booking, fromDate: data.date, toDate: date, hall });
  };

  const title = view === "week" ? `${format(days[0], "dd MMM")} – ${format(days[days.length - 1], "dd MMM yyyy")}` : format(cursor, "MMMM yyyy");
  const loading = bookings.isLoading || halls.isLoading;

  return (
    <Stagger>
      <Item>
        <PageHeader
          eyebrow="Sales"
          title="Availability calendar"
          description="Tentative = requested (orange outline), booked = confirmed (red), completed (grey), preparation days striped. Click an empty day to book; drag a booking to shift it."
          actions={
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: "month", label: "Month", icon: GridFour },
                { value: "week", label: "Week", icon: Columns },
                { value: "timeline", label: "Hall timeline", icon: Rows },
              ]}
            />
          }
        />
      </Item>
      <Item>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button size="icon" onClick={() => move(-1)} aria-label="Previous">
            <CaretLeft size={16} className="rtl:rotate-180" />
          </Button>
          <Button size="icon" onClick={() => move(1)} aria-label="Next">
            <CaretRight size={16} className="rtl:rotate-180" />
          </Button>
          <Button size="sm" icon={CalendarBlank} onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <h2 className="ms-2 text-[17px] font-semibold text-crm-ink">{title}</h2>
          {isPeakSeason(cursor) && <Badge tone="brand">Dec–Jan peak rates</Badge>}
          <div className="ms-auto flex flex-wrap items-center gap-2">
            <Select value={hallFilter} onChange={setHallFilter} placeholder="All halls" options={(halls.data ?? []).map((h) => ({ value: h.id, label: h.name }))} className="w-auto min-w-[150px]" />
          </div>
        </div>
        <div className="mb-3 flex flex-wrap gap-3 text-[12px] text-crm-ink-2">
          {(["tentative", "booked", "completed"] as DayState[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={cn("h-3 w-5 rounded", STATE_CLS[s])} /> {DAY_STATE_LABEL[s]}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="crm-striped h-3 w-5 rounded border border-crm-line" /> Preparation day
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-5 rounded bg-crm-surface-2 border border-crm-line" /> Weekend (Thu–Sat)
          </span>
        </div>
      </Item>

      <Item>
        {loading ? (
          <Skeleton className="h-[520px] w-full rounded-xl" />
        ) : (
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            {view === "month" ? (
              <div className="crm-card overflow-hidden">
                <div className="grid grid-cols-7 border-b border-crm-line bg-crm-surface-2 text-center text-[12px] font-semibold text-crm-muted">
                  {days.slice(0, 7).map((d) => (
                    <div key={d.toISOString()} className="py-2">
                      {format(d, "EEE")}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {days.map((d) => {
                    const ds = ymd(d);
                    const items = live.flatMap((b) => b.days.filter((x) => x.date === ds && (!hallFilter || x.hallId === hallFilter)).map((x) => ({ b, day: x })));
                    return (
                      <DropCell key={ds} id={`${hallFilter || hallList[0]?.id}|${ds}`} empty={!items.length} onEmptyClick={() => newBooking(hallFilter || hallList[0]?.id, ds)} className={cn("min-h-[104px] border-b border-e border-crm-line p-1.5", !isSameMonth(d, cursor) && "opacity-40", isWeekend(d) && "bg-crm-surface-2/70")}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className={cn("grid h-6 w-6 place-items-center rounded-full text-[12px] font-semibold tabular", ds === today ? "bg-crm-brand text-white" : "text-crm-ink-2")}>{format(d, "d")}</span>
                          {isPeakSeason(d) && isWeekend(d) && <span className="text-[9px] font-bold uppercase text-crm-brand">peak</span>}
                        </div>
                        <div className="space-y-0.5">
                          {items.slice(0, 3).map(({ b, day }) => (
                            <Chip key={`${b.id}-${day.id}`} b={b} date={ds} state={b.status === "requested" ? "tentative" : b.status === "completed" ? "completed" : "booked"} prep={day.dayType === "preparation"} draggable={canShift && b.status !== "completed"} />
                          ))}
                          {items.length > 3 && <span className="block text-[11px] text-crm-muted">+{items.length - 3} more</span>}
                        </div>
                      </DropCell>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="crm-card overflow-hidden">
                <div className="crm-scroll overflow-x-auto">
                  <table className="w-full border-collapse text-[12px]">
                    <thead className="sticky top-0 z-10 bg-crm-surface-2">
                      <tr>
                        <th className="sticky start-0 z-20 min-w-[150px] border-b border-e border-crm-line bg-crm-surface-2 px-3 py-2 text-start font-semibold text-crm-muted">Hall</th>
                        {days.map((d) => {
                          const ds = ymd(d);
                          return (
                            <th key={ds} className={cn("border-b border-e border-crm-line px-1 py-1.5 text-center font-medium", view === "week" ? "min-w-[140px]" : "min-w-[44px]", isWeekend(d) ? "bg-crm-line/40 text-crm-ink" : "text-crm-muted", ds === today && "!bg-crm-tint text-crm-brand")}>
                              <div className="text-[10.5px] uppercase">{format(d, view === "week" ? "EEEE" : "EEEEE")}</div>
                              <div className="text-[13px] font-semibold tabular">{format(d, "d")}</div>
                              {isPeakSeason(d) && <div className="mx-auto mt-0.5 h-0.5 w-4 rounded bg-crm-brand" title="Dec–Jan peak" />}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {hallList.map((h) => (
                        <tr key={h.id}>
                          <th className="sticky start-0 z-[5] border-b border-e border-crm-line bg-crm-surface px-3 py-2 text-start">
                            <span className="block text-[13px] font-semibold text-crm-ink">{h.name}</span>
                            <span className="text-[11px] text-crm-muted">{h.number}</span>
                          </th>
                          {days.map((d) => {
                            const ds = ymd(d);
                            const st = hallDayState(live, h.id, ds);
                            return (
                              <td key={ds} className={cn("h-14 border-b border-e border-crm-line p-0.5 align-top", isWeekend(d) && "bg-crm-surface-2/60")}>
                                <DropCell id={`${h.id}|${ds}`} empty={st.state === "free"} onEmptyClick={() => newBooking(h.id, ds)} className="h-full min-h-[48px] rounded">
                                  {st.booking && <Chip b={st.booking} date={ds} state={st.state} prep={st.preparation} compact={view !== "week"} draggable={canShift && st.state !== "completed"} />}
                                  {st.booking && view === "week" && <span className="mt-0.5 block truncate px-1 text-[10.5px] text-crm-muted">{st.booking.contact.name} · {st.booking.guests.optimum} guests</span>}
                                </DropCell>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </DndContext>
        )}
      </Item>
      {shift && <ShiftConfirm data={shift} onClose={() => setShift(null)} />}
    </Stagger>
  );
}
