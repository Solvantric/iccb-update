/** Idle Date Recovery — pure. Empty hall-days and the rent they put at risk. */
import { addDays, format } from "date-fns";
import type { Booking, Hall } from "@/types/crm";
import { hallRent, isPeakSeason, isWeekend, parseYmd, type PricingRates } from "./pricing";

export interface IdleDay {
  hallId: string;
  date: string;
  rentAtRisk: number;
  isWeekend: boolean;
  season: "peak" | "off_peak";
}

export interface IdleResult {
  days: IdleDay[];
  dates: string[];
  totalDays: number;
  totalRent: number;
  byHall: Record<string, { days: number; rent: number }>;
}

/** A hall-day is used by any live Requested or Confirmed booking (preparation days count). */
export function usedHallDays(bookings: Booking[]): Set<string> {
  const used = new Set<string>();
  for (const b of bookings) {
    if (b.deletedAt || b.closed || b.status === "completed") continue;
    for (const d of b.days) used.add(`${d.hallId}|${d.date}`);
  }
  return used;
}

export function idleDays(range: { from: string; days?: number }, halls: Hall[], bookings: Booking[], rates: PricingRates): IdleResult {
  const n = range.days ?? 90;
  const start = parseYmd(range.from);
  const dates = Array.from({ length: n }, (_, i) => format(addDays(start, i), "yyyy-MM-dd"));
  const rentable = halls.filter((h) => !h.deletedAt && h.active && h.kind === "hall");
  const used = usedHallDays(bookings);
  const out: IdleDay[] = [];
  const byHall: IdleResult["byHall"] = {};
  for (const h of rentable) {
    byHall[h.id] = { days: 0, rent: 0 };
    for (const date of dates) {
      if (used.has(`${h.id}|${date}`)) continue;
      const d = parseYmd(date);
      const rent = hallRent(h, date, rates);
      if (rent <= 0) continue;
      out.push({ hallId: h.id, date, rentAtRisk: rent, isWeekend: isWeekend(d), season: isPeakSeason(d) ? "peak" : "off_peak" });
      byHall[h.id].days++;
      byHall[h.id].rent += rent;
    }
  }
  return { days: out, dates, totalDays: out.length, totalRent: out.reduce((s, d) => s + d.rentAtRisk, 0), byHall };
}

/** Fill a message template: {name} {hall} {dates} {discount} {code} {repPhone}. */
export function fillTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k] : m));
}

/** Compact date list: "12, 13, 19 Mar 2027". */
export function compactDates(dates: string[]) {
  const sorted = [...new Set(dates)].sort();
  if (!sorted.length) return "";
  const groups = new Map<string, string[]>();
  for (const d of sorted) {
    const key = format(parseYmd(d), "MMM yyyy");
    groups.set(key, [...(groups.get(key) ?? []), format(parseYmd(d), "d")]);
  }
  return [...groups.entries()].map(([k, ds]) => `${ds.join(", ")} ${k}`).join("; ");
}
