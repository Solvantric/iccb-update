import type { AddOnRates, Booking, Decoration, EventType, Hall, Meal, MenuPackage, ServiceItem, SpecialPrice } from "@/types/crm";
import { MEAL_LABELS, MEALS } from "@/types/crm";

export interface BillRates {
  halls: Hall[];
  addOns: AddOnRates;
  weekendDays: number[];
  specials?: SpecialPrice[];
  menus?: MenuPackage[];
  services?: ServiceItem[];
  foodVatPercent?: number;
  securityByType?: Partial<Record<EventType, number>>;
}

export type BillGroup = "Venue" | "Decoration" | "Food" | "Services" | "Other";
export const BILL_GROUPS: BillGroup[] = ["Venue", "Decoration", "Food", "Services", "Other"];

export interface BillLine {
  key: string;
  group: BillGroup;
  label: string;
  detail?: string;
  qty?: number;
  rate?: number;
  amount: number;
}

export interface Bill {
  hallRent: number;
  isWeekend: boolean;
  special?: SpecialPrice;
  lines: BillLine[];
  /** Everything except hall rent (kept for summaries). */
  addOns: BillLine[];
  groupTotals: Record<BillGroup, number>;
  subtotal: number;
  discount: number;
  /** Food + food service charge, the VAT base. */
  foodBase: number;
  vat: number;
  total: number;
  paid: number;
  due: number;
  /** Refundable security money (not part of the total). */
  security: number;
}

/** Day of week (0 = Sun) for a yyyy-MM-dd date, independent of the local timezone. */
export function dayOfWeek(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)).getUTCDay();
}

export function specialFor(date: string, specials: SpecialPrice[] = []): SpecialPrice | undefined {
  return specials.find((s) => date >= s.from && date <= s.to);
}

/** Hall rent for a date: weekday/weekend rate, adjusted by any special price range. */
export function hallRentFor(hall: Hall | undefined, date: string, weekendDays: number[], specials: SpecialPrice[] = []) {
  if (!hall) return { amount: 0, isWeekend: false, special: undefined };
  const isWeekend = weekendDays.includes(dayOfWeek(date));
  const base = isWeekend ? hall.weekendRate : hall.weekdayRate;
  const special = specialFor(date, specials);
  const amount = special ? Math.round(base * (1 + special.percent / 100)) : base;
  return { amount, isWeekend, special };
}

export function decorationPrice(d: Decoration, r: AddOnRates): number {
  return { none: 0, basic: r.decorationBasic, standard: r.decorationStandard, premium: r.decorationPremium, outsideA: r.outsideA, outsideB: r.outsideB, outsideC: r.outsideC }[d] ?? 0;
}

export function mealRate(meal: Meal, menuId: string | undefined, rates: BillRates) {
  const menu = menuId ? rates.menus?.find((m) => m.id === menuId) : undefined;
  return { rate: menu?.perHead ?? rates.addOns[meal], menu };
}

const DECO_DETAIL: Record<Decoration, string> = { none: "", basic: "ICCB Basic", standard: "ICCB Standard", premium: "ICCB Premium", outsideA: "Outside firm fee · Cat. A", outsideB: "Outside firm fee · Cat. B", outsideC: "Outside firm fee · Cat. C" };

/** The booking bill — a pure function so it is easy to test. */
export function calcBill(booking: Pick<Booking, "hallId" | "date" | "addOns" | "discount"> & Partial<Pick<Booking, "eventType">>, rates: BillRates, paid = 0): Bill {
  const hall = rates.halls.find((h) => h.id === booking.hallId);
  const rent = hallRentFor(hall, booking.date, rates.weekendDays, rates.specials);
  const a = booking.addOns;
  const lines: BillLine[] = [];

  lines.push({
    key: "hall",
    group: "Venue",
    label: "Hall rent",
    detail: [hall?.name, rent.isWeekend ? "weekend" : "weekday", rent.special && `${rent.special.percent > 0 ? "+" : ""}${rent.special.percent}% ${rent.special.label.toLowerCase()}`].filter(Boolean).join(" · "),
    amount: rent.amount,
  });
  if (a.extraHours && a.extraHours > 0 && hall) lines.push({ key: "extra-hours", group: "Venue", label: "Extra hours", qty: a.extraHours, rate: hall.extraHourRate, amount: a.extraHours * hall.extraHourRate });

  const deco = decorationPrice(a.decoration, rates.addOns);
  if (deco > 0) lines.push({ key: "decoration", group: "Decoration", label: "Decoration", detail: [DECO_DETAIL[a.decoration], a.decorationFirm].filter(Boolean).join(" · "), amount: deco });

  let serviceCharge = 0;
  let servicePersons = { main: 0, light: 0 };
  for (const meal of MEALS) {
    const line = a[meal];
    if (!line || !(line.persons > 0)) continue;
    const { rate, menu } = mealRate(meal, line.menuId, rates);
    lines.push({ key: meal, group: "Food", label: MEAL_LABELS[meal], detail: menu?.name ?? "Standard menu", qty: line.persons, rate, amount: line.persons * rate });
    const main = meal === "lunch" || meal === "dinner";
    serviceCharge += line.persons * (main ? rates.addOns.serviceChargeMain : rates.addOns.serviceChargeLight);
    servicePersons = main ? { ...servicePersons, main: servicePersons.main + line.persons } : { ...servicePersons, light: servicePersons.light + line.persons };
  }
  if (serviceCharge > 0)
    lines.push({
      key: "service-charge",
      group: "Food",
      label: "Food service charge",
      detail: [servicePersons.main && `${servicePersons.main} × ${rates.addOns.serviceChargeMain}`, servicePersons.light && `${servicePersons.light} × ${rates.addOns.serviceChargeLight}`].filter(Boolean).join(" + "),
      amount: serviceCharge,
    });

  for (const s of a.services ?? []) {
    const item = rates.services?.find((x) => x.id === s.serviceId);
    if (!item || !(s.qty > 0)) continue;
    lines.push({ key: `svc-${s.serviceId}`, group: "Services", label: item.name, detail: `per ${item.unit}`, qty: s.qty, rate: item.rate, amount: s.qty * item.rate });
  }
  for (const c of a.custom ?? []) {
    if (!c.name.trim() || !(c.qty > 0)) continue;
    lines.push({ key: `custom-${c.id}`, group: "Other", label: c.name, qty: c.qty, rate: c.rate, amount: Math.round(c.qty * c.rate) });
  }

  const groupTotals = Object.fromEntries((["Venue", "Decoration", "Food", "Services", "Other"] as BillGroup[]).map((g) => [g, lines.filter((l) => l.group === g).reduce((s, l) => s + l.amount, 0)])) as Record<BillGroup, number>;
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const discount = Math.min(Math.max(0, booking.discount || 0), subtotal);
  const foodBase = groupTotals.Food;
  const vat = Math.round((foodBase * (rates.foodVatPercent ?? 0)) / 100);
  const total = subtotal - discount + vat;
  const security = booking.eventType ? (rates.securityByType?.[booking.eventType] ?? 0) : 0;
  return {
    hallRent: rent.amount,
    isWeekend: rent.isWeekend,
    special: rent.special,
    lines,
    addOns: lines.filter((l) => l.key !== "hall"),
    groupTotals,
    subtotal,
    discount,
    foodBase,
    vat,
    total,
    paid,
    due: Math.max(0, total - paid),
    security,
  };
}
