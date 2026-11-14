"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Booking, Meeting, MeetingType } from "@/types/crm";
import { MEETING_TYPES, validateContact } from "@/types/crm";
import { useBookings, useUsers } from "@/lib/crm/hooks";
import { useCurrentUser } from "@/lib/crm/db";
import { fmtDate, todayYmd } from "@/lib/crm/format";
import { createMeeting, updateMeeting } from "@/services/crm";
import { Button, Field, Input, Select, Textarea } from "../ui/core";
import { Modal } from "../ui/overlay";
import { DatePicker } from "../ui/DatePicker";

/**
 * Schedule (or edit) a meeting. With `booking` the client is fixed (Leads /
 * Booking detail); without it, staff pick a booking or type a walk-in client.
 */
export function MeetingModal({ open, onOpenChange, booking, meeting }: { open: boolean; onOpenChange: (v: boolean) => void; booking?: Booking; meeting?: Meeting }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={meeting ? "Edit meeting" : "Schedule meeting"} description={booking ? `${booking.name} · ${booking.eventName}` : undefined}>
      {open && <MeetingForm booking={booking} meeting={meeting} onDone={() => onOpenChange(false)} />}
    </Modal>
  );
}

function MeetingForm({ booking, meeting, onDone }: { booking?: Booking; meeting?: Meeting; onDone: () => void }) {
  const me = useCurrentUser();
  const users = useUsers().filter((u) => u.active && u.role !== "marketing");
  const bookings = useBookings();
  const [bookingId, setBookingId] = useState(meeting?.bookingId ?? booking?.id ?? "");
  const [q, setQ] = useState("");
  const [client, setClient] = useState({ name: meeting?.clientName ?? "", mobile: meeting?.mobile ?? "" });
  const [date, setDate] = useState(meeting?.date ?? todayYmd());
  const [time, setTime] = useState(meeting?.time ?? "11:00");
  const [rep, setRep] = useState(meeting?.rep && meeting.rep !== "Unassigned" ? meeting.rep : me.role === "marketing" ? (users[0]?.name ?? "") : me.name);
  const [note, setNote] = useState(meeting?.note ?? "");
  const [type, setType] = useState<MeetingType>(meeting?.type ?? (booking?.status === "booked" ? "PPM" : "Site visit"));
  const [location, setLocation] = useState(meeting?.location ?? "");
  const [outcome, setOutcome] = useState(meeting?.outcome ?? "");

  const linked = bookings.find((b) => b.id === bookingId);
  const matches = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return [];
    return bookings.filter((b) => b.status !== "cancelled" && [b.name, b.mobile, b.ref, b.eventName].join(" ").toLowerCase().includes(n)).slice(0, 5);
  }, [q, bookings]);

  const save = () => {
    const name = linked?.name ?? client.name;
    const mobile = linked?.mobile ?? client.mobile;
    const err = validateContact(name, mobile);
    if (err) return toast.error(err);
    if (!date || !time) return toast.error("Please pick a date and time.");
    const data = { bookingId: linked?.id, clientName: name, mobile, type, date, time, rep: rep || "Unassigned", location: location.trim() || undefined, note: note.trim() || undefined, outcome: outcome.trim() || undefined };
    if (meeting) updateMeeting(meeting.id, data);
    else createMeeting(data);
    toast.success(meeting ? "Meeting updated" : `Meeting scheduled for ${fmtDate(date)}`);
    onDone();
  };

  return (
    <div className="space-y-4">
      {!booking && (
        <Field label="Client / booking">
          {linked ? (
            <div className="flex items-center justify-between gap-3 rounded-[8px] border border-crm-line bg-crm-surface-2 px-3 py-2">
              <span className="min-w-0 text-[14px]">
                <span className="block truncate font-medium text-crm-ink">{linked.name}</span>
                <span className="block truncate text-[12.5px] text-crm-muted">
                  {linked.ref} · {linked.eventName}
                </span>
              </span>
              <Button size="sm" variant="ghost" onClick={() => setBookingId("")}>
                Change
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a booking by name, mobile or ref…" />
              {matches.length > 0 && (
                <div className="rounded-[8px] border border-crm-line p-1">
                  {matches.map((b) => (
                    <button key={b.id} type="button" onClick={() => setBookingId(b.id)} className="block w-full rounded-[6px] px-3 py-2 text-start text-[13.5px] hover:bg-crm-surface-2">
                      <span className="font-medium text-crm-ink">{b.name}</span> <span className="text-crm-muted">· {b.eventName}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input value={client.name} onChange={(e) => setClient((c) => ({ ...c, name: e.target.value }))} placeholder="…or walk-in client name" />
                <Input value={client.mobile} onChange={(e) => setClient((c) => ({ ...c, mobile: e.target.value }))} placeholder="Mobile" type="tel" />
              </div>
            </div>
          )}
        </Field>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Date" required className="sm:col-span-1">
          <DatePicker value={date} onChange={setDate} />
        </Field>
        <Field label="Time" required>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
        <Field label="Representative">
          <Select value={rep} onChange={setRep} placeholder="Unassigned" options={users.map((u) => ({ value: u.name, label: u.name }))} />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Meeting type">
          <Select value={type} onChange={(v) => setType(v as MeetingType)} options={MEETING_TYPES.map((t) => ({ value: t, label: t }))} />
        </Field>
        <Field label="Location">
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Meeting room 1" />
        </Field>
      </div>
      <Field label="Agenda / note">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Purpose of the meeting" />
      </Field>
      {meeting && (
        <Field label="Outcome">
          <Textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="What was agreed" className="min-h-[64px]" />
        </Field>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button variant="primary" onClick={save}>
          {meeting ? "Save" : "Schedule"}
        </Button>
      </div>
    </div>
  );
}
