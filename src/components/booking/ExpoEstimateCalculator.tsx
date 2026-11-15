"use client";
/** Expo Village budget estimator — show days, setup days, booths, booth type, services and own items. Sample rates. */
import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Calculator, Plus, Trash } from "@phosphor-icons/react";
import { BOOTH_TYPES, EXPO_IMG, EXPO_RATE, EXPO_SERVICES } from "./ExpoBooking";

const taka = (n: number) => `৳${Math.round(n).toLocaleString("en-IN")}`;
const FIELD =
  "w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-[13.5px] text-[var(--ink)] outline-none transition focus:border-[var(--accent)]";
const num = (v: string) => (v === "" ? 0 : Math.max(0, Number(v) || 0));

export function ExpoEstimateCalculator() {
  const [days, setDays] = useState(3);
  const [setupDays, setSetupDays] = useState(1);
  const [booths, setBooths] = useState(100);
  const [boothType, setBoothType] = useState<(typeof BOOTH_TYPES)[number]["id"]>("shell");
  const [services, setServices] = useState<string[]>([]);
  const [others, setOthers] = useState<{ name: string; price: number }[]>([]);

  const booth = BOOTH_TYPES.find((b) => b.id === boothType)!;
  const venue = days * EXPO_RATE.showDay + setupDays * EXPO_RATE.setupDay;
  const boothCost = booths * booth.rate;
  const svc = EXPO_SERVICES.filter((s) => services.includes(s.id)).reduce((t, s) => t + (s.per === "day" ? s.rate * (days + setupDays) : s.rate), 0);
  const own = others.reduce((t, o) => t + (o.price || 0), 0);
  const low = venue + boothCost + svc + own;
  const high = low * 1.12;

  const lines = [
    { label: "Expo Village rent", sub: `${days} show + ${setupDays} setup day${setupDays === 1 ? "" : "s"}`, value: venue },
    { label: "Booths", sub: booth.rate ? `${booths} × ${taka(booth.rate)}` : "Raw space", value: boothCost },
    { label: "Services", sub: `${services.length} selected`, value: svc },
    { label: "Other items", sub: others.length ? `${others.length} item${others.length > 1 ? "s" : ""}` : "None", value: own },
  ];

  return (
    <div className="mx-auto max-w-5xl grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-6 space-y-5">
        <Section n={1} title="Days">
          <div className="grid grid-cols-2 gap-2.5">
            <Labeled label={`Show days · ${taka(EXPO_RATE.showDay)}/day`}>
              <input type="number" min={1} max={15} value={days || ""} onChange={(e) => setDays(Math.max(1, num(e.target.value)))} className={FIELD} />
            </Labeled>
            <Labeled label={`Setup / dismantle · ${taka(EXPO_RATE.setupDay)}/day`}>
              <input type="number" min={0} max={6} value={setupDays} onChange={(e) => setSetupDays(num(e.target.value))} className={FIELD} />
            </Labeled>
          </div>
        </Section>

        <Section n={2} title="Booths">
          <Labeled label={`Number of booths — ${booths}`}>
            <input type="range" min={0} max={500} step={10} value={booths} onChange={(e) => setBooths(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
          </Labeled>
          <div className="mt-2 grid sm:grid-cols-3 gap-1.5">
            {BOOTH_TYPES.map((b) => {
              const on = b.id === boothType;
              return (
                <button key={b.id} type="button" onClick={() => setBoothType(b.id)}
                  className={`rounded-lg border px-3 py-2 text-start transition-all ${on ? "border-[var(--accent)] bg-[var(--bg-tint)]" : "border-[var(--line)] hover:border-[var(--ink)]/30"}`}>
                  <span className="block text-[12.5px] font-semibold text-[var(--ink)]">{b.label}</span>
                  <span className="block text-[11px] text-[var(--ink-muted)]">{b.rate ? `${taka(b.rate)} / booth` : "Included in rent"}</span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section n={3} title="Services">
          <div className="grid sm:grid-cols-2 gap-1.5">
            {EXPO_SERVICES.map((s) => {
              const on = services.includes(s.id);
              return (
                <label key={s.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors ${on ? "border-[var(--accent)]/60 bg-[var(--bg-tint)]" : "border-[var(--line)]"}`}>
                  <input type="checkbox" checked={on} onChange={() => setServices((x) => (on ? x.filter((i) => i !== s.id) : [...x, s.id]))} className="h-4 w-4 accent-[var(--accent)]" />
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-medium text-[var(--ink)]">{s.label}</span>
                    <span className="block text-[11px] text-[var(--ink-muted)]">{taka(s.rate)} / {s.per}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </Section>

        <Section n={4} title="Anything else? Add your own item">
          <div className="space-y-1.5">
            {others.map((o, i) => (
              <div key={i} className="grid grid-cols-[1fr_120px_auto] gap-1.5">
                <input value={o.name} placeholder="Item, e.g. Press conference room" onChange={(e) => setOthers((x) => x.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))} className={FIELD} />
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

      <div className="lg:sticky lg:top-28 overflow-hidden rounded-2xl bg-[#111214] text-white shadow-[0_30px_60px_-35px_rgba(0,0,0,0.6)]">
        <div className="relative h-[96px]">
          <Image src={EXPO_IMG} alt="" fill sizes="320px" className="object-cover opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111214] to-transparent" />
          <div className="absolute bottom-2.5 start-5 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/80">
            <Calculator size={15} /> Expo Village estimate
          </div>
        </div>
        <div className="px-5 pb-5">
          <div className="space-y-2 text-[13px]">
            {lines.map((l) => (
              <div key={l.label} className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-white/90">{l.label}</p><p className="text-[11px] text-white/45">{l.sub}</p></div>
                <span className="whitespace-nowrap tabular-nums text-white/90">{l.value ? taka(l.value) : "—"}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-white/10 pt-3">
            <p className="text-[10.5px] uppercase tracking-[0.16em] text-white/50">Estimated total</p>
            <AnimatePresence mode="wait">
              <motion.p key={Math.round(low)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}
                className="mt-0.5 font-display text-[24px] leading-tight tabular-nums">
                {taka(low)} – <span className="text-[var(--accent)]">{taka(high)}</span>
              </motion.p>
            </AnimatePresence>
            {booths > 0 && <p className="mt-0.5 text-[11.5px] text-white/55">≈ {taka(high / booths)} per booth</p>}
          </div>
          <a href="#booking-form-section" className="btn btn-primary mt-4 w-full justify-center">Check dates &amp; send request</a>
          <p className="mt-2.5 text-[11px] leading-relaxed text-white/45">Sample rates — our expo team will share an exact quote.</p>
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
function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11.5px] font-medium text-[var(--ink-muted)]">{label}</span>
      {children}
    </label>
  );
}
