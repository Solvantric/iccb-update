"use client";
/**
 * Public booking journey (website → CRM lead).
 *
 *   1. Venue & date   — month calendar per hall: Available / Reserved (tentative) / Booked
 *   2. Event          — event type, guests, time slot, event name
 *   3. Packages       — catering package + decoration (optional)
 *   4. Your details   — contact info → submit
 *
 * A live estimate (price range) sits beside the form.
 * Free date  → createBooking(…, "website")  → Reserved booking + enquiry in the CRM.
 * Reserved   → a waitlist enquiry in the CRM (the earlier request keeps priority).
 * Booked     → cannot be selected.
 * This file only *uses* the CRM's public services/stores; it does not change them.
 */
import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isBefore, isSameMonth, parseISO, startOfDay, startOfMonth, startOfWeek,
} from "date-fns";
import {
  ArrowLeft, ArrowRight, CalendarBlank, CaretLeft, CaretRight, CheckCircle, ForkKnife, Info, Sparkle, User, Users, WhatsappLogo,
} from "@phosphor-icons/react";
import type { Booking, EventType, Slot } from "@/types/crm";
import { EVENT_TYPES, SLOTS, MEAL_LABELS, validateContact } from "@/types/crm";
import { createBooking } from "@/services/crm";
import { db } from "@/lib/crm/db";
import { useBookings, useMenus, useSettingsValue } from "@/lib/crm/hooks";
import { useVenues } from "./venues";
import { useCrmReady } from "@/components/providers/CrmProvider";
import { trackCrm } from "@/lib/crm/track";

type DayStatus = "available" | "reserved" | "booked" | "past";
type Deco = "none" | "basic" | "standard" | "premium" | "other";

const STEPS = [
  { key: "venue", label: "Venue & date", icon: CalendarBlank },
  { key: "event", label: "Event", icon: Sparkle },
  { key: "package", label: "Packages", icon: ForkKnife },
  { key: "details", label: "Your details", icon: User },
] as const;

const DECOS: { id: Deco; label: string; note: string }[] = [
  { id: "none", label: "No decoration", note: "I'll decide later" },
  { id: "basic", label: "ICCB Basic", note: "Elegant stage & entrance" },
  { id: "standard", label: "ICCB Standard", note: "Themed stage, florals, lighting" },
  { id: "premium", label: "ICCB Premium", note: "Full thematic décor" },
  { id: "other", label: "Custom decoration", note: "Set your own budget" },
];


/**
 * Demo calendar data so visitors can see how Booked / Reserved dates look.
 * Deterministic per hall + date (same result on every visit). Real CRM bookings always win.
 */
/** Fixed demo dates (days from today) so the flagship hall always shows a few of each. */
const DEMO_FIXED: Record<string, { booked: number[]; reserved: number[] }> = {
  gulnaksha: { booked: [2, 5, 6, 9, 13, 19, 20, 26, 33], reserved: [4, 11, 16, 23, 27] },
};

function demoStatus(hallId: string, iso: string): "reserved" | "booked" | null {
  const fixed = DEMO_FIXED[hallId];
  if (fixed) {
    const offset = Math.round((parseISO(iso).getTime() - startOfDay(new Date()).getTime()) / 86_400_000);
    if (fixed.booked.includes(offset)) return "booked";
    if (fixed.reserved.includes(offset)) return "reserved";
  }
  let h = 2166136261;
  for (const ch of hallId + iso) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const r = ((h >>> 0) % 1000) / 1000;
  const dow = parseISO(iso).getDay();
  const weekend = dow === 5 || dow === 6;
  if (r < (weekend ? 0.22 : 0.08)) return "booked";
  if (r < (weekend ? 0.36 : 0.16)) return "reserved";
  return null;
}

const ICCB_WHATSAPP = "8801991197719";
/** Read a query-string value (prefill from the home page quick form). */
const queryParam = (key: string) => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get(key));
const taka = (n: number) => `৳${Math.round(n).toLocaleString("en-IN")}`;
const ease = [0.22, 1, 0.36, 1] as const;
const INPUT =
  "w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-muted)]/60 outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_15%,transparent)]";

export function BookingJourney({ onSwitchToExpo }: { onSwitchToExpo?: () => void } = {}) {
  const ready = useCrmReady();
  const halls = useVenues();
  const menus = useMenus().filter((m) => m.active);
  const bookings = useBookings();
  const settings = useSettingsValue();

  const [step, setStep] = useState(0);
  const [hallChoice, setHallId] = useState("");
  const [dateChoice, setDate] = useState(() => {
    const d = queryParam("date");
    return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "";
  });
  const [slot, setSlot] = useState<Slot>("Evening (5 PM – 11 PM)");
  const [eventType, setEventType] = useState<EventType | "">(() => {
    const raw = (queryParam("eventType") ?? "").toLowerCase();
    const alias: Record<string, EventType> = { expo: "Exhibition", seminar: "Conference" };
    return alias[raw] ?? EVENT_TYPES.find((t) => t.toLowerCase() === raw) ?? "";
  });
  const [eventName, setEventName] = useState("");
  const [guests, setGuests] = useState<number | "">(() => {
    const g = Number(queryParam("guests"));
    return g > 0 ? g : "";
  });
  const [menuId, setMenuId] = useState<string>("");
  const [deco, setDeco] = useState<Deco>("none");
  const [otherMenu, setOtherMenu] = useState("");
  const [otherDeco, setOtherDeco] = useState("");
  const [otherPerHead, setOtherPerHead] = useState<number | "">("");
  const [otherDecoBudget, setOtherDecoBudget] = useState<number | "">("");
  const [contact, setContact] = useState({ name: "", mobile: "", email: "", organization: "", note: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ kind: "booking"; booking: Booking } | { kind: "waitlist" } | { kind: "request" } | null>(null);

  useEffect(() => {
    if (ready) trackCrm("form_open", "/booking");
  }, [ready]);

  // Default to the first hall until the visitor picks one
  const hallId = hallChoice || halls[0]?.id || "";
  const hall = halls.find((h) => h.id === hallId);
  const menu = menus.find((m) => m.id === menuId);

  /** status of every date for the selected hall */
  const statusOf = (() => {
    const map = new Map<string, "reserved" | "booked">();
    for (const b of bookings) {
      if (b.hallId !== hallId) continue;
      if (b.status === "booked") map.set(b.date, "booked");
      else if (b.status === "reserved" && map.get(b.date) !== "booked") map.set(b.date, "reserved");
    }
    const today = startOfDay(new Date());
    return (iso: string): DayStatus =>
      isBefore(parseISO(iso), today) ? "past" : map.get(iso) ?? demoStatus(hallId, iso) ?? "available";
  })();

  // A date that is booked/past for the chosen hall is not a valid choice
  const rawStatus = dateChoice ? statusOf(dateChoice) : null;
  const date = rawStatus === "booked" || rawStatus === "past" ? "" : dateChoice;
  const dateStatus: DayStatus | null = date ? rawStatus : null;

  /* ─── Estimate ──────────────────────────────────────────────────────────── */
  const estimate = (() => {
    if (!hall) return null;
    const weekend = date ? settings.weekendDays.includes(parseISO(date).getDay()) : false;
    const hallRent = weekend ? hall.weekendRate : hall.weekdayRate;
    const g = Number(guests) || 0;
    const perHead = menu ? menu.perHead : menuId === "other" ? Number(otherPerHead) || 0 : 0;
    const food = perHead * g * (1 + (settings.foodVatPercent ?? 0) / 100);
    const decoMap: Record<Deco, number> = {
      none: 0,
      basic: settings.addOnRates.decorationBasic,
      standard: settings.addOnRates.decorationStandard,
      premium: settings.addOnRates.decorationPremium,
      other: Number(otherDecoBudget) || 0,
    };
    const decoration = decoMap[deco] ?? 0;
    const base = hallRent + food + decoration;
    return { hallRent, food, decoration, low: base, high: base * 1.12, weekend };
  })();

  /* ─── Step validation ───────────────────────────────────────────────────── */
  const stepError = (i: number): string => {
    if (i === 0) {
      if (!hallId) return "Please choose a venue.";
      if (!date) return "Please pick a date from the calendar.";
    }
    if (i === 1) {
      if (!eventType) return "Please choose the type of event.";
      if (!guests || Number(guests) < 1) return "Please enter the approximate number of guests.";
      if (hall && Number(guests) > hall.capacity) return `${hall.name} seats up to ${hall.capacity.toLocaleString("en-IN")} guests — please pick a larger hall or fewer guests.`;
    }
    if (i === 3) {
      const c = validateContact(contact.name, contact.mobile);
      if (c) return c;
    }
    return "";
  };

  const next = () => {
    const e = stepError(step);
    setError(e);
    if (!e) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    const e = stepError(3) || stepError(1) || stepError(0);
    setError(e);
    if (e || !hall || !eventType) return;
    setBusy(true);
    const pkgLine = [
      menu ? `Package: ${menu.name} (${taka(menu.perHead)}/head)` : menuId === "other" ? `Package: other — ${otherMenu.trim() || "to discuss"}${otherPerHead ? ` (budget ${taka(Number(otherPerHead))}/head)` : ""}` : "Package: not chosen",
      deco === "other" ? `Decoration: other — ${otherDeco.trim() || "to discuss"}${otherDecoBudget ? ` (budget ${taka(Number(otherDecoBudget))})` : ""}` : deco !== "none" ? `Decoration: ${DECOS.find((d) => d.id === deco)?.label}` : null,
      estimate ? `Estimate: ${taka(estimate.low)} – ${taka(estimate.high)}` : null,
    ].filter(Boolean).join(" · ");
    const note = [pkgLine, contact.note.trim()].filter(Boolean).join("\n").slice(0, 300);
    const name = eventName.trim() || `${eventType} at ICCB`;
    try {
      await new Promise((r) => setTimeout(r, 350));
      if (dateStatus === "reserved" || !hall.inCrm) {
        // Reserved date → waitlist lead; hall not in the CRM yet (Seminar Hall) → reservation-request lead
        db.enquiries.create({
          type: "booking",
          source: "Booking form",
          name: contact.name.trim(),
          mobile: contact.mobile.trim(),
          email: contact.email.trim() || undefined,
          message: [
            dateStatus === "reserved"
              ? `WAITLIST — ${hall.name} on ${format(parseISO(date), "EEE, d MMM yyyy")} is currently reserved by another client.`
              : `RESERVATION REQUEST — ${hall.name} on ${format(parseISO(date), "EEE, d MMM yyyy")}.`,
            `${name} · ${eventType} · ${Number(guests).toLocaleString("en-IN")} guests · ${slot}`,
            contact.organization.trim() ? `Organisation: ${contact.organization.trim()}` : "",
            note,
          ].filter(Boolean).join("\n"),
          seen: false,
        });
        trackCrm("form_submit", "/booking");
        setDone({ kind: dateStatus === "reserved" ? "waitlist" : "request" });
      } else {
        const booking = createBooking(
          {
            name: contact.name,
            mobile: contact.mobile,
            email: contact.email || undefined,
            organization: contact.organization || undefined,
            eventName: name,
            eventType,
            hallId,
            date,
            guests: Number(guests),
            slot,
            note,
          },
          "website",
        );
        setDone({ kind: "booking", booking });
      }
      document.getElementById("booking-form-section")?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please call +88-01991-197719.");
    } finally {
      setBusy(false);
    }
  };

  /* ─── Render ────────────────────────────────────────────────────────────── */
  if (!ready) return <div className="h-[560px] w-full rounded-2xl bg-[var(--surface)] animate-pulse" />;

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="mx-auto max-w-xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 sm:p-10 text-center shadow-[0_30px_60px_-40px_rgba(0,0,0,0.35)]"
      >
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
          className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle size={38} weight="fill" />
        </motion.div>
        <h3 className="font-display uppercase text-[26px] text-[var(--ink)]">
          {done.kind === "waitlist" ? "You're on the waiting list" : "Reservation request received"}
        </h3>
        <p className="mt-3 text-[16px] text-[var(--ink-body)] leading-relaxed">
          {done.kind === "waitlist"
            ? "This date is currently reserved by another client, who has priority. If they release it, it's yours — our team will contact you very soon."
            : done.kind === "request"
              ? "Thank you! Your reservation request has been sent — it is not a confirmed booking yet. Our team will contact you very soon to confirm."
              : "Thank you! This date is now reserved for you (tentatively) — it is not a confirmed booking yet. Our team will contact you very soon to confirm the details."}
        </p>
        {done.kind === "booking" && (
          <div className="mx-auto mt-6 inline-flex flex-col rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] px-6 py-3">
            <span className="text-[12px] text-[var(--ink-muted)]">Reference no.</span>
            <span className="text-[20px] font-semibold tracking-wide text-[var(--ink)] tabular-nums">{done.booking.ref}</span>
            <span className="text-[12.5px] text-[var(--ink-muted)]">{hall?.name} · {format(parseISO(done.booking.date), "EEE, d MMM yyyy")}</span>
          </div>
        )}
        <div className="mt-7 flex justify-center">
          <a
            href={`https://wa.me/${ICCB_WHATSAPP}?text=${encodeURIComponent(done.kind === "booking" ? `Hello ICCB, my booking reference is ${done.booking.ref}.` : "Hello ICCB, I joined the waiting list on your website.")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-btn)] bg-[#25D366] px-5 text-[14px] font-medium text-white hover:opacity-90 transition-opacity"
          >
            <WhatsappLogo size={18} weight="fill" /> Message us on WhatsApp
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] items-start">
      {/* ── Form card ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_30px_60px_-45px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* Stepper */}
        <ol className="grid grid-cols-4 border-b border-[var(--line)]">
          {STEPS.map((s, i) => {
            const state = i < step ? "done" : i === step ? "now" : "todo";
            return (
              <li key={s.key}>
                <button
                  type="button"
                  disabled={i > step}
                  onClick={() => i < step && setStep(i)}
                  className={`relative w-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-3 text-[11px] sm:text-[12.5px] font-semibold transition-colors ${
                    state === "now" ? "text-[var(--accent)]" : state === "done" ? "text-[var(--ink)] hover:text-[var(--accent)]" : "text-[var(--ink-muted)]/70"
                  }`}
                >
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] transition-colors ${
                    state === "now" ? "bg-[var(--accent)] text-white" : state === "done" ? "bg-[var(--ink)] text-white" : "bg-[var(--bg-soft)] text-[var(--ink-muted)]"
                  }`}>
                    {state === "done" ? <CheckCircle size={15} weight="bold" /> : i + 1}
                  </span>
                  <span className="text-center leading-tight">{s.label}</span>
                  {state === "now" && <motion.span layoutId="step-bar" className="absolute bottom-0 inset-x-0 h-[2px] bg-[var(--accent)]" />}
                </button>
              </li>
            );
          })}
        </ol>

        <div className="p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35, ease }}
            >
              {step === 0 && (
                <div className="space-y-4">
                  <StepTitle n={1} title="Choose a venue & check the date" sub="Pick a hall — the calendar shows which days are free." />
                  {/* Compact hall tiles — small photo + name */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {halls.map((h) => {
                      const on = h.id === hallId;
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => setHallId(h.id)}
                          className={`group flex items-center gap-2.5 text-start rounded-lg border p-1.5 pe-2.5 transition-all ${
                            on ? "border-[var(--accent)] bg-[var(--bg-tint)] shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent)_15%,transparent)]" : "border-[var(--line)] hover:border-[var(--ink)]/30"
                          }`}
                        >
                          <span className="relative h-11 w-14 flex-shrink-0 overflow-hidden rounded-md bg-[var(--bg-soft)]">
                            {h.image && <Image src={h.image} alt={h.name} fill sizes="56px" className="object-cover" />}
                          </span>
                          <span className="min-w-0">
                            <span className={`block truncate font-semibold text-[13px] ${on ? "text-[var(--accent)]" : "text-[var(--ink)]"}`}>{h.name}</span>
                            <span className="flex items-center gap-1 text-[11px] text-[var(--ink-muted)]"><Users size={11} /> {h.capacity.toLocaleString("en-IN")} · {taka(h.weekdayRate)}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <AvailabilityCalendar selected={date} onSelect={setDate} statusOf={statusOf} />

                  {/* Result for the chosen date */}
                  {date && dateStatus && (
                    <motion.div
                      key={`${hallId}-${date}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-[14px] ${
                        dateStatus === "reserved" ? "border-amber-300 bg-amber-50 text-amber-900" : "border-emerald-300 bg-emerald-50 text-emerald-900"
                      }`}
                    >
                      <Info size={18} weight="fill" className="mt-0.5 flex-shrink-0" />
                      {dateStatus === "reserved" ? (
                        <span>
                          <b>{format(parseISO(date), "EEE, d MMM yyyy")}</b> is <b>tentatively reserved</b> by another client. You can still request it —
                          the earlier request has priority. If they confirm, this date will not be available to you; if they release it, it&apos;s yours.
                        </span>
                      ) : (
                        <span>
                          Great news — <b>{hall?.name}</b> is <b>available</b> on <b>{format(parseISO(date), "EEE, d MMM yyyy")}</b>.
                        </span>
                      )}
                    </motion.div>
                  )}

                  <Field label="Time slot">
                    <div className="flex flex-wrap gap-2">
                      {SLOTS.map((s) => (
                        <Chip key={s} on={slot === s} onClick={() => setSlot(s)}>{s}</Chip>
                      ))}
                    </div>
                  </Field>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <StepTitle n={2} title="Tell us about your event" sub="This helps us suggest the right setup." />
                  <Field label="Event type">
                    <div className="flex flex-wrap gap-2">
                      {EVENT_TYPES.filter((t) => !(onSwitchToExpo && t === "Exhibition")).map((t) => (
                        <Chip key={t} on={eventType === t} onClick={() => setEventType(t)}>{t}</Chip>
                      ))}
                      {onSwitchToExpo && (
                        <Chip on={false} onClick={onSwitchToExpo}>Expo / Exhibition →</Chip>
                      )}
                    </div>
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Number of guests">
                      <input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={guests}
                        onChange={(e) => setGuests(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
                        placeholder={hall ? `Up to ${hall.capacity.toLocaleString("en-IN")}` : "e.g. 500"}
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Event name (optional)">
                      <input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g. Rahman–Karim wedding" className={INPUT} />
                    </Field>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <StepTitle n={3} title="Add our packages" sub="Optional — you can change everything later with our team." />
                  <Field label="Catering package">
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      <PackageCard on={menuId === ""} onClick={() => setMenuId("")} title="No catering yet" sub="Decide later" />
                      {menus.map((m) => (
                        <PackageCard
                          key={m.id}
                          on={menuId === m.id}
                          onClick={() => setMenuId(m.id)}
                          title={m.name}
                          sub={`${MEAL_LABELS[m.meal]} · ${taka(m.perHead)} / head`}
                          items={m.items}
                        />
                      ))}
                      <PackageCard on={menuId === "other"} onClick={() => setMenuId("other")} title="Custom menu" sub="Set your own budget per guest" />
                    </div>
                    {menuId === "other" && (
                      <div className="mt-2.5 grid sm:grid-cols-[1fr_170px] gap-2">
                        <input value={otherMenu} onChange={(e) => setOtherMenu(e.target.value)} placeholder="What would you like? e.g. Kacchi + BBQ" className={INPUT} />
                        <input type="number" min={0} inputMode="numeric" value={otherPerHead} onChange={(e) => setOtherPerHead(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))} placeholder="Budget ৳ / head" className={INPUT} />
                        <p className="sm:col-span-2 text-[12px] text-[var(--ink-muted)]">Tell us your budget per guest — our chef will design a menu to match.</p>
                      </div>
                    )}
                  </Field>
                  <Field label="Decoration">
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {DECOS.map((d) => (
                        <PackageCard
                          key={d.id}
                          on={deco === d.id}
                          onClick={() => setDeco(d.id)}
                          title={d.label}
                          sub={d.id === "none" || d.id === "other" ? d.note : `${d.note} · from ${taka(
                            d.id === "basic" ? settings.addOnRates.decorationBasic : d.id === "standard" ? settings.addOnRates.decorationStandard : settings.addOnRates.decorationPremium,
                          )}`}
                        />
                      ))}
                    </div>
                    {deco === "other" && (
                      <div className="mt-2.5 grid sm:grid-cols-[1fr_170px] gap-2">
                        <input value={otherDeco} onChange={(e) => setOtherDeco(e.target.value)} placeholder="e.g. floral theme, own decorator" className={INPUT} />
                        <input type="number" min={0} inputMode="numeric" value={otherDecoBudget} onChange={(e) => setOtherDecoBudget(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))} placeholder="Budget ৳" className={INPUT} />
                      </div>
                    )}
                  </Field>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <StepTitle n={4} title="Your details" sub="We'll use these to contact you about your booking." />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Full name *">
                      <input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className={INPUT} autoComplete="name" />
                    </Field>
                    <Field label="Mobile number *">
                      <input value={contact.mobile} onChange={(e) => setContact({ ...contact, mobile: e.target.value })} className={INPUT} inputMode="tel" placeholder="01XXXXXXXXX" autoComplete="tel" />
                    </Field>
                    <Field label="Email">
                      <input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className={INPUT} autoComplete="email" />
                    </Field>
                    <Field label="Organisation">
                      <input value={contact.organization} onChange={(e) => setContact({ ...contact, organization: e.target.value })} className={INPUT} autoComplete="organization" />
                    </Field>
                  </div>
                  <Field label="Anything else? (optional)">
                    <textarea rows={3} value={contact.note} onChange={(e) => setContact({ ...contact, note: e.target.value })} className={`${INPUT} resize-none`} maxLength={200} />
                  </Field>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {error && <p className="mt-5 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-[13.5px] text-red-700">{error}</p>}

          {/* Nav */}
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="inline-flex items-center gap-2 text-[14px] font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] disabled:opacity-0 transition"
            >
              <ArrowLeft size={15} /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} className="btn btn-primary">
                {step === 0 ? "Continue" : "Next"} <ArrowRight size={15} weight="bold" />
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={busy} className="btn btn-primary disabled:opacity-60">
                {busy ? "Sending…" : dateStatus === "reserved" ? "Join the waiting list" : "Send reservation request"} <ArrowRight size={15} weight="bold" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Estimate ──────────────────────────────────────────────── */}
      <aside className="lg:sticky lg:top-28 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_30px_60px_-45px_rgba(0,0,0,0.35)]">
        <p className="text-eyebrow mb-1">Estimate</p>
        <h3 className="font-display uppercase text-[22px] text-[var(--ink)] leading-tight">Your event cost</h3>
        <div className="mt-5 space-y-3 text-[14px]">
          <Row label={`Hall${hall ? ` — ${hall.name}` : ""}`} sub={estimate ? (estimate.weekend ? "Weekend rate" : "Weekday rate") : undefined} value={estimate ? taka(estimate.hallRent) : "—"} />
          <Row
            label={menu ? menu.name : menuId === "other" ? "Custom menu" : "Catering"}
            sub={
              menu && guests ? `${Number(guests).toLocaleString("en-IN")} guests × ${taka(menu.perHead)} + VAT`
              : menuId === "other" && guests && otherPerHead ? `${Number(guests).toLocaleString("en-IN")} guests × ${taka(Number(otherPerHead))} + VAT`
              : "Not selected"
            }
            value={estimate && estimate.food ? taka(estimate.food) : "—"}
          />
          <Row label="Decoration" sub={deco === "none" ? "Not selected" : DECOS.find((d) => d.id === deco)?.label} value={estimate && estimate.decoration ? taka(estimate.decoration) : "—"} />
        </div>
        <div className="mt-5 rounded-xl bg-[var(--bg-soft)] px-4 py-4">
          <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Estimated range</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={estimate ? `${Math.round(estimate.low)}` : "none"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="mt-1 font-display text-[24px] text-[var(--ink)] tabular-nums"
            >
              {estimate ? `${taka(estimate.low)} – ${taka(estimate.high)}` : "Choose a hall"}
            </motion.p>
          </AnimatePresence>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-[var(--ink-muted)]">
          A rough guide only. Final price depends on date, setup and extras — our team will share an exact quote. No payment is taken online.
        </p>
      </aside>
    </div>
  );
}

/* ─── Calendar ───────────────────────────────────────────────────────────── */

function AvailabilityCalendar({ selected, onSelect, statusOf }: { selected: string; onSelect: (iso: string) => void; statusOf: (iso: string) => DayStatus }) {
  const [month, setMonth] = useState(() => startOfMonth(selected ? parseISO(selected) : new Date()));
  const [dir, setDir] = useState(1);
  const days = eachDayOfInterval({ start: startOfWeek(month), end: endOfWeek(endOfMonth(month)) });
  const canPrev = !isBefore(addMonths(month, -1), startOfMonth(new Date()));
  const shift = (d: number) => {
    setDir(d);
    setMonth((m) => addMonths(m, d));
  };

  return (
    <div className="rounded-xl border border-[var(--line)] p-3 sm:p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <motion.button whileTap={{ scale: 0.9 }} type="button" disabled={!canPrev} onClick={() => shift(-1)} aria-label="Previous month"
          className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-30">
          <CaretLeft size={13} weight="bold" />
        </motion.button>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.span key={month.toISOString()} initial={{ opacity: 0, y: dir * 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: dir * -8 }} transition={{ duration: 0.2 }}
            className="font-semibold text-[14.5px] text-[var(--ink)]">
            {format(month, "MMMM yyyy")}
          </motion.span>
        </AnimatePresence>
        <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => shift(1)} aria-label="Next month"
          className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
          <CaretRight size={13} weight="bold" />
        </motion.button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10.5px] font-semibold uppercase tracking-wide text-[var(--ink-muted)] mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <span key={d} className="py-1">{d}</span>)}
      </div>

      {/* Days slide in with the month and ripple in one by one */}
      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <motion.div
          key={month.toISOString()}
          className="grid grid-cols-7 gap-1"
          variants={{
            hidden: { opacity: 0, x: dir * 28 },
            show: { opacity: 1, x: 0, transition: { duration: 0.28, ease, staggerChildren: 0.008 } },
            out: { opacity: 0, x: dir * -28, transition: { duration: 0.18 } },
          }}
          initial="hidden"
          animate="show"
          exit="out"
        >
          {days.map((d) => {
            const iso = format(d, "yyyy-MM-dd");
            const inMonth = isSameMonth(d, month);
            const st = statusOf(iso);
            const isSel = iso === selected;
            const disabled = !inMonth || st === "booked" || st === "past";
            // Soft tints with a coloured dot — easy to read, easy on the eye
            const tone =
              st === "booked" ? "bg-rose-50/70 text-rose-300 line-through decoration-rose-200"
              : st === "reserved" ? "bg-amber-50/80 text-amber-700 hover:bg-amber-100/70"
              : st === "past" ? "text-[var(--ink-muted)]/35"
              : "bg-emerald-50/60 text-[var(--ink)] hover:bg-emerald-100/60";
            const dot = st === "booked" ? "bg-rose-300" : st === "reserved" ? "bg-amber-400" : st === "available" ? "bg-emerald-400" : "";
            return (
              <motion.button
                key={iso}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(iso)}
                variants={{ hidden: { opacity: 0, scale: 0.85 }, show: { opacity: 1, scale: 1 } }}
                whileHover={disabled ? undefined : { scale: 1.08, y: -1 }}
                whileTap={disabled ? undefined : { scale: 0.94 }}
                title={st === "booked" ? "Booked — not available" : st === "reserved" ? "Reserved — earlier request has priority" : st === "past" ? "" : "Available"}
                className={`relative h-8 sm:h-9 rounded-md text-[12.5px] font-semibold tabular-nums transition-colors ${!inMonth ? "invisible" : tone} ${
                  isSel ? "!bg-[var(--ink)] !text-white ring-2 ring-offset-2 ring-offset-[var(--surface)] ring-[var(--ink)]" : ""
                } disabled:cursor-not-allowed`}
              >
                {format(d, "d")}
                {inMonth && dot && !isSel && <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full ${dot}`} />}
                {isSel && (
                  <motion.span
                    layoutId="cal-sel"
                    className="absolute inset-0 rounded-md ring-2 ring-[var(--ink)]"
                    transition={{ type: "spring", stiffness: 420, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-[var(--ink-muted)]">
        <Legend cls="bg-emerald-50 border-emerald-200" label="Available" />
        <Legend cls="bg-amber-50 border-amber-200" label="Reserved — request allowed, earlier request has priority" />
        <Legend cls="bg-rose-50 border-rose-200" label="Booked — not available" />
        <Legend cls="bg-[var(--ink)] border-[var(--ink)]" label="Your date" />
      </div>
    </div>
  );
}

/* ─── Small pieces ───────────────────────────────────────────────────────── */

function StepTitle({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Step {n} of 4</p>
      <h3 className="mt-0.5 font-display uppercase text-[19px] sm:text-[21px] text-[var(--ink)] leading-tight">{title}</h3>
      <p className="mt-0.5 text-[13px] text-[var(--ink-muted)]">{sub}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-semibold text-[var(--ink)]">{label}</span>
      {children}
    </label>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-all ${
        on ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]/40"
      }`}
    >
      {children}
    </button>
  );
}

function PackageCard({ on, onClick, title, sub, items }: { on: boolean; onClick: () => void; title: string; sub: string; items?: string[] }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-start rounded-lg border px-3 py-2 transition-all ${
        on ? "border-[var(--accent)] bg-[var(--bg-tint)] shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent)_15%,transparent)]" : "border-[var(--line)] hover:border-[var(--ink)]/30"
      }`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="font-semibold text-[13px] text-[var(--ink)]">{title}</span>
        <span className={`grid h-5 w-5 place-items-center rounded-full border ${on ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)]"}`}>
          {on && <CheckCircle size={12} weight="bold" />}
        </span>
      </span>
      <span className="mt-0.5 block text-[12.5px] text-[var(--ink-muted)]">{sub}</span>
      {items && <span className="mt-1.5 block text-[12px] text-[var(--ink-muted)]/80 line-clamp-1">{items.join(" · ")}</span>}
    </button>
  );
}

function Row({ label, sub, value }: { label: string; sub?: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-medium text-[var(--ink)]">{label}</p>
        {sub && <p className="text-[12px] text-[var(--ink-muted)]">{sub}</p>}
      </div>
      <span className="font-semibold text-[var(--ink)] tabular-nums whitespace-nowrap">{value}</span>
    </div>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded border ${cls}`} /> {label}
    </span>
  );
}
