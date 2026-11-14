import { describe, expect, it } from "vitest";
import { bookingsSeed, clientsSeed, paymentsSeed } from "@/data/crm/_generated";
import { radarEventsSeed } from "@/data/crm/radar-events";
import { amountInWords, taka } from "./format";

describe("seed data", () => {
  it("has 25–40 bookings across all statuses and closures", () => {
    expect(bookingsSeed.length).toBeGreaterThanOrEqual(25);
    expect(bookingsSeed.length).toBeLessThanOrEqual(40);
    const statuses = new Set(bookingsSeed.map((b) => b.status));
    expect(statuses).toEqual(new Set(["requested", "confirmed", "completed"]));
    expect(bookingsSeed.some((b) => b.closed?.kind === "cancelled")).toBe(true);
    expect(bookingsSeed.some((b) => b.closed?.kind === "lost")).toBe(true);
  });
  it("uses unique ICCB numbers and sample flags", () => {
    expect(new Set(bookingsSeed.map((b) => b.bfNo)).size).toBe(bookingsSeed.length);
    expect(bookingsSeed.every((b) => /^ICCB\d{6}\d{6}$/.test(b.bfNo))).toBe(true);
    expect(clientsSeed.every((c) => /^C\d{6}\d{4}$/.test(c.clientNo) && c.isSample)).toBe(true);
    expect(new Set(paymentsSeed.map((p) => p.mrNo)).size).toBe(paymentsSeed.length);
    expect(paymentsSeed.every((p) => /^MR\d{6}\d{7}$/.test(p.mrNo))).toBe(true);
    expect(paymentsSeed.every((p) => bookingsSeed.some((b) => b.id === p.bookingId))).toBe(true);
  });
  it("has 30+ radar items", () => expect(radarEventsSeed.length).toBeGreaterThanOrEqual(30));
});

describe("money format", () => {
  it("formats taka and words", () => {
    expect(taka(1258215, { decimals: true })).toBe("৳ 1,258,215.00");
    expect(taka(1258215, { grouping: "bd" })).toBe("৳ 12,58,215");
    expect(amountInWords(1258215)).toBe("Twelve Lakh Fifty-Eight Thousand Two Hundred Fifteen Taka Only");
  });
});

describe("business-feature seeds", async () => {
  const { portalSeed, vendorReviewsSeed, paymentsSeed: pays } = await import("@/data/crm/_generated");
  const { vendorsSeed } = await import("@/data/crm/vendors");
  const { offersSeed } = await import("@/data/crm/offers");
  const { buildEstimate, ratesAsOf, ratesFromSeed } = await import("./pricing");
  const { dueSchedule, refundRow } = await import("./collections");
  const { format } = await import("date-fns");
  const rates = ratesAsOf(ratesFromSeed());
  const today = format(new Date(), "yyyy-MM-dd");

  it("has 4+ completed bookings with open leakage and resolved history", () => {
    const withOpen = bookingsSeed.filter((b) => b.status === "completed" && b.leakage?.some((f) => f.status === "open"));
    expect(withOpen.length).toBeGreaterThanOrEqual(4);
    const rules = new Set(bookingsSeed.flatMap((b) => b.leakage ?? []).map((f) => f.ruleId));
    for (const r of ["EXTRA_HOURS", "EXTRA_GUESTS", "GENERATOR", "CHAIR_COVER", "EXTERNAL_LIGHTING"]) expect(rules).toContain(r);
    expect(bookingsSeed.some((b) => b.leakage?.some((f) => f.status === "added"))).toBe(true);
    expect(bookingsSeed.some((b) => b.leakage?.some((f) => f.status === "waived"))).toBe(true);
  });

  it("has portal links, offers and vendors", () => {
    expect(portalSeed).toHaveLength(2);
    expect(portalSeed.every((p) => p.token.length === 24)).toBe(true);
    expect(new Set(offersSeed.map((o) => o.status))).toEqual(new Set(["draft", "active", "ended"]));
    expect(vendorsSeed).toHaveLength(8);
    expect(vendorsSeed.some((v) => v.status === "warning") && vendorsSeed.some((v) => v.status === "blacklisted")).toBe(true);
    expect(vendorReviewsSeed.length).toBeGreaterThan(3);
  });

  it("has overdue balances in every aging bucket and 3+ pending refunds (1 overdue)", () => {
    const ctx = { today, balanceDueDays: 15, advancePct: 60, holidays: [] };
    const recs = bookingsSeed
      .filter((b) => !b.closed && b.status !== "requested")
      .map((b) => dueSchedule(b, buildEstimate(b, rates, { payments: pays.filter((p) => p.bookingId === b.id) }), ctx));
    const buckets = new Set(recs.map((r) => r.bucket).filter(Boolean));
    expect(buckets).toEqual(new Set(["1–7", "8–15", "16–30", "30+"]));
    const refunds = bookingsSeed
      .filter((b) => !b.closed)
      .map((b) => refundRow(b, buildEstimate(b, rates, { payments: pays.filter((p) => p.bookingId === b.id) }), { today, holidays: [] }))
      .filter((r) => r && r.status !== "refunded");
    expect(refunds.length).toBeGreaterThanOrEqual(3);
    expect(refunds.some((r) => r!.overdue)).toBe(true);
  });
});
