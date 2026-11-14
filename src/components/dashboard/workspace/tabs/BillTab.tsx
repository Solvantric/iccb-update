"use client";
import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { CheckCircle, Eye, ForkKnife, Hourglass, Plus, Sparkle, Tag, Trash, XCircle } from "@phosphor-icons/react";
import type { AddonLine, Booking, ChargeCategory, IccbService, MenuPackage, ServiceCharge } from "@/types/crm";
import { getSettings } from "@/lib/crm/db";
import { catalogRate, findHall } from "@/lib/crm/pricing";
import { taka } from "@/lib/crm/format";
import { decideDiscount, setDiscount, updateBooking } from "@/services/crm/bookings.service";
import { applyOfferCode, removeOfferCode } from "@/services/crm/features.service";
import { useCrmAction, useIccbServices, useMenus } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { Badge, Button, Card, CardHeader, Field, Input, NumberInput, SearchInput, Segmented, Select, Textarea } from "../../ui/core";
import { AnimatedMoney } from "../../ui/kpi";
import { Drawer } from "../../ui/overlay";
import { useDocs } from "../../documents/useDocs";
import { LeakageAlert } from "../../features/Leakage";
import { DecoratorPicker } from "../../features/Vendors";
import { useWs } from "../context";

const GROUP_LABEL = { venue: "Venue", service: "Service", food: "Food", decoration: "Decoration", addon: "Add-on", extra: "Extra", damage: "Damage" } as const;

/** Bill: every line from the pricing engine, editable add-on/food lines, totals. */
export function BillTab() {
  const { b, est, canEdit } = useWs();
  const docs = useDocs();
  const [adding, setAdding] = useState(false);
  const save = useCrmAction((a: { patch: Partial<Booking>; note?: string }) => updateBooking(b.id, a.patch, a.note));
  const readonly = !canEdit || !!b.closed;

  const edit = (lineId: string, field: "qty" | "rate", n: number) => {
    if (lineId.startsWith("addon-")) {
      const id = lineId.slice(6);
      save.mutate({ patch: { addons: b.addons.map((a) => (a.id === id ? { ...a, [field]: n } : a)) }, note: "Bill line edited" });
    } else if (lineId.startsWith("food-")) {
      const id = lineId.slice(5);
      save.mutate({ patch: { menus: b.menus.map((x) => (x.id === id ? { ...x, [field === "qty" ? "guests" : "perHead"]: n } : x)) }, note: "Menu edited" });
    }
  };
  const remove = (lineId: string, name: string) => {
    if (lineId.startsWith("addon-")) save.mutate({ patch: { addons: b.addons.filter((a) => a.id !== lineId.slice(6)) }, note: `Removed ${name}` });
    else if (lineId.startsWith("food-")) save.mutate({ patch: { menus: b.menus.filter((x) => x.id !== lineId.slice(5)) }, note: `Removed ${name}` });
  };

  return (
    <div className="space-y-5">
      <LeakageAlert />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="min-w-0">
          <CardHeader
            title="Bill"
            description="Prices come from the tariff on the booking date. Add-on and food lines can be edited."
            action={
              <div className="flex gap-2">
                <Button size="sm" icon={Eye} onClick={() => docs.previewLive(b.id, "estimate", "DRAFT")}>
                  Preview
                </Button>
                {!readonly && (
                  <Button size="sm" variant="primary" icon={Plus} onClick={() => setAdding(true)}>
                    Add items
                  </Button>
                )}
              </div>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead>
                <tr className="border-y border-crm-line bg-crm-surface-2 text-[11.5px] uppercase tracking-[0.08em] text-crm-muted">
                  <th className="px-5 py-2 text-start font-semibold">Item</th>
                  <th className="py-2 text-end font-semibold">Qty</th>
                  <th className="py-2 text-end font-semibold">Rate</th>
                  <th className="py-2 text-end font-semibold">Amount</th>
                  <th className="w-12 pe-3" />
                </tr>
              </thead>
              <tbody>
                {est.lines.map((l) => {
                  const editable = !readonly && (l.id.startsWith("addon-") || l.id.startsWith("food-"));
                  return (
                    <tr key={`${l.id}-${l.qty}-${l.rate}`} className="border-b border-crm-line last:border-0">
                      <td className="px-5 py-2.5">
                        <span className="text-crm-ink">{l.particular}</span>
                        <span className="ms-2 text-[11px] text-crm-muted">{GROUP_LABEL[l.group]}</span>
                      </td>
                      <td className="py-2 text-end">{editable ? <Cell value={l.qty} onCommit={(n) => edit(l.id, "qty", n)} /> : <span className="tabular">{l.qty.toLocaleString("en-US")}</span>}</td>
                      <td className="py-2 text-end">{editable ? <Cell value={l.rate} money onCommit={(n) => edit(l.id, "rate", n)} /> : <span className="tabular">{taka(l.rate)}</span>}</td>
                      <td className="py-2 text-end font-semibold tabular text-crm-ink whitespace-nowrap">{taka(l.amount)}</td>
                      <td className="pe-3 text-end">
                        {editable && (
                          <Button size="icon-sm" variant="ghost" aria-label="Remove line" onClick={() => remove(l.id, l.particular)}>
                            <Trash size={14} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <dl className="ms-auto max-w-sm space-y-1.5 border-t border-crm-line px-5 py-4 text-[13px]">
            <Row k="Subtotal" v={est.subtotal} />
            {est.vat > 0 && <Row k={`Food VAT ${est.vatPct}%`} v={est.vat} />}
            {est.ait > 0 && <Row k={`AIT ${est.aitPct}%`} v={est.ait} />}
            <Row k="Security money (refundable)" v={est.security} />
            {est.discount > 0 && <Row k="Discount" v={-est.discount} />}
            <div className="flex justify-between border-t border-crm-line pt-2">
              <dt className="font-semibold text-crm-ink">Grand total</dt>
              <dd>
                <AnimatedMoney value={est.grandTotal} className="font-display text-[20px] font-semibold text-crm-brand" />
              </dd>
            </div>
          </dl>
        </Card>

        <div className="space-y-5">
          <DiscountCard readonly={readonly} />
          <OfferCodeCard readonly={readonly} />
          <DecorationCard readonly={readonly} />
        </div>
      </div>
      {adding && <AddItemsDrawer onClose={() => setAdding(false)} />}
      {docs.viewer}
    </div>
  );
}

function Row({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-crm-ink-2">{k}</dt>
      <dd>
        <AnimatedMoney value={v} className="tabular text-crm-ink" />
      </dd>
    </div>
  );
}

function Cell({ value, onCommit, money }: { value: number; onCommit: (n: number) => void; money?: boolean }) {
  const [v, setV] = useState(value);
  return (
    <span onBlur={() => v !== value && onCommit(v)} className="ms-auto block w-28">
      <NumberInput value={v} onChange={setV} money={money} />
    </span>
  );
}

/* ─── Side cards ─────────────────────────────────────────────────────────── */

function DiscountCard({ readonly }: { readonly: boolean }) {
  const { b, est, canApprove, me } = useWs();
  const [d, setD] = useState({ mode: b.discount.mode, value: b.discount.value, reason: b.discount.reason ?? "" });
  const save = useCrmAction(() => setDiscount(b.id, d), { success: (r) => (r.discount.approval === "pending" ? "Discount sent for approval" : "Discount saved") });
  const decide = useCrmAction((ok: boolean) => decideDiscount(b.id, ok), { success: (r) => `Discount ${r.discount.approval}` });
  const threshold = getSettings().discountApprovalThreshold;
  const amount = d.mode === "percent" ? Math.round((est.subtotal * d.value) / 100) : d.value;
  const needs = amount > threshold && !canApprove;
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13.5px] font-semibold text-crm-ink">Discount</p>
        {b.discount.approval !== "none" && (
          <Badge tone={b.discount.approval === "approved" ? "green" : b.discount.approval === "pending" ? "amber" : "red"}>
            {b.discount.approval === "pending" ? <Hourglass size={12} /> : b.discount.approval === "approved" ? <CheckCircle size={12} /> : <XCircle size={12} />}
            {b.discount.approval}
          </Badge>
        )}
      </div>
      {!readonly && (
        <div className="mt-3 space-y-2.5">
          <div className="flex gap-2">
            <Segmented size="sm" value={d.mode} onChange={(v) => setD((s) => ({ ...s, mode: v }))} options={[{ value: "amount", label: "৳" }, { value: "percent", label: "%" }]} />
            <NumberInput value={d.value} onChange={(n) => setD((s) => ({ ...s, value: n }))} money={d.mode === "amount"} suffix={d.mode === "percent" ? "%" : undefined} className="flex-1" />
          </div>
          {d.value > 0 && <Textarea value={d.reason} onChange={(e) => setD((s) => ({ ...s, reason: e.target.value }))} placeholder="Reason" className="min-h-[52px]" />}
          <p className={cn("text-[12px]", needs ? "text-[#B54708]" : "text-crm-muted")}>
            = {taka(amount)} {needs ? `· above ${taka(threshold)}, needs approval` : ""}
          </p>
          <Button size="sm" className="w-full" loading={save.isPending} onClick={() => save.mutate(undefined)}>
            {needs ? "Request approval" : "Apply"}
          </Button>
        </div>
      )}
      {b.discount.approval === "pending" && canApprove && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-crm-line pt-3">
          <Button size="sm" variant="primary" loading={decide.isPending} onClick={() => decide.mutate(true)}>
            Approve
          </Button>
          <Button size="sm" variant="danger" onClick={() => decide.mutate(false)}>
            Reject
          </Button>
        </div>
      )}
      {b.discount.approval === "pending" && !canApprove && <p className="mt-2 text-[12px] text-crm-muted">Waiting for {me.role === "sales_executive" ? "your Sales Manager" : "a manager"}.</p>}
    </Card>
  );
}

function OfferCodeCard({ readonly }: { readonly: boolean }) {
  const { b } = useWs();
  const [code, setCode] = useState("");
  const apply = useCrmAction(() => applyOfferCode(b.id, code), { success: (r) => `Offer ${r.offerCode} applied`, onSuccess: () => setCode("") });
  const remove = useCrmAction(() => removeOfferCode(b.id), { success: "Offer removed" });
  const line = b.addons.find((a) => a.reason?.startsWith("offer:"));
  if (readonly && !line) return null;
  return (
    <Card className="p-4">
      <p className="flex items-center gap-2 text-[13.5px] font-semibold text-crm-ink">
        <Tag size={15} className="text-crm-brand" /> Offer code
      </p>
      {b.offerCode && line ? (
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-[var(--radius-btn)] bg-crm-tint px-3 py-2 text-[12.5px]">
          <span className="text-crm-ink">
            <span className="font-mono font-semibold">{b.offerCode}</span> · {taka(Math.abs(line.qty * line.rate))} off
          </span>
          {!readonly && (
            <Button size="sm" variant="ghost" loading={remove.isPending} onClick={() => remove.mutate(undefined)}>
              Remove
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-2.5 flex gap-2">
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ICCB-WED15" className="font-mono" />
          <Button disabled={code.trim().length < 4} loading={apply.isPending} onClick={() => apply.mutate(undefined)}>
            Apply
          </Button>
        </div>
      )}
    </Card>
  );
}

function DecorationCard({ readonly }: { readonly: boolean }) {
  const { b, rates } = useWs();
  const save = useCrmAction((a: { patch: Partial<Booking>; note?: string }) => updateBooking(b.id, a.patch, a.note));
  const hallCode = findHall(rates, b.days[0]?.hallId ?? "")?.code;
  const cat = rates.decoration.find((d) => d.code === b.decoration.category);
  return (
    <Card className="p-4">
      <p className="mb-2.5 text-[13.5px] font-semibold text-crm-ink">Decoration</p>
      <Segmented
        size="sm"
        value={b.decoration.provider}
        onChange={(v) => !readonly && save.mutate({ patch: { decoration: { ...b.decoration, provider: v } }, note: `Decoration provider: ${v}` })}
        options={[{ value: "iccb", label: "ICCB" }, { value: "outside", label: "Outside" }, { value: "none", label: "None" }]}
      />
      {b.decoration.provider === "outside" && (
        <div className="mt-3 space-y-3">
          <DecoratorPicker b={b} disabled={readonly} />
          <Field label="Fee category" hint={cat ? `${cat.description} · ${taka(hallCode === "hall-5" ? cat.rateHall5 : cat.rateHall14)}` : undefined}>
            <Select value={b.decoration.category} disabled={readonly} onChange={(v) => save.mutate({ patch: { decoration: { ...b.decoration, category: v as "A" | "B" | "C" } }, note: `Outside decoration category ${v}` })} placeholder="Choose…" options={rates.decoration.map((d) => ({ value: d.code, label: `Category ${d.code}` }))} />
          </Field>
        </div>
      )}
    </Card>
  );
}

/* ─── Add items (catalogue lives here, out of the main view) ─────────────── */

type Section = "catering" | "iccb" | "charges" | "custom";
const CAT_LABELS: Record<ChargeCategory, string> = { per_person: "Per person / item", hall: "Hall-level", generator: "Generator", other: "Other items", stall: "Food stalls" };

function AddItemsDrawer({ onClose }: { onClose: () => void }) {
  const { b, rates } = useWs();
  const menus = useMenus();
  const iccb = useIccbServices();
  const [section, setSection] = useState<Section>("catering");
  const [q, setQ] = useState("");
  const [guests, setGuests] = useState(b.guests.optimum);
  const [custom, setCustom] = useState({ name: "", unit: "item", qty: 1, rate: 0 });
  const save = useCrmAction((a: { patch: Partial<Booking>; note?: string }) => updateBooking(b.id, a.patch, a.note), { success: "Added to the bill" });
  const hallCode = findHall(rates, b.days[0]?.hallId ?? "")?.code;
  const match = (s: string) => !q || s.toLowerCase().includes(q.toLowerCase());
  const charges = useMemo(() => rates.charges.filter((c) => match(c.name) && (c.category !== "generator" || !c.hallCodes || !hallCode || c.hallCodes.includes(hallCode))), [rates.charges, q, hallCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const addLine = (l: Omit<AddonLine, "id">, note: string) => save.mutate({ patch: { addons: [...b.addons, { ...l, id: nanoid(6) }] }, note });
  const addMenu = (p: MenuPackage) => save.mutate({ patch: { menus: [...b.menus, { id: nanoid(6), packageId: p.id, name: p.name, guests, perHead: p.perHead }] }, note: `Added ICCB Catering: ${p.name} × ${guests}` });
  const addCharge = (c: ServiceCharge) => addLine({ kind: "service", catalogId: c.id, name: c.name, unit: c.unit, qty: c.category === "per_person" && c.unit === "person" ? b.guests.optimum : 1, rate: catalogRate(c, hallCode) }, `Added ${c.name}`);
  const addIccb = (s: IccbService) => addLine({ kind: "iccb", catalogId: s.id, name: s.name, unit: s.unit, qty: 1, rate: s.rate }, `Added ICCB service: ${s.name}`);

  const item = "group flex w-full items-center justify-between gap-3 rounded-[var(--radius-btn)] border border-crm-line px-3 py-2.5 text-start transition-colors hover:border-crm-brand hover:bg-crm-tint/40";
  return (
    <Drawer open onOpenChange={(o) => !o && onClose()} title="Add items to the bill" description="Click an item to add it. Edit quantity and rate in the bill." width={560}>
      <div className="space-y-4">
        <Segmented
          size="sm"
          value={section}
          onChange={setSection}
          options={[
            { value: "catering", label: "Catering", icon: ForkKnife },
            { value: "iccb", label: "ICCB services", icon: Sparkle },
            { value: "charges", label: "Charges", icon: Tag },
            { value: "custom", label: "Custom", icon: Plus },
          ]}
        />
        {section !== "custom" && <SearchInput value={q} onChange={setQ} placeholder="Search…" />}
        {section === "catering" && (
          <>
            <Field label="Guests for this menu">
              <NumberInput value={guests} onChange={setGuests} />
            </Field>
            <div className="space-y-2">
              {(menus.data ?? []).filter((p) => p.published && match(p.name)).map((p) => (
                <button key={p.id} className={item} onClick={() => addMenu(p)}>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-medium text-crm-ink">{p.name}</span>
                    <span className="block truncate text-[12px] text-crm-muted">{p.cuisine} · {p.items.slice(0, 3).join(", ")}</span>
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold text-crm-brand tabular">{taka(p.perHead)}/head</span>
                </button>
              ))}
            </div>
            <p className="text-[12px] text-crm-muted">Outside catering is not allowed. Food VAT 15% is added automatically.</p>
          </>
        )}
        {section === "iccb" && (
          <div className="space-y-2">
            {(iccb.data ?? []).filter((s) => match(s.name)).map((s) => (
              <button key={s.id} className={item} onClick={() => addIccb(s)}>
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-medium text-crm-ink">{s.name}</span>
                  <span className="block text-[12px] text-crm-muted">{s.category}</span>
                </span>
                <span className="shrink-0 text-[13px] font-semibold tabular text-crm-ink">{taka(s.rate)}/{s.unit}</span>
              </button>
            ))}
          </div>
        )}
        {section === "charges" && (
          <div className="space-y-2">
            {charges.map((c) => (
              <button key={c.id} className={item} onClick={() => addCharge(c)}>
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-medium text-crm-ink">{c.name}</span>
                  <span className="block text-[12px] text-crm-muted">{CAT_LABELS[c.category]}{c.maxHours ? ` · max ${c.maxHours} h` : ""}</span>
                </span>
                <span className="shrink-0 text-[13px] font-semibold tabular text-crm-ink">{taka(catalogRate(c, hallCode))}/{c.unit}</span>
              </button>
            ))}
          </div>
        )}
        {section === "custom" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" className="sm:col-span-2">
              <Input value={custom.name} onChange={(e) => setCustom((s) => ({ ...s, name: e.target.value }))} placeholder="e.g. Photo booth" />
            </Field>
            <Field label="Unit">
              <Input value={custom.unit} onChange={(e) => setCustom((s) => ({ ...s, unit: e.target.value }))} />
            </Field>
            <Field label="Qty">
              <NumberInput value={custom.qty} onChange={(n) => setCustom((s) => ({ ...s, qty: n }))} />
            </Field>
            <Field label="Rate" className="sm:col-span-2">
              <NumberInput value={custom.rate} onChange={(n) => setCustom((s) => ({ ...s, rate: n }))} money />
            </Field>
            <Button
              variant="primary"
              className="sm:col-span-2"
              disabled={!custom.name.trim()}
              onClick={() => {
                addLine({ kind: "custom", name: custom.name.trim(), unit: custom.unit || "item", qty: custom.qty, rate: custom.rate }, `Added custom item ${custom.name}`);
                setCustom({ name: "", unit: "item", qty: 1, rate: 0 });
              }}
            >
              Add custom item
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );
}
