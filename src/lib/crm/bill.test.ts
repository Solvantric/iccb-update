import { describe, expect, it } from "vitest";
import { calcBill, dayOfWeek, type BillRates } from "./bill";

const rates: BillRates = {
  halls: [{ id: "h1", name: "Hall 1", code: "H1", capacity: 1000, areaSqft: 20000, weekdayRate: 200_000, weekendRate: 250_000, extraHourRate: 15_000, features: [], active: true, createdAt: "" }],
  addOns: { decorationBasic: 50_000, decorationStandard: 90_000, decorationPremium: 120_000, outsideA: 120_000, outsideB: 75_000, outsideC: 50_000, breakfast: 400, lunch: 900, snacks: 300, dinner: 1_100, serviceChargeMain: 125, serviceChargeLight: 15 },
  weekendDays: [5, 6],
  menus: [{ id: "m1", name: "Royal", meal: "dinner", perHead: 2_000, items: [], active: true, createdAt: "" }],
  services: [{ id: "s1", name: "Sound", category: "Sound & light", unit: "day", rate: 45_000, active: true, createdAt: "" }],
  foodVatPercent: 15,
  securityByType: { Wedding: 75_000 },
};

const none = { decoration: "none" as const };

describe("calcBill", () => {
  it("uses weekday and weekend hall rates", () => {
    expect(dayOfWeek("2026-11-16")).toBe(1); // Monday
    expect(calcBill({ hallId: "h1", date: "2026-11-16", addOns: none, discount: 0 }, rates).total).toBe(200_000);
    const weekend = calcBill({ hallId: "h1", date: "2026-11-20", addOns: none, discount: 0 }, rates);
    expect(weekend.isWeekend).toBe(true);
    expect(weekend.total).toBe(250_000);
  });

  it("adds extra hours, decoration, menus, services and custom lines", () => {
    const bill = calcBill(
      { hallId: "h1", date: "2026-11-16", discount: 0, addOns: { decoration: "premium", extraHours: 2, lunch: { persons: 100 }, dinner: { persons: 50, menuId: "m1" }, services: [{ serviceId: "s1", qty: 1 }], custom: [{ id: "c", name: "Flowers", qty: 2, rate: 1_000 }] } },
      rates
    );
    expect(bill.groupTotals.Venue).toBe(200_000 + 30_000);
    expect(bill.groupTotals.Decoration).toBe(120_000);
    // lunch 100 × 900 + dinner 50 × 2000 (menu) + service charge 150 × 125
    expect(bill.groupTotals.Food).toBe(90_000 + 100_000 + 18_750);
    expect(bill.groupTotals.Services).toBe(45_000);
    expect(bill.groupTotals.Other).toBe(2_000);
  });

  it("applies discount, food VAT, paid, due and security", () => {
    const bill = calcBill({ hallId: "h1", date: "2026-11-16", eventType: "Wedding", addOns: { decoration: "basic", breakfast: { persons: 100 } }, discount: 10_000 }, rates, 100_000);
    const food = 100 * 400 + 100 * 15;
    expect(bill.vat).toBe(Math.round(food * 0.15));
    expect(bill.total).toBe(200_000 + 50_000 + food - 10_000 + bill.vat);
    expect(bill.due).toBe(bill.total - 100_000);
    expect(bill.security).toBe(75_000);
    const over = calcBill({ hallId: "h1", date: "2026-11-16", addOns: none, discount: 999_999 }, rates, 50);
    expect(over.total).toBe(0);
    expect(over.due).toBe(0);
  });

  it("applies a special price range to hall rent", () => {
    const bill = calcBill({ hallId: "h1", date: "2026-11-17", addOns: none, discount: 0 }, { ...rates, specials: [{ id: "s", from: "2026-11-16", to: "2026-11-18", percent: -10, label: "Low demand", createdAt: "" }] });
    expect(bill.hallRent).toBe(180_000);
    expect(bill.special?.label).toBe("Low demand");
  });
});
