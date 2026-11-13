"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek, addMonths, subMonths } from "date-fns";
import { AnimatePresence } from "framer-motion";
import { ArrowsClockwise, CalendarBlank, CaretLeft, CaretRight, CheckCircle, Circle, Clock, ListChecks, PencilSimple, Plus, Repeat, Trash } from "@phosphor-icons/react";
import type { Task, TaskType } from "@/types/crm";
import { TASK_TYPE_LABELS, TASK_TYPES } from "@/types/crm";
import { db, useCurrentUser } from "@/lib/crm/db";
import { ago, fmtDate, fmtDateTime } from "@/lib/crm/format";
import { firstEventDate, parseYmd } from "@/lib/crm/pricing";
import { completeTask, snoozeTask } from "@/services/crm/sales.service";
import { useBookings, useCrmAction, useCrmRemove, useTasks, useUsers } from "@/services/crm/hooks";
import { withLatency } from "@/services/crm/base";
import { cn } from "@/lib/utils/cn";
import { m, Item, Stagger } from "../ui/motion";
import { Avatar, Badge, Button, EmptyState, PageHeader, SearchInput, Segmented, Select, Skeleton, type Tone } from "../ui/core";
import { KpiCard } from "../ui/kpi";
import { TaskFormModal } from "../forms/QuickForms";

const TYPE_TONE: Record<TaskType, Tone> = { call: "blue", meeting: "purple", follow_up: "neutral", balance_due: "amber", document_due: "amber", ppm_due: "brand", refund_due: "green", repeat_event: "brand" };

export function FollowUpsPage() {
  const me = useCurrentUser();
  const tasks = useTasks();
  const users = useUsers();
  const bookings = useBookings();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [scope, setScope] = useState<"mine" | "all">(me.role === "admin" || me.role === "sales_manager" ? "all" : "mine");
  const [when, setWhen] = useState<"overdue" | "today" | "upcoming" | "done" | "open">("open");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(() => new Date());
  const [form, setForm] = useState<{ task?: Task; key: number } | null>(null);
  const done = useCrmAction((a: { id: string; v: boolean }) => completeTask(a.id, a.v), { success: (t) => (t.status === "done" ? "Done ✓" : "Reopened") });
  const snooze = useCrmAction((a: { id: string; days: number }) => snoozeTask(a.id, a.days), { success: (t) => `Snoozed to ${fmtDate(t.dueAt)}` });
  const remove = useCrmRemove("tasks", "Task");
  const scan = useCrmAction(
    () =>
      withLatency(() => {
        // Annual events: completed corporate / exhibition / convocation bookings → remind 2 months before the anniversary.
        let n = 0;
        for (const b of db.bookings.active()) {
          if (b.status !== "completed" || b.clientType === "personal") continue;
          if (db.tasks.active().some((t) => t.bookingId === b.id && t.type === "repeat_event")) continue;
          const due = addDays(parseYmd(firstEventDate(b)), 300);
          db.tasks.create({ title: `Repeat event: ${b.eventTitle} — reach out for next edition`, type: "repeat_event", dueAt: due.toISOString(), status: "open", assignedTo: b.assignedTo, bookingId: b.id, clientId: b.clientId, auto: true });
          n++;
        }
        return n;
      }),
    { success: (n) => (n ? `${n} repeat-event reminder${n > 1 ? "s" : ""} created` : "No new repeat events found") }
  );

  const nowIso = useMemo(() => new Date().toISOString(), [tasks.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const todayStr = nowIso.slice(0, 10);

  const visible = useMemo(() => {
    return (tasks.data ?? [])
      .filter((t) => scope === "all" || t.assignedTo === me.id)
      .filter((t) => !type || t.type === type)
      .filter((t) => !q || t.title.toLowerCase().includes(q.toLowerCase()));
  }, [tasks.data, scope, me.id, type, q]);

  const filtered = useMemo(() => {
    return visible
      .filter((t) => {
        if (when === "done") return t.status === "done";
        if (t.status === "done") return false;
        if (when === "overdue") return t.dueAt < nowIso;
        if (when === "today") return t.dueAt.slice(0, 10) === todayStr;
        if (when === "upcoming") return t.dueAt >= nowIso;
        return true;
      })
      .sort((a, b) => (when === "done" ? b.updatedAt.localeCompare(a.updatedAt) : a.dueAt.localeCompare(b.dueAt)));
  }, [visible, when, nowIso, todayStr]);

  const stats = {
    overdue: visible.filter((t) => t.status === "open" && t.dueAt < nowIso).length,
    today: visible.filter((t) => t.status === "open" && t.dueAt.slice(0, 10) === todayStr).length,
    week: visible.filter((t) => t.status === "open" && t.dueAt >= nowIso && t.dueAt <= addDays(new Date(nowIso), 7).toISOString()).length,
    repeat: visible.filter((t) => t.status === "open" && t.type === "repeat_event").length,
  };

  const userOf = (id?: string) => users.data?.find((u) => u.id === id);
  const bookingOf = (id?: string) => bookings.data?.find((b) => b.id === id);

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 6 }), end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 6 }) });

  return (
    <Stagger>
      <Item>
        <PageHeader
          eyebrow="Sales"
          title="Follow-ups"
          description="Calls, meetings and reminders — balance due, documents, PPM, refunds and repeat events. Auto-created by the booking flow."
          actions={
            <>
              <Segmented value={view} onChange={setView} options={[{ value: "list", label: "List", icon: ListChecks }, { value: "calendar", label: "Calendar", icon: CalendarBlank }]} />
              <Button icon={Repeat} loading={scan.isPending} onClick={() => scan.mutate(undefined)}>
                Scan repeat events
              </Button>
              <Button variant="primary" icon={Plus} onClick={() => setForm({ key: Date.now() })}>
                New task
              </Button>
            </>
          }
        />
      </Item>
      <Item>
        <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Overdue" value={stats.overdue} icon={Clock} tone="brand" loading={tasks.isLoading} />
          <KpiCard label="Due today" value={stats.today} icon={CalendarBlank} tone="amber" loading={tasks.isLoading} />
          <KpiCard label="Next 7 days" value={stats.week} icon={ListChecks} tone="blue" loading={tasks.isLoading} />
          <KpiCard label="Repeat events" value={stats.repeat} icon={ArrowsClockwise} tone="green" loading={tasks.isLoading} />
        </div>
      </Item>
      <Item>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Segmented size="sm" value={scope} onChange={setScope} options={[{ value: "mine", label: "Mine" }, { value: "all", label: "Everyone" }]} />
          {view === "list" && (
            <Segmented
              size="sm"
              value={when}
              onChange={setWhen}
              options={[
                { value: "open", label: "All open" },
                { value: "overdue", label: `Overdue${stats.overdue ? ` (${stats.overdue})` : ""}` },
                { value: "today", label: "Today" },
                { value: "upcoming", label: "Upcoming" },
                { value: "done", label: "Done" },
              ]}
            />
          )}
          <Select value={type} onChange={setType} placeholder="All types" options={TASK_TYPES.map((t) => ({ value: t, label: TASK_TYPE_LABELS[t] }))} className="w-auto min-w-[140px]" />
          <SearchInput value={q} onChange={setQ} className="w-full sm:ms-auto sm:w-60" />
        </div>
      </Item>
      <Item>
        {tasks.isLoading ? (
          <Skeleton className="h-96 rounded-xl" />
        ) : view === "list" ? (
          <div className="crm-card overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState icon={CheckCircle} title={when === "overdue" ? "Nothing overdue 🎉" : "No tasks here"} description="Tasks are created automatically from bookings, leads and the radar." />
            ) : (
              <ul className="divide-y divide-crm-line">
                <AnimatePresence initial={false}>
                  {filtered.map((t) => {
                    const overdue = t.status === "open" && t.dueAt < nowIso;
                    const b = bookingOf(t.bookingId);
                    const u = userOf(t.assignedTo);
                    return (
                      <m.li key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="group flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-crm-surface-2">
                        <button onClick={() => done.mutate({ id: t.id, v: t.status !== "done" })} className={cn("shrink-0", t.status === "done" ? "text-[#12B76A]" : "text-crm-muted hover:text-[#12B76A]")} aria-label="Toggle done">
                          {t.status === "done" ? <CheckCircle size={22} weight="fill" /> : <Circle size={22} />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-[13.5px] text-crm-ink", t.status === "done" && "text-crm-muted line-through")}>{t.title}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-crm-muted">
                            <Badge tone={TYPE_TONE[t.type]}>{TASK_TYPE_LABELS[t.type]}</Badge>
                            <span className={cn(overdue && "font-semibold text-[#D92D20]")} title={fmtDateTime(t.dueAt)}>
                              {overdue ? "Overdue · " : ""}
                              {fmtDateTime(t.dueAt)} ({ago(t.dueAt)})
                            </span>
                            {b && (
                              <Link href={`/dashboard/sales/bookings/${b.id}`} className="text-crm-brand hover:underline">
                                {b.bfNo}
                              </Link>
                            )}
                            {t.notes && <span className="truncate max-w-[280px]">{t.notes}</span>}
                          </p>
                        </div>
                        {u && <Avatar name={u.name} color={u.color} size={26} />}
                        {t.status === "open" && (
                          <Select value="" onChange={(v) => v && snooze.mutate({ id: t.id, days: Number(v) })} placeholder="Snooze…" options={[{ value: "1", label: "1 day" }, { value: "3", label: "3 days" }, { value: "7", label: "1 week" }]} className="h-8 w-[110px] text-[12px]" />
                        )}
                        <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setForm({ task: t, key: Date.now() })}>
                          <PencilSimple size={15} />
                        </Button>
                        <Button size="icon-sm" variant="ghost" aria-label="Delete" onClick={() => remove.mutate(t.id)}>
                          <Trash size={15} />
                        </Button>
                      </m.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>
        ) : (
          <div className="crm-card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-crm-line px-4 py-3">
              <Button size="icon-sm" onClick={() => setCursor((c) => subMonths(c, 1))} aria-label="Previous month">
                <CaretLeft size={14} />
              </Button>
              <Button size="icon-sm" onClick={() => setCursor((c) => addMonths(c, 1))} aria-label="Next month">
                <CaretRight size={14} />
              </Button>
              <span className="ms-2 text-[15px] font-semibold text-crm-ink">{format(cursor, "MMMM yyyy")}</span>
            </div>
            <div className="grid grid-cols-7 border-b border-crm-line bg-crm-surface-2 text-center text-[12px] font-semibold text-crm-muted">
              {days.slice(0, 7).map((d) => (
                <div key={d.toISOString()} className="py-2">
                  {format(d, "EEE")}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((d) => {
                const ds = format(d, "yyyy-MM-dd");
                const items = visible.filter((t) => t.dueAt.slice(0, 10) === ds);
                return (
                  <div key={ds} className={cn("min-h-[96px] border-b border-e border-crm-line p-1.5", !isSameMonth(d, cursor) && "opacity-40")}>
                    <span className={cn("mb-1 grid h-6 w-6 place-items-center rounded-full text-[12px] font-semibold", ds === todayStr ? "bg-crm-brand text-white" : "text-crm-ink-2")}>{format(d, "d")}</span>
                    {items.slice(0, 3).map((t) => (
                      <button key={t.id} onClick={() => setForm({ task: t, key: Date.now() })} className={cn("mb-0.5 block w-full truncate rounded px-1.5 py-0.5 text-start text-[11px]", t.status === "done" ? "bg-crm-surface-2 text-crm-muted line-through" : t.dueAt < nowIso ? "bg-[#FEF3F2] text-[#B42318]" : "bg-crm-tint text-crm-brand")}>
                        {t.title}
                      </button>
                    ))}
                    {items.length > 3 && <span className="text-[11px] text-crm-muted">+{items.length - 3}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Item>
      {form && <TaskFormModal key={form.key} open task={form.task} onOpenChange={(v) => !v && setForm(null)} />}
    </Stagger>
  );
}
