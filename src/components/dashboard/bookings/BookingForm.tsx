"use client";
import { useMemo, useState } from "react";
import { Warning } from "@phosphor-icons/react";
import { EVENT_TYPES, LAYOUTS, SLOTS, type EventType, type Layout, type Slot } from "@/types/crm";
import { useBookings, useHalls } from "@/lib/crm/hooks";
import { num } from "@/lib/crm/format";
import { takenDates, validateBooking, type BookingInput } from "@/services/crm";
import { Button, Checkbox, Field, Input, Select, Textarea } from "../ui/core";
import { DatePicker } from "../ui/DatePicker";
import { m } from "../ui/motion";
import { AnimatePresence } from "framer-motion";

export const emptyBooking = (patch: Partial<BookingInput> = {}): BookingInput => ({
  name: "",
  mobile: "",
  email: "",
  eventName: "",
  eventType: "Wedding",
  hallId: "",
  date: "",
  guests: 0,
  slot: "Evening (5 PM – 11 PM)",
  organization: "",
  note: "",
  meeting: null,
  ...patch,
});

/**
 * The booking form: the same fields on the website and in the "New booking"
 * modal. One screen, 2 columns on desktop, 1 on mobile.
 */
export function BookingForm({ initial, onSubmit, submitLabel, busy, footer, staff }: { initial?: Partial<BookingInput>; onSubmit: (v: BookingInput) => void; submitLabel: string; busy?: boolean; footer?: React.ReactNode; staff?: boolean }) {
  const halls = useHalls().filter((h) => h.active);
  const bookings = useBookings();
  const [v, setV] = useState<BookingInput>(() => emptyBooking(initial));
  const [wantsMeeting, setWantsMeeting] = useState(!!initial?.meeting);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof BookingInput>(k: K, val: BookingInput[K]) => {
    setV((s) => ({ ...s, [k]: val }));
    setError(null);
  };

  const hall = halls.find((h) => h.id === v.hallId);
  const taken = useMemo(() => (v.hallId ? takenDates(bookings, v.hallId) : new Set<string>()), [bookings, v.hallId]);
  const overCapacity = hall && v.guests > hall.capacity;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = { ...v, meeting: wantsMeeting && v.meeting?.date ? v.meeting : null };
    const err = validateBooking(input);
    if (err) return setError(err);
    onSubmit(input);
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
        <Field label="Full name" required>
          <Input value={v.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" placeholder="e.g. Rahim Uddin" />
        </Field>
        <Field label="Mobile" required>
          <Input value={v.mobile} onChange={(e) => set("mobile", e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" />
        </Field>
        <Field label="Email">
          <Input value={v.email ?? ""} onChange={(e) => set("email", e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" />
        </Field>
        <Field label="Organisation" hint="For corporate, government or NGO events.">
          <Input value={v.organization ?? ""} onChange={(e) => set("organization", e.target.value)} autoComplete="organization" placeholder="Optional" />
        </Field>
        <Field label="Event name" required>
          <Input value={v.eventName} onChange={(e) => set("eventName", e.target.value)} placeholder="e.g. Rahim & Nadia Wedding" />
        </Field>
        <Field label="Event type" required>
          <Select value={v.eventType} onChange={(x) => set("eventType", x as EventType)} options={EVENT_TYPES.map((t) => ({ value: t, label: t }))} />
        </Field>
        <Field label="Hall" required hint={hall ? `Capacity up to ${num(hall.capacity)} guests` : undefined}>
          <Select
            value={v.hallId}
            onChange={(x) => {
              set("hallId", x);
              if (v.date && takenDates(bookings, x).has(v.date)) set("date", "");
            }}
            placeholder="Choose a hall"
            options={halls.map((h) => ({ value: h.id, label: `${h.name} · up to ${num(h.capacity)}` }))}
          />
        </Field>
        <Field label="Date" required hint={!v.hallId ? "Choose a hall first to see free dates." : undefined}>
          <DatePicker value={v.date} onChange={(d) => set("date", d)} disabled={taken} />
        </Field>
        <Field label="Guests (approx.)" required hint={overCapacity ? `More than this hall's capacity (${num(hall!.capacity)}).` : undefined}>
          <Input type="number" min={1} inputMode="numeric" value={v.guests || ""} onChange={(e) => set("guests", Number(e.target.value))} placeholder="e.g. 500" />
        </Field>
        <Field label="Time slot">
          <Select value={v.slot ?? SLOTS[1]} onChange={(x) => set("slot", x as Slot)} options={SLOTS.map((t) => ({ value: t, label: t }))} />
        </Field>
        {staff ? (
          <Field label="Layout">
            <Select value={v.layout ?? ""} onChange={(x) => set("layout", (x || undefined) as Layout | undefined)} placeholder="Auto (by event type)" options={LAYOUTS.map((t) => ({ value: t, label: t }))} />
          </Field>
        ) : (
          <div className="hidden md:block" />
        )}
        <div className="md:col-span-2">
          <Checkbox
            checked={wantsMeeting}
            onChange={(c) => {
              setWantsMeeting(c);
              if (c && !v.meeting) set("meeting", { date: "", time: "11:00" });
            }}
            label="I'd like to meet ICCB at the venue"
          />
          <AnimatePresence initial={false}>
            {wantsMeeting && (
              <m.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Preferred date">
                  <DatePicker value={v.meeting?.date ?? ""} onChange={(d) => set("meeting", { date: d, time: v.meeting?.time ?? "11:00" })} />
                </Field>
                <Field label="Preferred time">
                  <Input type="time" value={v.meeting?.time ?? "11:00"} onChange={(e) => set("meeting", { date: v.meeting?.date ?? "", time: e.target.value })} />
                </Field>
              </m.div>
            )}
          </AnimatePresence>
        </div>
        <Field label="Note" className="md:col-span-2" hint={`${(v.note ?? "").length}/300`}>
          <Textarea value={v.note ?? ""} maxLength={300} onChange={(e) => set("note", e.target.value)} placeholder="Anything we should know?" />
        </Field>
      </div>

      <AnimatePresence>
        {error && (
          <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="alert" className="mt-4 flex items-center gap-2 rounded-[8px] bg-crm-reserved-bg px-3 py-2 text-[13.5px] text-crm-reserved-ink">
            <Warning size={16} weight="fill" />
            {error}
          </m.p>
        )}
      </AnimatePresence>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        {footer}
        <Button type="submit" variant="primary" loading={busy}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
