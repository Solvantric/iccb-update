"use client";
import { useState } from "react";
import { nanoid } from "nanoid";
import { CheckCircle, Eye, FloppyDisk, Plus, Trash, Warning } from "@phosphor-icons/react";
import type { Booking, FactSheet } from "@/types/crm";
import { firstEventDate, extraGuestCharge } from "@/lib/crm/pricing";
import { getRates } from "@/lib/crm/db";
import { taka } from "@/lib/crm/format";
import { saveFactSheet } from "@/services/crm/bookings.service";
import { useCrmAction } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { Badge, Button, Card, CardHeader, Field, Input, NumberInput, Textarea } from "../ui/core";
import { useDocs } from "../documents/useDocs";

function Stars({ value, onChange, disabled }: { value: number; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={disabled} onClick={() => onChange(n)} className={cn("h-7 w-7 rounded-md text-[12px] font-bold transition-colors", n <= value ? "bg-crm-brand text-white" : "bg-crm-surface-2 text-crm-muted hover:bg-crm-tint")}>
          {n}
        </button>
      ))}
    </div>
  );
}

/** Program Fact Sheet (Operations), filled on the event day. */
export function FactSheetForm({ b, readonly, onSaved }: { b: Booking; readonly?: boolean; onSaved?: () => void }) {
  const date = firstEventDate(b);
  const [f, setF] = useState<FactSheet>(
    () =>
      b.factSheet ?? {
        hallOpenedBy: "",
        preparationHours: 4,
        businessHours: 12,
        actualGuests: b.guests.optimum,
        extraHours: 0,
        acLog: [{ id: nanoid(5), start: b.days[0]?.start ?? "11:00", end: b.days[0]?.end ?? "23:00" }],
        generatorLog: [],
        foodProvider: b.menus.length ? "ICCB Catering" : "—",
        kitchenUsedTime: "",
        driverPackets: 0,
        foodStallQty: 0,
        serviceBoys: Math.round(b.guests.optimum / 12),
        atATimeSetup: Math.round(b.guests.optimum / 2),
        tablePerSetup: 10,
        headTable: 1,
        waiting: 0,
        hygiene: 4,
        serviceDress: 4,
        mannerism: 4,
        cleaningLog: [],
        summary: "",
        hallClosedBy: "",
        done: false,
      }
  );
  const set = <K extends keyof FactSheet>(k: K, v: FactSheet[K]) => setF((s) => ({ ...s, [k]: v }));
  const docs = useDocs();
  const save = useCrmAction((done: boolean) => saveFactSheet(b.id, { ...f, done }), { success: (r) => (r.factSheet?.done ? "Fact sheet completed — extras added to invoice" : "Fact sheet saved"), onSuccess: () => onSaved?.() });
  const xg = extraGuestCharge(b.guests.optimum, f.actualGuests, getRates(b.priceVersion));
  const num = (k: keyof FactSheet) => <NumberInput value={f[k] as number} onChange={(n) => set(k, n as never)} />;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Program Fact Sheet" description={`Event day ${date}. Extra hours and guests >10% over booked are charged automatically.`} action={b.factSheet?.done ? <Badge tone="green"><CheckCircle size={12} weight="fill" /> Completed</Badge> : <Badge tone="amber">Draft</Badge>} />
        <fieldset disabled={readonly} className="grid gap-4 px-5 pb-5 sm:grid-cols-3">
          <Field label="Hall opened by">
            <Input value={f.hallOpenedBy} onChange={(e) => set("hallOpenedBy", e.target.value)} />
          </Field>
          <Field label="Preparation hours">{num("preparationHours")}</Field>
          <Field label="Business hours">{num("businessHours")}</Field>
          <Field label="Actual guests" hint={`Booked ${b.guests.optimum}`}>
            {num("actualGuests")}
          </Field>
          <Field label="Extra hours (beyond 12 h)">{num("extraHours")}</Field>
          <Field label="Hall closed by">
            <Input value={f.hallClosedBy} onChange={(e) => set("hallClosedBy", e.target.value)} />
          </Field>
          {xg.amount > 0 && (
            <p className="sm:col-span-3 flex items-center gap-2 rounded-lg bg-[#FEF6E7] px-3 py-2 text-[12.5px] text-[#B54708] dark:bg-[#2B2010]">
              <Warning size={15} weight="fill" /> {xg.extra} extra guests (&gt;10% over booked) → {taka(xg.amount)} will be added to the invoice.
            </p>
          )}
        </fieldset>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="AC running log" action={!readonly && <Button size="sm" icon={Plus} onClick={() => set("acLog", [...f.acLog, { id: nanoid(5), start: "", end: "" }])}>Row</Button>} />
          <div className="space-y-2 px-5 pb-5">
            {f.acLog.map((r) => (
              <div key={r.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input type="time" value={r.start} disabled={readonly} onChange={(e) => set("acLog", f.acLog.map((x) => (x.id === r.id ? { ...x, start: e.target.value } : x)))} />
                <Input type="time" value={r.end} disabled={readonly} onChange={(e) => set("acLog", f.acLog.map((x) => (x.id === r.id ? { ...x, end: e.target.value } : x)))} />
                <Button size="icon" variant="ghost" disabled={readonly} onClick={() => set("acLog", f.acLog.filter((x) => x.id !== r.id))} aria-label="Remove">
                  <Trash size={15} />
                </Button>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Generator log" action={!readonly && <Button size="sm" icon={Plus} onClick={() => set("generatorLog", [...f.generatorLog, { id: nanoid(5), date, hours: 0, minutes: 30 }])}>Row</Button>} />
          <div className="space-y-2 px-5 pb-5">
            {f.generatorLog.length === 0 && <p className="text-[12.5px] text-crm-muted">No generator use logged.</p>}
            {f.generatorLog.map((r) => (
              <div key={r.id} className="grid grid-cols-[1.2fr_0.8fr_0.8fr_auto] gap-2">
                <Input type="date" value={r.date} disabled={readonly} onChange={(e) => set("generatorLog", f.generatorLog.map((x) => (x.id === r.id ? { ...x, date: e.target.value } : x)))} />
                <NumberInput value={r.hours} suffix="h" onChange={(n) => set("generatorLog", f.generatorLog.map((x) => (x.id === r.id ? { ...x, hours: n } : x)))} />
                <NumberInput value={r.minutes} suffix="m" onChange={(n) => set("generatorLog", f.generatorLog.map((x) => (x.id === r.id ? { ...x, minutes: n } : x)))} />
                <Button size="icon" variant="ghost" disabled={readonly} onClick={() => set("generatorLog", f.generatorLog.filter((x) => x.id !== r.id))} aria-label="Remove">
                  <Trash size={15} />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Food & service" />
        <fieldset disabled={readonly} className="grid gap-4 px-5 pb-5 sm:grid-cols-3 lg:grid-cols-4">
          <Field label="Food provider">
            <Input value={f.foodProvider} onChange={(e) => set("foodProvider", e.target.value)} />
          </Field>
          <Field label="Kitchen used time">
            <Input value={f.kitchenUsedTime} onChange={(e) => set("kitchenUsedTime", e.target.value)} placeholder="10:00–22:00" />
          </Field>
          <Field label="Driver packets">{num("driverPackets")}</Field>
          <Field label="Food stall qty">{num("foodStallQty")}</Field>
          <Field label="Service boys">{num("serviceBoys")}</Field>
          <Field label="At-a-time set-up">{num("atATimeSetup")}</Field>
          <Field label="Table per set-up">{num("tablePerSetup")}</Field>
          <Field label="Head table">{num("headTable")}</Field>
          <Field label="Waiting">{num("waiting")}</Field>
        </fieldset>
        <div className="grid gap-4 border-t border-crm-line px-5 py-4 sm:grid-cols-3">
          <Field label="Hygiene">
            <Stars value={f.hygiene} onChange={(n) => set("hygiene", n)} disabled={readonly} />
          </Field>
          <Field label="Service dress">
            <Stars value={f.serviceDress} onChange={(n) => set("serviceDress", n)} disabled={readonly} />
          </Field>
          <Field label="Mannerism">
            <Stars value={f.mannerism} onChange={(n) => set("mannerism", n)} disabled={readonly} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Cleaning visit log" action={!readonly && <Button size="sm" icon={Plus} onClick={() => set("cleaningLog", [...f.cleaningLog, { id: nanoid(5), time: "", rating: 4 }])}>Visit</Button>} />
        <div className="space-y-2 px-5 pb-5">
          {f.cleaningLog.length === 0 && <p className="text-[12.5px] text-crm-muted">No visits logged.</p>}
          {f.cleaningLog.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3">
              <Input type="time" value={c.time} disabled={readonly} className="w-36" onChange={(e) => set("cleaningLog", f.cleaningLog.map((x) => (x.id === c.id ? { ...x, time: e.target.value } : x)))} />
              <Stars value={c.rating} disabled={readonly} onChange={(n) => set("cleaningLog", f.cleaningLog.map((x) => (x.id === c.id ? { ...x, rating: n } : x)))} />
              <Button size="icon-sm" variant="ghost" disabled={readonly} onClick={() => set("cleaningLog", f.cleaningLog.filter((x) => x.id !== c.id))} aria-label="Remove">
                <Trash size={15} />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <Field label="Program summary">
          <Textarea value={f.summary} disabled={readonly} onChange={(e) => set("summary", e.target.value)} />
        </Field>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button icon={Eye} onClick={() => docs.previewLive(b.id, "fact_sheet", "FS-DRAFT")}>
            Preview
          </Button>
          {!readonly && (
            <>
              <Button icon={FloppyDisk} loading={save.isPending && save.variables === false} onClick={() => save.mutate(false)}>
                Save draft
              </Button>
              <Button variant="primary" icon={CheckCircle} loading={save.isPending && save.variables === true} onClick={() => save.mutate(true)}>
                Complete fact sheet
              </Button>
            </>
          )}
        </div>
      </Card>
      {docs.viewer}
    </div>
  );
}
