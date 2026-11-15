"use client";
/**
 * Expo Village booking (website → CRM enquiry). Different from hall booking:
 *   1. Expo & dates   — expo type, start date on the Expo Village calendar, show days, setup days
 *   2. Space          — booths, booth type, services
 *   3. Organiser      — company + contact → submit
 * Sends an "EXPO VILLAGE REQUEST" enquiry to the CRM (the CRM has no Expo Village venue yet).
 * Rates below are sample figures for the estimate only.
 */
import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isBefore, isSameMonth, parseISO, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { ArrowLeft, ArrowRight, CaretLeft, CaretRight, CheckCircle, Info, WhatsappLogo } from "@phosphor-icons/react";
import { validateContact } from "@/types/crm";
import { db } from "@/lib/crm/db";
import { trackCrm } from "@/lib/crm/track";

export const EXPO_TYPES = ["Trade fair", "Exhibition", "Product launch", "Auto & motor show", "Education fair", "Job fair", "Food & lifestyle fair", "Other"] as const;
type ExpoType = (typeof EXPO_TYPES)[number];

export const BOOTH_TYPES = [
  { id: "shell", label: "Shell scheme booth", note: "3×3 m, walls, fascia, light, table & chairs", rate: 18_000 },
  { id: "premium", label: "Premium custom booth", note: "Custom-built, branded stand", rate: 45_000 },
  { id: "raw", label: "Raw space only", note: "Exhibitors build their own stands", rate: 0 },
] as const;
type BoothType = (typeof BOOTH_TYPES)[number]["id"];

export const EXPO_SERVICES = [
  { id: "power", label: "Extra power", rate: 40_000, per: "day" },
  { id: "internet", label: "Internet / Wi-Fi", rate: 15_000, per: "day" },
  { id: "security", label: "Extra security", rate: 20_000, per: "day" },
  { id: "cleaning", label: "Cleaning crew", rate: 12_000, per: "day" },
  { id: "branding", label: "Branding & LED screens", rate: 120_000, per: "event" },
  { id: "registration", label: "Registration desk & badges", rate: 60_000, per: "event" },
] as const;

export const EXPO_RATE = { showDay: 800_000, setupDay: 300_000 }; // sample
export const EXPO_IMG = "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&q=85&w=1200";
const ICCB_WHATSAPP = "8801991197719";
const ease = [0.22, 1, 0.36, 1] as const;
const taka = (n: number) => `৳${Math.round(n).toLocaleString("en-IN")}`;
const INPUT =
  "w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-muted)]/60 outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_15%,transparent)]";
const queryParam = (key: string) => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get(key));

type DayStatus = "available" | "reserved" | "booked" | "past";

/** Demo Expo Village calendar (days from today) — real expo bookings will replace this. */
const DEMO = { booked: [[6, 9], [24, 27], [52, 56]], reserved: [[15, 17], [38, 41]] } as const;
function expoStatus(iso: string): DayStatus {
  const today = startOfDay(new Date());
  const d = parseISO(iso);
  if (isBefore(d, today)) return "past";
  const off = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (DEMO.booked.some(([a, b]) => off >= a && off <= b)) return "booked";
  if (DEMO.reserved.some(([a, b]) => off >= a && off <= b)) return "reserved";
  return "available";
}

const STEPS = ["Expo & dates", "Space & services", "Organiser"] as const;

export function ExpoBooking() {
  const [step, setStep] = useState(0);
  const [expoType, setExpoType] = useState<ExpoType | "">(() => {
    const t = queryParam("expoType");
    return EXPO_TYPES.find((x) => x.toLowerCase() === (t ?? "").toLowerCase()) ?? "";
  });
  const [start, setStart] = useState(() => {
    const d = queryParam("date");
    return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "";
  });
  const [days, setDays] = useState(() => Math.min(10, Math.max(1, Number(queryParam("days")) || 3)));
  const [setupDays, setSetupDays] = useState(1);
  const [booths, setBooths] = useState(50);
  const [boothType, setBoothType] = useState<BoothType>("shell");
  const [services, setServices] = useState<string[]>([]);
  const [org, setOrg] = useState({ company: "", name: "", mobile: "", email: "", visitors: "", note: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"request" | "waitlist" | null>(null);

  // Show days covered by the chosen start date
  const range = start ? Array.from({ length: days }, (_, i) => format(addDays(parseISO(start), i), "yyyy-MM-dd")) : [];
  const rangeStatus: DayStatus | null = !range.length
    ? null
    : range.some((d) => expoStatus(d) === "booked" || expoStatus(d) === "past")
      ? "booked"
      : range.some((d) => expoStatus(d) === "reserved")
        ? "reserved"
        : "available";

  const booth = BOOTH_TYPES.find((b) => b.id === boothType)!;
  const est = (() => {
    const venue = days * EXPO_RATE.showDay + setupDays * EXPO_RATE.setupDay;
    const boothCost = booths * booth.rate;
    const svc = EXPO_SERVICES.filter((s) => services.includes(s.id)).reduce((t, s) => t + (s.per === "day" ? s.rate * (days + setupDays) : s.rate), 0);
    const low = venue + boothCost + svc;
    return { venue, boothCost, svc, low, high: low * 1.12 };
  })();

  const stepError = (i: number) => {
    if (i === 0) {
      if (!expoType) return "Please choose the type of expo.";
      if (!start) return "Please pick a start date on the calendar.";
      if (rangeStatus === "booked") return "Some of those days are already booked — please pick another start date or fewer days.";
    }
    if (i === 1 && booths < 0) return "Please enter the number of booths.";
    if (i === 2) {
      if (!org.company.trim()) return "Please enter the organising company.";
      const c = validateContact(org.name, org.mobile);
      if (c) return c;
    }
    return "";
  };
  const next = () => {
    const e = stepError(step);
    setError(e);
    if (!e) setStep((s) => s + 1);
  };

  const submit = async () => {
    const e = stepError(2) || stepError(0);
    setError(e);
    if (e) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 350));
    const end = range[range.length - 1];
    db.enquiries.create({
      type: "booking",
      source: "Enquiry form",
      name: org.name.trim(),
      mobile: org.mobile.trim(),
      email: org.email.trim() || undefined,
      message: [
        `${rangeStatus === "reserved" ? "EXPO VILLAGE WAITLIST" : "EXPO VILLAGE REQUEST"} — ${expoType}`,
        `${format(parseISO(start), "d MMM yyyy")} → ${format(parseISO(end), "d MMM yyyy")} (${days} show day${days > 1 ? "s" : ""} + ${setupDays} setup)`,
        `Organiser: ${org.company.trim()}${org.visitors ? ` · ~${org.visitors} visitors` : ""}`,
        `${booths} × ${booth.label}${services.length ? ` · Services: ${EXPO_SERVICES.filter((s) => services.includes(s.id)).map((s) => s.label).join(", ")}` : ""}`,
        `Estimate: ${taka(est.low)} – ${taka(est.high)}`,
        org.note.trim(),
      ].filter(Boolean).join("\n"),
      seen: false,
    });
    trackCrm("form_submit", "/booking");
    setBusy(false);
    setDone(rangeStatus === "reserved" ? "waitlist" : "request");
    document.getElementById("booking-form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
        className="mx-auto max-w-xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center shadow-[0_30px_60px_-40px_rgba(0,0,0,0.35)]">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
          className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle size={38} weight="fill" />
        </motion.div>
        <h3 className="font-display uppercase text-[24px] text-[var(--ink)]">{done === "waitlist" ? "You're on the waiting list" : "Expo request received"}</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-body)]">
          {done === "waitlist"
            ? "Some of these dates are reserved by another organiser who has priority. If they release them, they're yours — our expo team will contact you very soon."
            : "Thank you! Your Expo Village reservation request has been sent — it is not a confirmed booking yet. Our expo team will contact you very soon."}
        </p>
        <a href={`https://wa.me/${ICCB_WHATSAPP}?text=${encodeURIComponent("Hello ICCB, I sent an Expo Village request on your website.")}`} target="_blank" rel="noreferrer"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-[var(--radius-btn)] bg-[#25D366] px-5 text-[14px] font-medium text-white hover:opacity-90">
          <WhatsappLogo size={18} weight="fill" /> Message us on WhatsApp
        </a>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] items-start">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_30px_60px_-45px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* Venue banner */}
        <div className="relative h-[92px]">
          <Image src={EXPO_IMG} alt="ICCB Expo Village" fill sizes="700px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-black/20" />
          <div className="absolute inset-y-0 start-5 flex flex-col justify-center text-white">
            <p className="text-[10.5px] uppercase tracking-[0.18em] text-white/70">Venue</p>
            <p className="font-display uppercase text-[20px] leading-tight">ICCB Expo Village</p>
            <p className="text-[12px] text-white/75">80,000+ sq ft · 500+ booths · single roof</p>
          </div>
        </div>

        {/* Stepper */}
        <ol className="grid grid-cols-3 border-b border-[var(--line)]">
          {STEPS.map((label, i) => {
            const state = i < step ? "done" : i === step ? "now" : "todo";
            return (
              <li key={label}>
                <button type="button" disabled={i > step} onClick={() => i < step && setStep(i)}
                  className={`relative w-full flex items-center justify-center gap-2 px-2 py-3 text-[11.5px] sm:text-[12.5px] font-semibold ${
                    state === "now" ? "text-[var(--accent)]" : state === "done" ? "text-[var(--ink)]" : "text-[var(--ink-muted)]/70"
                  }`}>
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${
                    state === "now" ? "bg-[var(--accent)] text-white" : state === "done" ? "bg-[var(--ink)] text-white" : "bg-[var(--bg-soft)] text-[var(--ink-muted)]"
                  }`}>{state === "done" ? <CheckCircle size={14} weight="bold" /> : i + 1}</span>
                  <span className="hidden sm:inline">{label}</span>
                  {state === "now" && <motion.span layoutId="expo-step" className="absolute bottom-0 inset-x-0 h-[2px] bg-[var(--accent)]" />}
                </button>
              </li>
            );
          })}
        </ol>

        <div className="p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35, ease }} className="space-y-4">
              {step === 0 && (
                <>
                  <Field label="Type of expo">
                    <div className="flex flex-wrap gap-1.5">
                      {EXPO_TYPES.map((t) => <Chip key={t} on={expoType === t} onClick={() => setExpoType(t)}>{t}</Chip>)}
                    </div>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Show days">
                      <Stepper value={days} min={1} max={10} onChange={setDays} />
                    </Field>
                    <Field label="Setup / dismantle days">
                      <Stepper value={setupDays} min={0} max={4} onChange={setSetupDays} />
                    </Field>
                  </div>
                  <Field label="Start date">
                    <RangeCalendar start={start} range={range} onSelect={setStart} />
                  </Field>
                  {rangeStatus && start && (
                    <motion.div key={`${start}-${days}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13.5px] ${
                        rangeStatus === "booked" ? "border-rose-200 bg-rose-50 text-rose-800" : rangeStatus === "reserved" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"
                      }`}>
                      <Info size={17} weight="fill" className="mt-0.5 flex-shrink-0" />
                      <span>
                        {format(parseISO(range[0]), "d MMM")} – {format(parseISO(range[range.length - 1]), "d MMM yyyy")}:{" "}
                        {rangeStatus === "booked" ? <b>some days are booked — not available.</b>
                          : rangeStatus === "reserved" ? <><b>some days are tentatively reserved</b> by another organiser. You can still request — the earlier request has priority.</>
                          : <b>Expo Village is available.</b>}
                      </span>
                    </motion.div>
                  )}
                </>
              )}

              {step === 1 && (
                <>
                  <Field label={`Number of booths (${booths})`}>
                    <input type="range" min={0} max={500} step={10} value={booths} onChange={(e) => setBooths(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
                    <div className="flex justify-between text-[11px] text-[var(--ink-muted)]"><span>0</span><span>250</span><span>500</span></div>
                  </Field>
                  <Field label="Booth type">
                    <div className="grid gap-1.5">
                      {BOOTH_TYPES.map((b) => (
                        <Option key={b.id} on={boothType === b.id} onClick={() => setBoothType(b.id)} title={b.label} sub={`${b.note}${b.rate ? ` · ${taka(b.rate)} / booth` : ""}`} />
                      ))}
                    </div>
                  </Field>
                  <Field label="Services">
                    <div className="grid sm:grid-cols-2 gap-1.5">
                      {EXPO_SERVICES.map((s) => (
                        <Option key={s.id} on={services.includes(s.id)} onClick={() => setServices((x) => (x.includes(s.id) ? x.filter((i) => i !== s.id) : [...x, s.id]))}
                          title={s.label} sub={`${taka(s.rate)} / ${s.per}`} />
                      ))}
                    </div>
                  </Field>
                </>
              )}

              {step === 2 && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Organising company *"><input value={org.company} onChange={(e) => setOrg({ ...org, company: e.target.value })} className={INPUT} autoComplete="organization" /></Field>
                  <Field label="Contact person *"><input value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} className={INPUT} autoComplete="name" /></Field>
                  <Field label="Mobile number *"><input value={org.mobile} onChange={(e) => setOrg({ ...org, mobile: e.target.value })} className={INPUT} inputMode="tel" placeholder="01XXXXXXXXX" /></Field>
                  <Field label="Email"><input type="email" value={org.email} onChange={(e) => setOrg({ ...org, email: e.target.value })} className={INPUT} /></Field>
                  <Field label="Expected visitors"><input type="number" min={0} value={org.visitors} onChange={(e) => setOrg({ ...org, visitors: e.target.value })} className={INPUT} placeholder="e.g. 20000" /></Field>
                  <Field label="Anything else?"><input value={org.note} onChange={(e) => setOrg({ ...org, note: e.target.value })} className={INPUT} maxLength={200} /></Field>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {error && <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] text-rose-800">{error}</p>}

          <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4">
            <button type="button" onClick={() => { setError(""); setStep((s) => Math.max(0, s - 1)); }} disabled={step === 0}
              className="inline-flex items-center gap-2 text-[14px] font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] disabled:opacity-0">
              <ArrowLeft size={15} /> Back
            </button>
            {step < 2 ? (
              <button type="button" onClick={next} className="btn btn-primary">Next <ArrowRight size={15} weight="bold" /></button>
            ) : (
              <button type="button" onClick={submit} disabled={busy} className="btn btn-primary disabled:opacity-60">
                {busy ? "Sending…" : rangeStatus === "reserved" ? "Join the waiting list" : "Send expo request"} <ArrowRight size={15} weight="bold" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Estimate */}
      <aside className="lg:sticky lg:top-28 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_30px_60px_-45px_rgba(0,0,0,0.35)]">
        <p className="text-eyebrow mb-1">Estimate</p>
        <h3 className="font-display uppercase text-[20px] leading-tight text-[var(--ink)]">Your expo cost</h3>
        <div className="mt-4 space-y-2.5 text-[13.5px]">
          <Row label="Expo Village rent" sub={`${days} show × ${taka(EXPO_RATE.showDay)} + ${setupDays} setup × ${taka(EXPO_RATE.setupDay)}`} value={taka(est.venue)} />
          <Row label="Booths" sub={booth.rate ? `${booths} × ${taka(booth.rate)}` : "Raw space"} value={est.boothCost ? taka(est.boothCost) : "—"} />
          <Row label="Services" sub={`${services.length} selected`} value={est.svc ? taka(est.svc) : "—"} />
        </div>
        <div className="mt-4 rounded-xl bg-[var(--bg-soft)] px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Estimated range</p>
          <p className="mt-0.5 font-display text-[21px] tabular-nums text-[var(--ink)]">{taka(est.low)} – {taka(est.high)}</p>
        </div>
        <p className="mt-2.5 text-[11.5px] leading-relaxed text-[var(--ink-muted)]">Sample rates — our expo team will share an exact quote.</p>
      </aside>
    </div>
  );
}

/* ─── Range calendar ─────────────────────────────────────────────────────── */
function RangeCalendar({ start, range, onSelect }: { start: string; range: string[]; onSelect: (iso: string) => void }) {
  const [month, setMonth] = useState(() => startOfMonth(start ? parseISO(start) : new Date()));
  const [dir, setDir] = useState(1);
  const days = eachDayOfInterval({ start: startOfWeek(month), end: endOfWeek(endOfMonth(month)) });
  const canPrev = !isBefore(addMonths(month, -1), startOfMonth(new Date()));
  const shift = (d: number) => { setDir(d); setMonth((m) => addMonths(m, d)); };

  return (
    <div className="rounded-xl border border-[var(--line)] p-3 overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" disabled={!canPrev} onClick={() => shift(-1)} aria-label="Previous month" className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] hover:border-[var(--accent)] disabled:opacity-30"><CaretLeft size={13} weight="bold" /></button>
        <span className="text-[14px] font-semibold text-[var(--ink)]">{format(month, "MMMM yyyy")}</span>
        <button type="button" onClick={() => shift(1)} aria-label="Next month" className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] hover:border-[var(--accent)]"><CaretRight size={13} weight="bold" /></button>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10.5px] font-semibold uppercase text-[var(--ink-muted)]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <span key={d}>{d}</span>)}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={month.toISOString()} className="grid grid-cols-7 gap-1"
          initial={{ opacity: 0, x: dir * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -24 }} transition={{ duration: 0.25, ease }}>
          {days.map((d) => {
            const iso = format(d, "yyyy-MM-dd");
            const inMonth = isSameMonth(d, month);
            const st = expoStatus(iso);
            const inRange = range.includes(iso);
            const disabled = !inMonth || st === "booked" || st === "past";
            const tone = st === "booked" ? "bg-rose-50/70 text-rose-300 line-through" : st === "reserved" ? "bg-amber-50/80 text-amber-700" : st === "past" ? "text-[var(--ink-muted)]/35" : "bg-emerald-50/60 text-[var(--ink)] hover:bg-emerald-100/60";
            const dot = st === "booked" ? "bg-rose-300" : st === "reserved" ? "bg-amber-400" : st === "available" ? "bg-emerald-400" : "";
            return (
              <motion.button key={iso} type="button" disabled={disabled} onClick={() => onSelect(iso)}
                whileHover={disabled ? undefined : { scale: 1.08 }} whileTap={disabled ? undefined : { scale: 0.94 }}
                className={`relative h-8 sm:h-9 rounded-md text-[12.5px] font-semibold tabular-nums transition-colors ${!inMonth ? "invisible" : inRange ? (iso === start ? "!bg-[var(--ink)] !text-white" : "!bg-[var(--ink)]/80 !text-white") : tone} disabled:cursor-not-allowed`}>
                {format(d, "d")}
                {inMonth && dot && !inRange && <span className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${dot}`} />}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--ink-muted)]">
        <Legend cls="bg-emerald-50 border-emerald-200" label="Available" />
        <Legend cls="bg-amber-50 border-amber-200" label="Reserved — request allowed" />
        <Legend cls="bg-rose-50 border-rose-200" label="Booked" />
        <Legend cls="bg-[var(--ink)] border-[var(--ink)]" label="Your expo days" />
      </div>
    </div>
  );
}

/* ─── Small pieces ───────────────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[12.5px] font-semibold text-[var(--ink)]">{label}</p>
      {children}
    </div>
  );
}
function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-all ${on ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]/40"}`}>
      {children}
    </button>
  );
}
function Option({ on, onClick, title, sub }: { on: boolean; onClick: () => void; title: string; sub: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-start transition-all ${on ? "border-[var(--accent)] bg-[var(--bg-tint)]" : "border-[var(--line)] hover:border-[var(--ink)]/30"}`}>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-[var(--ink)]">{title}</span>
        <span className="block text-[11.5px] text-[var(--ink-muted)]">{sub}</span>
      </span>
      <span className={`grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border ${on ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)]"}`}>
        {on && <CheckCircle size={12} weight="bold" />}
      </span>
    </button>
  );
}
function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center rounded-lg border border-[var(--line)]">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="h-10 w-10 text-[18px] text-[var(--ink-muted)] hover:text-[var(--accent)]" aria-label="Decrease">−</button>
      <span className="flex-1 text-center text-[14px] font-semibold tabular-nums text-[var(--ink)]">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="h-10 w-10 text-[18px] text-[var(--ink-muted)] hover:text-[var(--accent)]" aria-label="Increase">+</button>
    </div>
  );
}
function Row({ label, sub, value }: { label: string; sub: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><p className="font-medium text-[var(--ink)]">{label}</p><p className="text-[11.5px] text-[var(--ink-muted)]">{sub}</p></div>
      <span className="whitespace-nowrap font-semibold tabular-nums text-[var(--ink)]">{value}</span>
    </div>
  );
}
function Legend({ cls, label }: { cls: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className={`h-3 w-3 rounded border ${cls}`} /> {label}</span>;
}
