"use client";
import { useState } from "react";
import { addDays, format } from "date-fns";
import type { Client, ClientInput, ClientType, EnquiryInput, Task, TaskInput } from "@/types/crm";
import { CLIENT_TYPE_LABELS, CLIENT_TYPES, ENQUIRY_TYPES, SOURCE_LABELS, SOURCES, TASK_TYPE_LABELS, TASK_TYPES, requireNameAndPhone } from "@/types/crm";
import { db, nextNumber, useCurrentUser } from "@/lib/crm/db";
import { findClientByMobile } from "@/services/crm/bookings.service";
import { createTask, submitEnquiry } from "@/services/crm/sales.service";
import { useCrmAction } from "@/services/crm/hooks";
import { withLatency } from "@/services/crm/base";
import { Button, Field, Input, Select, Textarea } from "../ui/core";
import { Modal } from "../ui/overlay";

const userOptions = () => db.users.active().filter((u) => u.active).map((u) => ({ value: u.id, label: u.name }));

/* ─── Client ─────────────────────────────────────────────────────────────── */

export function ClientFormModal({ open, onOpenChange, client }: { open: boolean; onOpenChange: (v: boolean) => void; client?: Client }) {
  const [v, setV] = useState<ClientInput>(() => client ? { name: client.name, type: client.type, mobile: client.mobile, organization: client.organization, phone: client.phone, email: client.email, address: client.address, tags: client.tags, notes: client.notes } : { name: "", type: "personal", mobile: "", tags: [] });
  const [error, setError] = useState<string | null>(null);
  const dup = !client && v.mobile.replace(/\D/g, "").length >= 11 ? findClientByMobile(v.mobile) : undefined;
  const save = useCrmAction(
    () =>
      withLatency(() =>
        client ? db.clients.update(client.id, v) : db.clients.create({ ...v, clientNo: nextNumber("client"), tags: v.tags ?? [] } as Omit<Client, "id" | "createdAt" | "updatedAt">)
      ),
    { success: client ? "Client updated" : "Client created", onSuccess: () => onOpenChange(false) }
  );
  const set = <K extends keyof ClientInput>(k: K, val: ClientInput[K]) => setV((s) => ({ ...s, [k]: val }));
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={client ? "Edit client" : "New client"}
      description={client ? client.clientNo : "Client ID is generated automatically."}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="primary"
            loading={save.isPending}
            onClick={() => {
              const err = requireNameAndPhone(v);
              setError(err);
              if (!err) save.mutate(undefined);
            }}
          >
            Save client
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required error={error?.includes("name") ? error : null}>
          <Input value={v.name} onChange={(e) => set("name", e.target.value)} autoFocus />
        </Field>
        <Field label="Mobile" required error={error?.includes("phone") ? error : null} hint={dup ? `⚠ Matches existing client ${dup.name} (${dup.clientNo})` : undefined}>
          <Input value={v.mobile} onChange={(e) => set("mobile", e.target.value)} placeholder="01XXXXXXXXX" />
        </Field>
        <Field label="Client type">
          <Select value={v.type} onChange={(x) => set("type", x as ClientType)} options={CLIENT_TYPES.map((t) => ({ value: t, label: CLIENT_TYPE_LABELS[t] }))} />
        </Field>
        <Field label="Organization">
          <Input value={v.organization ?? ""} onChange={(e) => set("organization", e.target.value)} />
        </Field>
        <Field label="Email">
          <Input value={v.email ?? ""} onChange={(e) => set("email", e.target.value)} type="email" />
        </Field>
        <Field label="Phone">
          <Input value={v.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <Input value={v.address ?? ""} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field label="Tags" hint="Comma separated, e.g. VIP, corporate, repeat" className="sm:col-span-2">
          <Input value={(v.tags ?? []).join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea value={v.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

/* ─── Task ───────────────────────────────────────────────────────────────── */

export function TaskFormModal({ open, onOpenChange, task, defaults }: { open: boolean; onOpenChange: (v: boolean) => void; task?: Task; defaults?: Partial<TaskInput> }) {
  const me = useCurrentUser();
  const [v, setV] = useState<TaskInput>(() =>
    task
      ? { title: task.title, type: task.type, dueAt: task.dueAt, assignedTo: task.assignedTo, bookingId: task.bookingId, leadId: task.leadId, notes: task.notes }
      : { title: "", type: "follow_up", dueAt: addDays(new Date(), 1).toISOString(), assignedTo: me.id, ...defaults }
  );
  const save = useCrmAction(() => (task ? withLatency(() => db.tasks.update(task.id, v)) : createTask(v)), { success: task ? "Task updated" : "Task created", onSuccess: () => onOpenChange(false) });
  const set = <K extends keyof TaskInput>(k: K, val: TaskInput[K]) => setV((s) => ({ ...s, [k]: val }));
  const local = format(new Date(v.dueAt), "yyyy-MM-dd'T'HH:mm");
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={task ? "Edit task" : "New task"}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} disabled={!v.title.trim()} onClick={() => save.mutate(undefined)}>
            Save task
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" required className="sm:col-span-2">
          <Input value={v.title} onChange={(e) => set("title", e.target.value)} autoFocus placeholder="Call client about menu tasting" />
        </Field>
        <Field label="Type">
          <Select value={v.type} onChange={(x) => set("type", x as TaskInput["type"])} options={TASK_TYPES.map((t) => ({ value: t, label: TASK_TYPE_LABELS[t] }))} />
        </Field>
        <Field label="Due">
          <Input type="datetime-local" value={local} onChange={(e) => e.target.value && set("dueAt", new Date(e.target.value).toISOString())} />
        </Field>
        <Field label="Assigned to">
          <Select value={v.assignedTo} onChange={(x) => set("assignedTo", x)} options={userOptions()} />
        </Field>
        <Field label="Booking (optional)">
          <Select value={v.bookingId} onChange={(x) => set("bookingId", x || undefined)} placeholder="—" options={db.bookings.active().slice(0, 80).map((b) => ({ value: b.id, label: `${b.bfNo} · ${b.eventTitle}` }))} />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea value={v.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

/* ─── Enquiry ────────────────────────────────────────────────────────────── */

export function EnquiryFormModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [v, setV] = useState<EnquiryInput>({ name: "", mobile: "", type: "enquiry", source: "phone", message: "" });
  const [error, setError] = useState<string | null>(null);
  const save = useCrmAction(() => submitEnquiry(v), { success: "Enquiry logged", onSuccess: () => onOpenChange(false) });
  const set = <K extends keyof EnquiryInput>(k: K, val: EnquiryInput[K]) => setV((s) => ({ ...s, [k]: val }));
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Log an enquiry"
      description="Phone, WhatsApp or walk-in enquiries go to the Enquiries inbox."
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="primary"
            loading={save.isPending}
            onClick={() => {
              const err = requireNameAndPhone(v);
              setError(err);
              if (!err) save.mutate(undefined);
            }}
          >
            Save enquiry
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required error={error?.includes("name") ? error : null}>
          <Input value={v.name} onChange={(e) => set("name", e.target.value)} autoFocus />
        </Field>
        <Field label="Mobile" required error={error?.includes("phone") ? error : null}>
          <Input value={v.mobile} onChange={(e) => set("mobile", e.target.value)} />
        </Field>
        <Field label="Source">
          <Select value={v.source} onChange={(x) => set("source", x as EnquiryInput["source"])} options={SOURCES.map((s) => ({ value: s, label: SOURCE_LABELS[s] }))} />
        </Field>
        <Field label="Type">
          <Select value={v.type} onChange={(x) => set("type", x as EnquiryInput["type"])} options={ENQUIRY_TYPES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} />
        </Field>
        <Field label="Event type">
          <Input value={v.eventType ?? ""} onChange={(e) => set("eventType", e.target.value)} placeholder="Wedding, conference…" />
        </Field>
        <Field label="Guests">
          <Input type="number" value={v.guests ?? ""} onChange={(e) => set("guests", e.target.value ? Number(e.target.value) : undefined)} />
        </Field>
        <Field label="Preferred date">
          <Input type="date" value={v.preferredDate ?? ""} onChange={(e) => set("preferredDate", e.target.value)} />
        </Field>
        <Field label="Hall preference">
          <Select value={v.hallPreference} onChange={(x) => set("hallPreference", x)} placeholder="Any" options={db.halls.active().map((h) => ({ value: h.name, label: h.name }))} />
        </Field>
        <Field label="Message" className="sm:col-span-2">
          <Textarea value={v.message ?? ""} onChange={(e) => set("message", e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
