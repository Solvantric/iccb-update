"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { create } from "zustand";
import { addMonths, format } from "date-fns";
import { CalendarCheck, CaretDown, CheckCircle, FilePdf, MagicWand, Sparkle, Users, WarningCircle, WhatsappLogo } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Booking, ClientType } from "@/types/crm";
import { CLIENT_TYPE_LABELS, CLIENT_TYPES, EVENT_NATURES } from "@/types/crm";
import { db, getRates, getSettings, useCurrentUser } from "@/lib/crm/db";
import { matchHalls, MATCH_LAYOUTS, type MatchInput, type MatchLayout, type MatchOption } from "@/lib/crm/matchmaker";
import { buildDocModel } from "@/lib/crm/documents";
import { fmtDate, taka, todayYmd } from "@/lib/crm/format";
import { halls as publicHalls } from "@/data/halls";
import { cn } from "@/lib/utils/cn";
import { m } from "../ui/motion";
import { Badge, Button, EmptyState, Field, Input, NumberInput, Segmented, Select, Switch } from "../ui/core";
import { AnimatedMoney, ProgressBar } from "../ui/kpi";
import { Drawer } from "../ui/overlay";
import { downloadPdf } from "../documents/DocumentViewer";

const PHOTO: Record<string, string | undefined> = {
  "hall-1": publicHalls.find((h) => h.slug === "gulnaksha")?.image,
  "hall-2": publicHalls.find((h) => h.slug === "pushpoguchcho")?.image,
  "hall-3": publicHalls.find((h) => h.slug === "rajdarshan")?.image,
  "hall-4": publicHalls.find((h) => h.slug === "noboratri")?.image,
  "hall-5": publicHalls.find((h) => h.slug === "pushpanjali")?.image,
};

const TYPE_FOR: Record<string, ClientType> = { Corporate: "corporate", Conference: "corporate", Seminar: "corporate", "Product Launch": "corporate", "Award Ceremony": "corporate", Concert: "cultural", "Fashion Show": "cultural", Exhibition: "exhibition", "Trade Fair": "exhibition", Convocation: "others" };
const LABEL_TONE = { "Best fit": "brand", "Best value": "green", "Alternative date": "blue" } as const;

export interface MatchPrefill {
  hallId: string;
  date: string;
  guests: number;
  eventNature: string;
  clientType: ClientType;
  layout: string;
  food: boolean;
  decorationProvider: "iccb" | "outside" | "none";
}

/** Global open state so the command palette can open the matchmaker anywhere. */
export const useMatchmakerDrawer = create<{ open: boolean; set: (v: boolean) => void }>((set) => ({ open: false, set: (open) => set({ open }) }));

function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

type Deco = "iccb" | "none" | "A" | "B" | "C";

export function Matchmaker({ onUse, compact }: { onUse: (p: MatchPrefill) => void; compact?: boolean }) {
  const me = useCurrentUser();
  const bookings = db.bookings.store((s) => s.items);
  const menuItems = db.menus.store((s) => s.items);
  const menus = useMemo(() => menuItems.filter((x) => !x.deletedAt && x.published), [menuItems]);
  const [eventType, setEventType] = useState("Wedding");
  const [clientType, setClientType] = useState<ClientType>("personal");
  const [guests, setGuests] = useState(600);
  const [sqft, setSqft] = useState(40000);
  const [layout, setLayout] = useState<MatchLayout>("banquet_stage");
  const [mode, setMode] = useState<"date" | "month">("date");
  const [date, setDate] = useState(format(addMonths(new Date(), 2), "yyyy-MM-dd"));
  const [month, setMonth] = useState(format(addMonths(new Date(), 1), "yyyy-MM"));
  const [budget, setBudget] = useState(0);
  const [food, setFood] = useState(true);
  const [menuId, setMenuId] = useState(menus[0]?.id ?? "");
  const [deco, setDeco] = useState<Deco>("iccb");
  const [client, setClient] = useState({ name: "", mobile: "" });

  const input = useMemo<MatchInput>(() => {
    const menu = menus.find((x) => x.id === menuId);
    return {
      eventType,
      clientType,
      guests,
      layout,
      sqft: layout === "exhibition" ? sqft : undefined,
      date: mode === "date" ? date : undefined,
      month: mode === "month" ? month : undefined,
      budget: budget || undefined,
      food,
      menuPerHead: menu?.perHead,
      menuName: menu?.name,
      decoration: deco === "iccb" || deco === "none" ? { provider: deco } : { provider: "outside", category: deco },
      start: layout === "theatre" || clientType === "corporate" ? "08:00" : "12:00",
      end: layout === "theatre" || clientType === "corporate" ? "20:00" : "23:00",
    };
  }, [eventType, clientType, guests, layout, sqft, mode, date, month, budget, food, menuId, deco, menus]);
  const debounced = useDebounced(input);
  const result = useMemo(() => matchHalls(debounced, { rates: getRates(), bookings: bookings.filter((b) => !b.deletedAt), today: todayYmd() }), [debounced, bookings]);

  const prefill = (o: MatchOption): MatchPrefill => ({ hallId: o.hallIds[0], date: o.date, guests: input.guests, eventNature: eventType, clientType, layout: layout === "exhibition" ? "exhibition" : layout, food, decorationProvider: deco === "iccb" || deco === "none" ? deco : "outside" });

  const shareText = (o: MatchOption) =>
    [
      `ICCB — ${o.hallName}`,
      `${fmtDate(o.date, "EEEE, dd MMM yyyy")} · ${layout === "exhibition" ? `${sqft.toLocaleString("en-US")} sq ft` : `${guests} guests (${o.utilisation}% of capacity)`}`,
      `Estimated total ${taka(o.estimate.grandTotal)} incl. VAT & refundable security ${taka(o.estimate.security)}`,
      o.savingsText ? `✓ ${o.savingsText}` : "",
      "Provisional — subject to availability and final menu.",
      `${me.name}, ICCB · ${me.phone}`,
    ]
      .filter(Boolean)
      .join("\n");

  const quote = async (o: MatchOption) => {
    const id = toast.loading("Preparing quote…");
    try {
      const fake: Booking = {
        id: "quote",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        bfNo: "QUOTE",
        refNo: "",
        programRegNo: "",
        bookingDate: todayYmd(),
        priceVersion: todayYmd(),
        clientId: "",
        clientType,
        eventTitle: `${eventType}${client.name ? ` — ${client.name}` : ""}`,
        eventNature: eventType,
        contact: { name: client.name || "Prospective client", mobile: client.mobile || "—" },
        emergency: {},
        days: o.hallIds.map((h, i) => ({ id: `q${i}`, dayType: "program" as const, hallId: h, date: o.date, start: input.start!, end: input.end! })),
        guests: { optimum: guests, maximum: guests },
        cars: { optimum: 0, maximum: 0 },
        layout,
        food: { breakfast: false, lunch: false, snacks: false, dinner: food },
        menus: [],
        addons: [],
        decoration: input.decoration,
        discount: { mode: "amount", value: 0, approval: "none" },
        applyAit: false,
        status: "requested",
        checklist: {},
        documents: [],
        source: "phone",
        tags: [],
        activity: [],
      };
      const model = buildDocModel("estimate", { b: fake, est: o.estimate, payments: [], halls: db.halls.all(), users: db.users.all(), settings: getSettings(), number: `QUOTE-${format(new Date(), "yyMMddHHmm")}` });
      await downloadPdf({ ...model, watermark: "PROVISIONAL", title: "Provisional Quote" });
      toast.success("Quote downloaded", { id });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF failed", { id });
    }
  };

  return (
    <div className={cn("grid gap-5", compact ? "lg:grid-cols-[300px_minmax(0,1fr)]" : "xl:grid-cols-[340px_minmax(0,1fr)]")}>
      {/* Form */}
      <div className="crm-card h-fit space-y-3.5 p-5">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-crm-ink">
          <MagicWand size={18} className="text-crm-brand" /> Find the right hall
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Event type">
            <Select value={eventType} onChange={(v) => { setEventType(v); setClientType(TYPE_FOR[v] ?? "personal"); if (v === "Exhibition" || v === "Trade Fair") setLayout("exhibition"); }} options={EVENT_NATURES.map((x) => ({ value: x, label: x }))} />
          </Field>
          <Field label="Client type">
            <Select value={clientType} onChange={(v) => setClientType(v as ClientType)} options={CLIENT_TYPES.map((x) => ({ value: x, label: CLIENT_TYPE_LABELS[x] }))} />
          </Field>
        </div>
        <Field label="Layout">
          <Select value={layout} onChange={(v) => setLayout(v as MatchLayout)} options={MATCH_LAYOUTS} />
        </Field>
        {layout === "exhibition" ? (
          <Field label="Exhibition area"><NumberInput value={sqft} onChange={setSqft} min={0} step={1000} suffix="sq ft" /></Field>
        ) : (
          <Field label="Guests"><NumberInput value={guests} onChange={setGuests} min={0} step={50} /></Field>
        )}
        <Field label="When">
          <Segmented size="sm" value={mode} onChange={setMode} options={[{ value: "date", label: "Preferred date" }, { value: "month", label: "Flexible month" }]} className="mb-2" />
          {mode === "date" ? <Input type="date" value={date} min={todayYmd()} onChange={(e) => setDate(e.target.value)} /> : <Input type="month" value={month} min={todayYmd().slice(0, 7)} onChange={(e) => setMonth(e.target.value)} />}
        </Field>
        <Field label="Budget (optional)"><NumberInput value={budget || undefined} onChange={setBudget} money placeholder="No limit" /></Field>
        <div className="space-y-2">
          <Switch checked={food} onChange={setFood} label="ICCB Catering" />
          {food && <Select value={menuId} onChange={setMenuId} options={menus.map((x) => ({ value: x.id, label: `${x.name} · ${taka(x.perHead)}/head` }))} />}
        </div>
        <Field label="Decoration">
          <Select value={deco} onChange={(v) => setDeco(v as Deco)} options={[{ value: "iccb", label: "ICCB Events" }, { value: "A", label: "Outside firm — category A" }, { value: "B", label: "Outside firm — category B" }, { value: "C", label: "Outside firm — category C" }, { value: "none", label: "None" }]} />
        </Field>
        <div className="grid grid-cols-2 gap-3 border-t border-crm-line pt-3">
          <Field label="Client name"><Input value={client.name} onChange={(e) => setClient((c) => ({ ...c, name: e.target.value }))} placeholder="Optional" /></Field>
          <Field label="Mobile"><Input value={client.mobile} onChange={(e) => setClient((c) => ({ ...c, mobile: e.target.value }))} placeholder="For WhatsApp" /></Field>
        </div>
      </div>

      {/* Options */}
      <div className="min-w-0">
        {result.options.length === 0 ? (
          <div className="crm-card">
            <EmptyState icon={WarningCircle} title="No match yet" description={result.message ?? "Adjust guests, layout or date."} />
          </div>
        ) : (
          <div className={cn("grid gap-4", compact ? "md:grid-cols-2 2xl:grid-cols-3" : "md:grid-cols-2 2xl:grid-cols-3")}>
            <AnimatePresence initial={false}>
              {result.options.map((o, i) => (
                <OptionCard key={o.key} o={o} index={i} exhibition={layout === "exhibition"} onUse={() => onUse(prefill(o))} onQuote={() => void quote(o)} whatsapp={`https://wa.me/${client.mobile.replace(/\D/g, "").replace(/^0/, "880")}?text=${encodeURIComponent(shareText(o))}`} />
              ))}
            </AnimatePresence>
          </div>
        )}
        {result.firstChoice && result.options.length > 0 && (
          <p className="mt-3 text-[12px] text-crm-muted">
            Savings compare with the client&apos;s first choice: {result.firstChoice.hallName} on {fmtDate(result.firstChoice.date, "EEE dd MMM")} ({taka(result.firstChoice.estimate.grandTotal)}{result.firstChoice.availableOnRequested ? "" : ", not available"}).
          </p>
        )}
      </div>
    </div>
  );
}

function OptionCard({ o, index, exhibition, onUse, onQuote, whatsapp }: { o: MatchOption; index: number; exhibition: boolean; onUse: () => void; onQuote: () => void; whatsapp: string }) {
  const [open, setOpen] = useState(false);
  const photo = PHOTO[o.hallCodes[0]];
  const utilColor = o.utilisation > 95 ? "#F79009" : o.utilisation >= 70 ? "#12B76A" : "var(--crm-muted)";
  const rows: [string, number][] = [
    ["Hall rent", o.breakdown.rent],
    ["Service charge", o.breakdown.service],
    ["Food", o.breakdown.food],
    ["Food VAT", o.breakdown.vat],
    ["Decoration fee", o.breakdown.decoration],
    ["Security (refundable)", o.breakdown.security],
  ];
  return (
    <m.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }, delay: index * 0.05 }} className="crm-card crm-card-hover flex flex-col overflow-hidden">
      <div className="relative h-28 bg-crm-surface-2">
        {photo ? <Image src={photo} alt={o.hallName} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /> : <div className="grid h-full place-items-center bg-gradient-to-br from-[var(--bg-deep)] to-[var(--accent-deep)] text-white/80"><Sparkle size={30} /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        {o.label && <span className="absolute start-3 top-3"><Badge tone={LABEL_TONE[o.label]} className="shadow-sm">{o.label}</Badge></span>}
        <p className="absolute bottom-2 start-3 end-3 truncate font-display text-[18px] font-semibold uppercase text-white">{o.hallName}</p>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
          <span className="flex items-center gap-1.5 text-crm-ink">
            <CalendarCheck size={15} className="text-crm-brand" /> {fmtDate(o.date, "EEE, dd MMM yyyy")}
          </span>
          {o.availableOnRequested ? <Badge tone="green" dot>Available</Badge> : <Badge tone="amber" dot>Nearest free date</Badge>}
        </div>
        <div>
          <div className="mb-1 flex justify-between text-[12px] text-crm-muted">
            <span className="flex items-center gap-1"><Users size={13} /> {exhibition ? "Area" : "Capacity"} {o.capacity.toLocaleString("en-US")}</span>
            <span className="font-semibold tabular" style={{ color: utilColor }}>{o.utilisation}% used</span>
          </div>
          <ProgressBar value={o.utilisation} color={utilColor} />
        </div>
        <div>
          <p className="text-[11.5px] text-crm-muted">Estimated total</p>
          <p className="font-display text-[26px] font-semibold leading-tight text-crm-ink">
            <AnimatedMoney value={o.estimate.grandTotal} duration={0.5} />
          </p>
          {o.savingsText && <span className="mt-1 inline-block"><Badge tone={o.savings > 0 ? "green" : "neutral"}><CheckCircle size={12} weight="fill" /> {o.savingsText}</Badge></span>}
        </div>
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 text-[12.5px] font-medium text-crm-ink-2 hover:text-crm-brand">
          Price breakdown <CaretDown size={12} className={cn("transition-transform", open && "rotate-180")} />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <m.dl initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-1 overflow-hidden text-[12.5px]">
              {rows.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between"><dt className="text-crm-muted">{k}</dt><dd className="tabular text-crm-ink">{taka(v)}</dd></div>
              ))}
            </m.dl>
          )}
        </AnimatePresence>
        {o.warnings.length > 0 && (
          <ul className="space-y-0.5 text-[11.5px] text-[#B54708]">
            {o.warnings.map((w) => <li key={w}>⚠ {w}</li>)}
          </ul>
        )}
        <div className="mt-auto flex gap-2 border-t border-crm-line pt-3">
          <Button variant="primary" size="sm" className="flex-1" onClick={onUse}>Use this option</Button>
          <Button size="icon-sm" aria-label="Download provisional quote (PDF)" title="Download quote (PDF)" onClick={onQuote}><FilePdf size={16} /></Button>
          <a href={whatsapp} target="_blank" rel="noreferrer" aria-label="Share on WhatsApp" title="Share on WhatsApp"><Button size="icon-sm" tabIndex={-1}><WhatsappLogo size={16} /></Button></a>
        </div>
      </div>
    </m.div>
  );
}

/** Drawer version — opened from the command palette ("Find a hall"). */
export function MatchmakerDrawer() {
  const { open, set } = useMatchmakerDrawer();
  const router = useRouter();
  if (!open) return null;
  return (
    <Drawer open onOpenChange={set} title="Find a hall · 2-minute quote" description="Live options from capacity, availability and the pricing engine." width={1100}>
      <Matchmaker
        compact
        onUse={(p) => {
          set(false);
          const q = new URLSearchParams({ hall: p.hallId, date: p.date, guests: String(p.guests), nature: p.eventNature, type: p.clientType, layout: p.layout, food: p.food ? "1" : "0", deco: p.decorationProvider });
          router.push(`/dashboard/sales/bookings/new?${q.toString()}`);
        }}
      />
    </Drawer>
  );
}
