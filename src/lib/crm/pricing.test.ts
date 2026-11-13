import { describe, expect, it } from "vitest";
import {
  buildEstimate,
  cancellationCharge,
  capacityCheck,
  catalogRate,
  charge,
  extraGuestCharge,
  hallRent,
  ratesAsOf,
  ratesFromSeed,
  securityMoney,
  type EstimateInput,
} from "./pricing";

const rates = ratesAsOf(ratesFromSeed());
const hall = (code: string) => rates.halls.find((h) => h.code === code)!;

const baseInput = (over: Partial<EstimateInput> = {}): EstimateInput => ({
  days: [{ id: "d1", dayType: "program", hallId: "hall-5", date: "2026-03-10", start: "10:00", end: "22:00" }],
  guests: { optimum: 300, maximum: 300 },
  food: { breakfast: false, lunch: false, snacks: false, dinner: true },
  menus: [],
  addons: [],
  decoration: { provider: "iccb" },
  discount: { mode: "amount", value: 0, approval: "none" },
  clientType: "personal",
  applyAit: false,
  ...over,
});

describe("hallRent", () => {
  it("uses Feb–Nov rate outside peak", () => {
    expect(hallRent(hall("hall-1"), "2026-03-12", rates)).toBe(400000);
    expect(hallRent(hall("hall-4"), "2026-06-06", rates)).toBe(550000);
  });
  it("uses Dec–Jan weekend rate on Thu/Fri/Sat", () => {
    expect(hallRent(hall("hall-2"), "2026-12-10", rates)).toBe(450000); // Thursday
    expect(hallRent(hall("hall-4"), "2027-01-09", rates)).toBe(600000); // Saturday
  });
  it("uses Dec–Jan weekday rate on Sun–Wed", () => {
    expect(hallRent(hall("hall-3"), "2026-12-13", rates)).toBe(400000); // Sunday
    expect(hallRent(hall("hall-5"), "2026-12-12", rates)).toBe(200000);
  });
});

describe("securityMoney", () => {
  it("follows event type and Hall-5 override", () => {
    expect(securityMoney("personal", ["hall-1"], rates)).toBe(75000);
    expect(securityMoney("cultural", ["hall-4"], rates)).toBe(300000);
    expect(securityMoney("exhibition", ["hall-2"], rates)).toBe(150000);
    expect(securityMoney("corporate", ["hall-3"], rates)).toBe(100000);
    expect(securityMoney("cultural", ["hall-5"], rates)).toBe(50000);
  });
});

describe("buildEstimate — ICCB real estimate", () => {
  it("matches the Hall-5 wedding estimate (1,238,215 / 1,258,215)", () => {
    const e = buildEstimate(
      baseInput({
        guests: { optimum: 485, maximum: 500 },
        decoration: { provider: "outside", category: "C", firm: "Outside firm" },
        menus: [{ id: "m1", name: "ICCB food", guests: 1, perHead: 806600 }],
        discount: { mode: "amount", value: 30000, approval: "approved" },
      }),
      rates
    );
    const amount = (pred: (p: string) => boolean) => e.lines.filter((l) => pred(l.particular)).reduce((s, l) => s + l.amount, 0);
    expect(amount((p) => p.startsWith("Hall-5 rent"))).toBe(200000);
    expect(amount((p) => p.startsWith("Outside decoration"))).toBe(50000);
    expect(amount((p) => p.startsWith("Service charge"))).toBe(60625);
    expect(e.food).toBe(806600);
    expect(e.vat).toBe(120990);
    expect(e.total).toBe(1238215);
    expect(e.security).toBe(50000);
    expect(e.discount).toBe(30000);
    expect(e.grandTotal).toBe(1258215);
  });

  it("matches the simple Hall-5 estimate (247,500 / 297,500)", () => {
    const lighting = charge(rates, "external-lighting")!;
    const e = buildEstimate(
      baseInput({
        addons: [{ id: "a1", kind: "service", catalogId: lighting.id, name: lighting.name, unit: lighting.unit, qty: 1, rate: catalogRate(lighting, "hall-5") }],
      }),
      rates
    );
    expect(e.total).toBe(247500);
    expect(e.grandTotal).toBe(297500);
  });

  it("does not apply a discount that is still pending approval", () => {
    const e = buildEstimate(baseInput({ discount: { mode: "amount", value: 50000, approval: "pending" } }), rates);
    expect(e.discount).toBe(0);
    expect(e.discountPending).toBe(true);
  });

  it("charges extra business hours beyond 12", () => {
    const e = buildEstimate(baseInput({ days: [{ id: "d1", dayType: "program", hallId: "hall-1", date: "2026-03-10", start: "08:00", end: "23:00" }] }), rates);
    expect(e.lines.find((l) => l.particular.startsWith("Extra business"))?.amount).toBe(3 * 15000);
  });
});

describe("cancellationCharge", () => {
  const b = baseInput({ days: [{ id: "d1", dayType: "program", hallId: "hall-1", date: "2026-09-30", start: "10:00", end: "22:00" }] });
  it("uses the chart bands", () => {
    expect(cancellationCharge(b, "2026-06-01", "cancel", rates)).toMatchObject({ pct: 12, charge: 48000 });
    expect(cancellationCharge(b, "2026-08-20", "shift", rates)).toMatchObject({ pct: 10, charge: 40000 });
    expect(cancellationCharge(b, "2026-09-25", "cancel", rates)).toMatchObject({ pct: 50, charge: 200000 });
  });
});

describe("capacityCheck", () => {
  it("warns above capacity", () => {
    expect(capacityCheck("hall-1", "full_banquet", 900, rates).status).toBe("ok");
    expect(capacityCheck("hall-1", "full_banquet", 1100, rates).status).toBe("over");
    expect(capacityCheck("hall-4", "theatre", 3440, rates).status).toBe("near");
    expect(capacityCheck("hall-5", "theatre", 100, rates).status).toBe("unknown");
  });
});

describe("extraGuestCharge", () => {
  it("charges only above +10%", () => {
    expect(extraGuestCharge(500, 550, rates).amount).toBe(0);
    expect(extraGuestCharge(500, 560, rates).amount).toBe(60 * 130);
  });
});
