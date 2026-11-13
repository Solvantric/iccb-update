"use client";
import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { Copy, Plus, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Booking, BookingDay, ClientType } from "@/types/crm";
import { CLIENT_TYPE_LABELS, CLIENT_TYPES, EVENT_NATURES } from "@/types/crm";
import { LAYOUT_OPTIONS } from "@/data/crm/capacities";
import { hallDayState, DAY_STATE_LABEL } from "@/lib/crm/availability";
import { db } from "@/lib/crm/db";
import { fmtDateTime, taka } from "@/lib/crm/format";
import { requestShift, scheduleMeeting, shiftPreview, updateBooking } from "@/services/crm/bookings.service";
import { useCrmAction } from "@/services/crm/hooks";
import { Badge, Button, Checkbox, Field, Input, NumberInput, Select, Textarea } from "../ui/core";
import { Drawer, Modal } from "../ui/overlay";
import { copyText } from "../ui/misc";
import { useWs } from "./context";

export function ScheduleMeetingModal({ onClose }: { onClose: () => void }) {
  const { b, users, halls } = useWs();
  const reps = users.filter((u) => u.active && (u.role === "sales_executive" || u.role === "sales_manager"));
  const [at, setAt] = useState(() => {
    const d = addDays(new Date(), 1);
    d.setHours(15, 0, 0, 0);
    return format(d, "yyyy-MM-dd'T'HH:mm");
  });
  const [rep, setRep] = useState(b.assignedTo ?? reps[0]?.id ?? "");
  const save = useCrmAction(() => scheduleMeeting(b.id, new Date(at).toISOString(), rep), { success: "Meeting scheduled", onSuccess: onClose });
  const repName = users.find((u) => u.id === rep)?.name ?? "our representative";
  const hall = halls.find((h) => h.id === b.days[0]?.hallId)?.name ?? "ICCB";
  const invite = `Assalamu Alaikum ${b.contact.name},\n\nYour meeting / site visit at ICCB is set for ${fmtDateTime(new Date(at).toISOString())} with ${repName}.\nBooking ref: ${b.bfNo} (${b.eventTitle}, ${hall}).\n\nPlace: ICCB Sales Office, Kuril Bishwa Road, next to 300 ft. Purbachal Express Highway, Dhaka-1229.\nPlease bring your NID or Passport (and Trade License for organizations).\n\nCall/WhatsApp: +88-01991-197719`;
  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      title="Schedule meeting / site visit"
      description="Creates a task and marks the checklist item."
      footer={
        <>
          <Button
            icon={Copy}
            onClick={async () => {
              if (await copyText(invite)) toast.success("Invite text copied — paste it in WhatsApp");
            }}
          >
            Copy WhatsApp invite
          </Button>
          <Button variant="primary" loading={save.isPending} onClick={() => save.mutate(undefined)}>
            Schedule
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date & time">
          <Input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
        </Field>
        <Field label="Representative">
          <Select value={rep} onChange={setRep} options={reps.map((u) => ({ value: u.id, label: u.name }))} />
        </Field>
        <Field label="Invite preview" className="sm:col-span-2">
          <pre className="whitespace-pre-wrap rounded-lg bg-crm-surface-2 p-3 font-sans text-[12.5px] text-crm-ink-2">{invite}</pre>
        </Field>
      </div>
    </Modal>
  );
}

export function ShiftModal({ onClose }: { onClose: () => void }) {
  const { b, halls, canApprove } = useWs();
  const first = b.days.find((d) => d.dayType === "program") ?? b.days[0];
  const [date, setDate] = useState(first?.date ?? "");
  const [hallId, setHallId] = useState(first?.hallId ?? "");
  const [reason, setReason] = useState("");
  const preview = useMemo(() => shiftPreview(b), [b]);
  const avail = date && hallId ? hallDayState(db.bookings.all(), hallId, date, b.id) : null;
  const save = useCrmAction(() => requestShift(b.id, date, hallId, reason), { success: canApprove ? "Date shifted" : "Shift requested — waiting for approval", onSuccess: onClose });
  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      title="Shift / postpone"
      description="The charge comes from ICCB's shift chart (% of total venue rent)."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} disabled={!reason.trim() || !date} onClick={() => save.mutate(undefined)}>
            {canApprove ? "Shift now" : "Request approval"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New first event date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Hall">
          <Select value={hallId} onChange={setHallId} options={halls.filter((h) => h.active).map((h) => ({ value: h.id, label: h.name }))} />
        </Field>
        {avail && (
          <div className="sm:col-span-2">
            <Badge tone={avail.state === "free" ? "green" : avail.state === "tentative" ? "amber" : "red"} dot>
              {DAY_STATE_LABEL[avail.state]}
              {avail.booking ? ` — ${avail.booking.eventTitle}` : ""}
            </Badge>
          </div>
        )}
        <div className="sm:col-span-2 rounded-xl border border-crm-line bg-crm-surface-2 p-4">
          <div className="flex justify-between text-[13px]">
            <span className="text-crm-ink-2">Days before event (today)</span>
            <span className="font-semibold text-crm-ink tabular">{preview.daysBefore}</span>
          </div>
          <div className="mt-1 flex justify-between text-[13px]">
            <span className="text-crm-ink-2">Total venue rent</span>
            <span className="tabular text-crm-ink">{taka(preview.venueRent)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-crm-line pt-2 text-[14px]">
            <span className="font-semibold text-crm-ink">Shift charge ({preview.pct}%)</span>
            <span className="font-bold text-crm-brand tabular">{taka(preview.charge)}</span>
          </div>
        </div>
        <Field label="Reason" required className="sm:col-span-2">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Client request, family reason, organizer change…" />
        </Field>
      </div>
    </Modal>
  );
}

type DayDraft = BookingDay;

/** Edit event, days, guests, layout, food and contact details. */
export function EditDetailsDrawer({ onClose }: { onClose: () => void }) {
  const { b, halls } = useWs();
  const [v, setV] = useState<Booking>(() => structuredClone(b));
  const set = <K extends keyof Booking>(k: K, val: Booking[K]) => setV((s) => ({ ...s, [k]: val }));
  const setDay = (id: string, patch: Partial<DayDraft>) => set("days", v.days.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const save = useCrmAction(
    () =>
      updateBooking(
        b.id,
        { eventTitle: v.eventTitle, eventNature: v.eventNature, clientType: v.clientType, days: v.days, guests: v.guests, cars: v.cars, layout: v.layout, food: v.food, contact: v.contact, emergency: v.emergency, refundAccountName: v.refundAccountName, referredBy: v.referredBy, notes: v.notes, tags: v.tags, applyAit: v.applyAit },
        "Booking details updated"
      ),
    { success: "Details saved", onSuccess: onClose }
  );
  return (
    <Drawer
      open
      onOpenChange={(o) => !o && onClose()}
      title="Edit booking details"
      description={b.bfNo}
      width={640}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} onClick={() => save.mutate(undefined)}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="Event title" className="sm:col-span-2">
            <Input value={v.eventTitle} onChange={(e) => set("eventTitle", e.target.value)} />
          </Field>
          <Field label="Event nature">
            <Select value={v.eventNature} onChange={(x) => set("eventNature", x)} options={EVENT_NATURES.map((n) => ({ value: n, label: n }))} />
          </Field>
          <Field label="Client type">
            <Select value={v.clientType} onChange={(x) => set("clientType", x as ClientType)} options={CLIENT_TYPES.map((t) => ({ value: t, label: CLIENT_TYPE_LABELS[t] }))} />
          </Field>
        </section>

        <section>
          <p className="mb-2 text-[13px] font-semibold text-crm-ink">Hall-wise days</p>
          <div className="space-y-2">
            {v.days.map((d) => (
              <div key={d.id} className="grid grid-cols-2 gap-2 rounded-lg border border-crm-line p-2.5 sm:grid-cols-[1fr_1.2fr_1fr_0.8fr_0.8fr_auto]">
                <Select value={d.dayType} onChange={(x) => setDay(d.id, { dayType: x as DayDraft["dayType"] })} options={[{ value: "program", label: "Program" }, { value: "preparation", label: "Preparation" }]} />
                <Select value={d.hallId} onChange={(x) => setDay(d.id, { hallId: x })} options={halls.filter((h) => h.active).map((h) => ({ value: h.id, label: h.name }))} />
                <Input type="date" value={d.date} onChange={(e) => setDay(d.id, { date: e.target.value })} />
                <Input type="time" value={d.start} onChange={(e) => setDay(d.id, { start: e.target.value })} />
                <Input type="time" value={d.end} onChange={(e) => setDay(d.id, { end: e.target.value })} />
                <Button size="icon" variant="ghost" disabled={v.days.length < 2} onClick={() => set("days", v.days.filter((x) => x.id !== d.id))} aria-label="Remove day">
                  <Trash size={15} />
                </Button>
                {halls.find((h) => h.id === d.hallId)?.kind === "expo" && (
                  <div className="col-span-2 sm:col-span-6">
                    <NumberInput value={d.sqft} onChange={(n) => setDay(d.id, { sqft: n })} suffix="sq ft" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button size="sm" icon={Plus} className="mt-2" onClick={() => { const last = v.days[v.days.length - 1]; set("days", [...v.days, { ...last, id: `d${Date.now().toString(36)}` }]); }}>
            Add day
          </Button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="Guests — optimum">
            <NumberInput value={v.guests.optimum} onChange={(n) => set("guests", { ...v.guests, optimum: n })} />
          </Field>
          <Field label="Guests — maximum">
            <NumberInput value={v.guests.maximum} onChange={(n) => set("guests", { ...v.guests, maximum: n })} />
          </Field>
          <Field label="Cars — optimum">
            <NumberInput value={v.cars.optimum} onChange={(n) => set("cars", { ...v.cars, optimum: n })} />
          </Field>
          <Field label="Cars — maximum">
            <NumberInput value={v.cars.maximum} onChange={(n) => set("cars", { ...v.cars, maximum: n })} />
          </Field>
          <Field label="Layout" className="sm:col-span-2">
            <Select value={v.layout} onChange={(x) => set("layout", x)} options={LAYOUT_OPTIONS} />
          </Field>
          <div className="sm:col-span-2 flex flex-wrap gap-x-6 gap-y-2">
            {(["breakfast", "lunch", "snacks", "dinner"] as const).map((k) => (
              <Checkbox key={k} checked={v.food[k]} onChange={(x) => set("food", { ...v.food, [k]: x })} label={k[0].toUpperCase() + k.slice(1)} />
            ))}
            <Checkbox checked={v.applyAit} onChange={(x) => set("applyAit", x)} label="Apply AIT (5%)" />
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <p className="sm:col-span-2 text-[13px] font-semibold text-crm-ink">Client contact</p>
          <Field label="Name">
            <Input value={v.contact.name} onChange={(e) => set("contact", { ...v.contact, name: e.target.value })} />
          </Field>
          <Field label="Mobile">
            <Input value={v.contact.mobile} onChange={(e) => set("contact", { ...v.contact, mobile: e.target.value })} />
          </Field>
          <Field label="Organization">
            <Input value={v.contact.organization ?? ""} onChange={(e) => set("contact", { ...v.contact, organization: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input value={v.contact.email ?? ""} onChange={(e) => set("contact", { ...v.contact, email: e.target.value })} />
          </Field>
          <Field label="Phone">
            <Input value={v.contact.phone ?? ""} onChange={(e) => set("contact", { ...v.contact, phone: e.target.value })} />
          </Field>
          <Field label="Fax">
            <Input value={v.contact.fax ?? ""} onChange={(e) => set("contact", { ...v.contact, fax: e.target.value })} />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Input value={v.contact.address ?? ""} onChange={(e) => set("contact", { ...v.contact, address: e.target.value })} />
          </Field>
          <Field label="Emergency contact">
            <Input value={v.emergency.name ?? ""} onChange={(e) => set("emergency", { ...v.emergency, name: e.target.value })} />
          </Field>
          <Field label="Emergency mobile">
            <Input value={v.emergency.mobile ?? ""} onChange={(e) => set("emergency", { ...v.emergency, mobile: e.target.value })} />
          </Field>
          <Field label="Refund account holder name">
            <Input value={v.refundAccountName ?? ""} onChange={(e) => set("refundAccountName", e.target.value)} />
          </Field>
          <Field label="Referred by">
            <Input value={v.referredBy?.name ?? ""} onChange={(e) => set("referredBy", e.target.value ? { ...v.referredBy, name: e.target.value } : undefined)} />
          </Field>
          <Field label="Tags" hint="Comma separated" className="sm:col-span-2">
            <Input value={v.tags.join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea value={v.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </section>
      </div>
    </Drawer>
  );
}

