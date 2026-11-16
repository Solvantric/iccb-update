"use client";
/**
 * Stand-alone budget estimator (booking page) — everything from A to Z in one compact form:
 * venue, day, extra hours, guests, catering (or custom ৳/head), decoration (or custom ৳),
 * every extra service with quantity, and any custom items with your own price.
 * Reads rates from the CRM (menus, services, settings) + useVenues(); never writes anything.
 */
import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Calculator, Plus, Trash } from "@phosphor-icons/react";
import { MEAL_LABELS } from "@/types/crm";
import { useMenus, useServices, useSettingsValue } from "@/lib/crm/hooks";
import { useCrmReady } from "@/components/providers/CrmProvider";
import { useVenues } from "./venues";

type Deco = "none" | "basic" | "standard" | "premium" | "custom";
const taka = (n: number) => `৳${Math.round(n).toLocaleString("en-IN")}`;
const FIELD =
  "w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-[13.5px] text-[var(--ink)] outline-none transition focus:border-[var(--accent)]";
const num = (v: string) => (v === "" ? 0 : Math.max(0, Number(v) || 0));

/** default quantity for a service when it's ticked */
const defaultQty = (unit: string, guests: number) =>
  unit === "sq ft" ? 100 : unit === "hour" ? 4 : unit === "cover" || unit === "chair" ? guests : unit === "person" ? 10 : 1;

export function EstimateCalculator() {
  const ready = useCrmReady();
  const venues = useVenues();
  const menus = useMenus().filter((m) => m.active);
  const services = useServices().filter((s) => s.active);
  const settings = useSettingsValue();

  const [venueChoice, setVenue] = useState("");
  const [weekend, setWeekend] = useState(false);
  const [extraHours, setExtraHours] = useState(0);
  const [guests, setGuests] = useState(500);
  const [menuId, setMenuId] = useState("");
  const [customPerHead, setCustomPerHead] = useState(0);
  const [deco, setDeco] = useState<Deco>("none");
  const [customDeco, setCustomDeco] = useState(0);
  const [qty, setQty] = useState<Record<string, number>>({}); // serviceId → quantity (absent = not selected)
  const [others, setOthers] = useState<{ name: string; price: number }[]>([]);

  if (!ready) return <div className="mx-auto max-w-5xl h-[420px] rounded-2xl bg-[var(--surface)] animate-pulse" />;

  const venue = venues.find((v) => v.id === venueChoice) ?? venues[0];
  const vat = (settings.foodVatPercent ?? 0) / 100;
  const menu = menus.find((m) => m.id === menuId);
  const perHead = menu ? menu.perHead : menuId === "custom" ? customPerHead : 0;

  const hallRent = venue ? (weekend ? venue.weekendRate : venue.weekdayRate) : 0;
  const hoursCost = venue ? extraHours * venue.extraHourRate : 0;
  const food = perHead * guests * (1 + vat);
  const decoRates: Record<Deco, number> = {
    none: 0,
    basic: settings.addOnRates.decorationBasic,
    standard: settings.addOnRates.decorationStandard,
    premium: settings.addOnRates.decorationPremium,
    custom: customDeco,
  };
  const decoration = decoRates[deco];
  const extrasCost = services.reduce((t, s) => t + (qty[s.id] ? qty[s.id] * s.rate : 0), 0);
  const othersCost = others.reduce((t, o) => t + (o.price || 0), 0);

  const low = hallRent + hoursCost + food + decoration + extrasCost + othersCost;
  const high = low * 1.12;

  const lines = [
    { label: `Hall — ${venue?.name ?? ""}`, sub: weekend ? "Weekend rate" : "Weekday rate", value: hallRent },
    { label: "Extra hours", sub: extraHours ? `${extraHours} × ${taka(venue?.extraHourRate ?? 0)}` : "None", value: hoursCost },
    { label: "Catering", sub: perHead ? `${guests.toLocaleString("en-IN")} × ${taka(perHead)} + ${settings.foodVatPercent ?? 0}% VAT` : "Not included", value: food },
    { label: "Decoration", sub: deco === "none" ? "Not included" : deco === "custom" ? "Custom budget" : `ICCB ${deco[0].toUpperCase()}${deco.slice(1)}`, value: decoration },
    { label: "Extras & services", sub: `${Object.keys(qty).length} selected`, value: extrasCost },
    { label: "Other items", sub: others.length ? `${others.length} item${others.length > 1 ? "s" : ""}` : "None", value: othersCost },
  ];

  const toggleService = (id: string, unit: string) =>
    setQty((q) => {
      const next = { ...q };
      if (next[id]) delete next[id];
      else next[id] = defaultQty(unit, guests);
      return next;
    });

  return (
    <div className="mx-auto max-w-5xl grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
      {/* Inputs — one compact card */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-6 space-y-5">
        <Section n={1} title="Venue & time">
          <div className="grid sm:grid-cols-3 gap-2.5">
            <Labeled label="Hall" className="sm:col-span-3">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {venues.map((v) => {
                  const on = v.id === venue?.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVenue(v.id)}
                      title={`${v.name} · up to ${v.capacity.toLocaleString("en-IN")} guests`}
                      className={`overflow-hidden rounded-lg border text-start transition-all ${on ? "border-[var(--accent)] shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent)_18%,transparent)]" : "border-[var(--line)] hover:border-[var(--ink)]/30"}`}
                    >
                      <span className="relative block h-12 bg-[var(--bg-soft)]">
                        {v.image && <Image src={v.image} alt={v.name} fill sizes="110px" className="object-cover" />}
                      </span>
                      <span className={`block truncate px-1.5 py-1 text-[11.5px] font-semibold ${on ? "text-[var(--accent)]" : "text-[var(--ink)]"}`}>{v.name}</span>
                    </button>
                  );
                })}
              </div>
            </Labeled>
            <Labeled label="Day">
              <div className="grid grid-cols-2 rounded-lg border border-[var(--line)] p-0.5">
                {[false, true].map((w) => (
                  <button key={String(w)} type="button" onClick={() => setWeekend(w)}
                    className={`rounded-md py-1.5 text-[12.5px] font-medium transition-colors ${weekend === w ? "bg-[var(--ink)] text-white" : "text-[var(--ink-muted)] hover:text-[var(--ink)]"}`}>
                    {w ? "Weekend" : "Weekday"}
                  </button>
                ))}
              </div>
            </Labeled>
            <Labeled label={`Guests (max ${venue?.capacity.toLocaleString("en-IN") ?? "—"})`}>
              <input type="number" min={1} value={guests || ""} onChange={(e) => setGuests(num(e.target.value))} className={FIELD} />
            </Labeled>
            <Labeled label={`Extra hours · ${taka(venue?.extraHourRate ?? 0)}/hr`}>
              <input type="number" min={0} value={extraHours || ""} placeholder="0" onChange={(e) => setExtraHours(num(e.target.value))} className={FIELD} />
            </Labeled>
          </div>
          {venue && guests > venue.capacity && (
            <p className="mt-2 text-[12px] text-amber-700">{venue.name} seats up to {venue.capacity.toLocaleString("en-IN")} — consider a larger hall.</p>
          )}
        </Section>

        <Section n={2} title="Food & decoration">
          <div className="grid sm:grid-cols-2 gap-2.5">
            <Labeled label="Catering package">
              <select value={menuId} onChange={(e) => setMenuId(e.target.value)} className={FIELD}>
                <option value="">No catering</option>
                {menus.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({MEAL_LABELS[m.meal]}) — {taka(m.perHead)}/head</option>
                ))}
                <option value="custom">Custom menu — my own budget</option>
              </select>
            </Labeled>
            <Labeled label="Decoration">
              <select value={deco} onChange={(e) => setDeco(e.target.value as Deco)} className={FIELD}>
                <option value="none">No decoration</option>
                <option value="basic">ICCB Basic — {taka(decoRates.basic)}</option>
                <option value="standard">ICCB Standard — {taka(decoRates.standard)}</option>
                <option value="premium">ICCB Premium — {taka(decoRates.premium)}</option>
                <option value="custom">Custom — my own budget</option>
              </select>
            </Labeled>
            {menuId === "custom" && (
              <Labeled label="Your budget per guest (৳)">
                <input type="number" min={0} value={customPerHead || ""} placeholder="e.g. 1200" onChange={(e) => setCustomPerHead(num(e.target.value))} className={FIELD} />
              </Labeled>
            )}
            {deco === "custom" && (
              <Labeled label="Your decoration budget (৳)" className={menuId === "custom" ? "" : "sm:col-start-2"}>
                <input type="number" min={0} value={customDeco || ""} placeholder="e.g. 150000" onChange={(e) => setCustomDeco(num(e.target.value))} className={FIELD} />
              </Labeled>
            )}
          </div>
          {menu && <p className="mt-2 text-[12px] text-[var(--ink-muted)]">Includes: {menu.items.join(" · ")}</p>}
        </Section>

        <Section n={3} title="Extras & services">
          <div className="grid sm:grid-cols-2 gap-1.5">
            {services.map((s) => {
              const on = !!qty[s.id];
              const perUnit = s.unit === "day" || s.unit === "event";
              return (
                <div key={s.id} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors ${on ? "border-[var(--accent)]/60 bg-[var(--bg-tint)]" : "border-[var(--line)]"}`}>
                  <input type="checkbox" checked={on} onChange={() => toggleService(s.id, s.unit)} className="h-4 w-4 accent-[var(--accent)]" aria-label={s.name} />
                  <button type="button" onClick={() => toggleService(s.id, s.unit)} className="min-w-0 flex-1 text-start">
                    <span className="block truncate text-[12.5px] font-medium text-[var(--ink)]">{s.name}</span>
                    <span className="block text-[11px] text-[var(--ink-muted)]">{taka(s.rate)} / {s.unit}</span>
                  </button>
                  {on && !perUnit && (
                    <input
                      type="number"
                      min={1}
                      value={qty[s.id]}
                      onChange={(e) => setQty((q) => ({ ...q, [s.id]: Math.max(1, num(e.target.value)) }))}
                      className="w-16 rounded-md border border-[var(--line)] bg-[var(--bg)] px-1.5 py-1 text-[12px] text-end"
                      aria-label={`${s.name} quantity (${s.unit})`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        <Section n={4} title="Anything else? Add your own item">
          <div className="space-y-1.5">
            {others.map((o, i) => (
              <div key={i} className="grid grid-cols-[1fr_120px_auto] gap-1.5">
                <input value={o.name} placeholder="Item, e.g. Kids corner" onChange={(e) => setOthers((x) => x.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))} className={FIELD} />
                <input type="number" min={0} value={o.price || ""} placeholder="৳ price" onChange={(e) => setOthers((x) => x.map((y, j) => (j === i ? { ...y, price: num(e.target.value) } : y)))} className={FIELD} />
                <button type="button" onClick={() => setOthers((x) => x.filter((_, j) => j !== i))} aria-label="Remove item" className="grid w-9 place-items-center rounded-lg border border-[var(--line)] text-[var(--ink-muted)] hover:text-[var(--accent)]">
                  <Trash size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setOthers((x) => [...x, { name: "", price: 0 }])}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--line)] px-3 py-2 text-[12.5px] font-medium text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]">
              <Plus size={13} weight="bold" /> Add other item with your price
            </button>
          </div>
        </Section>
      </div>

      {/* Result */}
      <div className="lg:sticky lg:top-28 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-[0_30px_60px_-40px_rgba(0,0,0,0.35)]">
        <div className="relative h-[96px]">
          {venue?.image && <Image src={venue.image} alt="" fill sizes="320px" className="object-cover opacity-90" />}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/40 to-transparent" />
          <div className="absolute bottom-2.5 start-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink)]">
            <Calculator size={15} /> Budget estimate
          </div>
        </div>
        <div className="px-5 pb-5">
          <div className="space-y-2 text-[13px]">
            {lines.map((l) => (
              <div key={l.label} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[var(--ink)] truncate">{l.label}</p>
                  <p className="text-[11px] text-[var(--ink-muted)]">{l.sub}</p>
                </div>
                <span className="tabular-nums text-[var(--ink)] whitespace-nowrap">{l.value ? taka(l.value) : "—"}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-[var(--line)] pt-3">
            <p className="text-[10.5px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">Estimated total</p>
            <AnimatePresence mode="wait">
              <motion.p key={Math.round(low)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}
                className="mt-0.5 font-display text-[24px] leading-tight tabular-nums">
                {taka(low)} – <span className="text-[var(--accent)]">{taka(high)}</span>
              </motion.p>
            </AnimatePresence>
            {guests > 0 && <p className="mt-0.5 text-[11.5px] text-[var(--ink-muted)]">≈ {taka(high / guests)} per guest</p>}
          </div>
          <a href="#booking-form-section" className="btn btn-primary w-full mt-4 justify-center">Check availability &amp; reserve</a>
          <p className="mt-2.5 text-[11px] leading-relaxed text-[var(--ink-muted)]">Rough guide only — the upper figure adds ~12% for setup and small extras. Our team will share an exact quote.</p>
        </div>
      </div>
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-2 flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ink)]">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--accent)] text-[10.5px] text-white">{n}</span>
        {title}
      </p>
      {children}
    </section>
  );
}

function Labeled({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11.5px] font-medium text-[var(--ink-muted)]">{label}</span>
      {children}
    </label>
  );
}
