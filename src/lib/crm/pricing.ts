/**
 * ICCB pricing engine — pure functions, no store access.
 * Rates are passed in (see `ratesFromSeed()` / `getRates()` in db.ts) so
 * admins can edit every tariff and old bookings keep their price version.
 */
import type {
  AddonLine,
  BaseRecord,
  Booking,
  CancellationRule,
  CapacityRow,
  ClientType,
  DecorationCategory,
  ExpoZoneTariff,
  Hall,
  HallTariff,
  Payment,
  SecurityRule,
  ServiceCharge,
  TaxRule,
  Versioned,
} from "@/types/crm";
import { hallsSeed } from "@/data/crm/halls";
import { tariffsSeed, taxesSeed } from "@/data/crm/tariffs";
import { securitySeed } from "@/data/crm/security-money";
import { serviceChargesSeed } from "@/data/crm/service-charges";
import { decorationSeed } from "@/data/crm/decoration-categories";
import { expoZonesSeed } from "@/data/crm/expo-zones";
import { cancellationSeed } from "@/data/crm/cancellation-rules";
import { capacitiesSeed } from "@/data/crm/capacities";

export interface PricingRates {
  halls: Hall[];
  tariffs: HallTariff[];
  security: SecurityRule[];
  charges: ServiceCharge[];
  decoration: DecorationCategory[];
  expo: ExpoZoneTariff[];
  cancellation: CancellationRule[];
  taxes: TaxRule[];
  capacities: CapacityRow[];
}

export const BUSINESS_HOURS = 12;
export const EXTRA_GUEST_THRESHOLD = 0.1;

/* ─── Helpers ────────────────────────────────────────────────────────────── */

export function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Keep only the newest version of each `key` that is effective on `asOf`. */
export function resolveVersions<T extends Versioned & BaseRecord>(rows: T[], asOf?: string): T[] {
  const byKey = new Map<string, T>();
  for (const r of rows) {
    if (r.deletedAt) continue;
    if (asOf && r.effectiveFrom > asOf) continue;
    const cur = byKey.get(r.key);
    if (!cur || r.effectiveFrom > cur.effectiveFrom || (r.effectiveFrom === cur.effectiveFrom && r.updatedAt > cur.updatedAt)) byKey.set(r.key, r);
  }
  return [...byKey.values()];
}

/** Resolve every versioned table for a pricing date. */
export function ratesAsOf(all: PricingRates, asOf?: string): PricingRates {
  return {
    ...all,
    halls: all.halls.filter((h) => !h.deletedAt),
    tariffs: resolveVersions(all.tariffs, asOf),
    security: resolveVersions(all.security, asOf),
    charges: resolveVersions(all.charges, asOf),
    decoration: resolveVersions(all.decoration, asOf),
    expo: resolveVersions(all.expo, asOf),
    cancellation: resolveVersions(all.cancellation, asOf),
    taxes: resolveVersions(all.taxes, asOf),
    capacities: all.capacities.filter((c) => !c.deletedAt),
  };
}

export function ratesFromSeed(): PricingRates {
  return {
    halls: hallsSeed,
    tariffs: tariffsSeed,
    security: securitySeed,
    charges: serviceChargesSeed,
    decoration: decorationSeed,
    expo: expoZonesSeed,
    cancellation: cancellationSeed,
    taxes: taxesSeed,
    capacities: capacitiesSeed,
  };
}

export const isWeekend = (d: Date) => [4, 5, 6].includes(d.getDay()); // Thu, Fri, Sat
export const isPeakSeason = (d: Date) => d.getMonth() === 11 || d.getMonth() === 0; // Dec, Jan

export function findHall(rates: PricingRates, hallIdOrCode: string) {
  return rates.halls.find((h) => h.id === hallIdOrCode || h.code === hallIdOrCode);
}

export function charge(rates: PricingRates, key: string) {
  return rates.charges.find((c) => c.key === key);
}

export function taxPct(rates: PricingRates, key: "food_vat" | "ait") {
  return rates.taxes.find((t) => t.key === key)?.pct ?? 0;
}

/** Rate for a catalogue item, picking the Hall-5 rate where one exists. */
export function catalogRate(item: ServiceCharge, hallCode?: string) {
  return hallCode === "hall-5" && item.rateHall5 != null ? item.rateHall5 : item.rate;
}

function hoursBetween(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  return mins / 60;
}

/* ─── Core rules ─────────────────────────────────────────────────────────── */

/** Base tariff for a hall group, or a special month rule when one exists. */
export function tariffFor(rates: PricingRates, group: Hall["tariffGroup"], date?: string) {
  const month = date?.slice(0, 7);
  return (month && rates.tariffs.find((t) => t.group === group && t.month === month)) || rates.tariffs.find((t) => t.group === group && !t.month);
}

export function hallRent(hall: Hall, date: string, rates: PricingRates): number {
  const tariff = tariffFor(rates, hall.tariffGroup, date);
  if (!tariff) return 0;
  const d = parseYmd(date);
  if (!isPeakSeason(d)) return tariff.offPeak;
  return isWeekend(d) ? tariff.peakWeekend : tariff.peakWeekday;
}

export function rentLabel(date: string) {
  const d = parseYmd(date);
  if (!isPeakSeason(d)) return "Feb–Nov rate";
  return isWeekend(d) ? "Dec–Jan weekend" : "Dec–Jan weekday";
}

export function securityMoney(clientType: ClientType, hallCodes: string[], rates: PricingRates): number {
  const codes = hallCodes.length ? hallCodes : [];
  const expoZones = codes.filter((c) => c.startsWith("expo-"));
  if (expoZones.length) {
    const zones = rates.expo.filter((z) => expoZones.includes(`expo-${z.zone.toLowerCase()}`));
    return Math.max(0, ...zones.map((z) => (clientType === "personal" ? z.securityPersonal : z.securityOthers)));
  }
  if (codes.length && codes.every((c) => c === "hall-5")) {
    return rates.security.find((s) => s.key === "hall5")?.amount ?? 0;
  }
  return rates.security.find((s) => s.key === clientType)?.amount ?? rates.security.find((s) => s.key === "others")?.amount ?? 0;
}

export interface CapacityResult {
  status: "ok" | "near" | "over" | "unknown";
  max?: number;
  layoutLabel?: string;
  message: string;
}

export function capacityCheck(hallCode: string, layout: string, guests: number, rates: PricingRates): CapacityResult {
  const row = rates.capacities.find((c) => c.layout === layout && !c.isCount);
  const cap = row?.byHall[hallCode as keyof CapacityRow["byHall"]];
  if (!row || !cap) return { status: "unknown", message: "No capacity data for this hall/layout — confirm with Operations." };
  const max = cap.main + cap.extra;
  const detail = `${cap.main}${cap.extra ? ` + ${cap.extra}` : ""}${cap.waiting ? ` (+ waiting ${cap.waiting})` : ""}`;
  if (guests > max) return { status: "over", max, layoutLabel: row.label, message: `${guests} guests exceeds ${row.label} capacity of ${max} (${detail}).` };
  if (guests > max * 0.9) return { status: "near", max, layoutLabel: row.label, message: `Close to the ${row.label} capacity of ${max} (${detail}).` };
  return { status: "ok", max, layoutLabel: row.label, message: `Fits ${row.label} (max ${max}: ${detail}).` };
}

/* ─── Estimate ───────────────────────────────────────────────────────────── */

export type EstimateGroup = "venue" | "service" | "food" | "decoration" | "addon" | "extra" | "damage";

export interface EstimateLine {
  id: string;
  group: EstimateGroup;
  date?: string;
  hall?: string;
  time?: string;
  particular: string;
  unit: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface Estimate {
  lines: EstimateLine[];
  venueRent: number;
  food: number;
  subtotal: number;
  vat: number;
  vatPct: number;
  ait: number;
  aitPct: number;
  total: number;
  security: number;
  discount: number;
  discountPending: boolean;
  grandTotal: number;
  received: number;
  balance: number;
  advanceRequired: number;
  advancePaid: number;
}

export type EstimateInput = Pick<
  Booking,
  "days" | "guests" | "food" | "menus" | "addons" | "decoration" | "discount" | "clientType" | "applyAit"
>;

const line = (l: Omit<EstimateLine, "amount">): EstimateLine => ({ ...l, amount: Math.round(l.qty * l.rate) });

export function buildEstimate(
  b: EstimateInput,
  rates: PricingRates,
  opts: { payments?: Pick<Payment, "amount" | "purpose">[]; advancePct?: number } = {}
): Estimate {
  const lines: EstimateLine[] = [];
  const programDays = b.days.filter((d) => d.dayType === "program");
  const hallCodes: string[] = [];

  for (const day of b.days) {
    const hall = findHall(rates, day.hallId);
    if (!hall) continue;
    hallCodes.push(hall.code);
    const time = `${day.start}–${day.end}`;
    const dayLabel = day.dayType === "program" ? "Program day" : "Preparation day";
    const hours = hoursBetween(day.start, day.end);
    const extraHours = Math.max(0, Math.ceil(hours - BUSINESS_HOURS));

    if (hall.kind === "expo") {
      const zone = rates.expo.find((z) => `expo-${z.zone.toLowerCase()}` === hall.code);
      const sqft = day.sqft ?? zone?.minSqft ?? 0;
      if (zone) {
        lines.push(line({ id: `rent-${day.id}`, group: "venue", date: day.date, hall: hall.name, time, particular: `${hall.name} space rent (${dayLabel})`, unit: "sq ft/day", qty: sqft, rate: zone.ratePerSqftDay }));
        lines.push(line({ id: `wash-${day.id}`, group: "venue", date: day.date, hall: hall.name, time, particular: "Washroom & cleaning", unit: "day", qty: 1, rate: b.clientType === "cultural" ? zone.washroomCultural : zone.washroomOther }));
        const freeParking = (sqft * zone.freeParkingPct) / 100;
        const paidParking = Math.max(0, (day.parkingSqft ?? 0) - freeParking);
        if (paidParking > 0) lines.push(line({ id: `park-${day.id}`, group: "venue", date: day.date, hall: hall.name, time, particular: "Parking above free 25%", unit: "sq ft/day", qty: paidParking, rate: zone.parkingRate }));
        if (extraHours) lines.push(line({ id: `xh-${day.id}`, group: "venue", date: day.date, hall: hall.name, time, particular: "Extra business hours", unit: "hour", qty: extraHours, rate: zone.extraHour }));
      }
      continue;
    }

    const rent = hallRent(hall, day.date, rates);
    const tariff = tariffFor(rates, hall.tariffGroup, day.date);
    lines.push(line({ id: `rent-${day.id}`, group: "venue", date: day.date, hall: hall.name, time, particular: `${hall.number} rent — ${hall.name} (${dayLabel}, ${rentLabel(day.date)})${tariff?.note ? ` · ${tariff.note}` : ""}`, unit: "day", qty: 1, rate: rent }));
    if (extraHours && tariff?.extraHour) {
      lines.push(line({ id: `xh-${day.id}`, group: "venue", date: day.date, hall: hall.name, time, particular: "Extra business hours (beyond 12 h)", unit: "hour", qty: extraHours, rate: tariff.extraHour }));
    }
  }

  // Service charges — per program day, per meal served.
  const main = charge(rates, "svc-main-meal");
  const light = charge(rates, "svc-light-meal");
  const guests = b.guests.optimum;
  for (const day of programDays) {
    const meals: [boolean, string, ServiceCharge | undefined][] = [
      [b.food.breakfast, "breakfast", light],
      [b.food.lunch, "lunch", main],
      [b.food.snacks, "snacks", light],
      [b.food.dinner, "dinner", main],
    ];
    for (const [on, meal, rate] of meals) {
      if (on && rate && guests > 0) {
        lines.push(line({ id: `svc-${day.id}-${meal}`, group: "service", date: day.date, particular: `Service charge (${meal})`, unit: "person", qty: guests, rate: rate.rate }));
      }
    }
  }

  // Outside decoration fee (ICCB Events decoration is priced as an add-on).
  const primaryHall = findHall(rates, programDays[0]?.hallId ?? b.days[0]?.hallId ?? "");
  if (b.decoration.provider === "outside" && b.decoration.category) {
    const cat = rates.decoration.find((c) => c.code === b.decoration.category);
    if (cat) {
      const rate = primaryHall?.code === "hall-5" ? cat.rateHall5 : cat.rateHall14;
      lines.push(line({ id: "deco-outside", group: "decoration", particular: `Outside decoration fee — Category ${cat.code}${b.decoration.firm ? ` (${b.decoration.firm})` : ""}`, unit: "event", qty: 1, rate }));
    }
  }

  // ICCB Catering.
  for (const m of b.menus) {
    lines.push(line({ id: `food-${m.id}`, group: "food", particular: `ICCB Catering — ${m.name}`, unit: "person", qty: m.guests, rate: m.perHead }));
  }

  // Add-ons, extras, damages.
  for (const a of b.addons) {
    const group: EstimateGroup = a.kind === "extra" ? "extra" : a.kind === "damage" ? "damage" : "addon";
    lines.push(line({ id: `addon-${a.id}`, group, particular: a.name, unit: a.unit, qty: a.qty, rate: a.rate }));
  }

  const sum = (g?: EstimateGroup[]) => lines.filter((l) => !g || g.includes(l.group)).reduce((s, l) => s + l.amount, 0);
  const venueRent = lines.filter((l) => l.group === "venue" && l.id.startsWith("rent-")).reduce((s, l) => s + l.amount, 0);
  const food = sum(["food"]);
  const subtotal = sum();
  const vatPct = taxPct(rates, "food_vat");
  const aitPct = taxPct(rates, "ait");
  const vat = Math.round((food * vatPct) / 100);
  const ait = b.applyAit ? Math.round(((subtotal - food) * aitPct) / 100) : 0;
  const total = subtotal + vat + ait;
  const security = securityMoney(b.clientType, programDays.length ? programDays.map((d) => findHall(rates, d.hallId)?.code ?? "") : hallCodes, rates);

  const rawDiscount = b.discount.mode === "percent" ? Math.round((subtotal * b.discount.value) / 100) : b.discount.value;
  const discountPending = rawDiscount > 0 && (b.discount.approval === "pending" || b.discount.approval === "rejected");
  const discount = discountPending ? 0 : rawDiscount;

  const grandTotal = total + security - discount;
  const payments = opts.payments ?? [];
  const received = payments.reduce((s, p) => s + p.amount, 0);
  const advancePct = opts.advancePct ?? 60;
  const advanceRequired = Math.round((venueRent * advancePct) / 100);
  const advancePaid = payments.filter((p) => p.purpose === "advance" || p.purpose === "balance").reduce((s, p) => s + p.amount, 0);

  return {
    lines,
    venueRent,
    food,
    subtotal,
    vat,
    vatPct,
    ait,
    aitPct,
    total,
    security,
    discount,
    discountPending,
    grandTotal,
    received,
    balance: grandTotal - received,
    advanceRequired,
    advancePaid,
  };
}

/* ─── Cancellation / shift ───────────────────────────────────────────────── */

export function daysBetween(fromYmd: string, toYmd: string) {
  return Math.round((parseYmd(toYmd).getTime() - parseYmd(fromYmd).getTime()) / 86400000);
}

export function firstEventDate(b: Pick<Booking, "days">) {
  const prog = b.days.filter((d) => d.dayType === "program").map((d) => d.date).sort();
  return prog[0] ?? b.days.map((d) => d.date).sort()[0];
}

export function lastEventDate(b: Pick<Booking, "days">) {
  const all = b.days.map((d) => d.date).sort();
  return all[all.length - 1];
}

export function cancellationCharge(
  b: EstimateInput,
  actionDate: string,
  type: "shift" | "cancel",
  rates: PricingRates
): { daysBefore: number; pct: number; charge: number; venueRent: number } {
  const eventDate = firstEventDate(b);
  const daysBefore = eventDate ? daysBetween(actionDate, eventDate) : 0;
  const rule =
    rates.cancellation.find((r) => daysBefore >= r.minDays && (r.maxDays == null || daysBefore <= r.maxDays)) ??
    [...rates.cancellation].sort((a, c) => a.minDays - c.minDays)[0];
  const pct = rule ? (type === "shift" ? rule.shiftPct : rule.cancelPct) : 0;
  const { venueRent } = buildEstimate({ ...b, menus: [], addons: [] as AddonLine[] }, rates);
  return { daysBefore, pct, charge: Math.round((venueRent * pct) / 100), venueRent };
}

/** Extra guests above +10% of booked count are charged per head. */
export function extraGuestCharge(booked: number, actual: number, rates: PricingRates) {
  if (actual <= booked * (1 + EXTRA_GUEST_THRESHOLD)) return { extra: 0, amount: 0, rate: 0 };
  const rate = charge(rates, "extra-guest")?.rate ?? 130;
  const extra = actual - booked;
  return { extra, rate, amount: extra * rate };
}
