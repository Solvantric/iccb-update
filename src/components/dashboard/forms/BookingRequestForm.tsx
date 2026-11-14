"use client";
import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { addDays, format } from "date-fns";
import { ArrowLeft, ArrowRight, CalendarCheck, CheckCircle, Info, Plus, Trash, WarningCircle } from "@phosphor-icons/react";
import type { BookingDay, BookingRequestInput, ClientType, Source } from "@/types/crm";
import { CLIENT_TYPE_LABELS, CLIENT_TYPES, EVENT_NATURES, SOURCE_LABELS, SOURCES, requireNameAndPhone } from "@/types/crm";
import { db, getRates } from "@/lib/crm/db";
import { buildEstimate, capacityCheck, findHall, hallRent, rentLabel } from "@/lib/crm/pricing";
import { hallDayState, DAY_STATE_LABEL } from "@/lib/crm/availability";
import { LAYOUT_OPTIONS } from "@/data/crm/capacities";
import { taka } from "@/lib/crm/format";
import { cn } from "@/lib/utils/cn";
import { hallCodeFor, trackCrm } from "@/lib/crm/track";
import { m } from "../ui/motion";
import { Badge, Button, Checkbox, Field, Input, NumberInput, Segmented, Select, Textarea } from "../ui/core";
import { AnimatedMoney } from "../ui/kpi";

type DayDraft = Omit<BookingDay, "id"> & { key: string };

const STEPS = ["Event", "Venue & date", "Guests", "Contact"] as const;

export interface BookingFormResult {
  input: BookingRequestInput;
}

export function BookingRequestForm({
  mode,
  onSubmit,
  submitting,
  initial,
}: {
  mode: "public" | "staff";
  onSubmit: (input: BookingRequestInput) => void;
  submitting?: boolean;
  initial?: Partial<{ hallId: string; date: string; name: string; mobile: string; eventNature: string; guests: number; source: Source; clientType: ClientType; layout: string; food: boolean; decorationProvider: "iccb" | "outside" | "none" }>;
}) {
  const halls = db.halls.store((s) => s.items).filter((h) => !h.deletedAt && h.active).sort((a, b) => a.order - b.order);
  const bookings = db.bookings.store((s) => s.items);
  const users = db.users.store((s) => s.items).filter((u) => !u.deletedAt && u.active && (u.role === "sales_executive" || u.role === "sales_manager"));

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [helpChoose, setHelpChoose] = useState(false);

  const [clientType, setClientType] = useState<ClientType>(initial?.clientType ?? "personal");
  const [eventTitle, setEventTitle] = useState("");
  const [eventNature, setEventNature] = useState(initial?.eventNature ?? "Wedding");
  const [days, setDays] = useState<DayDraft[]>(() => [{ key: "d0", dayType: "program", hallId: initial?.hallId ?? "", date: initial?.date ?? format(addDays(new Date(), 60), "yyyy-MM-dd"), start: "12:00", end: "23:00" }]);
  const [guests, setGuests] = useState({ optimum: initial?.guests ?? 500, maximum: initial?.guests ? Math.round(initial.guests * 1.1) : 550 });
  const [cars, setCars] = useState({ optimum: 120, maximum: 160 });
  const [food, setFood] = useState({ breakfast: false, lunch: false, snacks: false, dinner: initial?.food ?? true });
  const [decorationProvider, setDeco] = useState<"iccb" | "outside" | "none">(initial?.decorationProvider ?? "iccb");
  const [layout, setLayout] = useState(initial?.layout ?? "banquet_stage");
  const [contact, setContact] = useState({ name: initial?.name ?? "", organization: "", mobile: initial?.mobile ?? "", phone: "", email: "", address: "", emergencyName: "", emergencyMobile: "", referredBy: "", preferredMeetingTime: "", notes: "" });
  const [consent, setConsent] = useState(mode === "staff");
  const [source, setSource] = useState<Source>(initial?.source ?? (mode === "staff" ? "walk_in" : "website"));
  const [assignedTo, setAssignedTo] = useState("");

  const rates = useMemo(() => getRates(), []);
  const setDay = (key: string, patch: Partial<DayDraft>) => setDays((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const est = useMemo(() => {
    const valid = days.filter((d) => d.hallId && d.date);
    if (!valid.length) return null;
    return buildEstimate(
      { days: valid.map((d) => ({ ...d, id: d.key })), guests, food, menus: [], addons: [], decoration: { provider: decorationProvider === "outside" ? "outside" : "iccb" }, discount: { mode: "amount", value: 0, approval: "none" }, clientType, applyAit: false },
      rates
    );
  }, [days, guests, food, decorationProvider, clientType, rates]);

  // "Help me choose": suggest halls that fit the guest count for the layout.
  const suggestions = useMemo(
    () =>
      halls
        .filter((h) => h.kind === "hall")
        .map((h) => ({ h, cap: capacityCheck(h.code, layout, guests.optimum, rates) }))
        .filter((x) => x.cap.status === "ok" || x.cap.status === "near" || x.cap.status === "unknown")
        .slice(0, 4),
    [halls, layout, guests.optimum, rates]
  );

  const validate = (s: number): string | null => {
    if (s === 0 && !eventNature) return "Choose the event nature";
    if (s === 1) {
      if (!days.length) return "Add at least one date";
      if (days.some((d) => !d.hallId)) return "Choose a hall for each date (or use “Help me choose”)";
    }
    if (s === 3) {
      const e = requireNameAndPhone(contact);
      if (e) return e;
      if (!consent) return "Please confirm you've read ICCB's policies";
    }
    return null;
  };

  const next = () => {
    const e = validate(step);
    setError(e);
    if (e) return;
    if (mode === "public" && step === 1) {
      // Website funnel: availability check + estimate seen.
      for (const d of days) trackCrm("availability_check", { page: "/booking", hallCode: hallCodeFor(halls.find((h) => h.id === d.hallId)?.code) });
      trackCrm("estimate", { page: "/booking", hallCode: hallCodeFor(halls.find((h) => h.id === days[0]?.hallId)?.code) });
    }
    setDir(1);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const back = () => {
    setError(null);
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  };
  const submit = () => {
    for (let s = 0; s < STEPS.length; s++) {
      const e = validate(s);
      if (e) {
        setError(e);
        setStep(s);
        return;
      }
    }
    onSubmit({
      clientType,
      eventTitle: eventTitle.trim() || `${eventNature} — ${contact.name}`,
      eventNature,
      days: days.map(({ key: _k, ...d }) => {
        void _k;
        return d;
      }),
      guests,
      cars,
      food,
      decorationProvider,
      layout,
      ...contact,
      source,
      assignedTo: assignedTo || undefined,
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="crm-card overflow-hidden">
        {/* Stepper */}
        <div className="flex items-center gap-2 border-b border-crm-line px-5 py-4 overflow-x-auto crm-scroll">
          {STEPS.map((s, i) => (
            <button key={s} type="button" onClick={() => i < step && (setDir(-1), setStep(i))} className="flex shrink-0 items-center gap-2">
              <m.span animate={{ backgroundColor: i <= step ? "var(--crm-brand)" : "var(--crm-line)", color: i <= step ? "#fff" : "var(--crm-muted)" }} className="grid h-7 w-7 place-items-center rounded-full text-[12px] font-bold">
                {i < step ? <CheckCircle size={16} weight="bold" /> : i + 1}
              </m.span>
              <span className={cn("text-[13px] font-medium", i === step ? "text-crm-ink" : "text-crm-muted")}>{s}</span>
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-crm-line" />}
            </button>
          ))}
        </div>

        <div className="relative min-h-[380px] p-5">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <m.div key={step} custom={dir} initial={{ opacity: 0, x: dir * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -24 }} transition={{ duration: 0.22 }}>
              {step === 0 && (
                <div className="grid gap-5">
                  <Field label="Client type">
                    <div className="flex flex-wrap gap-2">
                      {CLIENT_TYPES.map((t) => (
                        <button key={t} type="button" onClick={() => setClientType(t)} className={cn("rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors", clientType === t ? "border-crm-brand bg-crm-tint text-crm-brand" : "border-crm-line text-crm-ink-2 hover:border-crm-muted/50")}>
                          {CLIENT_TYPE_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Event nature" required>
                      <Select value={eventNature} onChange={setEventNature} options={EVENT_NATURES.map((n) => ({ value: n, label: n }))} />
                    </Field>
                    <Field label="Event title" hint="e.g. “Rahman–Karim Wedding” or “Annual Sales Conference”">
                      <Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
                    </Field>
                  </div>
                  {mode === "staff" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Source">
                        <Select value={source} onChange={(v) => setSource(v as Source)} options={SOURCES.map((s) => ({ value: s, label: SOURCE_LABELS[s] }))} />
                      </Field>
                      <Field label="Assign representative" hint="Leave empty for round-robin">
                        <Select value={assignedTo} onChange={setAssignedTo} placeholder="Round-robin" options={users.map((u) => ({ value: u.id, label: u.name }))} />
                      </Field>
                    </div>
                  )}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[13px] text-crm-muted">Add each program and preparation day. Availability and rent update live.</p>
                    <Button size="sm" variant={helpChoose ? "soft" : "secondary"} onClick={() => setHelpChoose((v) => !v)}>
                      Help me choose a hall
                    </Button>
                  </div>
                  {helpChoose && (
                    <div className="rounded-xl border border-crm-line bg-crm-surface-2 p-4">
                      <div className="mb-3 grid gap-3 sm:grid-cols-2">
                        <Field label="Layout">
                          <Select value={layout} onChange={setLayout} options={LAYOUT_OPTIONS} />
                        </Field>
                        <Field label="Guests (optimum)">
                          <NumberInput value={guests.optimum} onChange={(n) => setGuests((g) => ({ ...g, optimum: n }))} />
                        </Field>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {suggestions.map(({ h, cap }) => (
                          <button key={h.id} type="button" onClick={() => setDays((ds) => ds.map((d) => ({ ...d, hallId: h.id })))} className="rounded-lg border border-crm-line bg-crm-surface p-3 text-start hover:border-crm-brand">
                            <p className="text-[13.5px] font-semibold text-crm-ink">
                              {h.name} <span className="font-normal text-crm-muted">· {h.number}</span>
                            </p>
                            <p className="text-[12px] text-crm-muted">{cap.message}</p>
                          </button>
                        ))}
                        {!suggestions.length && <p className="text-[13px] text-crm-muted">No single hall fits this guest count — an ICCB manager will suggest a combination.</p>}
                      </div>
                    </div>
                  )}
                  {days.map((d, i) => {
                    const hall = findHall(rates, d.hallId);
                    const avail = d.hallId && d.date ? hallDayState(bookings, d.hallId, d.date) : null;
                    const rent = hall && d.date && hall.kind !== "expo" ? hallRent(hall, d.date, rates) : null;
                    return (
                      <m.div key={d.key} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-crm-line p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <Segmented size="sm" value={d.dayType} onChange={(v) => setDay(d.key, { dayType: v })} options={[{ value: "program", label: "Program day" }, { value: "preparation", label: "Preparation day" }]} />
                          {days.length > 1 && (
                            <Button size="icon-sm" variant="ghost" aria-label="Remove day" onClick={() => setDays((ds) => ds.filter((x) => x.key !== d.key))}>
                              <Trash size={15} />
                            </Button>
                          )}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_0.8fr_0.8fr]">
                          <Field label={`Hall ${i + 1}`}>
                            <Select value={d.hallId} onChange={(v) => setDay(d.key, { hallId: v })} placeholder="Choose hall" options={halls.map((h) => ({ value: h.id, label: `${h.name} (${h.number})` }))} />
                          </Field>
                          <Field label="Date">
                            <Input type="date" value={d.date} min={format(new Date(), "yyyy-MM-dd")} onChange={(e) => setDay(d.key, { date: e.target.value })} />
                          </Field>
                          <Field label="Start">
                            <Input type="time" value={d.start} onChange={(e) => setDay(d.key, { start: e.target.value })} />
                          </Field>
                          <Field label="End">
                            <Input type="time" value={d.end} onChange={(e) => setDay(d.key, { end: e.target.value })} />
                          </Field>
                        </div>
                        {hall?.kind === "expo" && (
                          <Field label="Space (sq ft)" className="mt-3 max-w-xs">
                            <NumberInput value={d.sqft ?? 50000} onChange={(n) => setDay(d.key, { sqft: n })} suffix="sq ft" />
                          </Field>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px]">
                          {avail && (
                            <Badge tone={avail.state === "free" ? "green" : avail.state === "tentative" ? "amber" : "red"} dot>
                              {DAY_STATE_LABEL[avail.state]}
                            </Badge>
                          )}
                          {rent !== null && (
                            <span className="text-crm-muted">
                              Hall rent <span className="font-semibold text-crm-ink tabular">{taka(rent)}</span> · {rentLabel(d.date)}
                            </span>
                          )}
                          {avail && avail.state !== "free" && <span className="text-crm-muted">You can still request — a manager will suggest alternatives.</span>}
                        </div>
                      </m.div>
                    );
                  })}
                  <Button
                    size="sm"
                    icon={Plus}
                    onClick={() => {
                      const last = days[days.length - 1];
                      setDays((ds) => [...ds, { ...last, key: `d${Date.now()}`, date: last?.date ? format(addDays(new Date(`${last.date}T00:00:00`), 1), "yyyy-MM-dd") : "" }]);
                    }}
                  >
                    Add another day
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Guests — optimum" required>
                      <NumberInput value={guests.optimum} onChange={(n) => setGuests((g) => ({ ...g, optimum: n }))} />
                    </Field>
                    <Field label="Guests — maximum">
                      <NumberInput value={guests.maximum} onChange={(n) => setGuests((g) => ({ ...g, maximum: n }))} />
                    </Field>
                    <Field label="Cars — optimum">
                      <NumberInput value={cars.optimum} onChange={(n) => setCars((c) => ({ ...c, optimum: n }))} />
                    </Field>
                    <Field label="Cars — maximum">
                      <NumberInput value={cars.maximum} onChange={(n) => setCars((c) => ({ ...c, maximum: n }))} />
                    </Field>
                  </div>
                  <Field label="Layout">
                    <Select value={layout} onChange={setLayout} options={LAYOUT_OPTIONS} />
                  </Field>
                  {(() => {
                    const h = findHall(rates, days[0]?.hallId ?? "");
                    if (!h) return null;
                    const c = capacityCheck(h.code, layout, guests.optimum, rates);
                    return (
                      <p className={cn("flex items-start gap-2 rounded-lg px-3 py-2 text-[12.5px]", c.status === "over" ? "bg-[#FEF3F2] text-[#B42318]" : c.status === "near" ? "bg-[#FEF6E7] text-[#B54708]" : "bg-crm-surface-2 text-crm-ink-2")}>
                        {c.status === "over" ? <WarningCircle size={16} className="mt-0.5 shrink-0" /> : <Info size={16} className="mt-0.5 shrink-0" />}
                        {h.name}: {c.message}
                      </p>
                    );
                  })()}
                  <Field label="Food requirement" hint="ICCB Catering only — outside catering is not allowed.">
                    <div className="mt-1 flex flex-wrap gap-x-6 gap-y-2">
                      {(["breakfast", "lunch", "snacks", "dinner"] as const).map((k) => (
                        <Checkbox key={k} checked={food[k]} onChange={(v) => setFood((f) => ({ ...f, [k]: v }))} label={k === "snacks" ? "Evening snacks" : k[0].toUpperCase() + k.slice(1)} />
                      ))}
                    </div>
                  </Field>
                  <Field label="Decoration">
                    <Segmented value={decorationProvider} onChange={setDeco} options={[{ value: "iccb", label: "ICCB Events" }, { value: "outside", label: "Outside firm" }, { value: "none", label: "Not needed" }]} />
                  </Field>
                  {decorationProvider === "outside" && <p className="text-[12.5px] text-crm-muted">An outside-decoration fee applies (Category A/B/C) — your representative will confirm the category.</p>}
                </div>
              )}

              {step === 3 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" required>
                    <Input value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} autoComplete="name" />
                  </Field>
                  <Field label="Mobile" required hint="Bangladeshi mobile, e.g. 01712345678">
                    <Input value={contact.mobile} onChange={(e) => setContact((c) => ({ ...c, mobile: e.target.value }))} inputMode="tel" autoComplete="tel" />
                  </Field>
                  <Field label="Organization">
                    <Input value={contact.organization} onChange={(e) => setContact((c) => ({ ...c, organization: e.target.value }))} />
                  </Field>
                  <Field label="Email">
                    <Input type="email" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} autoComplete="email" />
                  </Field>
                  <Field label="Phone (land)">
                    <Input value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} />
                  </Field>
                  <Field label="Address">
                    <Input value={contact.address} onChange={(e) => setContact((c) => ({ ...c, address: e.target.value }))} />
                  </Field>
                  <Field label="Emergency contact name">
                    <Input value={contact.emergencyName} onChange={(e) => setContact((c) => ({ ...c, emergencyName: e.target.value }))} />
                  </Field>
                  <Field label="Emergency contact mobile">
                    <Input value={contact.emergencyMobile} onChange={(e) => setContact((c) => ({ ...c, emergencyMobile: e.target.value }))} />
                  </Field>
                  <Field label="Referred by">
                    <Input value={contact.referredBy} onChange={(e) => setContact((c) => ({ ...c, referredBy: e.target.value }))} />
                  </Field>
                  <Field label="Preferred meeting time">
                    <Input value={contact.preferredMeetingTime} onChange={(e) => setContact((c) => ({ ...c, preferredMeetingTime: e.target.value }))} placeholder="e.g. Saturday afternoon" />
                  </Field>
                  <Field label="Notes" className="sm:col-span-2">
                    <Textarea value={contact.notes} onChange={(e) => setContact((c) => ({ ...c, notes: e.target.value }))} />
                  </Field>
                  {mode === "public" && (
                    <>
                      <p className="sm:col-span-2 rounded-lg bg-crm-surface-2 px-3 py-2 text-[12.5px] text-crm-muted">NID / Passport is not collected online. It is verified at your meeting at ICCB.</p>
                      <Checkbox
                        className="sm:col-span-2"
                        checked={consent}
                        onChange={setConsent}
                        label={
                          <>
                            I have read ICCB&apos;s{" "}
                            <a href="/terms" target="_blank" className="text-crm-brand underline">
                              policies
                            </a>
                            .
                          </>
                        }
                      />
                    </>
                  )}
                </div>
              )}
            </m.div>
          </AnimatePresence>
        </div>

        {error && (
          <m.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mx-5 mb-3 flex items-center gap-2 rounded-lg bg-[#FEF3F2] px-3 py-2 text-[13px] text-[#B42318]">
            <WarningCircle size={16} /> {error}
          </m.p>
        )}

        <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-crm-line bg-crm-surface-2 px-5 py-3">
          <Button onClick={back} disabled={step === 0} icon={ArrowLeft}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button variant="primary" onClick={next} iconRight={ArrowRight}>
              Continue
            </Button>
          ) : (
            <Button variant="primary" onClick={submit} loading={submitting} icon={CalendarCheck}>
              {mode === "public" ? "Send booking request" : "Create booking"}
            </Button>
          )}
        </div>
      </div>

      {/* Live estimate */}
      <aside className="lg:sticky lg:top-4 h-fit space-y-4">
        <div className="crm-card p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-crm-muted">Live estimate</p>
          <div className="mt-3 space-y-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-crm-ink-2">Hall rent</span>
              <AnimatedMoney value={est?.venueRent ?? 0} className="font-semibold text-crm-ink" />
            </div>
            <div className="flex justify-between">
              <span className="text-crm-ink-2">Service charge</span>
              <AnimatedMoney value={est ? est.lines.filter((l) => l.group === "service").reduce((s, l) => s + l.amount, 0) : 0} className="text-crm-ink" />
            </div>
            <div className="flex justify-between">
              <span className="text-crm-ink-2">Other venue items</span>
              <AnimatedMoney value={est ? est.subtotal - est.venueRent - est.lines.filter((l) => l.group === "service").reduce((s, l) => s + l.amount, 0) : 0} className="text-crm-ink" />
            </div>
            <div className="flex justify-between">
              <span className="text-crm-ink-2">Security money (refundable)</span>
              <AnimatedMoney value={est?.security ?? 0} className="text-crm-ink" />
            </div>
            <div className="mt-2 flex justify-between border-t border-crm-line pt-2 text-[15px]">
              <span className="font-semibold text-crm-ink">Indicative total</span>
              <AnimatedMoney value={est?.grandTotal ?? 0} className="font-bold text-crm-brand" />
            </div>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-crm-muted">Excludes food & VAT. Not a final quotation — a booking manager confirms the price, date and terms. 60% of venue rent as advance confirms the booking. No online payment.</p>
        </div>
      </aside>
    </div>
  );
}
