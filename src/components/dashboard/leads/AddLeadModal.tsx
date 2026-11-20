"use client";
import { useState } from "react";
import { toast } from "sonner";
import type { EventType, ManualChannel } from "@/types/crm";
import { EVENT_TYPES, MANUAL_CHANNELS } from "@/types/crm";
import { useHalls, useUsers } from "@/lib/crm/hooks";
import { createManualLead, type ManualLeadInput } from "@/services/crm";
import { Button, Field, Input, Select, Textarea } from "../ui/core";
import { Modal } from "../ui/overlay";
import { AssignPicker } from "./shared";

const EMPTY: ManualLeadInput = { name: "", mobile: "", organization: "", email: "", eventName: "", eventType: "Wedding", guests: 0, hallId: "", eventDate: "", value: 0, channel: "Phone call", referredBy: "", ownerIds: [], note: "" };

export function AddLeadModal({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated?: (id: string) => void }) {
  const halls = useHalls();
  const users = useUsers();
  const [f, setF] = useState<ManualLeadInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof ManualLeadInput>(k: K, v: ManualLeadInput[K]) => setF((s) => ({ ...s, [k]: v }));

  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setF(EMPTY);
      setError(null);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const lead = createManualLead(f);
      toast.success(`${lead.code} added to Discover`);
      close(false);
      onCreated?.(lead.id);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={close}
      size="lg"
      title="Add lead"
      description="For walk-ins, phone calls, referrals and expo contacts. The lead starts at Discover."
      footer={
        <>
          <Button variant="ghost" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="add-lead">
            Add lead
          </Button>
        </>
      }
    >
      <form id="add-lead" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact name" required>
          <Input id="lead-name" value={f.name} onChange={(e) => set("name", e.target.value)} autoFocus />
        </Field>
        <Field label="Mobile" required>
          <Input id="lead-mobile" value={f.mobile} onChange={(e) => set("mobile", e.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" />
        </Field>
        <Field label="Organisation">
          <Input id="lead-org" value={f.organization} onChange={(e) => set("organization", e.target.value)} />
        </Field>
        <Field label="Email">
          <Input id="lead-email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Event name" required className="sm:col-span-2">
          <Input id="lead-event" value={f.eventName} onChange={(e) => set("eventName", e.target.value)} placeholder="e.g. Annual dealers meet" />
        </Field>
        <Field label="Event type">
          <Select aria-label="Event type" value={f.eventType} onChange={(v) => set("eventType", v as EventType)} options={EVENT_TYPES.map((t) => ({ value: t, label: t }))} />
        </Field>
        <Field label="Guests">
          <Input id="lead-guests" type="number" min={0} value={f.guests || ""} onChange={(e) => set("guests", Number(e.target.value))} />
        </Field>
        <Field label="Preferred hall">
          <Select aria-label="Preferred hall" value={f.hallId ?? ""} onChange={(v) => set("hallId", v)} placeholder="Not decided" options={halls.filter((h) => h.active).map((h) => ({ value: h.id, label: h.name }))} />
        </Field>
        <Field label="Event date (approx.)">
          <Input id="lead-date" type="date" value={f.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
        </Field>
        <Field label="Estimated value (৳)">
          <Input id="lead-value" type="number" min={0} step={10000} value={f.value || ""} onChange={(e) => set("value", Number(e.target.value))} />
        </Field>
        <Field label="How did they reach us?">
          <Select aria-label="Channel" value={f.channel} onChange={(v) => set("channel", v as ManualChannel)} options={MANUAL_CHANNELS.map((c) => ({ value: c, label: c }))} />
        </Field>
        {f.channel === "Referral" && (
          <Field label="Referred by">
            <Input id="lead-ref" value={f.referredBy} onChange={(e) => set("referredBy", e.target.value)} />
          </Field>
        )}
        <div className="block min-w-0">
          <span className="mb-1.5 block text-[13px] font-medium text-crm-ink-2">Assign to</span>
          <AssignPicker variant="field" value={f.ownerIds ?? []} users={users} onChange={(ids) => set("ownerIds", ids)} />
        </div>
        <Field label="Note" className="sm:col-span-2">
          <Textarea id="lead-note" value={f.note} onChange={(e) => set("note", e.target.value)} placeholder="What the client asked for" />
        </Field>
        {error && <p className="text-[13px] text-crm-danger sm:col-span-2">{error}</p>}
      </form>
    </Modal>
  );
}
