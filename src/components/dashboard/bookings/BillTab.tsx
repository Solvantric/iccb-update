"use client";
import { useState } from "react";
import { nanoid } from "nanoid";
import { Eye, FilePdf, Plus, Trash } from "@phosphor-icons/react";
import type { AddOns, Booking, Decoration, Meal } from "@/types/crm";
import { MEAL_LABELS, MEALS, SERVICE_CATEGORIES } from "@/types/crm";
import { BILL_GROUPS, decorationPrice } from "@/lib/crm/bill";
import { useBill, useHallMap, useMenus, useSecurityHeld, useServices, useSettingsValue } from "@/lib/crm/hooks";
import { money, num } from "@/lib/crm/format";
import { setAddOns } from "@/services/crm";
import { invoiceModel, pdfBill } from "@/lib/pdf/actions";
import { viewPdf } from "../ui/PdfViewer";
import { cn } from "@/lib/utils/cn";
import { Button, Card, CardTitle, Checkbox, Input, Select } from "../ui/core";
import { AnimatedNumber } from "../ui/motion";

const ICCB_DECO: Decoration[] = ["none", "basic", "standard", "premium"];
const OUTSIDE_DECO: { value: Decoration; label: string; hint: string }[] = [
  { value: "outsideA", label: "Cat. A", hint: "Full ceiling, thematic" },
  { value: "outsideB", label: "Cat. B", hint: "Backdrop, heavy light" },
  { value: "outsideC", label: "Cat. C", hint: "Simple, small stage" },
];
const DECO_NAME: Record<Decoration, string> = { none: "None", basic: "Basic", standard: "Standard", premium: "Premium", outsideA: "Cat. A", outsideB: "Cat. B", outsideC: "Cat. C" };

function Section({ title, hint, children, action }: { title: string; hint?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="border-t border-crm-line px-5 py-5 first:border-0">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[14.5px] font-semibold text-crm-ink">{title}</h3>
          {hint && <p className="text-[12.5px] text-crm-muted">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function NumberBox({ value, onChange, label, className, placeholder }: { value: number | undefined; onChange: (n: number) => void; label: string; className?: string; placeholder?: string }) {
  return <Input type="number" min={0} aria-label={label} value={value ? value : ""} placeholder={placeholder ?? "0"} onChange={(e) => onChange(Math.max(0, Number(e.target.value)))} className={cn("h-9 text-end tabular", className)} />;
}

export function BillTab({ booking: b }: { booking: Booking }) {
  const settings = useSettingsValue();
  const rates = settings.addOnRates;
  const menus = useMenus().filter((m) => m.active);
  const allServices = useServices();
  const services = allServices.filter((s) => s.active);
  const hall = useHallMap().get(b.hallId);
  const held = useSecurityHeld().get(b.id) ?? 0;
  const bill = useBill(b)!;
  const locked = b.status === "closed" || b.status === "cancelled";
  const a = b.addOns;
  const save = (patch: Partial<AddOns>, discount?: number) => setAddOns(b.id, { ...a, ...patch }, discount);
  const [svcPick, setSvcPick] = useState("");
  const outside = a.decoration.startsWith("outside");

  const setMeal = (meal: Meal, patch: Partial<{ persons: number; menuId?: string }> | null) => save({ [meal]: patch === null ? undefined : { persons: a[meal]?.persons ?? b.guests, ...a[meal], ...patch } });

  return (
    <div className="grid gap-5 xl:grid-cols-5">
      <Card className={cn("xl:col-span-3", locked && "pointer-events-none opacity-60")}>
        <CardTitle title="Add-ons" action={locked && <span className="text-[12.5px] text-crm-muted">Locked ({b.status})</span>} />

        <Section title="Venue" hint={`${hall?.name ?? "—"} · ${b.slot} · ${b.layout}`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[14px] text-crm-ink-2">Extra hours</span>
            <NumberBox label="Extra hours" value={a.extraHours} onChange={(n) => save({ extraHours: n || undefined })} className="w-24" />
            <span className="text-[12.5px] text-crm-muted tabular">× {money(hall?.extraHourRate ?? 0)} / hour</span>
          </div>
        </Section>

        <Section title="Decoration" hint="ICCB Events package, or a fee when the client brings an outside firm.">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="ICCB decoration">
            {ICCB_DECO.map((d) => {
              const on = a.decoration === d;
              return (
                <button key={d} type="button" role="radio" aria-checked={on} onClick={() => save({ decoration: d, decorationFirm: undefined })} className={cn("rounded-[10px] border px-3 py-2.5 text-start transition-colors", on ? "border-crm-brand bg-crm-tint" : "border-crm-line hover:bg-crm-surface-2")}>
                  <span className={cn("block text-[13.5px] font-medium", on ? "text-crm-brand-text" : "text-crm-ink")}>{d === "none" ? "None" : `ICCB ${DECO_NAME[d]}`}</span>
                  <span className="block text-[12px] text-crm-muted tabular">{d === "none" ? "—" : money(decorationPrice(d, rates))}</span>
                </button>
              );
            })}
          </div>
          <p className="mb-2 mt-4 text-[12.5px] font-medium text-crm-muted">Outside decoration firm (fee)</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Outside decoration">
            {OUTSIDE_DECO.map((d) => {
              const on = a.decoration === d.value;
              return (
                <button key={d.value} type="button" role="radio" aria-checked={on} onClick={() => save({ decoration: d.value })} className={cn("rounded-[10px] border px-3 py-2.5 text-start transition-colors", on ? "border-crm-brand bg-crm-tint" : "border-crm-line hover:bg-crm-surface-2")}>
                  <span className={cn("block text-[13.5px] font-medium", on ? "text-crm-brand-text" : "text-crm-ink")}>{d.label}</span>
                  <span className="block text-[12px] text-crm-muted">{d.hint}</span>
                  <span className="block text-[12px] text-crm-muted tabular">{money(decorationPrice(d.value, rates))}</span>
                </button>
              );
            })}
          </div>
          {outside && <Input className="mt-3" value={a.decorationFirm ?? ""} onChange={(e) => save({ decorationFirm: e.target.value })} placeholder="Outside firm name" aria-label="Outside firm name" />}
        </Section>

        <Section title="Food" hint={`Service charge ${money(rates.serviceChargeMain)}/person (lunch, dinner) and ${money(rates.serviceChargeLight)}/person (breakfast, snacks). VAT ${settings.foodVatPercent}% on food.`}>
          <div className="divide-y divide-crm-line rounded-[10px] border border-crm-line">
            {MEALS.map((meal) => {
              const line = a[meal];
              const on = !!line;
              const options = menus.filter((m) => m.meal === meal);
              const menu = options.find((m) => m.id === line?.menuId);
              return (
                <div key={meal} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Checkbox checked={on} onChange={(c) => setMeal(meal, c ? {} : null)} label={<span className="text-crm-ink">{MEAL_LABELS[meal]}</span>} className="min-w-[140px]" />
                    <Select
                      aria-label={`${MEAL_LABELS[meal]} menu`}
                      value={line?.menuId ?? ""}
                      onChange={(v) => setMeal(meal, { menuId: v || undefined })}
                      placeholder={`Standard · ${money(rates[meal])}`}
                      options={options.map((m) => ({ value: m.id, label: `${m.name} · ${money(m.perHead)}` }))}
                      className={cn("h-9 min-w-0 flex-1 sm:max-w-[260px]", !on && "pointer-events-none opacity-50")}
                    />
                    <div className="ms-auto flex items-center gap-2">
                      <NumberBox label={`${MEAL_LABELS[meal]} persons`} value={line?.persons} placeholder={String(b.guests)} onChange={(n) => setMeal(meal, { persons: n })} className={cn("w-24", !on && "pointer-events-none opacity-50")} />
                      <span className="text-[12.5px] text-crm-muted">persons</span>
                    </div>
                  </div>
                  {menu && <p className="mt-1.5 ps-7 text-[12.5px] text-crm-muted">{menu.items.join(" · ")}</p>}
                </div>
              );
            })}
          </div>
        </Section>

        <Section
          title="ICCB services"
          hint="Sound, light, LED, power, furniture, staff and logistics."
          action={
            <div className="flex items-center gap-2">
              <select aria-label="Add a service" value={svcPick} onChange={(e) => setSvcPick(e.target.value)} className="h-9 max-w-[200px] rounded-[8px] border border-crm-line bg-crm-surface px-2 text-[13px] text-crm-ink focus:border-crm-brand focus:outline-none">
                <option value="">Choose a service…</option>
                {SERVICE_CATEGORIES.map((cat) => {
                  const list = services.filter((s) => s.category === cat && !a.services?.some((x) => x.serviceId === s.id));
                  return list.length ? (
                    <optgroup key={cat} label={cat}>
                      {list.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} · {money(s.rate)}/{s.unit}
                        </option>
                      ))}
                    </optgroup>
                  ) : null;
                })}
              </select>
              <Button
                size="sm"
                icon={Plus}
                disabled={!svcPick}
                onClick={() => {
                  save({ services: [...(a.services ?? []), { serviceId: svcPick, qty: 1 }] });
                  setSvcPick("");
                }}
              >
                Add
              </Button>
            </div>
          }
        >
          {a.services?.length ? (
            <ul className="divide-y divide-crm-line rounded-[10px] border border-crm-line">
              {a.services.map((line) => {
                const s = allServices.find((x) => x.id === line.serviceId);
                return (
                  <li key={line.serviceId} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] text-crm-ink">{s?.name ?? "Removed service"}</span>
                      <span className="block text-[12px] text-crm-muted tabular">
                        {s?.category} · {money(s?.rate ?? 0)} / {s?.unit}
                      </span>
                    </span>
                    <NumberBox label="Quantity" value={line.qty} onChange={(n) => save({ services: a.services!.map((x) => (x.serviceId === line.serviceId ? { ...x, qty: n } : x)) })} className="w-24" />
                    <span className="w-28 text-end text-[13.5px] text-crm-ink-2 tabular">{money(line.qty * (s?.rate ?? 0))}</span>
                    <Button size="icon-sm" variant="ghost" aria-label="Remove service" onClick={() => save({ services: a.services!.filter((x) => x.serviceId !== line.serviceId) })}>
                      <Trash size={15} />
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[13.5px] text-crm-muted">No services added.</p>
          )}
        </Section>

        <Section
          title="Other items"
          hint="Anything not in the catalog (flowers, extra stage, special requests)."
          action={
            <Button size="sm" icon={Plus} onClick={() => save({ custom: [...(a.custom ?? []), { id: nanoid(6), name: "", qty: 1, rate: 0 }] })}>
              Add item
            </Button>
          }
        >
          {a.custom?.length ? (
            <ul className="space-y-2">
              {a.custom.map((c) => {
                const upd = (patch: Partial<typeof c>) => save({ custom: a.custom!.map((x) => (x.id === c.id ? { ...x, ...patch } : x)) });
                return (
                  <li key={c.id} className="flex flex-wrap items-center gap-2">
                    <Input value={c.name} onChange={(e) => upd({ name: e.target.value })} placeholder="Item name" aria-label="Item name" className="h-9 min-w-[160px] flex-1" />
                    <NumberBox label="Quantity" value={c.qty} onChange={(n) => upd({ qty: n })} className="w-20" />
                    <span className="text-crm-muted">×</span>
                    <NumberBox label="Rate" value={c.rate} onChange={(n) => upd({ rate: n })} className="w-28" />
                    <Button size="icon-sm" variant="ghost" aria-label="Remove item" onClick={() => save({ custom: a.custom!.filter((x) => x.id !== c.id) })}>
                      <Trash size={15} />
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[13.5px] text-crm-muted">No other items.</p>
          )}
        </Section>

        <Section title="Discount" hint="Taken off the subtotal, before VAT.">
          <div className="flex flex-wrap items-center gap-2">
            <NumberBox label="Discount" value={b.discount} onChange={(n) => save({}, n)} className="w-40" />
            {[5, 10, 15].map((pct) => (
              <Button key={pct} size="sm" variant="ghost" onClick={() => save({}, Math.round((bill.subtotal * pct) / 100))}>
                {pct}%
              </Button>
            ))}
            {b.discount > 0 && (
              <Button size="sm" variant="ghost" onClick={() => save({}, 0)}>
                Clear
              </Button>
            )}
          </div>
        </Section>
      </Card>

      <div className="xl:col-span-2">
        <Card className="xl:sticky xl:top-4">
          <CardTitle
            title="Bill"
            action={
              <div className="flex gap-1.5">
                <Button size="sm" icon={Eye} onClick={() => viewPdf(invoiceModel(b))}>
                  View invoice
                </Button>
                <Button size="icon-sm" variant="ghost" aria-label="Download bill PDF" title="Download bill PDF" onClick={() => pdfBill(b)}>
                  <FilePdf size={17} />
                </Button>
              </div>
            }
          />
          <div className="px-5 pb-5 text-[14px]">
            {BILL_GROUPS.filter((g) => bill.groupTotals[g] > 0).map((g) => (
              <div key={g} className="mb-3">
                <div className="mb-1 flex items-center justify-between text-[12.5px] font-medium text-crm-muted">
                  <span>{g}</span>
                  <span className="tabular">{money(bill.groupTotals[g])}</span>
                </div>
                <ul className="space-y-1.5">
                  {bill.lines
                    .filter((l) => l.group === g)
                    .map((l) => (
                      <li key={l.key} className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="text-crm-ink">{l.label}</span>
                          <span className="block text-[12px] text-crm-muted">{[l.detail, l.qty != null && l.rate != null && `${num(l.qty)} × ${num(l.rate)}`].filter(Boolean).join(" · ")}</span>
                        </span>
                        <AnimatedNumber value={l.amount} format={money} className="shrink-0 text-crm-ink-2" />
                      </li>
                    ))}
                </ul>
              </div>
            ))}
            <dl className="mt-4 space-y-2 border-t border-crm-line pt-4">
              <Row label="Subtotal" value={bill.subtotal} />
              {bill.discount > 0 && <Row label="Discount" value={-bill.discount} />}
              {bill.vat > 0 && <Row label={`VAT ${settings.foodVatPercent}% on food`} value={bill.vat} />}
              <Row label="Total" value={bill.total} strong />
              <Row label="Paid" value={bill.paid} />
              <Row label="Due" value={bill.due} strong accent={bill.due > 0} />
            </dl>
            <div className="mt-4 space-y-1.5 rounded-[10px] bg-crm-surface-2 px-4 py-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-crm-muted">Advance to confirm (60%)</span>
                <span className="text-crm-ink tabular">{money(Math.round(bill.total * 0.6))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-crm-muted">Security money ({b.eventType}, refundable)</span>
                <span className="text-crm-ink tabular">{money(bill.security)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-crm-muted">Security held</span>
                <span className="text-crm-ink tabular">{money(held)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, strong, accent }: { label: string; value: number; strong?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={strong ? "font-medium text-crm-ink" : "text-crm-muted"}>{label}</dt>
      <dd>
        <AnimatedNumber value={value} format={(n) => (n < 0 ? `− ${money(-n)}` : money(n))} className={cn(strong ? "text-[16px] font-semibold text-crm-ink" : "text-crm-ink-2", accent && "text-crm-brand-text")} />
      </dd>
    </div>
  );
}
