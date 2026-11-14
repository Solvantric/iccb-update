"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { CalendarBlank, CheckCircle, Clock, FilePdf, Handshake, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import type { Meeting, MeetingStatus } from "@/types/crm";
import { MEETING_STATUS_LABELS, MEETING_TYPES } from "@/types/crm";
import { addDays, format } from "date-fns";
import { DateRange, FilterSelect, FilterSummary, inRange, useFilters } from "../ui/filters";
import { Kpi } from "../ui/data";
import { Item, Stagger } from "../ui/motion";
import { useBookings, useMeetings } from "@/lib/crm/hooks";
import { fmtDate, fmtTime, todayYmd } from "@/lib/crm/format";
import { deleteMeeting, updateMeeting } from "@/services/crm";
import { pdfMeeting } from "@/lib/pdf/actions";
import { cn } from "@/lib/utils/cn";
import { Button, EmptyState, FilterRow, PageHeader, SearchInput } from "../ui/core";
import { Menu, useConfirm } from "../ui/overlay";
import { m } from "../ui/motion";
import { MeetingModal } from "../meetings/MeetingModal";

const STATUS_TONE: Record<MeetingStatus, string> = {
  scheduled: "bg-crm-reserved-bg text-crm-reserved-ink",
  done: "bg-crm-success-bg text-crm-success",
  cancelled: "bg-crm-closed-bg text-crm-muted",
};

export function MeetingsPage() {
  const meetings = useMeetings();
  const bookings = useBookings();
  const bookingMap = useMemo(() => new Map(bookings.map((b) => [b.id, b])), [bookings]);
  const confirm = useConfirm();
  const [modal, setModal] = useState<{ meeting?: Meeting } | null>(null);
  const today = todayYmd();

  const { f, set, reset, active } = useFilters({ q: "", status: "", type: "", rep: "", from: "", to: "" });
  const reps = useMemo(() => [...new Set(meetings.map((x) => x.rep || "Unassigned"))].sort(), [meetings]);
  const filtered = useMemo(() => {
    const n = f.q.trim().toLowerCase();
    return meetings.filter(
      (m) =>
        (!f.status || m.status === f.status) &&
        (!f.type || m.type === f.type) &&
        (!f.rep || m.rep === f.rep) &&
        inRange(m.date, f.from, f.to) &&
        (!n || [m.clientName, m.mobile, m.note, m.location, m.outcome, m.bookingId && bookingMap.get(m.bookingId)?.eventName].join(" ").toLowerCase().includes(n))
    );
  }, [meetings, f, bookingMap]);

  const groups = useMemo(() => {
    const asc = [...filtered].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    return [
      { title: "Today", items: asc.filter((x) => x.date === today) },
      { title: "Upcoming", items: asc.filter((x) => x.date > today) },
      { title: "Past", items: asc.filter((x) => x.date < today).reverse() },
    ];
  }, [filtered, today]);

  const kpi = useMemo(() => {
    const week = format(addDays(new Date(), 7), "yyyy-MM-dd");
    return {
      today: meetings.filter((m) => m.date === today && m.status === "scheduled").length,
      week: meetings.filter((m) => m.date > today && m.date <= week && m.status === "scheduled").length,
      ppm: meetings.filter((x) => x.type === "PPM").length,
      done: meetings.filter((m) => m.status === "done").length,
    };
  }, [meetings, today]);

  return (
    <>
      <PageHeader
        title="PPM — Meetings"
        description="Program preparation meetings, site visits, follow-up calls and final briefings."
        action={
          <Button variant="primary" icon={Plus} onClick={() => setModal({})}>
            New meeting
          </Button>
        }
      />
      <Stagger className="mb-6 grid grid-cols-2 gap-5 xl:grid-cols-4">
        <Item>
          <Kpi label="Today" value={kpi.today} icon={CalendarBlank} hint="Scheduled" />
        </Item>
        <Item>
          <Kpi label="Next 7 days" value={kpi.week} icon={Clock} />
        </Item>
        <Item>
          <Kpi label="PPMs" value={kpi.ppm} icon={Handshake} hint="Program preparation" />
        </Item>
        <Item>
          <Kpi label="Done" value={kpi.done} icon={CheckCircle} />
        </Item>
      </Stagger>
      <FilterRow>
        <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Client, event, note…" />
        <FilterSelect label="Status" all="Any status" value={f.status} onChange={(v) => set("status", v)} options={(Object.keys(MEETING_STATUS_LABELS) as MeetingStatus[]).map((x) => ({ value: x, label: MEETING_STATUS_LABELS[x] }))} />
        <FilterSelect label="Types" value={f.type} onChange={(v) => set("type", v)} options={MEETING_TYPES} />
        <FilterSelect label="Representatives" value={f.rep} onChange={(v) => set("rep", v)} options={reps} />
        <DateRange from={f.from} to={f.to} onFrom={(v) => set("from", v)} onTo={(v) => set("to", v)} label="Meeting date" />
      </FilterRow>
      <FilterSummary active={active} onClear={reset} count={filtered.length} noun="meeting" />
      {meetings.length === 0 ? (
        <div className="crm-card">
          <EmptyState icon={Handshake} text="No meetings yet." action={<Button onClick={() => setModal({})}>New meeting</Button>} />
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.title}>
              <h2 className="mb-2.5 flex items-center gap-2 text-[16px] font-semibold text-crm-ink">
                {g.title} <span className="text-[13px] font-normal text-crm-muted">{g.items.length}</span>
              </h2>
              {g.items.length === 0 ? (
                <p className="crm-card px-5 py-4 text-[13.5px] text-crm-muted">No meetings.</p>
              ) : (
                <ul className="crm-card divide-y divide-crm-line overflow-hidden">
                  <AnimatePresence initial={false}>
                    {g.items.map((mt) => {
                      const b = mt.bookingId ? bookingMap.get(mt.bookingId) : undefined;
                      return (
                        <m.li key={mt.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-crm-surface-2/60 md:flex-row md:items-center">
                          <div className="w-32 shrink-0">
                            <p className="text-[14px] font-medium text-crm-ink tabular">{fmtTime(mt.time)}</p>
                            <p className="text-[12.5px] text-crm-muted">{g.title === "Today" ? "Today" : fmtDate(mt.date, "EEE, d MMM")}</p>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-medium text-crm-ink">
                              {b ? (
                                <Link href={`/dashboard/bookings/${b.id}`} className="hover:underline">
                                  {mt.clientName}
                                </Link>
                              ) : (
                                mt.clientName
                              )}
                              <span className="font-normal text-crm-muted"> · {b?.eventName ?? "Walk-in"}</span>
                            </p>
                            <p className="truncate text-[13px] text-crm-muted">
                              <span className="text-crm-ink-2">{mt.type}</span> · {mt.rep}
                              {mt.location ? ` · ${mt.location}` : ""}
                              {mt.outcome ? ` · ✓ ${mt.outcome}` : mt.note ? ` · ${mt.note}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              aria-label="Meeting status"
                              value={mt.status}
                              onChange={(e) => {
                                updateMeeting(mt.id, { status: e.target.value as MeetingStatus });
                                toast.success(`Marked ${MEETING_STATUS_LABELS[e.target.value as MeetingStatus].toLowerCase()}`);
                              }}
                              className={cn("h-8 cursor-pointer rounded-full border-0 px-3 text-[12.5px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-crm-brand/20", STATUS_TONE[mt.status])}
                            >
                              {(Object.keys(MEETING_STATUS_LABELS) as MeetingStatus[]).map((s) => (
                                <option key={s} value={s}>
                                  {MEETING_STATUS_LABELS[s]}
                                </option>
                              ))}
                            </select>
                            <Button size="icon-sm" variant="ghost" aria-label="Meeting PDF" title="PDF" onClick={() => pdfMeeting(mt)}>
                              <FilePdf size={17} />
                            </Button>
                            <Menu
                              items={[
                                { label: "Edit", icon: PencilSimple, onClick: () => setModal({ meeting: mt }) },
                                {
                                  label: "Delete",
                                  icon: Trash,
                                  danger: true,
                                  onClick: async () => {
                                    if (await confirm({ title: "Delete this meeting?", confirmLabel: "Delete", danger: true })) {
                                      deleteMeeting(mt.id);
                                      toast("Meeting deleted");
                                    }
                                  },
                                },
                              ]}
                            />
                          </div>
                        </m.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
      <MeetingModal open={!!modal} onOpenChange={(v) => !v && setModal(null)} meeting={modal?.meeting} booking={modal?.meeting?.bookingId ? bookingMap.get(modal.meeting.bookingId) : undefined} />
    </>
  );
}
