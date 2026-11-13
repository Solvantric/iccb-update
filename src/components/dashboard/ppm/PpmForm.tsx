"use client";
import { useState } from "react";
import { CheckCircle, Eye, FloppyDisk, Warning } from "@phosphor-icons/react";
import type { Booking, PpmMinutes } from "@/types/crm";
import { PPM_AGENDA, ppmDueDate } from "@/lib/crm/rules";
import { firstEventDate, daysBetween } from "@/lib/crm/pricing";
import { fmtDate, todayYmd } from "@/lib/crm/format";
import { savePpm, generateDocument } from "@/services/crm/bookings.service";
import { useCrmAction } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { Badge, Button, Card, CardHeader, Field, Input, Textarea } from "../ui/core";
import { useDocs } from "../documents/useDocs";

/** Digital PPM Minutes with ICCB's fixed 24-item agenda. Used in the workspace and /operations/ppm. */
export function PpmForm({ b, readonly, onSaved }: { b: Booking; readonly?: boolean; onSaved?: () => void }) {
  const event = firstEventDate(b);
  const due = event ? ppmDueDate(event) : undefined;
  const [v, setV] = useState<PpmMinutes>(
    () =>
      b.ppm ?? {
        date: due && due > todayYmd() ? due : todayYmd(),
        time: "15:00",
        venue: "ICCB Sales Office",
        attendees: `${b.contact.name} (client)`,
        agenda: { 1: `${b.guests.optimum} guests (max ${b.guests.maximum})`, 15: b.menus.length ? "ICCB Catering" : "", 24: "" },
        notes: "",
        done: false,
      }
  );
  const docs = useDocs();
  const save = useCrmAction((done: boolean) => savePpm(b.id, { ...v, done }), { success: (r) => (r.ppm?.done ? "PPM completed" : "PPM saved"), onSuccess: () => onSaved?.() });
  const gen = useCrmAction(() => generateDocument(b.id, "ppm"), { success: "PPM Minutes generated", onSuccess: (d) => docs.preview(d) });
  const gap = event ? daysBetween(v.date, event) : 99;
  const tooLate = gap < 15;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Program Preparation Meeting"
          description={`Hold at least 15 days before the event${due ? ` (by ${fmtDate(due)})` : ""}. Anything not agreed here can be refused or charged extra.`}
          action={b.ppm?.done ? <Badge tone="green"><CheckCircle size={12} weight="fill" /> Done</Badge> : <Badge tone="amber">Draft</Badge>}
        />
        <div className="grid gap-4 px-5 pb-5 sm:grid-cols-4">
          <Field label="Date">
            <Input type="date" value={v.date} disabled={readonly} onChange={(e) => setV((s) => ({ ...s, date: e.target.value }))} />
          </Field>
          <Field label="Time">
            <Input type="time" value={v.time ?? ""} disabled={readonly} onChange={(e) => setV((s) => ({ ...s, time: e.target.value }))} />
          </Field>
          <Field label="Venue" className="sm:col-span-2">
            <Input value={v.venue ?? ""} disabled={readonly} onChange={(e) => setV((s) => ({ ...s, venue: e.target.value }))} />
          </Field>
          <Field label="Attendance" className="sm:col-span-4">
            <Input value={v.attendees} disabled={readonly} onChange={(e) => setV((s) => ({ ...s, attendees: e.target.value }))} placeholder="Client, Sales, Operations, Catering…" />
          </Field>
          {tooLate && (
            <p className="sm:col-span-4 flex items-center gap-2 rounded-lg bg-[#FEF6E7] px-3 py-2 text-[12.5px] text-[#B54708] dark:bg-[#2B2010]">
              <Warning size={15} weight="fill" /> This PPM is only {gap} day{gap === 1 ? "" : "s"} before the event (rule: ≥15).
            </p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Agenda (24 items)" description="Write the decision for each item." />
        <ol className="divide-y divide-crm-line">
          {PPM_AGENDA.map((a, k) => (
            <li key={a} className="grid gap-2 px-5 py-2.5 sm:grid-cols-[28px_minmax(180px,0.8fr)_1.6fr] sm:items-center">
              <span className="text-[12px] font-semibold text-crm-muted tabular">{k + 1}</span>
              <span className="text-[13px] font-medium text-crm-ink">{a}</span>
              <Input value={v.agenda[k + 1] ?? ""} disabled={readonly} onChange={(e) => setV((s) => ({ ...s, agenda: { ...s.agenda, [k + 1]: e.target.value } }))} placeholder="Decision…" className={cn(!v.agenda[k + 1] && "bg-crm-surface-2")} />
            </li>
          ))}
        </ol>
      </Card>

      <Card className="p-5">
        <Field label="Key notes">
          <Textarea value={v.notes} disabled={readonly} onChange={(e) => setV((s) => ({ ...s, notes: e.target.value }))} placeholder="Special requests, risks, follow-ups…" />
        </Field>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button icon={Eye} onClick={() => docs.previewLive(b.id, "ppm", "PPM-DRAFT")}>
            Preview
          </Button>
          {b.ppm && (
            <Button onClick={() => gen.mutate(undefined)} loading={gen.isPending}>
              Export PDF
            </Button>
          )}
          {!readonly && (
            <>
              <Button icon={FloppyDisk} loading={save.isPending && save.variables === false} onClick={() => save.mutate(false)}>
                Save draft
              </Button>
              <Button variant="primary" icon={CheckCircle} loading={save.isPending && save.variables === true} onClick={() => save.mutate(true)}>
                Mark PPM done
              </Button>
            </>
          )}
        </div>
      </Card>
      {docs.viewer}
    </div>
  );
}
