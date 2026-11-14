"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, CalendarPlus, Check, Phone, Plus, Tray, WhatsappLogo, X } from "@phosphor-icons/react";
import type { Booking } from "@/types/crm";
import { useBookings, useHallMap, useHalls } from "@/lib/crm/hooks";
import { fmtDate, num, telHref, timeAgo, waHref } from "@/lib/crm/format";
import { toggleContacted } from "@/services/crm";
import { cn } from "@/lib/utils/cn";
import { Avatar, Button, EmptyState, FilterRow, LinkButton, PageHeader, SearchInput } from "../ui/core";
import { FilterSelect, FilterSummary, SortSelect, useFilters } from "../ui/filters";
import { EVENT_TYPES } from "@/types/crm";
import { m } from "../ui/motion";
import { useNewBooking } from "../bookings/NewBookingModal";
import { useBookingActions } from "../bookings/useBookingActions";
import { MeetingModal } from "../meetings/MeetingModal";

export function LeadsPage() {
  const bookings = useBookings();
  const halls = useHalls();
  const hallMap = useHallMap();
  const newBooking = useNewBooking();
  const actions = useBookingActions();
  const [meetFor, setMeetFor] = useState<Booking | null>(null);
  const { f, set, reset, active } = useFilters({ q: "", hall: "", type: "", contacted: "", sort: "newest" });

  const leads = useMemo(() => {
    const n = f.q.trim().toLowerCase();
    const list = bookings.filter(
      (b) =>
        b.status === "reserved" &&
        (!f.hall || b.hallId === f.hall) &&
        (!f.type || b.eventType === f.type) &&
        (!f.contacted || (f.contacted === "yes") === b.contacted) &&
        (!n || [b.name, b.mobile, b.eventName, b.ref, b.organization].join(" ").toLowerCase().includes(n))
    );
    return [...list].sort((a, b) => (f.sort === "event" ? a.date.localeCompare(b.date) : f.sort === "guests" ? b.guests - a.guests : f.sort === "oldest" ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)));
  }, [bookings, f]);

  return (
    <>
      <PageHeader
        title="Leads"
        description="New Reserved requests. Call the client, then confirm or cancel."
        action={
          <Button variant="primary" icon={Plus} onClick={() => newBooking()}>
            New booking
          </Button>
        }
      />
      <FilterRow>
        <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Search name, mobile, event…" />
        <FilterSelect label="Halls" value={f.hall} onChange={(v) => set("hall", v)} options={halls.map((h) => ({ value: h.id, label: h.name }))} />
        <FilterSelect label="Event types" value={f.type} onChange={(v) => set("type", v)} options={EVENT_TYPES} />
        <FilterSelect label="Contacted" all="Contacted or not" value={f.contacted} onChange={(v) => set("contacted", v)} options={[{ value: "no", label: "Not contacted yet" }, { value: "yes", label: "Contacted" }]} />
        <SortSelect value={f.sort} onChange={(v) => set("sort", v)} options={[{ value: "newest", label: "Newest request" }, { value: "oldest", label: "Oldest request" }, { value: "event", label: "Event date (soonest)" }, { value: "guests", label: "Most guests" }]} className="sm:ms-auto" />
      </FilterRow>
      <FilterSummary active={active} onClear={reset} count={leads.length} noun="lead" />

      {leads.length === 0 ? (
        <div className="crm-card">
          <EmptyState icon={Tray} text={active ? "No leads match your filters." : "No new leads right now. New website requests appear here."} action={<Button onClick={() => newBooking()}>New booking</Button>} />
        </div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {leads.map((b, i) => (
              <m.li key={b.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }} exit={{ opacity: 0, scale: 0.98 }} className="crm-card crm-card-hover p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <Avatar name={b.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <Link href={`/dashboard/bookings/${b.id}`} className="truncate text-[15px] font-semibold text-crm-ink hover:underline">
                          {b.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleContacted(b.id)}
                          aria-pressed={b.contacted}
                          className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2 text-[12px] font-medium transition-colors", b.contacted ? "bg-crm-success-bg text-crm-success" : "border border-dashed border-crm-line text-crm-muted hover:text-crm-ink")}
                        >
                          {b.contacted ? <Check size={12} weight="bold" /> : null}
                          {b.contacted ? "Contacted" : "Mark contacted"}
                        </button>
                        <span className="text-[12.5px] text-crm-muted">· {timeAgo(b.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[14px] text-crm-ink-2">
                        {b.eventName} <span className="text-crm-muted">· {b.eventType}</span>
                      </p>
                      <p className="mt-1 text-[13px] text-crm-muted">
                        {hallMap.get(b.hallId)?.name} · {fmtDate(b.date, "EEE, d MMM yyyy")} · {b.slot.split(" (")[0]} · {num(b.guests)} guests
                        {b.organization ? ` · ${b.organization}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <LinkButton href={telHref(b.mobile)} icon={Phone}>
                      Call
                    </LinkButton>
                    <LinkButton href={waHref(b.mobile, `Hello ${b.name}, this is ICCB about your booking ${b.ref}.`)} icon={WhatsappLogo} external>
                      WhatsApp
                    </LinkButton>
                    <Button size="sm" icon={CalendarPlus} onClick={() => setMeetFor(b)}>
                      Schedule meeting
                    </Button>
                    <Link href={`/dashboard/bookings/${b.id}`}>
                      <Button size="sm" variant="ghost">
                        Open <ArrowRight size={14} className="rtl:rotate-180" />
                      </Button>
                    </Link>
                    <Button size="icon-sm" variant="ghost" aria-label="Cancel booking" title="Cancel (frees the date)" onClick={() => actions.cancel(b)}>
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      <MeetingModal open={!!meetFor} onOpenChange={(v) => !v && setMeetFor(null)} booking={meetFor ?? undefined} />
    </>
  );
}
