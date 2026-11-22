"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Check, PencilSimple, X } from "@phosphor-icons/react";
import type { Booking, EventType, Layout, Slot } from "@/types/crm";
import { EVENT_TYPES, LAYOUTS, SLOTS, validateContact } from "@/types/crm";
import { useBookings, useClients, useHallMap, useHalls, useMeetings, useUsers } from "@/lib/crm/hooks";
import { fmtDate, fmtTime, num, timeAgo } from "@/lib/crm/format";
import { takenDates, updateBooking, upsertClient } from "@/services/crm";
import { Button, Card, CardTitle, Field, Input, KeyValue, Select, Textarea } from "../ui/core";
import { DatePicker } from "../ui/DatePicker";
import { MeetingPill } from "../ui/status";

function EditButtons({ editing, onEdit, onCancel, onSave }: { editing: boolean; onEdit: () => void; onCancel: () => void; onSave: () => void }) {
  return editing ? (
    <div className="flex gap-1">
      <Button size="icon-sm" variant="ghost" aria-label="Cancel" onClick={onCancel}>
        <X size={16} />
      </Button>
      <Button size="sm" icon={Check} onClick={onSave}>
        Save
      </Button>
    </div>
  ) : (
    <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={onEdit}>
      <PencilSimple size={16} />
    </Button>
  );
}

function ClientCard({ b }: { b: Booking }) {
  const client = useClients().find((c) => c.id === b.clientId);
  const otherBookings = useBookings().filter((x) => x.clientId && x.clientId === b.clientId && x.id !== b.id).length;
  const [edit, setEdit] = useState(false);
  const init = () => ({ name: b.name, mobile: b.mobile, email: b.email ?? "", organization: b.organization ?? "" });
  const [v, setV] = useState(init);
  const save = () => {
    const err = validateContact(v.name, v.mobile);
    if (err) return toast.error(err);
    const c = upsertClient({ name: v.name, mobile: v.mobile, email: v.email, organization: v.organization });
    updateBooking(b.id, { clientId: c.id, name: v.name.trim(), mobile: v.mobile.trim(), email: v.email.trim() || undefined, organization: v.organization.trim() || undefined }, "Client details updated");
    setEdit(false);
    toast.success("Saved");
  };
  return (
    <Card>
      <CardTitle
        title="Client"
        action={
          <EditButtons
            editing={edit}
            onEdit={() => {
              setV(init());
              setEdit(true);
            }}
            onCancel={() => setEdit(false)}
            onSave={save}
          />
        }
      />
      <div className="px-5 pb-5">
        {edit ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
            </Field>
            <Field label="Mobile">
              <Input value={v.mobile} onChange={(e) => setV({ ...v, mobile: e.target.value })} type="tel" />
            </Field>
            <Field label="Email">
              <Input value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} type="email" />
            </Field>
            <Field label="Organisation">
              <Input value={v.organization} onChange={(e) => setV({ ...v, organization: e.target.value })} />
            </Field>
          </div>
        ) : (
          <>
            <KeyValue
              items={[
                ["Name", b.name],
                ["Mobile", b.mobile],
                ["Email", b.email],
                ["Organisation", b.organization],
                ["Client type", client?.type],
                ["Client no", client?.clientNo],
              ]}
            />
            {client && (
              <Link href={`/dashboard/clients?c=${client.id}`} className="mt-4 inline-flex items-center gap-1 text-[13px] text-crm-info-ink hover:underline">
                Open client{otherBookings ? ` · ${otherBookings} other booking${otherBookings > 1 ? "s" : ""}` : ""} <ArrowRight size={13} className="rtl:rotate-180" />
              </Link>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function EventCard({ b }: { b: Booking }) {
  const halls = useHalls();
  const hallMap = useHallMap();
  const bookings = useBookings();
  const staff = useUsers().filter((u) => u.active && (u.role === "operations" || u.role === "admin"));
  const [edit, setEdit] = useState(false);
  const init = () => ({ eventName: b.eventName, eventType: b.eventType, hallId: b.hallId, date: b.date, slot: b.slot, layout: b.layout, guests: b.guests, cars: b.cars ?? 0, coordinator: b.coordinator ?? "", note: b.note ?? "" });
  const [v, setV] = useState(init);
  const others = useMemo(() => bookings.filter((x) => x.id !== b.id), [bookings, b.id]);
  const taken = useMemo(() => takenDates(others, v.hallId), [others, v.hallId]);
  const locked = b.status === "closed" || b.status === "cancelled";
  const hall = hallMap.get(b.hallId);

  const save = () => {
    if (!v.eventName.trim() || !v.date || !v.hallId || !(v.guests > 0)) return toast.error("Please fill in event name, hall, date and guests.");
    try {
      updateBooking(b.id, { ...v, eventName: v.eventName.trim(), cars: v.cars || undefined, coordinator: v.coordinator || undefined, note: v.note.trim() || undefined }, "Event details updated");
      setEdit(false);
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    }
  };

  return (
    <Card>
      <CardTitle
        title="Event"
        action={
          !locked && (
            <EditButtons
              editing={edit}
              onEdit={() => {
                setV(init());
                setEdit(true);
              }}
              onCancel={() => setEdit(false)}
              onSave={save}
            />
          )
        }
      />
      <div className="px-5 pb-5">
        {edit ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Event name" className="sm:col-span-2">
              <Input value={v.eventName} onChange={(e) => setV({ ...v, eventName: e.target.value })} />
            </Field>
            <Field label="Event type">
              <Select value={v.eventType} onChange={(x) => setV({ ...v, eventType: x as EventType })} options={EVENT_TYPES.map((t) => ({ value: t, label: t }))} />
            </Field>
            <Field label="Hall">
              <Select value={v.hallId} onChange={(x) => setV({ ...v, hallId: x, date: takenDates(others, x).has(v.date) ? "" : v.date })} options={halls.map((h) => ({ value: h.id, label: `${h.name} · up to ${num(h.capacity)}` }))} />
            </Field>
            <Field label="Date">
              <DatePicker value={v.date} onChange={(d) => setV({ ...v, date: d })} disabled={taken} />
            </Field>
            <Field label="Time slot">
              <Select value={v.slot} onChange={(x) => setV({ ...v, slot: x as Slot })} options={SLOTS.map((t) => ({ value: t, label: t }))} />
            </Field>
            <Field label="Layout">
              <Select value={v.layout} onChange={(x) => setV({ ...v, layout: x as Layout })} options={LAYOUTS.map((t) => ({ value: t, label: t }))} />
            </Field>
            <Field label="Coordinator">
              <Select value={v.coordinator} onChange={(x) => setV({ ...v, coordinator: x })} placeholder="Not assigned" options={staff.map((u) => ({ value: u.name, label: u.name }))} />
            </Field>
            <Field label="Guests">
              <Input type="number" min={1} value={v.guests || ""} onChange={(e) => setV({ ...v, guests: Number(e.target.value) })} />
            </Field>
            <Field label="Cars (parking)">
              <Input type="number" min={0} value={v.cars || ""} onChange={(e) => setV({ ...v, cars: Number(e.target.value) })} />
            </Field>
            <Field label="Note" className="sm:col-span-2">
              <Textarea value={v.note} maxLength={300} onChange={(e) => setV({ ...v, note: e.target.value })} />
            </Field>
          </div>
        ) : (
          <KeyValue
            cols={3}
            items={[
              ["Event name", b.eventName],
              ["Event type", b.eventType],
              ["Hall", hall ? `${hall.name} (${hall.code})` : "—"],
              ["Date", fmtDate(b.date, "EEE, d MMM yyyy")],
              ["Time slot", b.slot],
              ["Layout", b.layout],
              ["Guests", `${num(b.guests)}${hall && b.guests > hall.capacity ? " · over capacity" : ""}`],
              ["Cars", b.cars ? num(b.cars) : "—"],
              ["Coordinator", b.coordinator],
              ["Source", b.source === "website" ? "Website form" : "Staff"],
              ["Created", fmtDate(b.createdAt)],
              ["Note", b.note],
            ]}
          />
        )}
      </div>
    </Card>
  );
}

function MeetingsCard({ b }: { b: Booking }) {
  const meetings = useMeetings()
    .filter((m) => m.bookingId === b.id)
    .sort((x, y) => (y.date + y.time).localeCompare(x.date + x.time));
  return (
    <Card className="h-fit">
      <CardTitle title="Meetings" action={<Link href="/dashboard/operations/ppm" className="text-[13px] text-crm-muted hover:text-crm-ink">All</Link>} />
      {meetings.length === 0 ? (
        <p className="px-5 pb-5 text-[13.5px] text-crm-muted">No meetings yet. Use ⋯ → Schedule meeting.</p>
      ) : (
        <ul className="space-y-3 px-5 pb-5">
          {meetings.slice(0, 4).map((m) => (
            <li key={m.id} className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-[13.5px] text-crm-ink">
                  {m.type} · {fmtDate(m.date, "d MMM")}, {fmtTime(m.time)}
                </span>
                <span className="block truncate text-[12px] text-crm-muted">
                  {m.rep}
                  {m.outcome ? ` · ${m.outcome}` : m.note ? ` · ${m.note}` : ""}
                </span>
              </span>
              <MeetingPill status={m.status} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function DetailsTab({ booking: b }: { booking: Booking }) {
  const history = [...b.history].reverse().slice(0, 6);
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <EventCard key={`e-${b.id}`} b={b} />
        <ClientCard key={`c-${b.id}`} b={b} />
      </div>
      <div className="space-y-5">
        <MeetingsCard b={b} />
        <Card className="h-fit">
          <CardTitle title="History" />
          <ol className="px-5 pb-5">
            {history.map((h, i) => (
              <li key={i} className="relative border-s border-crm-line ps-4 pb-4 last:pb-0">
                <span className={`absolute -start-[4.5px] top-1.5 h-2 w-2 rounded-full ring-2 ring-crm-surface ${i === 0 ? "bg-crm-info" : "bg-crm-line"}`} />
                <p className="text-[13.5px] text-crm-ink">{h.text}</p>
                <p className="text-[12px] text-crm-muted">
                  {h.by} · {timeAgo(h.at)}
                </p>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}

