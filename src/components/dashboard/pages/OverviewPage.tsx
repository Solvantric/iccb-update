"use client";
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { ArrowRight, CalendarCheck, CalendarBlank, Handshake, Money, Plus, Tray } from "@phosphor-icons/react";
import { useCurrentUser } from "@/lib/crm/db";
import { useBills, useBookings, useEnquiries, useHallMap, useHalls, useMeetings, usePayments } from "@/lib/crm/hooks";
import { isBillPayment } from "@/types/crm";
import { fmtDate, fmtTime, money, timeAgo, todayYmd } from "@/lib/crm/format";
import { canSeePath } from "@/lib/crm/permissions";
import { Button, Card, CardTitle, EmptyState, FilterRow, PageHeader, Segmented } from "../ui/core";
import { FilterSelect } from "../ui/filters";
import { Kpi, SimpleBars } from "../ui/data";
import { Item, Stagger } from "../ui/motion";
import { MeetingPill } from "../ui/status";
import { useNewBooking } from "../bookings/NewBookingModal";
import { UnpaidDrawer } from "../bookings/UnpaidDrawer";

export function OverviewPage() {
  const user = useCurrentUser();
  const bookings = useBookings();
  const payments = usePayments();
  const meetings = useMeetings();
  const halls = useHallMap();
  const newBooking = useNewBooking();
  const allHalls = useHalls();
  const enquiries = useEnquiries();
  const today = todayYmd();
  const sales = canSeePath(user.role, "/dashboard/bookings");
  const [period, setPeriod] = useState<"this" | "last" | "year">("this");
  const [hall, setHall] = useState("");
  const [unpaidOpen, setUnpaidOpen] = useState(false);
  const inHall = useCallback((hallId?: string) => !hall || hallId === hall, [hall]);

  /** Selected period as a yyyy-MM-dd range. */
  const range = useMemo(() => {
    const now = new Date();
    if (period === "last") {
      const d = subMonths(now, 1);
      return { from: format(startOfMonth(d), "yyyy-MM-dd"), to: format(endOfMonth(d), "yyyy-MM-dd"), label: format(d, "MMMM") };
    }
    if (period === "year") return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31`, label: String(now.getFullYear()) };
    return { from: format(startOfMonth(now), "yyyy-MM-dd"), to: format(endOfMonth(now), "yyyy-MM-dd"), label: format(now, "MMMM") };
  }, [period]);
  const bookingHall = useMemo(() => new Map(bookings.map((b) => [b.id, b.hallId])), [bookings]);
  const dueBills = useBills(bookings);

  const stats = useMemo(
    () => ({
      leads: bookings.filter((b) => b.status === "reserved" && inHall(b.hallId)).length,
      booked: bookings.filter((b) => (b.status === "booked" || b.status === "closed") && inHall(b.hallId) && b.date >= range.from && b.date <= range.to).length,
      collected: payments.filter((p) => isBillPayment(p.kind) && inHall(bookingHall.get(p.bookingId)) && p.date >= range.from && p.date <= range.to).reduce((s, p) => s + p.amount, 0),
      meetingsToday: meetings.filter((m) => m.date === today && m.status !== "cancelled" && (!hall || (m.bookingId && bookingHall.get(m.bookingId) === hall))).length,
    }),
    [bookings, payments, meetings, today, range, inHall, hall, bookingHall]
  );

  const dues = useMemo(
    () =>
      bookings
        .filter((b) => (b.status === "booked" || b.status === "closed") && inHall(b.hallId) && (dueBills.get(b.id)?.due ?? 0) > 0)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5),
    [bookings, dueBills, inHall]
  );
  const latestEnquiries = useMemo(() => [...enquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5), [enquiries]);

  const upcoming = useMemo(() => bookings.filter((b) => b.status === "booked" && b.date >= today && inHall(b.hallId)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5), [bookings, today, inHall]);
  const todaysMeetings = useMemo(() => meetings.filter((m) => m.date === today).sort((a, b) => a.time.localeCompare(b.time)).slice(0, 5), [meetings, today]);
  const chart = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(new Date(), 5 - i)));
    return months.map((d) => {
      const key = format(d, "yyyy-MM");
      return { label: format(d, "MMM"), value: bookings.filter((b) => b.status !== "cancelled" && inHall(b.hallId) && b.createdAt.slice(0, 7) === key).length };
    });
  }, [bookings, inHall]);

  return (
    <>
      <PageHeader
        title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${user.name.split(" ")[0]}`}
        description={fmtDate(today, "EEEE, d MMMM yyyy")}
        action={
          sales && (
            <Button variant="primary" icon={Plus} onClick={() => newBooking()}>
              New booking
            </Button>
          )
        }
      />

      <FilterRow>
        <Segmented
          id="ov-period"
          value={period}
          onChange={setPeriod}
          options={[
            { value: "this", label: "This month" },
            { value: "last", label: "Last month" },
            { value: "year", label: "This year" },
          ]}
        />
        <FilterSelect label="Halls" value={hall} onChange={setHall} options={allHalls.map((h) => ({ value: h.id, label: h.name }))} />
      </FilterRow>
      <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Item>
          <Kpi label="New leads" value={stats.leads} icon={Tray} hint="Reserved, waiting in Leads" tone="warn" />
        </Item>
        <Item>
          <Kpi label={period === "year" ? "Booked this year" : period === "last" ? "Booked last month" : "Booked this month"} value={stats.booked} icon={CalendarCheck} hint={`Events in ${range.label}`} tone="good" />
        </Item>
        <Item>
          <Kpi label={`Collected · ${range.label}`} value={stats.collected} icon={Money} format={money} hint="Bill payments only" tone="good" />
        </Item>
        <Item>
          <Kpi label="Meetings today" value={stats.meetingsToday} icon={Handshake} tone="info" />
        </Item>
      </Stagger>

      <Stagger className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Item>
          <Card className="h-full">
            <CardTitle
              title="Upcoming events"
              action={
                sales && (
                  <Link href="/dashboard/calendar" className="inline-flex items-center gap-1 text-[13px] text-crm-muted hover:text-crm-ink">
                    Calendar <ArrowRight size={13} className="rtl:rotate-180" />
                  </Link>
                )
              }
            />
            {upcoming.length === 0 ? (
              <EmptyState icon={CalendarBlank} text="No booked events coming up." className="py-10" />
            ) : (
              <ul className="px-2 pb-3">
                {upcoming.map((b) => (
                  <li key={b.id}>
                    <Link href={sales ? `/dashboard/bookings/${b.id}` : "#"} className="flex items-center gap-4 rounded-[10px] px-3 py-2.5 transition-colors hover:bg-crm-surface-2">
                      <span className="grid w-12 shrink-0 text-center leading-tight">
                        <span className="text-[11px] uppercase text-crm-muted">{fmtDate(b.date, "MMM")}</span>
                        <span className="text-[18px] font-semibold text-crm-ink tabular">{fmtDate(b.date, "d")}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-crm-ink">{b.name}</span>
                        <span className="block truncate text-[12.5px] text-crm-muted">
                          {b.eventName} · {halls.get(b.hallId)?.name}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Item>
        <Item>
          <Card className="h-full">
            <CardTitle
              title="Today's meetings"
              action={
                sales && (
                  <Link href="/dashboard/operations/ppm" className="inline-flex items-center gap-1 text-[13px] text-crm-muted hover:text-crm-ink">
                    All meetings <ArrowRight size={13} className="rtl:rotate-180" />
                  </Link>
                )
              }
            />
            {todaysMeetings.length === 0 ? (
              <EmptyState icon={Handshake} text="No meetings today." className="py-10" />
            ) : (
              <ul className="px-2 pb-3">
                {todaysMeetings.map((mt) => (
                  <li key={mt.id} className="flex items-center gap-4 rounded-[10px] px-3 py-2.5">
                    <span className="w-16 shrink-0 text-[13.5px] font-medium text-crm-ink tabular">{fmtTime(mt.time)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] text-crm-ink">{mt.clientName}</span>
                      <span className="block truncate text-[12.5px] text-crm-muted">
                        {mt.rep}
                        {mt.note ? ` · ${mt.note}` : ""}
                      </span>
                    </span>
                    <MeetingPill status={mt.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Item>
      </Stagger>

      {sales && (
        <Stagger className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Item>
            <Card className="h-full">
              <CardTitle
                title="Unpaid amount"
                action={
                  <button type="button" onClick={() => setUnpaidOpen(true)} className="inline-flex items-center gap-1 text-[13px] font-medium text-crm-info-ink hover:underline">
                    See who owes <ArrowRight size={13} className="rtl:rotate-180" />
                  </button>
                }
              />
              {dues.length === 0 ? (
                <EmptyState icon={Money} text="Every booked event is fully paid." className="py-10" />
              ) : (
                <ul className="px-2 pb-3">
                  {dues.map((b) => (
                    <li key={b.id}>
                      <Link href={`/dashboard/bookings/${b.id}`} className="flex items-center justify-between gap-4 rounded-[10px] px-3 py-2.5 transition-colors hover:bg-crm-surface-2">
                        <span className="min-w-0">
                          <span className="block truncate text-[14px] font-medium text-crm-ink">{b.eventName}</span>
                          <span className="block truncate text-[12.5px] text-crm-muted">
                            {b.name} · {fmtDate(b.date)}
                          </span>
                        </span>
                        <span className="shrink-0 text-[14px] font-medium text-crm-danger tabular">{money(dueBills.get(b.id)?.due ?? 0)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Item>
          <Item>
            <Card className="h-full">
              <CardTitle
                title="Latest enquiries"
                action={
                  <Link href="/dashboard/enquiries" className="inline-flex items-center gap-1 text-[13px] text-crm-muted hover:text-crm-ink">
                    Enquiries <ArrowRight size={13} className="rtl:rotate-180" />
                  </Link>
                }
              />
              <ul className="px-2 pb-3">
                {latestEnquiries.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 rounded-[10px] px-3 py-2.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${e.seen ? "bg-crm-line" : "bg-crm-info"}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] text-crm-ink">{e.name}</span>
                      <span className="block truncate text-[12.5px] text-crm-muted">
                        {e.source} · {e.message.split("\n")[0]}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12px] text-crm-muted">{timeAgo(e.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Item>
        </Stagger>
      )}

      <Card className="mt-6">
        <CardTitle title="Bookings per month" action={<span className="text-[12.5px] text-crm-muted">Last 6 months</span>} />
        <div className="px-3 pb-4">
          <SimpleBars data={chart} />
        </div>
      </Card>
      <UnpaidDrawer open={unpaidOpen} onOpenChange={setUnpaidOpen} />
    </>
  );
}
