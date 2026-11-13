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
