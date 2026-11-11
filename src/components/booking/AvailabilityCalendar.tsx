"use client";
import { useState, useCallback } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, isToday, isSameDay, getDay } from "date-fns";
import { ArrowLeft, ArrowRight, Lock, Clock } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { halls } from "@/data/halls";
import { getAvailability } from "@/data/availability";
import type { AvailabilitySlot, Shift } from "@/types";

interface AvailabilityCalendarProps {
  onSelect?: (date: string, shift: Shift, hallId: string) => void;
  initialHallId?: string;
  initialDate?: string;
}

const SHIFTS: { key: Shift; label: string }[] = [
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "fullday", label: "Full Day" },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function StatusIcon({ status }: { status: string }) {
  if (status === "reserved") return <Clock size={12} className="text-[var(--status-reserved-color)]" />;
  if (status === "booked") return <Lock size={12} className="text-[var(--status-booked-color)]" />;
  return null;
}

export function AvailabilityCalendar({ onSelect, initialHallId = "gulnaksha", initialDate }: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedHallId, setSelectedHallId] = useState(initialHallId);
  const [selectedShift, setSelectedShift] = useState<Shift>("fullday");
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate || null);

  const monthStr = format(currentMonth, "yyyy-MM");
  const slots = getAvailability(selectedHallId, monthStr);

  const getSlot = useCallback((date: string): AvailabilitySlot | undefined => {
    return slots.find((s) => s.date === date && s.shift === selectedShift);
  }, [slots, selectedShift]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startPadding = getDay(startOfMonth(currentMonth));

  const handleDayClick = (date: Date) => {
    if (isBefore(date, new Date()) && !isToday(date)) return;
    const dateStr = format(date, "yyyy-MM-dd");
    const slot = getSlot(dateStr);
    if (slot?.status === "booked") return;
    setSelectedDate(dateStr);
    onSelect?.(dateStr, selectedShift, selectedHallId);
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-none sm:rounded-[var(--radius-card)] p-4 sm:p-5 md:p-6">
      {/* Hall selector */}
      <div className="mb-5">
        <label className="meta-label block mb-2">Select Hall</label>
        <div className="flex flex-wrap gap-2">
          {halls.map((hall) => (
            <button
              key={hall.id}
              onClick={() => setSelectedHallId(hall.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors",
                selectedHallId === hall.id
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              )}
            >
              {hall.name.en}
            </button>
          ))}
        </div>
      </div>

      {/* Shift selector */}
      <div className="mb-5">
        <label className="meta-label block mb-2">Shift</label>
        <div className="flex gap-2">
          {SHIFTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSelectedShift(s.key)}
              className={cn(
                "px-4 py-2 rounded-full text-[12px] font-medium border transition-colors",
                selectedShift === s.key
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          aria-label="Previous month"
          className="w-8 h-8 flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors"
        >
          <ArrowLeft size={16} weight="light" />
        </button>
        <h3 className="font-medium text-[var(--ink)] text-[15px]">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          aria-label="Next month"
          className="w-8 h-8 flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors"
        >
          <ArrowRight size={16} weight="light" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {/* Day headers */}
        {DAY_NAMES.map((day) => (
          <div key={day} className="text-center text-[10px] text-[var(--ink-muted)] font-medium tracking-wider uppercase py-2">
            {day}
          </div>
        ))}

        {/* Empty cells for padding */}
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {/* Days */}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const slot = getSlot(dateStr);
          const status = slot?.status || "available";
          const isPast = isBefore(day, new Date()) && !isToday(day);
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(day)}
              disabled={status === "booked" || isPast}
              aria-label={`${format(day, "d MMMM")} - ${status}`}
              className={cn(
                "relative h-8 sm:h-10 w-full rounded sm:rounded-lg flex flex-col items-center justify-center gap-0.5 text-[11px] sm:text-[13px] font-medium transition-all",
                isPast && "opacity-30 cursor-not-allowed",
                !isPast && status === "available" && "hover:bg-[var(--bg-soft)] cursor-pointer",
                !isPast && status === "reserved" && "cursor-pointer",
                !isPast && status === "booked" && "cursor-not-allowed opacity-70",
                isSelected && "ring-2 ring-[var(--accent)] ring-offset-1",
                isToday(day) && "font-bold",
                status === "available" && !isPast && "bg-[var(--surface)] border border-[var(--line)]",
                status === "reserved" && "bg-[var(--status-reserved-bg)] border border-[var(--status-reserved-color)]/30",
                status === "booked" && "bg-[var(--status-booked-bg)] border border-[var(--status-booked-color)]/30",
              )}
            >
              <span className={cn(
                "leading-none",
                status === "reserved" && "text-[var(--status-reserved-color)]",
                status === "booked" && "text-[var(--status-booked-color)]",
                !["reserved", "booked"].includes(status) && "text-[var(--ink)]",
              )}>
                {format(day, "d")}
              </span>
              <StatusIcon status={status} />
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 pt-4 border-t border-[var(--line)]">
        {[
          { status: "available", label: "Available", color: "var(--line)" },
          { status: "reserved", label: "Reserved — on hold", color: "var(--status-reserved-color)" },
          { status: "booked", label: "Booked", color: "var(--status-booked-color)" },
        ].map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{
                background: item.status === "available" ? "var(--surface)" : item.status === "reserved" ? "var(--status-reserved-bg)" : "var(--status-booked-bg)",
                border: `1px solid ${item.color}`,
              }}
            />
            <span className="text-[11px] text-[var(--ink-muted)]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
