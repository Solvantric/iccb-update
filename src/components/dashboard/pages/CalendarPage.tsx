"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { CalendarBlank, CaretLeft, CaretRight, Plus } from "@phosphor-icons/react";
import type { Booking } from "@/types/crm";
import { useBookings, useHallMap, useHalls } from "@/lib/crm/hooks";
import { fmtDate, todayYmd } from "@/lib/crm/format";
import { cn } from "@/lib/utils/cn";
import { Button, EmptyState, FilterRow, PageHeader, SearchInput } from "../ui/core";
import { FilterSelect, useFilters } from "../ui/filters";
import { EVENT_TYPES, STATUS_LABELS } from "@/types/crm";
import { useIsMobile } from "../ui/overlay";
import { STATUS_STYLE, StatusLegend, StatusPill } from "../ui/status";
import { m } from "../ui/motion";
import { useNewBooking } from "../bookings/NewBookingModal";

const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarPage() {
  const bookings = useBookings();
  const halls = useHalls();
  const hallMap = useHallMap();
  const newBooking = useNewBooking();
  const mobile = useIsMobile();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const { f, set, reset, active } = useFilters({ q: "", hall: "", type: "", status: "" });
  const hall = f.hall;
  const today = todayYmd();

  const byDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const n = f.q.trim().toLowerCase();
      if (f.status ? b.status !== f.status : b.status === "cancelled") continue;
      if ((hall && b.hallId !== hall) || (f.type && b.eventType !== f.type)) continue;
      if (n && ![b.name, b.eventName, b.ref, b.organization].join(" ").toLowerCase().includes(n)) continue;
      map.set(b.date, [...(map.get(b.date) ?? []), b]);
    }
    return map;
  }, [bookings, hall, f]);
  const monthCount = useMemo(() => [...byDate.entries()].filter(([d]) => d.startsWith(format(month, "yyyy-MM"))).reduce((t, [, l]) => t + l.length, 0), [byDate, month]);

  const days = useMemo(() => eachDayOfInterval({ start: startOfWeek(month), end: endOfWeek(endOfMonth(month)) }), [month]);
  const monthKey = format(month, "yyyy-MM");
  const agenda = useMemo(() => [...byDate.entries()].filter(([d]) => d.startsWith(monthKey)).sort(([a], [b]) => a.localeCompare(b)), [byDate, monthKey]);

  const chip = (b: Booking) => (
    <Link
      key={b.id}
      href={`/dashboard/bookings/${b.id}`}
      onClick={(e) => e.stopPropagation()}
      title={`${b.name} · ${b.eventName} · ${hallMap.get(b.hallId)?.name}`}
      className={cn("block truncate rounded-[6px] border-s-[3px] px-1.5 py-0.5 text-[11.5px] font-medium leading-[18px] transition-colors duration-300 hover:brightness-95", STATUS_STYLE[b.status].chip || "border-s-crm-line text-crm-muted line-through")}
    >
      {b.name} · {b.eventName}
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Reserved, booked and closed dates for every hall."
        action={
          <Button variant="primary" icon={Plus} onClick={() => newBooking({ hallId: hall || undefined })}>
            New booking
          </Button>
        }
      />

      <FilterRow>
        <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Name, event, ref…" />
        <FilterSelect label="Halls" value={f.hall} onChange={(v) => set("hall", v)} options={halls.map((h) => ({ value: h.id, label: h.name }))} />
        <FilterSelect label="Status" all="Reserved, booked & closed" value={f.status} onChange={(v) => set("status", v)} options={(["reserved", "booked", "closed", "cancelled"] as const).map((x) => ({ value: x, label: STATUS_LABELS[x] }))} />
        <FilterSelect label="Event types" value={f.type} onChange={(v) => set("type", v)} options={EVENT_TYPES} />
        {active > 0 && (
          <Button size="sm" variant="ghost" onClick={reset}>
            Clear filters
          </Button>
        )}
      </FilterRow>
      <div className="crm-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-crm-line px-4 py-3 sm:px-5">
          <div className="flex items-center gap-1">
            <Button size="icon-sm" variant="ghost" aria-label="Previous month" onClick={() => setMonth((d) => addMonths(d, -1))}>
              <CaretLeft size={16} className="rtl:rotate-180" />
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label="Next month" onClick={() => setMonth((d) => addMonths(d, 1))}>
              <CaretRight size={16} className="rtl:rotate-180" />
            </Button>
          </div>
          <h2 className="min-w-[140px] text-[16px] font-semibold text-crm-ink">{format(month, "MMMM yyyy")}</h2>
          <Button size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>
            Today
          </Button>
          <div className="flex w-full items-center gap-3 sm:ms-auto sm:w-auto">
            <StatusLegend className="hidden md:flex" />
            <span className="text-[12.5px] text-crm-muted tabular">{monthCount} this month</span>
          </div>
        </div>
        <StatusLegend className="border-b border-crm-line px-4 py-2 md:hidden" />

        {mobile ? (
          agenda.length === 0 ? (
            <EmptyState icon={CalendarBlank} text="Nothing booked this month." action={<Button onClick={() => newBooking({ hallId: hall || undefined })}>New booking</Button>} />
          ) : (
            <ul className="divide-y divide-crm-line">
              {agenda.map(([date, list]) => (
                <li key={date} className="px-4 py-3">
                  <p className={cn("mb-2 text-[13px] font-medium", date === today ? "text-crm-info-ink" : "text-crm-muted")}>{fmtDate(date, "EEEE, d MMM")}</p>
                  <div className="space-y-2">
                    {list.map((b) => (
                      <Link key={b.id} href={`/dashboard/bookings/${b.id}`} className="flex items-center justify-between gap-3 rounded-[10px] border border-crm-line px-3 py-2.5">
                        <span className="min-w-0">
                          <span className="block truncate text-[14px] font-medium text-crm-ink">{b.name}</span>
                          <span className="block truncate text-[12.5px] text-crm-muted">
                            {b.eventName} · {hallMap.get(b.hallId)?.name}
                          </span>
                        </span>
                        <StatusPill status={b.status} />
                      </Link>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : (
          <m.div key={monthKey + hall} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <div className="grid grid-cols-7 border-b border-crm-line">
              {WEEK.map((d) => (
                <div key={d} className="px-3 py-2 text-[12.5px] font-medium text-crm-muted">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((d, i) => {
                const key = format(d, "yyyy-MM-dd");
                const list = byDate.get(key) ?? [];
                const inMonth = isSameMonth(d, month);
                const past = key < today;
                return (
                  <div
                    key={key}
                    role="button"
                    tabIndex={0}
                    aria-label={`${fmtDate(key)}: ${list.length ? `${list.length} booking(s)` : "free"}`}
                    onClick={() => !past && newBooking({ date: key, hallId: hall || undefined })}
                    onKeyDown={(e) => e.key === "Enter" && !past && newBooking({ date: key, hallId: hall || undefined })}
                    className={cn(
                      "group min-h-[112px] border-crm-line p-1.5 transition-colors",
                      i % 7 !== 6 && "border-e",
                      i < days.length - 7 && "border-b",
                      !inMonth && "bg-crm-surface-2/60",
                      past ? "cursor-default" : "cursor-pointer hover:bg-crm-surface-2/70"
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between px-1">
                      <span className={cn("grid h-6 min-w-6 place-items-center rounded-full text-[12.5px] tabular", key === today ? "crm-btn-primary font-semibold" : inMonth ? "text-crm-ink-2" : "text-crm-muted/60")}>{format(d, "d")}</span>
                      {!past && <Plus size={12} className="text-crm-muted opacity-0 transition-opacity group-hover:opacity-100" />}
                    </div>
                    <div className="space-y-1">
                      {list.slice(0, 3).map(chip)}
                      {list.length > 3 && <p className="px-1 text-[11px] text-crm-muted">+{list.length - 3} more</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </m.div>
        )}
      </div>
    </>
  );
}
