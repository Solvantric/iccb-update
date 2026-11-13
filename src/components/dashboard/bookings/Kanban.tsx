"use client";
import { useState } from "react";
import Link from "next/link";
import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { AnimatePresence } from "framer-motion";
import { CalendarBlank, Users } from "@phosphor-icons/react";
import type { BookingStatus } from "@/types/crm";
import { BOOKING_STATUSES, STATUS_LABELS } from "@/types/crm";
import { STATUS_COLORS } from "@/lib/crm/workflow";
import { fmtDate, takaShort } from "@/lib/crm/format";
import { cn } from "@/lib/utils/cn";
import { m } from "../ui/motion";
import { Avatar, Skeleton } from "../ui/core";
import { ClosedTag } from "../ui/status";
import { ProgressBar } from "../ui/kpi";
import { useStatusChange, type BookingRow } from "./shared";

function Card({ row, overlay }: { row: BookingRow; overlay?: boolean }) {
  const { b } = row;
  return (
    <div className={cn("crm-card p-3.5 select-none", overlay && "shadow-[var(--crm-shadow-lg)] ring-2 ring-crm-brand/30")}>
      <div className="flex items-start justify-between gap-2">
        <Link href={`/dashboard/sales/bookings/${b.id}`} onPointerDown={(e) => e.stopPropagation()} className="min-w-0 text-[13.5px] font-semibold leading-snug text-crm-ink hover:text-crm-brand">
          {b.eventTitle}
        </Link>
        {row.rep && <Avatar name={row.rep.name} color={row.rep.color} size={22} />}
      </div>
      <p className="mt-0.5 truncate text-[12px] text-crm-muted">
        {b.bfNo} · {b.contact.name}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-crm-ink-2">
        <span className="inline-flex items-center gap-1">
          <CalendarBlank size={13} /> {fmtDate(row.eventDate, "dd MMM")}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users size={13} /> {b.guests.optimum}
        </span>
        <span className="truncate">{row.hallLabel}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <ProgressBar value={row.paidPct} color={STATUS_COLORS[b.status]} className="h-1.5" />
        <span className="shrink-0 text-[11.5px] font-semibold text-crm-ink tabular">{takaShort(row.est.grandTotal)}</span>
      </div>
      {b.closed && <ClosedTag closed={b.closed} className="mt-2" />}
    </div>
  );
}

function DraggableCard({ row }: { row: BookingRow }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: row.id, data: { row }, disabled: !!row.b.closed });
  return (
    <m.div layout layoutId={`kb-${row.id}`} ref={setNodeRef} {...attributes} {...listeners} className={cn("cursor-grab active:cursor-grabbing touch-none", isDragging && "opacity-30")} transition={{ type: "spring", stiffness: 500, damping: 40 }}>
      <Card row={row} />
    </m.div>
  );
}

function Column({ status, rows, activeFrom }: { status: BookingStatus; rows: BookingRow[]; activeFrom?: BookingStatus }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const total = rows.reduce((s, r) => s + r.est.grandTotal, 0);
  return (
    <div ref={setNodeRef} className={cn("flex w-[300px] shrink-0 flex-col rounded-2xl border bg-crm-surface-2/70 transition-colors md:w-auto md:flex-1", isOver && activeFrom !== status ? "border-crm-brand bg-crm-tint/60" : "border-crm-line")}>
      <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[status] }} />
          <span className="text-[13.5px] font-semibold text-crm-ink">{STATUS_LABELS[status]}</span>
          <span className="rounded-full bg-crm-surface px-1.5 text-[11.5px] font-semibold text-crm-muted tabular">{rows.length}</span>
        </div>
        <span className="text-[12px] text-crm-muted tabular">{takaShort(total)}</span>
      </div>
      <div className="crm-scroll flex max-h-[calc(100vh-300px)] min-h-[200px] flex-col gap-2.5 overflow-y-auto px-3 pb-3">
        <AnimatePresence initial={false}>
          {rows.map((r) => (
            <DraggableCard key={r.id} row={r} />
          ))}
        </AnimatePresence>
        {rows.length === 0 && <p className="py-8 text-center text-[12.5px] text-crm-muted">Drop a booking here</p>}
      </div>
    </div>
  );
}

export function Kanban({ rows, loading }: { rows?: BookingRow[]; loading?: boolean }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  const [active, setActive] = useState<BookingRow | null>(null);
  const change = useStatusChange();

  if (loading || !rows)
    return (
      <div className="flex gap-4 overflow-x-auto">
        {BOOKING_STATUSES.map((s) => (
          <div key={s} className="w-[300px] shrink-0 space-y-3 rounded-2xl border border-crm-line p-3 md:flex-1">
            <Skeleton className="h-5 w-28" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    );

  const onStart = (e: DragStartEvent) => setActive((e.active.data.current as { row: BookingRow }).row);
  const onEnd = (e: DragEndEvent) => {
    const row = active;
    setActive(null);
    const target = e.over?.id as BookingStatus | undefined;
    if (!row || !target || target === row.b.status) return;
    const rect = e.over?.rect;
    void change(row.b, target, rect ? { x: rect.left + rect.width / 2, y: rect.top + 80 } : undefined);
  };

  return (
    <DndContext sensors={sensors} onDragStart={onStart} onDragEnd={onEnd} onDragCancel={() => setActive(null)}>
      <div className="crm-scroll -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {BOOKING_STATUSES.map((s) => (
          <Column key={s} status={s} activeFrom={active?.b.status} rows={rows.filter((r) => r.b.status === s).sort((a, b) => a.eventDate.localeCompare(b.eventDate))} />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.22,1,0.36,1)" }}>
        {active ? (
          <m.div initial={{ scale: 1 }} animate={{ scale: 1.03, rotate: -1.5 }} className="w-[290px]">
            <Card row={active} overlay />
          </m.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
