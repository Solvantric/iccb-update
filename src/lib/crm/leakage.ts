/**
 * Revenue Leakage Guard — pure functions, no store access.
 * Finds chargeable items that happened (PPM / Fact Sheet / booking) but are not on the bill.
 */
import type { AddonLine, Booking, LeakageFinding, LeakageRuleId } from "@/types/crm";
import { buildEstimate, charge, EXTRA_GUEST_THRESHOLD, findHall, tariffFor, type Estimate, type PricingRates } from "./pricing";

export const LEAKAGE_RULE_LABELS: Record<LeakageRuleId, string> = {
  EXTRA_HOURS: "Extra business hours",
  EXTRA_GUESTS: "Extra guests (>10%)",
  SERVICE_CHARGE_GAP: "Service charge gap",
  GENERATOR: "Generator support",
  CHAIR_COVER: "Chair covers",
  EXTRA_CHAIRS: "Extra chairs",
  EXTERNAL_LIGHTING: "External lighting",
  HALL_SETUP: "Hall set-up",
  ARCHWAY: "Additional archway gates",
  OUTSIDE_DECOR_FEE: "Outside decoration fee",
  FOOD_STALLS: "Outside food stalls",
  FOOD_VAT: "Food VAT",
  UNAPPROVED_DISCOUNT: "Unapproved discount",
};

export interface LeakageCtx {
  discountApprovalThreshold: number;
  /** Expected Food VAT %, defaults to 15. */
  foodVatPct?: number;
}

type Draft = Omit<LeakageFinding, "id" | "bookingId" | "status">;

const sumQty = (lines: AddonLine[]) => lines.reduce((s, l) => s + l.qty, 0);
const byRule = (b: Booking, rule: LeakageRuleId) => b.addons.filter((a) => a.reason === `leakage:${rule}`);
const byName = (b: Booking, re: RegExp) => b.addons.filter((a) => re.test(a.name));
const fmt = (n: number) => n.toLocaleString("en-US");

/** Bill lines that already cover a rule: lines added by the guard + matching catalogue/manual lines. */
function billed(b: Booking, rule: LeakageRuleId, re: RegExp) {
  const lines = [...byRule(b, rule), ...byName(b, re).filter((a) => a.reason !== `leakage:${rule}`)];
  return { lines, qty: sumQty(lines), amount: lines.reduce((s, l) => s + l.qty * l.rate, 0) };
}

export function detectLeakage(b: Booking, rates: PricingRates, ctx: LeakageCtx, est: Estimate = buildEstimate(b, rates)): Draft[] {
  if (b.status === "requested" || b.closed) return [];
  const out: Draft[] = [];
  const fs = b.factSheet;
  const ppm = b.ppm;
  const extras = ppm?.extras;
  const programDays = b.days.filter((d) => d.dayType === "program");
  const firstDay = programDays[0] ?? b.days[0];
  const hall = firstDay ? findHall(rates, firstDay.hallId) : undefined;
  const hallCode = hall?.code ?? "";
  const isHall5 = hallCode === "hall-5";
  const isExpo = hall?.kind === "expo";
  const booked = b.guests.optimum;

  /* EXTRA_HOURS — fact sheet extra hours not on the bill. */
  if (fs && fs.extraHours > 0 && hall && !isExpo) {
    const tariff = tariffFor(rates, hall.tariffGroup, firstDay?.date);
    const rate = tariff?.extraHour ?? 0;
    const viaEstimate = est.lines.filter((l) => l.id.startsWith("xh-")).reduce((s, l) => s + l.qty, 0);
    const missing = fs.extraHours - viaEstimate - billed(b, "EXTRA_HOURS", /extra (business )?hour/i).qty;
    if (missing > 0 && rate > 0)
      out.push({ ruleId: "EXTRA_HOURS", title: LEAKAGE_RULE_LABELS.EXTRA_HOURS, detail: `Fact sheet: ${fs.extraHours} extra hour${fs.extraHours > 1 ? "s" : ""}, ${missing} not billed`, source: "FactSheet", sourceRef: "factSheet.extraHours", expectedAmount: missing * rate, line: { name: "Extra business hour (event day)", unit: "hour", qty: missing, rate } });
  }

  /* EXTRA_GUESTS — actual guests above +10% of booked. */
  if (fs && fs.actualGuests > booked * (1 + EXTRA_GUEST_THRESHOLD)) {
    const rate = charge(rates, "extra-guest")?.rate ?? 130;
    const extra = fs.actualGuests - booked;
    const missing = extra - billed(b, "EXTRA_GUESTS", /extra guest/i).qty;
    if (missing > 0)
      out.push({ ruleId: "EXTRA_GUESTS", title: LEAKAGE_RULE_LABELS.EXTRA_GUESTS, detail: `Fact sheet: ${fmt(fs.actualGuests)} actual vs ${fmt(booked)} booked`, source: "FactSheet", sourceRef: "factSheet.actualGuests", expectedAmount: missing * rate, line: { name: `Extra guests over +10% (${fmt(fs.actualGuests)} vs ${fmt(booked)})`, unit: "person", qty: missing, rate } });
  }

  /* SERVICE_CHARGE_GAP — billed service-charge persons below actual guests (up to 110%). */
  if (fs && fs.actualGuests > 0) {
    const cap = Math.min(fs.actualGuests, Math.round(booked * (1 + EXTRA_GUEST_THRESHOLD)));
    const svcLines = est.lines.filter((l) => l.group === "service");
    const alreadyGap = billed(b, "SERVICE_CHARGE_GAP", /service charge gap/i);
    let missingPersons = 0;
    let amount = 0;
    let rate = 0;
    for (const l of svcLines) {
      const gap = cap - l.qty;
      if (gap > 0) {
        missingPersons += gap;
        amount += gap * l.rate;
        rate = Math.max(rate, l.rate);
      }
    }
    amount -= alreadyGap.amount;
    if (amount > 0 && missingPersons > 0) {
      const meals = svcLines.length;
      out.push({ ruleId: "SERVICE_CHARGE_GAP", title: LEAKAGE_RULE_LABELS.SERVICE_CHARGE_GAP, detail: `Service charge billed for ${fmt(svcLines[0]?.qty ?? 0)} persons × ${meals} meal${meals > 1 ? "s" : ""}; ${fmt(cap)} served`, source: "FactSheet", sourceRef: "factSheet.actualGuests", expectedAmount: amount, line: { name: "Service charge gap (actual guests)", unit: "meal-person", qty: missingPersons, rate: Math.round(amount / missingPersons) } });
    }
  }

  /* GENERATOR — generator log minutes with no generator line. */
  if (fs) {
    const minutes = fs.generatorLog.reduce((s, g) => s + g.hours * 60 + g.minutes, 0);
    const gen = rates.charges.find((c) => c.category === "generator" && c.hallCodes?.includes(hallCode));
    if (minutes > 0 && gen) {
      const hours = Math.ceil(minutes / 60);
      const missing = hours - billed(b, "GENERATOR", /generator/i).qty;
      if (missing > 0)
        out.push({ ruleId: "GENERATOR", title: LEAKAGE_RULE_LABELS.GENERATOR, detail: `Generator log: ${Math.floor(minutes / 60)} h ${minutes % 60} min → ${hours} h billable`, source: "FactSheet", sourceRef: "factSheet.generatorLog", expectedAmount: missing * gen.rate, line: { name: gen.name, unit: "hour", qty: missing, rate: gen.rate } });
    }
  }

  /* CHAIR_COVER — ICCB-provided chair covers agreed at the PPM. */
  if (extras && extras.chairCovers > 0) {
    const rate = charge(rates, "chair-cover")?.rate ?? 40;
    const missing = extras.chairCovers - billed(b, "CHAIR_COVER", /chair cover/i).qty;
    if (missing > 0)
      out.push({ ruleId: "CHAIR_COVER", title: LEAKAGE_RULE_LABELS.CHAIR_COVER, detail: `PPM: ${fmt(extras.chairCovers)} chair covers (ICCB)`, source: "PPM", sourceRef: "ppm.extras.chairCovers", expectedAmount: missing * rate, line: { name: "Chair cover", unit: "cover", qty: missing, rate } });
  }

  /* EXTRA_CHAIRS — chairs above the hall's included chairs. */
  if (extras && extras.chairs > 0) {
    const included = rates.capacities.find((c) => c.layout === "chairs")?.byHall[hallCode as "hall-1"]?.main;
    if (included) {
      const extra = extras.chairs - included;
      const rate = charge(rates, "extra-chair")?.rate ?? 50;
      const missing = extra - billed(b, "EXTRA_CHAIRS", /extra chair/i).qty;
      if (extra > 0 && missing > 0)
        out.push({ ruleId: "EXTRA_CHAIRS", title: LEAKAGE_RULE_LABELS.EXTRA_CHAIRS, detail: `PPM: ${fmt(extras.chairs)} chairs, hall includes ${fmt(included)}`, source: "PPM", sourceRef: "ppm.extras.chairs", expectedAmount: missing * rate, line: { name: "Extra chair", unit: "chair", qty: missing, rate } });
    }
  }

  /* EXTERNAL_LIGHTING */
  if (extras?.externalLighting && billed(b, "EXTERNAL_LIGHTING", /external lighting/i).qty === 0) {
    const c = charge(rates, "external-lighting");
    const rate = c ? (isHall5 && c.rateHall5 != null ? c.rateHall5 : c.rate) : isHall5 ? 10000 : 30000;
    out.push({ ruleId: "EXTERNAL_LIGHTING", title: LEAKAGE_RULE_LABELS.EXTERNAL_LIGHTING, detail: "PPM: external lighting = yes", source: "PPM", sourceRef: "ppm.extras.externalLighting", expectedAmount: rate, line: { name: "External lighting", unit: "event", qty: 1, rate } });
  }

  /* HALL_SETUP — exhibition / corporate / cultural events in a hall. */
  if (!isExpo && hall?.kind === "hall" && ["exhibition", "corporate", "cultural"].includes(b.clientType) && billed(b, "HALL_SETUP", /hall set-?up/i).qty === 0) {
    const c = charge(rates, "hall-setup");
    const rate = c ? (isHall5 && c.rateHall5 != null ? c.rateHall5 : c.rate) : isHall5 ? 6000 : 12000;
    out.push({ ruleId: "HALL_SETUP", title: LEAKAGE_RULE_LABELS.HALL_SETUP, detail: `${b.clientType[0].toUpperCase()}${b.clientType.slice(1)} event without a set-up line`, source: "Booking", sourceRef: "booking.clientType", expectedAmount: rate, line: { name: "Hall set-up (exhibition/corporate/cultural)", unit: "event", qty: 1, rate } });
  }

  /* ARCHWAY — one gate is free, the rest are charged. */
  if (extras && extras.archways > 1) {
    const rate = charge(rates, "archway")?.rate ?? 3000;
    const missing = extras.archways - 1 - billed(b, "ARCHWAY", /archway/i).qty;
    if (missing > 0)
      out.push({ ruleId: "ARCHWAY", title: LEAKAGE_RULE_LABELS.ARCHWAY, detail: `PPM: ${extras.archways} archway gates (1 included)`, source: "PPM", sourceRef: "ppm.extras.archways", expectedAmount: missing * rate, line: { name: "Archway gate (additional)", unit: "piece", qty: missing, rate } });
  }

  /* OUTSIDE_DECOR_FEE — outside decorator but no fee line. */
  if (b.decoration.provider === "outside" && !est.lines.some((l) => l.id === "deco-outside") && billed(b, "OUTSIDE_DECOR_FEE", /decoration fee/i).qty === 0) {
    const code = b.decoration.category ?? "C";
    const cat = rates.decoration.find((d) => d.code === code);
    const rate = cat ? (isHall5 ? cat.rateHall5 : cat.rateHall14) : 50000;
    out.push({ ruleId: "OUTSIDE_DECOR_FEE", title: LEAKAGE_RULE_LABELS.OUTSIDE_DECOR_FEE, detail: `Outside decorator${b.decoration.firm ? ` (${b.decoration.firm})` : ""}${b.decoration.category ? `, category ${code}` : ", category not set — minimum category C"}`, source: "Booking", sourceRef: "booking.decoration", expectedAmount: rate, line: { name: `Outside decoration fee — Category ${code}`, unit: "event", qty: 1, rate } });
  }

  /* FOOD_STALLS — outside food stalls per day. */
  const stalls = Math.max(fs?.foodStallQty ?? 0, extras?.foodStalls ?? 0);
  if (stalls > 0) {
    const rate = charge(rates, "food-stall")?.rate ?? 20000;
    const daysN = Math.max(1, programDays.length);
    const expectedQty = stalls * daysN;
    const missing = expectedQty - billed(b, "FOOD_STALLS", /food stall/i).qty;
    if (missing > 0)
      out.push({ ruleId: "FOOD_STALLS", title: LEAKAGE_RULE_LABELS.FOOD_STALLS, detail: `${stalls} outside food stall${stalls > 1 ? "s" : ""} × ${daysN} day${daysN > 1 ? "s" : ""}`, source: fs?.foodStallQty ? "FactSheet" : "PPM", sourceRef: fs?.foodStallQty ? "factSheet.foodStallQty" : "ppm.extras.foodStalls", expectedAmount: missing * rate, line: { name: "Outside food stall", unit: "stall/day", qty: missing, rate } });
  }

  /* FOOD_VAT — food billed but VAT missing or not at the expected rate. */
  const vatPct = ctx.foodVatPct ?? 15;
  if (est.food > 0) {
    const expected = Math.round((est.food * vatPct) / 100);
    const gap = expected - est.vat - billed(b, "FOOD_VAT", /food vat/i).amount;
    if (gap > 0)
      out.push({ ruleId: "FOOD_VAT", title: LEAKAGE_RULE_LABELS.FOOD_VAT, detail: `Food ${fmt(est.food)} → VAT ${vatPct}% should be ${fmt(expected)}; billed ${fmt(est.vat)} (${est.vatPct}%)`, source: "Booking", sourceRef: "estimate.vat", expectedAmount: gap, line: { name: `Food VAT adjustment (${vatPct}%)`, unit: "event", qty: 1, rate: gap } });
  }

  /* UNAPPROVED_DISCOUNT — flag only. */
  const discAmount = b.discount.mode === "percent" ? Math.round((est.subtotal * b.discount.value) / 100) : b.discount.value;
  if (discAmount > ctx.discountApprovalThreshold && b.discount.approval !== "approved") {
    out.push({ ruleId: "UNAPPROVED_DISCOUNT", title: LEAKAGE_RULE_LABELS.UNAPPROVED_DISCOUNT, detail: `Discount ${fmt(discAmount)} above the ${fmt(ctx.discountApprovalThreshold)} threshold is ${b.discount.approval === "none" ? "not approved" : b.discount.approval}`, source: "Booking", sourceRef: "booking.discount", expectedAmount: 0 });
  }

  return out;
}

/**
 * Merge live detection with the stored record: resolved (added / waived) findings
 * are kept as history; open findings are replaced by what is detected now.
 */
export function mergeFindings(bookingId: string, detected: Draft[], stored: LeakageFinding[] = [], nowIso = new Date().toISOString()): LeakageFinding[] {
  const resolved = stored.filter((f) => f.status !== "open");
  const resolvedIds = new Set(resolved.map((f) => f.id));
  const prevOpen = new Map(stored.filter((f) => f.status === "open").map((f) => [f.id, f]));
  const open: LeakageFinding[] = detected
    .map((d) => ({ ...d, id: `${bookingId}:${d.ruleId}`, bookingId, status: "open" as const, detectedAt: prevOpen.get(`${bookingId}:${d.ruleId}`)?.detectedAt ?? nowIso }))
    // A waived rule stays waived unless the amount grew (new evidence).
    .filter((f) => {
      if (!resolvedIds.has(f.id)) return true;
      const r = resolved.find((x) => x.id === f.id)!;
      return r.status === "added" ? true : f.expectedAmount > r.expectedAmount;
    })
    .map((f) => (resolvedIds.has(f.id) ? { ...f, id: `${f.id}:${nowIso.slice(0, 10)}` } : f));
  return [...open, ...resolved];
}

export function liveFindings(b: Booking, rates: PricingRates, ctx: LeakageCtx, est?: Estimate) {
  return mergeFindings(b.id, detectLeakage(b, rates, ctx, est), b.leakage);
}

export const openFindings = (list: LeakageFinding[]) => list.filter((f) => f.status === "open");
export const openAmount = (list: LeakageFinding[]) => openFindings(list).reduce((s, f) => s + f.expectedAmount, 0);
