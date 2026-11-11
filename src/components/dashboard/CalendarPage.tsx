"use client";
import { useState, useEffect } from "react";
import { CaretLeft, CaretRight, CalendarCheck, MapPin } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { getAllBookings } from "@/data/bookings";
import { halls } from "@/data/halls";
import type { Booking } from "@/types";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const STATUS_DOT: Record<string, string> = {
  confirmed: "bg-green-500",
  on_hold: "bg-yellow-500",
  pending_hold: "bg-blue-500",
  cancelled: "bg-red-400",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setBookings(getAllBookings());
  }, []);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const bookingsForDay = (day: number): Booking[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return bookings.filter((b) => b.date === dateStr);
  };

  const selectedBookings = selected ? bookings.filter((b) => b.date === selected) : [];

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-[var(--ink)] font-light uppercase">Event Calendar</h1>
        <p className="text-[var(--ink-muted)] text-[13px] mt-0.5">Monthly view of all bookings and events</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="xl:col-span-2 bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)]">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-[var(--bg-soft)] transition-colors">
              <CaretLeft size={16} className="text-[var(--ink-muted)]" />
            </button>
            <h2 className="font-display text-lg text-[var(--ink)] font-light uppercase">
              {MONTHS[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-[var(--bg-soft)] transition-colors">
              <CaretRight size={16} className="text-[var(--ink-muted)]" />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 border-b border-[var(--line)]">
            {DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-[11px] font-medium text-[var(--ink-muted)] uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              const dayBookings = day ? bookingsForDay(day) : [];
              const dateStr = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : null;
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isSelected = dateStr === selected;

              return (
                <div
                  key={idx}
                  onClick={() => day && setSelected(isSelected ? null : dateStr)}
                  className={cn(
                    "min-h-[80px] p-2 border-b border-e border-[var(--line)] last:border-e-0 cursor-pointer transition-colors",
                    day ? "hover:bg-[var(--bg-soft)]" : "bg-[var(--bg-soft)]/40",
                    isSelected && "bg-[var(--accent)]/5 ring-1 ring-inset ring-[var(--accent)]/30"
                  )}
                >
                  {day && (
                    <>
                      <span className={cn(
                        "text-[12px] font-medium w-6 h-6 flex items-center justify-center rounded-full",
                        isToday ? "bg-[var(--accent)] text-white" : "text-[var(--ink)]"
                      )}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayBookings.slice(0, 2).map((b) => (
                          <div key={b.id} className={cn("text-[9px] px-1.5 py-0.5 rounded truncate font-medium",
                            b.status === "confirmed" ? "bg-green-500/15 text-green-700 dark:text-green-400" :
                            b.status === "on_hold" ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400" :
                            "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                          )}>
                            {halls.find((h) => h.id === b.hallId)?.name.en.split(" ")[0] || "Hall"}
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <div className="text-[9px] text-[var(--ink-muted)]">+{dayBookings.length - 2} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4">
            <h3 className="text-[11px] font-medium text-[var(--ink-muted)] uppercase tracking-wider mb-3">Status Legend</h3>
            {Object.entries(STATUS_DOT).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2 mb-2">
                <div className={cn("w-2.5 h-2.5 rounded-full", color)} />
                <span className="text-[12px] text-[var(--ink)] capitalize">{status.replace("_", " ")}</span>
              </div>
            ))}
          </div>

          {/* Selected day */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 flex-1">
            <h3 className="text-[11px] font-medium text-[var(--ink-muted)] uppercase tracking-wider mb-3">
              {selected ? `Events on ${selected}` : "Select a date"}
            </h3>
            {selectedBookings.length === 0 ? (
              <p className="text-[var(--ink-muted)] text-[13px]">
                {selected ? "No bookings on this date." : "Click a date to see events."}
              </p>
            ) : (
              <div className="space-y-3">
                {selectedBookings.map((b) => (
                  <div key={b.id} className="border border-[var(--line)] rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={cn("w-2 h-2 rounded-full", STATUS_DOT[b.status] || "bg-gray-400")} />
                      <span className="text-[12px] font-medium text-[var(--ink)] uppercase">{b.referenceNumber}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[var(--ink-muted)] text-[12px] mb-1">
                      <MapPin size={12} />
                      <span>{halls.find((h) => h.id === b.hallId)?.name.en || b.hallId}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[var(--ink-muted)] text-[12px]">
                      <CalendarCheck size={12} />
                      <span className="capitalize">{b.eventType} · {b.shift}</span>
                    </div>
                    {b.guests && (
                      <p className="text-[11px] text-[var(--ink-muted)] mt-1">{b.guests.toLocaleString()} guests</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly summary */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4">
            <h3 className="text-[11px] font-medium text-[var(--ink-muted)] uppercase tracking-wider mb-3">
              {MONTHS[month]} Summary
            </h3>
            {(() => {
              const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
              const monthBookings = bookings.filter((b) => b.date.startsWith(monthStr));
              return (
                <div className="space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[var(--ink-muted)]">Total events</span>
                    <span className="text-[var(--ink)] font-medium">{monthBookings.length}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[var(--ink-muted)]">Confirmed</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {monthBookings.filter((b) => b.status === "confirmed").length}
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[var(--ink-muted)]">On Hold</span>
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                      {monthBookings.filter((b) => b.status === "on_hold").length}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
