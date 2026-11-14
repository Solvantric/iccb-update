"use client";
import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { AnimatePresence } from "framer-motion";
import { CheckCircle, ForkKnife, Hourglass, Package, PaintBrush, Plus, Sparkle, Tag, Trash, XCircle } from "@phosphor-icons/react";
import type { AddonLine, Booking, ChargeCategory, IccbService, MenuPackage, ServiceCharge } from "@/types/crm";
import { getSettings } from "@/lib/crm/db";
import { catalogRate, findHall } from "@/lib/crm/pricing";
import { taka } from "@/lib/crm/format";
import { decideDiscount, setDiscount, updateBooking } from "@/services/crm/bookings.service";
import { useCrmAction, useIccbServices, useMenus } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { m } from "../../ui/motion";
import { Badge, Button, Card, CardHeader, Field, Input, NumberInput, SearchInput, Segmented, Select, Textarea } from "../../ui/core";
import { AnimatedMoney } from "../../ui/kpi";
import { useWs } from "../context";
import { LeakageAlert } from "../../features/Leakage";
import { DecoratorPicker } from "../../features/Vendors";
import { applyOfferCode, removeOfferCode } from "@/services/crm/features.service";

const CAT_LABELS: Record<ChargeCategory, string> = { per_person: "Per person / item", hall: "Hall-level", generator: "Generator", other: "Other items", stall: "Food stalls" };

function LineEditor({ line, onSave, onRemove, disabled }: { line: AddonLine; onSave: (l: AddonLine) => void; onRemove: () => void; disabled?: boolean }) {
  const [qty, setQty] = useState(line.qty);
  const [rate, setRate] = useState(line.rate);
  const dirty = qty !== line.qty || rate !== line.rate;
  return (
    <m.tr layout initial={{ opacity: 0, backgroundColor: "var(--crm-tint-2)" }} animate={{ opacity: 1, backgroundColor: "rgba(0,0,0,0)" }} exit={{ opacity: 0 }} transition={{ backgroundColor: { duration: 1.2 } }} className="border-b border-crm-line last:border-0">
      <td className="py-2 pe-2">
        <p className="text-[13px] text-crm-ink">{line.name}</p>
        <p className="text-[11.5px] text-crm-muted">
          {line.kind === "iccb" ? "ICCB service" : line.kind === "extra" ? "Extra" : line.kind === "custom" ? "Custom" : "Catalogue"} · per {line.unit}
          {line.reason?.startsWith("leakage:") ? " · added by Leakage Guard" : line.reason?.startsWith("offer:") ? " · idle-date offer" : line.reason && line.reason !== "fact-sheet" ? ` · ${line.reason}` : ""}
        </p>
      </td>
      <td className="w-24 py-2 pe-2">
        <NumberInput value={qty} onChange={setQty} min={0} />
      </td>
      <td className="w-32 py-2 pe-2">
        <NumberInput value={rate} onChange={setRate} money min={0} />
      </td>
      <td className="w-28 py-2 text-end font-semibold text-crm-ink tabular">{taka(qty * rate)}</td>
      <td className="w-20 py-2 text-end">
        {!disabled &&
          (dirty ? (
            <Button size="sm" variant="primary" onClick={() => onSave({ ...line, qty, rate })}>
              Save
            </Button>
          ) : (
            <Button size="icon-sm" variant="ghost" onClick={onRemove} aria-label="Remove line">
              <Trash size={15} />
            </Button>
          ))}
      </td>
    </m.tr>
  );
}

export function ServicesTab() {
  const { b, est, rates, canEdit, canApprove, me } = useWs();
  const menus = useMenus();
  const iccb = useIccbServices();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<ChargeCategory | "">("");
  const [custom, setCustom] = useState({ name: "", unit: "item", qty: 1, rate: 0 });
  const [menuPick, setMenuPick] = useState({ packageId: "", guests: b.guests.optimum });
  const [disc, setDisc] = useState({ mode: b.discount.mode, value: b.discount.value, reason: b.discount.reason ?? "" });
  const hallCode = findHall(rates, b.days[0]?.hallId ?? "")?.code;

  const save = useCrmAction((a: { patch: Partial<Booking>; note?: string }) => updateBooking(b.id, a.patch, a.note));
  const saveDiscount = useCrmAction(() => setDiscount(b.id, disc), { success: (r) => (r.discount.approval === "pending" ? "Discount sent for approval" : "Discount saved") });
  const decide = useCrmAction((ok: boolean) => decideDiscount(b.id, ok), { success: (r) => `Discount ${r.discount.approval}` });

  const catalogue = useMemo(() => {
    const rows = rates.charges.filter((c) => (!cat || c.category === cat) && (!q || c.name.toLowerCase().includes(q.toLowerCase())));
    return rows.filter((c) => c.category !== "generator" || !c.hallCodes || !hallCode || c.hallCodes.includes(hallCode));
  }, [rates.charges, cat, q, hallCode]);

  const addLine = (l: Omit<AddonLine, "id">, note: string) => save.mutate({ patch: { addons: [...b.addons, { ...l, id: nanoid(6) }] }, note });
  const addCharge = (c: ServiceCharge) =>
    addLine({ kind: "service", catalogId: c.id, name: c.name, unit: c.unit, qty: c.category === "per_person" && c.unit === "person" ? b.guests.optimum : c.category === "generator" ? 1 : 1, rate: catalogRate(c, hallCode) }, `Added ${c.name}`);
  const addIccb = (s: IccbService) => addLine({ kind: "iccb", catalogId: s.id, name: s.name, unit: s.unit, qty: 1, rate: s.rate }, `Added ICCB service: ${s.name}`);
  const addMenu = (p: MenuPackage) => save.mutate({ patch: { menus: [...b.menus, { id: nanoid(6), packageId: p.id, name: p.name, guests: menuPick.guests, perHead: p.perHead }] }, note: `Added ICCB Catering: ${p.name} × ${menuPick.guests}` });

  const decoCat = rates.decoration.find((d) => d.code === b.decoration.category);
  const threshold = getSettings().discountApprovalThreshold;
  const discAmount = disc.mode === "percent" ? Math.round((est.subtotal * disc.value) / 100) : disc.value;
  const readonly = !canEdit || !!b.closed;

  return (
    <div className="space-y-5">
    <LeakageAlert />
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5 min-w-0">
        {/* Current lines */}
        <Card>
          <CardHeader icon={Package} title="Add-ons on this booking" description="Edit quantity or rate inline. Totals update live." />
          <div className="overflow-x-auto px-5 pb-4">
            {b.addons.length === 0 && b.menus.length === 0 ? (
              <p className="py-4 text-[13px] text-crm-muted">No add-ons yet. Pick from the catalogue below.</p>
            ) : (
              <table className="w-full min-w-[560px]">
                <tbody>
                  <AnimatePresence initial={false}>
                    {b.menus.map((mn) => (
                      <LineEditor
                        key={`m-${mn.id}-${mn.guests}-${mn.perHead}`}
                        disabled={readonly}
                        line={{ id: mn.id, kind: "iccb", name: `ICCB Catering — ${mn.name}`, unit: "person", qty: mn.guests, rate: mn.perHead }}
                        onSave={(l) => save.mutate({ patch: { menus: b.menus.map((x) => (x.id === mn.id ? { ...x, guests: l.qty, perHead: l.rate } : x)) }, note: `Updated menu ${mn.name}` })}
                        onRemove={() => save.mutate({ patch: { menus: b.menus.filter((x) => x.id !== mn.id) }, note: `Removed menu ${mn.name}` })}
                      />
                    ))}
                    {b.addons.map((a) => (
                      <LineEditor
                        key={`${a.id}-${a.qty}-${a.rate}`}
                        disabled={readonly}
                        line={a}
                        onSave={(l) => save.mutate({ patch: { addons: b.addons.map((x) => (x.id === a.id ? l : x)) }, note: `Updated ${a.name}` })}
                        onRemove={() => save.mutate({ patch: { addons: b.addons.filter((x) => x.id !== a.id) }, note: `Removed ${a.name}` })}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {!readonly && (
          <>
            {/* Catering */}
            <Card>
              <CardHeader icon={ForkKnife} title="ICCB Catering" description="Outside catering is prohibited. Food VAT 15% applies." />
              <div className="px-5 pb-5">
                <div className="mb-3 max-w-xs">
                  <Field label="Guests for this menu">
                    <NumberInput value={menuPick.guests} onChange={(n) => setMenuPick((s) => ({ ...s, guests: n }))} />
                  </Field>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(menus.data ?? []).filter((p) => p.published).map((p) => (
                    <button key={p.id} onClick={() => addMenu(p)} className="group rounded-xl border border-crm-line p-3 text-start transition-colors hover:border-crm-brand hover:bg-crm-tint/40">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13.5px] font-semibold text-crm-ink">{p.name}</p>
                        <Plus size={15} className="text-crm-muted group-hover:text-crm-brand" />
                      </div>
                      <p className="text-[12px] text-crm-muted">{p.cuisine}</p>
                      <p className="mt-1 text-[13px] font-semibold text-crm-brand tabular">{taka(p.perHead)}/head</p>
                      <p className="mt-1 line-clamp-2 text-[11.5px] text-crm-muted">{p.items.join(", ")}</p>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Decoration */}
            <Card>
              <CardHeader icon={PaintBrush} title="Decoration" description="ICCB Events is the default provider. An outside firm pays a fee by category." />
              <div className="space-y-4 px-5 pb-5">
                <Segmented
                  value={b.decoration.provider}
                  onChange={(v) => save.mutate({ patch: { decoration: { ...b.decoration, provider: v } }, note: `Decoration provider: ${v}` })}
                  options={[{ value: "iccb", label: "ICCB Events" }, { value: "outside", label: "Outside firm" }, { value: "none", label: "None" }]}
                />
                {b.decoration.provider === "outside" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DecoratorPicker b={b} disabled={readonly} />
                    <Field label="Category" hint={decoCat ? `${decoCat.description} · fee ${taka(hallCode === "hall-5" ? decoCat.rateHall5 : decoCat.rateHall14)}` : undefined}>
                      <Select value={b.decoration.category} onChange={(v) => save.mutate({ patch: { decoration: { ...b.decoration, category: v as "A" | "B" | "C" } }, note: `Outside decoration category ${v}` })} placeholder="Choose…" options={rates.decoration.map((d) => ({ value: d.code, label: `${d.code} — ${d.description}` }))} />
                    </Field>
                  </div>
                )}
                {b.decoration.provider === "iccb" && <p className="text-[12.5px] text-crm-muted">Add an ICCB Events decoration package from ICCB services below.</p>}
              </div>
            </Card>

            {/* ICCB services */}
            <Card>
              <CardHeader icon={Sparkle} title="ICCB services" description="Decoration packages, sound, LED, generator, extra hours, logistics." />
              <div className="grid gap-2 px-5 pb-5 sm:grid-cols-2">
                {(iccb.data ?? []).map((s) => (
                  <button key={s.id} onClick={() => addIccb(s)} className="group flex items-center justify-between gap-3 rounded-xl border border-crm-line px-3 py-2.5 text-start hover:border-crm-brand hover:bg-crm-tint/40">
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-crm-ink">{s.name}</span>
                      <span className="block text-[11.5px] text-crm-muted">
                        {s.category} · {taka(s.rate)}/{s.unit}
                      </span>
                    </span>
                    <Plus size={15} className="shrink-0 text-crm-muted group-hover:text-crm-brand" />
                  </button>
                ))}
              </div>
            </Card>

            {/* Catalogue */}
            <Card>
              <CardHeader icon={Tag} title="Service charges catalogue" description="ICCB's service-based charges. Hall-5 rates apply automatically." />
              <div className="px-5 pb-5">
                <div className="mb-3 flex flex-wrap gap-2">
                  <SearchInput value={q} onChange={setQ} placeholder="Search items…" className="w-full sm:w-60" />
                  <Select value={cat} onChange={(v) => setCat(v as ChargeCategory | "")} placeholder="All categories" options={Object.entries(CAT_LABELS).map(([value, label]) => ({ value, label }))} className="w-auto" />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {catalogue.map((c) => (
                    <button key={c.id} onClick={() => addCharge(c)} className="group flex items-center justify-between gap-3 rounded-xl border border-crm-line px-3 py-2.5 text-start hover:border-crm-brand hover:bg-crm-tint/40">
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-crm-ink">{c.name}</span>
                        <span className="block text-[11.5px] text-crm-muted">
                          {CAT_LABELS[c.category]} · {taka(catalogRate(c, hallCode))}/{c.unit}
                          {c.maxHours ? ` · max ${c.maxHours} h` : ""}
                        </span>
                      </span>
                      <Plus size={15} className="shrink-0 text-crm-muted group-hover:text-crm-brand" />
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Custom */}
            <Card>
              <CardHeader icon={Plus} title="Custom line item" />
              <div className="grid gap-3 px-5 pb-5 sm:grid-cols-[2fr_1fr_0.8fr_1fr_auto] sm:items-end">
                <Field label="Name">
                  <Input value={custom.name} onChange={(e) => setCustom((s) => ({ ...s, name: e.target.value }))} placeholder="e.g. Photo booth" />
                </Field>
                <Field label="Unit">
                  <Input value={custom.unit} onChange={(e) => setCustom((s) => ({ ...s, unit: e.target.value }))} />
                </Field>
                <Field label="Qty">
                  <NumberInput value={custom.qty} onChange={(n) => setCustom((s) => ({ ...s, qty: n }))} />
                </Field>
                <Field label="Rate">
                  <NumberInput value={custom.rate} onChange={(n) => setCustom((s) => ({ ...s, rate: n }))} money />
                </Field>
                <Button
                  variant="primary"
                  disabled={!custom.name.trim()}
                  onClick={() => {
                    addLine({ kind: "custom", name: custom.name.trim(), unit: custom.unit || "item", qty: custom.qty, rate: custom.rate }, `Added custom item ${custom.name}`);
                    setCustom({ name: "", unit: "item", qty: 1, rate: 0 });
                  }}
                >
                  Add
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Totals + discount */}
      <div className="space-y-5 xl:sticky xl:top-4 h-fit">
        <Card className="p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-crm-muted">Totals</p>
          <dl className="mt-3 space-y-2 text-[13px]">
            {[
              ["Venue rent", est.venueRent],
              ["Subtotal", est.subtotal],
              [`Food VAT ${est.vatPct}%`, est.vat],
              ...(est.ait ? [[`AIT ${est.aitPct}%`, est.ait] as [string, number]] : []),
              ["Total", est.total],
              ["+ Security money", est.security],
              ["− Discount", est.discount],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between">
                <dt className="text-crm-ink-2">{k}</dt>
                <dd>
                  <AnimatedMoney value={v as number} className="text-crm-ink" />
                </dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-crm-line pt-2 text-[15px]">
              <dt className="font-semibold text-crm-ink">Grand total</dt>
              <dd>
                <AnimatedMoney value={est.grandTotal} className="font-bold text-crm-brand" />
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-[13.5px] font-semibold text-crm-ink">Discount</p>
            {b.discount.approval !== "none" && (
              <Badge tone={b.discount.approval === "approved" ? "green" : b.discount.approval === "pending" ? "amber" : "red"}>
                {b.discount.approval === "pending" ? <Hourglass size={12} /> : b.discount.approval === "approved" ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {b.discount.approval}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-[12px] text-crm-muted">Above {taka(threshold)} needs Sales Manager approval.</p>
          {!readonly && (
            <div className="mt-3 space-y-3">
              <Segmented size="sm" value={disc.mode} onChange={(v) => setDisc((s) => ({ ...s, mode: v }))} options={[{ value: "amount", label: "Amount ৳" }, { value: "percent", label: "Percent %" }]} />
              <NumberInput value={disc.value} onChange={(n) => setDisc((s) => ({ ...s, value: n }))} money={disc.mode === "amount"} suffix={disc.mode === "percent" ? "%" : undefined} />
              <Textarea value={disc.reason} onChange={(e) => setDisc((s) => ({ ...s, reason: e.target.value }))} placeholder="Reason (shown to the approver)" className="min-h-[60px]" />
              <p className={cn("text-[12px]", discAmount > threshold && !canApprove ? "text-[#B54708]" : "text-crm-muted")}>
                = {taka(discAmount)} {discAmount > threshold && !canApprove ? "· needs approval" : ""}
              </p>
              <Button className="w-full" variant="secondary" loading={saveDiscount.isPending} onClick={() => saveDiscount.mutate(undefined)}>
                {discAmount > threshold && !canApprove ? "Request approval" : "Apply discount"}
              </Button>
            </div>
          )}
          {b.discount.approval === "pending" && canApprove && (
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-crm-line pt-3">
              <Button variant="primary" loading={decide.isPending} onClick={() => decide.mutate(true)}>
                Approve
              </Button>
              <Button variant="danger" onClick={() => decide.mutate(false)}>
                Reject
              </Button>
            </div>
          )}
          {b.discount.approval === "pending" && !canApprove && <p className="mt-3 text-[12px] text-crm-muted">Waiting for {me.role === "sales_executive" ? "your Sales Manager" : "a manager"} to decide.</p>}
        </Card>
        <OfferCodeCard readonly={readonly} />
      </div>
    </div>
    </div>
  );
}

/** Idle-date offer code → discount line + link to the offer. */
function OfferCodeCard({ readonly }: { readonly: boolean }) {
  const { b } = useWs();
  const [code, setCode] = useState("");
  const apply = useCrmAction(() => applyOfferCode(b.id, code), { success: (r) => `Offer ${r.offerCode} applied`, onSuccess: () => setCode("") });
  const remove = useCrmAction(() => removeOfferCode(b.id), { success: "Offer removed" });
  const line = b.addons.find((a) => a.reason?.startsWith("offer:"));
  return (
    <Card className="p-5">
      <p className="flex items-center gap-2 text-[13.5px] font-semibold text-crm-ink">
        <Tag size={16} className="text-crm-brand" /> Offer code
      </p>
      {b.offerCode && line ? (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-[var(--radius-btn)] bg-crm-tint px-3 py-2">
          <span className="text-[12.5px] text-crm-ink">
            <span className="font-mono font-semibold">{b.offerCode}</span> · {taka(Math.abs(line.qty * line.rate))} off
          </span>
          {!readonly && (
            <Button size="sm" variant="ghost" loading={remove.isPending} onClick={() => remove.mutate(undefined)}>
              Remove
            </Button>
          )}
        </div>
      ) : readonly ? (
        <p className="mt-2 text-[12px] text-crm-muted">No offer used.</p>
      ) : (
        <div className="mt-3 flex gap-2">
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. ICCB-WED15" className="font-mono" />
          <Button variant="secondary" disabled={code.trim().length < 4} loading={apply.isPending} onClick={() => apply.mutate(undefined)}>
            Apply
          </Button>
        </div>
      )}
      <p className="mt-2 text-[11.5px] text-crm-muted">Idle-date offers from Marketing. The code must match this booking&apos;s hall and date.</p>
    </Card>
  );
}

