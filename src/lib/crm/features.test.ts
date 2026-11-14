import { describe, expect, it } from "vitest";
import type { Booking, FactSheet, PpmExtras, VendorReview } from "@/types/crm";
import { buildEstimate, ratesAsOf, ratesFromSeed } from "./pricing";
import { detectLeakage, mergeFindings } from "./leakage";
import { readiness, dueMilestones, levelFor } from "./readiness";
import { idleDays } from "./idle";
import { matchHalls } from "./matchmaker";
import { agingBucket, dueSchedule, refundRow, weeklyForecast } from "./collections";
import { addWorkingDays, refundDueDate } from "./rules";
import { reviewPoints, suggestedStatus, vendorScore } from "./vendor-score";

const rates = ratesAsOf(ratesFromSeed());
const CTX = { discountApprovalThreshold: 25000 };

function factSheet(over: Partial<FactSheet> = {}): FactSheet {
  return {
    hallOpenedBy: "", preparationHours: 0, businessHours: 12, actualGuests: 0, extraHours: 0, acLog: [], generatorLog: [], foodProvider: "", kitchenUsedTime: "",
    driverPackets: 0, foodStallQty: 0, serviceBoys: 0, atATimeSetup: 0, tablePerSetup: 0, headTable: 0, waiting: 0, hygiene: 0, serviceDress: 0, mannerism: 0, cleaningLog: [], summary: "", hallClosedBy: "", done: true,
    ...over,
  };
}
const extras = (over: Partial<PpmExtras> = {}): PpmExtras => ({ chairCovers: 0, chairs: 0, externalLighting: false, archways: 1, foodStalls: 0, ...over });

function booking(over: Partial<Booking> = {}): Booking {
  return {
    id: "b1", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
    bfNo: "ICCB202601000001", refNo: "", programRegNo: "", bookingDate: "2026-01-01", priceVersion: "2026-01-01",
    clientId: "c1", clientType: "personal", eventTitle: "Test", eventNature: "Wedding",
    contact: { name: "A", mobile: "01700000000" }, emergency: {},
    days: [{ id: "d1", dayType: "program", hallId: "hall-1", date: "2026-03-10", start: "12:00", end: "23:00" }],
    guests: { optimum: 500, maximum: 550 }, cars: { optimum: 0, maximum: 0 }, layout: "banquet_stage",
    food: { breakfast: false, lunch: false, snacks: false, dinner: true }, menus: [], addons: [],
    decoration: { provider: "iccb" }, discount: { mode: "amount", value: 0, approval: "none" }, applyAit: false,
    status: "completed", closed: null, checklist: {}, documents: [], tags: [], source: "website", activity: [],
    ...over,
  };
}
const rules = (b: Booking) => detectLeakage(b, rates, CTX).map((f) => f.ruleId);
const find = (b: Booking, id: string) => detectLeakage(b, rates, CTX).find((f) => f.ruleId === id);

/* ─── Leakage ────────────────────────────────────────────────────────────── */

describe("Revenue Leakage Guard", () => {
  it("ignores requested and closed bookings", () => {
    expect(detectLeakage(booking({ status: "requested", factSheet: factSheet({ extraHours: 3 }) }), rates, CTX)).toEqual([]);
    expect(detectLeakage(booking({ closed: { kind: "cancelled", reason: "x", at: "", charge: 0 }, factSheet: factSheet({ extraHours: 3 }) }), rates, CTX)).toEqual([]);
  });

  it("EXTRA_HOURS uses the hall's extra-hour rate (Hall 1–3 15k, Hall 4 25k, Hall 5 10k)", () => {
    expect(find(booking({ factSheet: factSheet({ extraHours: 3 }) }), "EXTRA_HOURS")?.expectedAmount).toBe(45000);
    const h4 = booking({ factSheet: factSheet({ extraHours: 2 }), days: [{ id: "d1", dayType: "program", hallId: "hall-4", date: "2026-03-10", start: "12:00", end: "23:00" }] });
    expect(find(h4, "EXTRA_HOURS")?.expectedAmount).toBe(50000);
    const h5 = booking({ factSheet: factSheet({ extraHours: 2 }), days: [{ id: "d1", dayType: "program", hallId: "hall-5", date: "2026-03-10", start: "12:00", end: "23:00" }] });
    expect(find(h5, "EXTRA_HOURS")?.expectedAmount).toBe(20000);
  });

  it("EXTRA_HOURS is cleared once the hours are on the bill", () => {
    const b = booking({ factSheet: factSheet({ extraHours: 2 }), addons: [{ id: "x", kind: "extra", name: "Extra business hours (fact sheet)", unit: "hour", qty: 2, rate: 15000 }] });
    expect(rules(b)).not.toContain("EXTRA_HOURS");
  });

  it("EXTRA_GUESTS only above +10% and charges every extra guest at 130", () => {
    expect(rules(booking({ factSheet: factSheet({ actualGuests: 540 }) }))).not.toContain("EXTRA_GUESTS");
    expect(find(booking({ factSheet: factSheet({ actualGuests: 600 }) }), "EXTRA_GUESTS")?.expectedAmount).toBe(100 * 130);
  });

  it("SERVICE_CHARGE_GAP bills up to 110% of booked guests (125 main meal / 15 breakfast)", () => {
    expect(find(booking({ factSheet: factSheet({ actualGuests: 600 }) }), "SERVICE_CHARGE_GAP")?.expectedAmount).toBe(50 * 125);
    const breakfast = booking({ food: { breakfast: true, lunch: false, snacks: false, dinner: false }, factSheet: factSheet({ actualGuests: 520 }) });
    expect(find(breakfast, "SERVICE_CHARGE_GAP")?.expectedAmount).toBe(20 * 15);
    expect(rules(booking({ factSheet: factSheet({ actualGuests: 480 }) }))).not.toContain("SERVICE_CHARGE_GAP");
  });

  it("GENERATOR rounds up to whole hours at the hall's generator rate; Hall 5 has none", () => {
    expect(find(booking({ factSheet: factSheet({ generatorLog: [{ id: "g", date: "2026-03-10", hours: 1, minutes: 20 }] }) }), "GENERATOR")?.expectedAmount).toBe(2 * 20000);
    const h5 = booking({ factSheet: factSheet({ generatorLog: [{ id: "g", date: "2026-03-10", hours: 1, minutes: 0 }] }), days: [{ id: "d1", dayType: "program", hallId: "hall-5", date: "2026-03-10", start: "12:00", end: "23:00" }] });
    expect(rules(h5)).not.toContain("GENERATOR");
  });

  it("PPM extras: chair covers, extra chairs, lighting, archways, food stalls", () => {
    const b = booking({ ppm: { date: "2026-02-20", attendees: "", agenda: {}, notes: "", done: true, extras: extras({ chairCovers: 600, chairs: 1400, externalLighting: true, archways: 3, foodStalls: 2 }) } });
    expect(find(b, "CHAIR_COVER")?.expectedAmount).toBe(600 * 40);
    expect(find(b, "EXTRA_CHAIRS")?.expectedAmount).toBe(100 * 50); // Hall-1 includes 1,300
    expect(find(b, "EXTERNAL_LIGHTING")?.expectedAmount).toBe(30000);
    expect(find(b, "ARCHWAY")?.expectedAmount).toBe(2 * 3000);
    expect(find(b, "FOOD_STALLS")?.expectedAmount).toBe(2 * 20000);
  });

  it("Hall 5 uses the lower lighting and set-up rates", () => {
    const b = booking({ clientType: "corporate", days: [{ id: "d1", dayType: "program", hallId: "hall-5", date: "2026-03-10", start: "09:00", end: "18:00" }], ppm: { date: "2026-02-20", attendees: "", agenda: {}, notes: "", done: true, extras: extras({ externalLighting: true }) } });
    expect(find(b, "EXTERNAL_LIGHTING")?.expectedAmount).toBe(10000);
    expect(find(b, "HALL_SETUP")?.expectedAmount).toBe(6000);
    expect(find({ ...b, days: [{ ...b.days[0], hallId: "hall-2" }] }, "HALL_SETUP")?.expectedAmount).toBe(12000);
  });

  it("OUTSIDE_DECOR_FEE when the decorator has no category fee line", () => {
    expect(find(booking({ decoration: { provider: "outside", firm: "X" } }), "OUTSIDE_DECOR_FEE")?.expectedAmount).toBe(50000);
    expect(rules(booking({ decoration: { provider: "outside", firm: "X", category: "A" } }))).not.toContain("OUTSIDE_DECOR_FEE");
  });

  it("FOOD_VAT flags a VAT rate below 15%", () => {
    const low = { ...rates, taxes: rates.taxes.map((t) => (t.key === "food_vat" ? { ...t, pct: 10 } : t)) };
    const b = booking({ menus: [{ id: "m", name: "Menu", guests: 100, perHead: 1000 }] });
    expect(detectLeakage(b, low, CTX).find((f) => f.ruleId === "FOOD_VAT")?.expectedAmount).toBe(5000);
    expect(rules(b)).not.toContain("FOOD_VAT");
  });

  it("UNAPPROVED_DISCOUNT is a flag with amount 0", () => {
    const f = find(booking({ discount: { mode: "amount", value: 40000, approval: "pending" } }), "UNAPPROVED_DISCOUNT");
    expect(f?.expectedAmount).toBe(0);
    expect(f?.line).toBeUndefined();
  });

  it("merge keeps waived findings closed unless the amount grows", () => {
    const b = booking({ factSheet: factSheet({ extraHours: 1 }) });
    const first = mergeFindings(b.id, detectLeakage(b, rates, CTX));
    const waived = first.map((f) => ({ ...f, status: "waived" as const, waivedReason: "goodwill" }));
    expect(mergeFindings(b.id, detectLeakage(b, rates, CTX), waived).filter((f) => f.status === "open")).toHaveLength(0);
    const more = { ...b, factSheet: factSheet({ extraHours: 3 }) };
    expect(mergeFindings(b.id, detectLeakage(more, rates, CTX), waived).filter((f) => f.status === "open")).toHaveLength(1);
  });
});

/* ─── Readiness ──────────────────────────────────────────────────────────── */

describe("Event Readiness Score", () => {
  const confirmed = (over: Partial<Booking> = {}) =>
    booking({
      status: "confirmed",
      days: [{ id: "d1", dayType: "program", hallId: "hall-1", date: "2026-06-30", start: "12:00", end: "23:00" }],
      documents: [
        { id: "nid", key: "nid", label: "NID", state: "yes" },
        { id: "police", key: "police", label: "Police", state: "pending", dueDate: "2026-06-25" },
        { id: "ppm_copy", key: "ppm_copy", label: "PPM copy", state: "pending" },
      ],
      ...over,
    });
  const paid = { advancePaid: 240000, advanceRequired: 240000, balance: 0 };

  it("is Ready when everything is done", () => {
    const b = confirmed({ documents: [{ id: "nid", key: "nid", label: "NID", state: "yes" }], ppm: { date: "2026-06-10", attendees: "", agenda: { 5: "Line array" }, notes: "", done: true } });
    const r = readiness(b, "2026-06-20", { est: paid, balanceDueDays: 15 });
    expect(r.score).toBe(100);
    expect(r.level).toBe("ready");
  });

  it("gives 50% credit to items not yet due and 0 to overdue ones", () => {
    const early = readiness(confirmed(), "2026-05-01", { est: { advancePaid: 240000, advanceRequired: 240000, balance: 500000 }, balanceDueDays: 15 });
    const pay = early.items.find((i) => i.area === "payment")!;
    expect(pay.state).toBe("on_track");
    expect(pay.credit).toBe(0.5);
    const late = readiness(confirmed(), "2026-06-26", { est: { advancePaid: 240000, advanceRequired: 240000, balance: 500000 }, balanceDueDays: 15 });
    expect(late.items.find((i) => i.area === "payment")!.state).toBe("overdue");
    expect(late.items.find((i) => i.area === "permissions")!.state).toBe("overdue");
    expect(late.items.find((i) => i.area === "ppm")!.state).toBe("overdue");
    expect(late.level).toBe("risk");
  });

  it("vendor area needs a decorator score ≥ 60", () => {
    const b = confirmed({ decoration: { provider: "outside", firm: "X", vendorId: "v1" } });
    const low = readiness(b, "2026-05-01", { est: paid, balanceDueDays: 15, vendorScore: 40 }).items.find((i) => i.area === "vendors")!;
    const ok = readiness(b, "2026-05-01", { est: paid, balanceDueDays: 15, vendorScore: 80 }).items.find((i) => i.area === "vendors")!;
    expect(low.credit).toBeLessThan(ok.credit);
  });

  it("levels and milestones", () => {
    expect([levelFor(80), levelFor(79), levelFor(50), levelFor(49)]).toEqual(["ready", "attention", "attention", "risk"]);
    expect(dueMilestones(10)).toEqual(["D-15"]);
    expect(dueMilestones(2, ["D-15"])).toEqual(["D-7", "D-3"]);
    expect(dueMilestones(20)).toEqual([]);
  });
});

/* ─── Idle days ──────────────────────────────────────────────────────────── */

describe("Idle Date Recovery", () => {
  it("counts free hall-days and rent at risk; preparation days count as used", () => {
    const b = booking({ status: "confirmed", days: [
      { id: "p", dayType: "preparation", hallId: "hall-1", date: "2026-03-01", start: "08:00", end: "20:00" },
      { id: "d", dayType: "program", hallId: "hall-1", date: "2026-03-02", start: "12:00", end: "23:00" },
    ] });
    const r = idleDays({ from: "2026-03-01", days: 3 }, rates.halls, [b], rates);
    const h1 = r.days.filter((d) => d.hallId === "hall-1");
    expect(h1.map((d) => d.date)).toEqual(["2026-03-03"]);
    expect(r.byHall["hall-1"].rent).toBe(400000);
    expect(r.days.every((d) => !d.hallId.startsWith("expo"))).toBe(true);
  });
  it("ignores requests that were closed", () => {
    const b = booking({ status: "requested", closed: { kind: "lost", reason: "", at: "", charge: 0 }, days: [{ id: "d", dayType: "program", hallId: "hall-2", date: "2026-03-01", start: "12:00", end: "23:00" }] });
    expect(idleDays({ from: "2026-03-01", days: 1 }, rates.halls, [b], rates).byHall["hall-2"].days).toBe(1);
  });
});

/* ─── Matchmaker ─────────────────────────────────────────────────────────── */

describe("Smart Hall Matchmaker", () => {
  const base = { eventType: "Wedding", clientType: "personal" as const, layout: "banquet_stage" as const, food: false, decoration: { provider: "iccb" as const } };
  const ctx = { rates, bookings: [] as Booking[], today: "2026-01-01" };

  it("suggests a hall combination or the Expo Zone when guests exceed every hall", () => {
    const r = matchHalls({ ...base, layout: "theatre", guests: 4000, date: "2026-04-15" }, ctx);
    expect(r.options.length).toBeGreaterThan(0);
    expect(r.options.every((o) => o.hallIds.length > 1 || o.hallCodes[0].startsWith("expo"))).toBe(true);
  });

  it("puts Hall 5 first for small events", () => {
    const r = matchHalls({ ...base, guests: 200, date: "2026-04-15" }, ctx);
    expect(r.options[0].label).toBe("Best fit");
    expect(r.options[0].hallCodes).toEqual(["hall-5"]);
  });

  it("finds a cheaper weekday in Dec–Jan and explains the saving", () => {
    const friday = "2026-12-11";
    const r = matchHalls({ ...base, guests: 600, layout: "theatre", date: friday }, ctx);
    const alt = r.options.find((o) => o.label === "Alternative date");
    expect(alt).toBeDefined();
    expect(alt!.savings).toBe(50000);
    expect(alt!.savingsText).toMatch(/instead of Friday saves ৳ 50,000/);
  });

  it("moves off a booked date to the nearest free one", () => {
    const busy = booking({ status: "confirmed", days: [{ id: "d", dayType: "program", hallId: "hall-5", date: "2026-04-15", start: "12:00", end: "23:00" }] });
    const r = matchHalls({ ...base, guests: 200, date: "2026-04-15" }, { ...ctx, bookings: [busy] });
    const h5 = r.options.find((o) => o.hallCodes[0] === "hall-5");
    expect(h5?.date).not.toBe("2026-04-15");
  });
});

/* ─── Collections ────────────────────────────────────────────────────────── */

describe("Collections", () => {
  it("adds working days skipping Fri, Sat and holidays", () => {
    // 2026-03-05 is a Thursday → next working day is Sunday 08.
    expect(addWorkingDays("2026-03-05", 1)).toBe("2026-03-08");
    expect(addWorkingDays("2026-03-05", 1, ["2026-03-08"])).toBe("2026-03-09");
    expect(refundDueDate("2026-03-05")).toBe("2026-03-26");
  });

  it("builds the due schedule and ages overdue balances", () => {
    const b = booking({ status: "confirmed", approvedAt: "2026-01-10T10:00:00Z", days: [{ id: "d1", dayType: "program", hallId: "hall-1", date: "2026-03-10", start: "12:00", end: "23:00" }] });
    const est = buildEstimate(b, rates, { payments: [{ amount: 240000, purpose: "advance" }] });
    const r = dueSchedule(b, est, { today: "2026-03-01", balanceDueDays: 15, advancePct: 60, holidays: [] });
    expect(r.items[0]).toMatchObject({ kind: "advance", amount: 240000, remaining: 0 });
    expect(r.items[1].dueDate).toBe("2026-02-23");
    expect(r.overdueDays).toBe(6);
    expect(r.bucket).toBe("1–7");
    expect([agingBucket(0), agingBucket(8), agingBucket(16), agingBucket(31)]).toEqual([null, "8–15", "16–30", "30+"]);
  });

  it("refund = security held − damages − dues, due event + 15 working days", () => {
    const b = booking({ days: [{ id: "d1", dayType: "program", hallId: "hall-1", date: "2026-03-05", start: "12:00", end: "23:00" }], damage: { rows: [{ id: "r", department: "Operation", item: "x", time: "", uom: "", qty: 1, rate: 10000 }], certifiedBy: "", noDamage: false, done: true } });
    const est = buildEstimate(b, rates);
    const r = refundRow(b, { ...est, received: est.grandTotal }, { today: "2026-03-30", holidays: [] })!;
    expect(r.amount).toBe(est.security - 10000);
    expect(r.dueDate).toBe("2026-03-26");
    expect(r.overdue).toBe(true);
  });

  it("weekly forecast has 13 weeks with the current one flagged", () => {
    const w = weeklyForecast([], [], "2026-03-11");
    expect(w).toHaveLength(13);
    expect(w.filter((x) => x.current)).toHaveLength(1);
  });
});

/* ─── Vendor score ───────────────────────────────────────────────────────── */

describe("Vendor scorecard", () => {
  const rv = (over: Partial<VendorReview> = {}) => ({ setupOnTime: true, dismantledWithin24h: true, violations: [] as string[], damageAmount: 0, rating: 3, date: "2026-01-01", ...over });
  it("applies penalties and rating", () => {
    expect(reviewPoints(rv())).toBe(100);
    expect(reviewPoints(rv({ setupOnTime: false, dismantledWithin24h: false, violations: ["a", "b"], damageAmount: 25000, rating: 1 }))).toBe(100 - 10 - 15 - 20 - 20 - 10);
    expect(reviewPoints(rv({ damageAmount: 5000, rating: 5 }))).toBe(100);
  });
  it("averages the last 10 reviews and suggests a status", () => {
    const many = Array.from({ length: 12 }, (_, i) => rv({ date: `2026-01-${String(i + 1).padStart(2, "0")}`, violations: i < 2 ? ["a", "b", "c", "d", "e"] : [] }));
    expect(vendorScore(many)).toBe(100); // the two oldest bad reviews fall outside the window
    expect(vendorScore([])).toBe(100);
    expect([suggestedStatus(70), suggestedStatus(69), suggestedStatus(49)]).toEqual(["active", "warning", "review_blacklist"]);
  });
});
