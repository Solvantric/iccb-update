/**
 * Smart Hall Matchmaker — pure. "Which hall suits me and how much?" in one call:
 * capacity filter → availability (±14 days / flexible month) → price → score → up to 3 options.
 */
import { addDays, format, getDaysInMonth } from "date-fns";
import type { Booking, BookingDay, ClientType, Hall } from "@/types/crm";
import { buildEstimate, isPeakSeason, isWeekend, parseYmd, type Estimate, type PricingRates } from "./pricing";
import { usedHallDays } from "./idle";

export type MatchLayout = "full_banquet" | "banquet_stage" | "banquet_waiting" | "theatre" | "exhibition";
export const MATCH_LAYOUTS: { value: MatchLayout; label: string }[] = [
  { value: "full_banquet", label: "Full banquet" },
  { value: "banquet_stage", label: "Banquet + stage" },
  { value: "banquet_waiting", label: "Banquet + waiting + stage" },
  { value: "theatre", label: "Theatre" },
  { value: "exhibition", label: "Exhibition (sq ft)" },
];

/** Hall-5 isn't in the capacity sheet; working figures — confirm with Operations. */
export const HALL5_CAPACITY: Record<Exclude<MatchLayout, "exhibition">, number> = { full_banquet: 350, banquet_stage: 260, banquet_waiting: 220, theatre: 450 };
/** Adjacent halls that can be combined for very large events. */
export const HALL_COMBOS: string[][] = [["hall-1", "hall-2"], ["hall-2", "hall-3"], ["hall-1", "hall-2", "hall-3"]];
/** Rough guests-per-sq-ft for using an Expo Zone as a big hall (theatre ≈ 8 sq ft / person). */
const SQFT_PER_GUEST = 8;

export interface MatchInput {
  eventType: string;
  clientType: ClientType;
  guests: number;
  layout: MatchLayout;
  sqft?: number;
  /** A preferred date… */
  date?: string;
  /** …or a flexible month (yyyy-MM). */
  month?: string;
  budget?: number;
  food: boolean;
  menuPerHead?: number;
  menuName?: string;
  decoration: { provider: "iccb" | "outside" | "none"; category?: "A" | "B" | "C" };
  start?: string;
  end?: string;
}

export type MatchLabel = "Best fit" | "Best value" | "Alternative date";

export interface MatchOption {
  key: string;
  label?: MatchLabel;
  hallIds: string[];
  hallCodes: string[];
  hallName: string;
  date: string;
  capacity: number;
  utilisation: number; // %
  availableOnRequested: boolean;
  estimate: Estimate;
  breakdown: { rent: number; service: number; food: number; vat: number; decoration: number; security: number; other: number; total: number };
  savings: number;
  savingsText?: string;
  warnings: string[];
  score: number;
  peak: boolean;
  weekend: boolean;
}

export interface MatchResult {
  options: MatchOption[];
  firstChoice?: MatchOption;
  message?: string;
}

interface Candidate {
  halls: Hall[];
  capacity: number;
  combined: boolean;
  approx: boolean;
}

function capacityOf(h: Hall, layout: MatchLayout, rates: PricingRates): number {
  if (layout === "exhibition") {
    if (h.kind !== "expo") return 0;
    const z = rates.expo.find((x) => `expo-${x.zone.toLowerCase()}` === h.code);
    return z?.maxSqft ?? 0;
  }
  if (h.code === "hall-5") return HALL5_CAPACITY[layout];
  const row = rates.capacities.find((c) => c.layout === layout && !c.isCount);
  const cap = row?.byHall[h.code as "hall-1"];
  return cap ? cap.main + cap.extra : 0;
}

/** Halls (or combinations / Expo Zones) that can hold the event. */
export function candidates(input: MatchInput, rates: PricingRates): Candidate[] {
  const halls = rates.halls.filter((h) => h.active && !h.deletedAt);
  const need = input.layout === "exhibition" ? input.sqft ?? 0 : input.guests;
  const singles: Candidate[] = halls
    .filter((h) => (input.layout === "exhibition" ? h.kind === "expo" : h.kind === "hall"))
    .map((h) => ({ halls: [h], capacity: capacityOf(h, input.layout, rates), combined: false, approx: h.code === "hall-5" }))
    .filter((c) => c.capacity >= need && (input.layout !== "exhibition" || need >= (rates.expo.find((z) => `expo-${z.zone.toLowerCase()}` === c.halls[0].code)?.minSqft ?? 0)));
  if (singles.length || input.layout === "exhibition") return singles;

  // Too big for any single hall → combine adjacent halls, or use an Expo Zone.
  const byCode = (c: string) => halls.find((h) => h.code === c);
  const combos: Candidate[] = HALL_COMBOS.map((codes) => codes.map(byCode).filter((h): h is Hall => !!h))
    .filter((hs) => hs.length > 1)
    .map((hs) => ({ halls: hs, capacity: hs.reduce((s, h) => s + capacityOf(h, input.layout, rates), 0), combined: true, approx: false }))
    .filter((c) => c.capacity >= need);
  const expo: Candidate[] = halls
    .filter((h) => h.kind === "expo")
    .map((h) => ({ halls: [h], capacity: Math.floor((rates.expo.find((z) => `expo-${z.zone.toLowerCase()}` === h.code)?.maxSqft ?? 0) / SQFT_PER_GUEST), combined: false, approx: true }))
    .filter((c) => c.capacity >= need);
  return [...combos, ...expo];
}

const isFree = (used: Set<string>, halls: Hall[], date: string) => halls.every((h) => !used.has(`${h.id}|${date}`));

function price(input: MatchInput, halls: Hall[], date: string, rates: PricingRates): Estimate {
  const days: BookingDay[] = halls.map((h, i) => ({
    id: `m${i}`,
    dayType: "program",
    hallId: h.id,
    date,
    start: input.start ?? "12:00",
    end: input.end ?? "23:00",
    sqft: h.kind === "expo" ? (input.layout === "exhibition" ? input.sqft : Math.ceil((input.guests * SQFT_PER_GUEST) / 1000) * 1000) : undefined,
  }));
  const perHead = input.food ? input.menuPerHead ?? 0 : 0;
  return buildEstimate(
    {
      days,
      guests: { optimum: input.guests, maximum: input.guests },
      food: { breakfast: false, lunch: false, snacks: false, dinner: input.food },
      menus: perHead > 0 ? [{ id: "menu", name: input.menuName ?? "Menu", guests: input.guests, perHead }] : [],
      addons: [],
      decoration: input.decoration.provider === "outside" ? { provider: "outside", category: input.decoration.category ?? "C" } : { provider: input.decoration.provider },
      discount: { mode: "amount", value: 0, approval: "none" },
      clientType: input.clientType,
      applyAit: false,
    },
    rates
  );
}

function breakdown(e: Estimate): MatchOption["breakdown"] {
  const g = (grp: string) => e.lines.filter((l) => l.group === grp).reduce((s, l) => s + l.amount, 0);
  const rent = g("venue");
  const service = g("service");
  const decoration = g("decoration");
  return { rent, service, food: e.food, vat: e.vat, decoration, security: e.security, other: e.subtotal - rent - service - e.food - decoration, total: e.grandTotal };
}

function datesAround(center: string, span: number) {
  const c = parseYmd(center);
  const out: string[] = [];
  for (let i = 1; i <= span; i++) out.push(format(addDays(c, i), "yyyy-MM-dd"), format(addDays(c, -i), "yyyy-MM-dd"));
  return out; // nearest first
}

function monthDates(month: string, today: string) {
  const first = parseYmd(`${month}-01`);
  return Array.from({ length: getDaysInMonth(first) }, (_, i) => format(addDays(first, i), "yyyy-MM-dd")).filter((d) => d >= today);
}

const DAY = (d: string) => format(parseYmd(d), "EEEE");

export function matchHalls(input: MatchInput, ctx: { rates: PricingRates; bookings: Booking[]; today: string }): MatchResult {
  const { rates, today } = ctx;
  const need = input.layout === "exhibition" ? input.sqft ?? 0 : input.guests;
  if (!need || need <= 0) return { options: [], message: input.layout === "exhibition" ? "Enter the exhibition area in sq ft." : "Enter the number of guests." };
  const cands = candidates(input, rates);
  if (!cands.length) return { options: [], message: "No hall, combination or Expo Zone fits this size. Talk to Operations about a custom set-up." };

  const used = usedHallDays(ctx.bookings);
  const requested = input.date ?? (input.month ? monthDates(input.month, today)[0] : undefined) ?? today;
  const flexible = !input.date && !!input.month;
  const pool = flexible ? monthDates(input.month!, today) : [];

  const build = (c: Candidate, date: string, onRequested: boolean): MatchOption => {
    const est = price(input, c.halls, date, rates);
    const d = parseYmd(date);
    const util = Math.round((need / c.capacity) * 100);
    const warnings: string[] = [];
    if (util > 95) warnings.push(`Near capacity (${util}%)`);
    if (c.combined) warnings.push("Combined halls — confirm the partition plan with Operations");
    if (c.approx) warnings.push(c.halls[0].kind === "expo" ? "Expo Zone used as a hall — capacity is an estimate" : "Hall-5 capacity is a working figure");
    if (isPeakSeason(d)) warnings.push(`Peak season (${isWeekend(d) ? "Dec–Jan weekend" : "Dec–Jan weekday"})`);
    if (input.budget && est.grandTotal > input.budget) warnings.push(`Over budget by ৳ ${(est.grandTotal - input.budget).toLocaleString("en-US")}`);
    if (!onRequested && input.date) warnings.push(`Requested date ${input.date} is not available`);
    return {
      key: `${c.halls.map((h) => h.code).join("+")}@${date}`,
      hallIds: c.halls.map((h) => h.id),
      hallCodes: c.halls.map((h) => h.code),
      hallName: c.halls.map((h) => h.name).join(" + "),
      date,
      capacity: c.capacity,
      utilisation: util,
      availableOnRequested: onRequested,
      estimate: est,
      breakdown: breakdown(est),
      savings: 0,
      warnings,
      score: 0,
      peak: isPeakSeason(d),
      weekend: isWeekend(d),
    };
  };

  const fitScore = (u: number) => (u >= 70 && u <= 95 ? 40 : u < 70 ? 40 * (u / 70) : u <= 100 ? 30 : 0);

  // First choice = best capacity fit, on the requested date (even if taken).
  const byFit = [...cands].sort((a, b) => fitScore((need / b.capacity) * 100) - (b.combined ? 10 : 0) - (fitScore((need / a.capacity) * 100) - (a.combined ? 10 : 0)));
  const firstChoice = build(byFit[0], requested, isFree(used, byFit[0].halls, requested));

  const primary: MatchOption[] = [];
  const alternates: MatchOption[] = [];
  for (const c of cands) {
    // Primary date: the requested date if free, else the nearest free date within ±14 days.
    let date: string | undefined;
    let onReq = false;
    if (flexible) {
      const free = pool.filter((d) => isFree(used, c.halls, d));
      const priced = free.map((d) => ({ d, t: price(input, c.halls, d, rates).grandTotal })).sort((a, b) => a.t - b.t || a.d.localeCompare(b.d));
      date = priced[0]?.d;
      onReq = !!date;
      if (priced[1]) alternates.push(build(c, priced.find((p) => p.d !== date && p.t >= priced[0].t)?.d ?? priced[1].d, false));
    } else {
      if (isFree(used, c.halls, requested)) {
        date = requested;
        onReq = true;
      } else date = datesAround(requested, 14).find((d) => d >= today && isFree(used, c.halls, d));
      // Cheapest free date within ±14 days (alternative).
      const around = [requested, ...datesAround(requested, 14)].filter((d) => d >= today && d !== date && isFree(used, c.halls, d));
      const cheapest = around.map((d) => ({ d, t: price(input, c.halls, d, rates).grandTotal })).sort((a, b) => a.t - b.t || Math.abs(parseYmd(a.d).getTime() - parseYmd(requested).getTime()) - Math.abs(parseYmd(b.d).getTime() - parseYmd(requested).getTime()))[0];
      if (cheapest) alternates.push(build(c, cheapest.d, false));
    }
    if (date) primary.push(build(c, date, onReq));
  }
  if (!primary.length && !alternates.length) return { options: [], firstChoice, message: "Every suitable hall is booked around this date. Try a flexible month." };

  const finish = (o: MatchOption, c?: Candidate): MatchOption => {
    o.savings = firstChoice.estimate.grandTotal - o.estimate.grandTotal;
    const parts: string[] = [];
    if (o.savings > 0) {
      const amount = `৳ ${o.savings.toLocaleString("en-US")}`;
      if (o.date !== firstChoice.date && DAY(o.date) !== DAY(firstChoice.date)) parts.push(`${DAY(o.date)} instead of ${DAY(firstChoice.date)} saves ${amount}${o.hallName !== firstChoice.hallName ? ` (${o.hallName})` : ""}`);
      else if (o.hallName !== firstChoice.hallName) parts.push(`${o.hallName} instead of ${firstChoice.hallName} saves ${amount}`);
      else parts.push(`Saves ${amount}`);
    }
    if (!o.peak) parts.push("Feb–Nov rate");
    o.savingsText = parts.join(" · ") || undefined;
    const u = o.utilisation;
    const budgetScore = input.budget ? (o.estimate.grandTotal <= input.budget ? 25 : 25 * Math.max(0, 1 - (o.estimate.grandTotal - input.budget) / input.budget)) : 15;
    const availScore = o.availableOnRequested ? 20 : 10;
    const saveScore = o.savings > 0 ? 15 * Math.min(1, o.savings / 100000) : 0;
    o.score = Math.round(fitScore(u) + budgetScore + availScore + saveScore - (c?.combined || o.hallIds.length > 1 ? 10 : 0));
    return o;
  };

  const all = [...primary, ...alternates].map((o) => finish(o));
  const uniq = new Map<string, MatchOption>();
  for (const o of all) if (!uniq.has(o.key) || uniq.get(o.key)!.score < o.score) uniq.set(o.key, o);
  const list = [...uniq.values()];
  const primaryKeys = new Set(primary.map((p) => p.key));

  const chosen: MatchOption[] = [];
  const take = (o: MatchOption | undefined, label: MatchLabel) => {
    if (!o || chosen.some((c) => c.key === o.key)) return;
    chosen.push({ ...o, label });
  };
  take([...list].filter((o) => primaryKeys.has(o.key)).sort((a, b) => b.score - a.score)[0] ?? [...list].sort((a, b) => b.score - a.score)[0], "Best fit");
  take([...list].filter((o) => !chosen.some((c) => c.key === o.key)).sort((a, b) => a.estimate.grandTotal - b.estimate.grandTotal || b.score - a.score)[0], "Best value");
  take(
    [...list]
      .filter((o) => !chosen.some((c) => c.key === o.key) && o.date !== chosen[0]?.date)
      .sort((a, b) => b.savings - a.savings || b.score - a.score)[0],
    "Alternative date"
  );
  return { options: chosen, firstChoice };
}
