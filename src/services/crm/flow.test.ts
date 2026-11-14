import { describe, expect, it, vi } from "vitest";

// Node's built-in localStorage is incomplete without a file; use an in-memory one.
vi.hoisted(() => {
  const m = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size; }, clear: () => m.clear() },
  });
});
import { addDays, format } from "date-fns";
import { db } from "@/lib/crm/db";
import { addPayment, cancelBooking, closeEvent, confirmBooking, createBooking, deleteBooking, isDateTaken, restoreBooking } from "./index";

const date = format(addDays(new Date(), 40), "yyyy-MM-dd");
const input = { name: "Test Client", mobile: "01711-000000", eventName: "Test Wedding", eventType: "Wedding" as const, hallId: "gulnaksha", date, guests: 500, meeting: { date, time: "12:00" } };

describe("booking journey", () => {
  it("seeds 5–6 records per list", () => {
    expect(db.bookings.all()).toHaveLength(9);
    expect(db.clients.all()).toHaveLength(8);
    expect(db.payments.all()).toHaveLength(8);
    expect(db.meetings.all()).toHaveLength(6);
    expect(db.enquiries.all()).toHaveLength(8);
    expect(db.halls.all()).toHaveLength(5);
    expect(db.radar.all()).toHaveLength(8);
    expect(db.menus.all().length).toBeGreaterThan(5);
    expect(db.services.all().length).toBeGreaterThan(10);
  });

  it("website form → Reserved + enquiry + meeting, date is held", () => {
    const b = createBooking(input, "website");
    expect(b.status).toBe("reserved");
    expect(b.ref).toMatch(/^ICCB-\d{4}-0010$/);
    expect(db.enquiries.all().some((e) => e.bookingId === b.id && e.type === "booking" && !e.seen)).toBe(true);
    expect(db.meetings.all().some((m) => m.bookingId === b.id)).toBe(true);
    expect(isDateTaken("gulnaksha", date)).toBe(true);
    // a new client is created from the mobile number, and reused next time
    expect(db.clients.all().find((c) => c.id === b.clientId)?.name).toBe("Test Client");
    expect(() => createBooking(input, "staff")).toThrow(/already reserved/);
  });

  it("confirm → booked, cancel frees the date, history is logged", () => {
    const b = db.bookings.all().find((x) => x.date === date)!;
    confirmBooking(b.id);
    expect(db.bookings.get(b.id)!.status).toBe("booked");
    cancelBooking(b.id);
    expect(db.bookings.get(b.id)!.status).toBe("cancelled");
    expect(isDateTaken("gulnaksha", date)).toBe(false);
    expect(db.bookings.get(b.id)!.history.map((h) => h.text)).toEqual(expect.arrayContaining(["Booking confirmed", "Cancelled — date released"]));
  });

  it("staff booking skips the enquiry feed; payments, close and undo-delete work", () => {
    const before = db.enquiries.all().length;
    const b = createBooking({ ...input, meeting: null }, "staff");
    expect(db.enquiries.all()).toHaveLength(before);
    expect(b.clientId).toBe(db.bookings.all().find((x) => x.name === "Test Client" && x.id !== b.id)?.clientId);
    const p = addPayment(b.id, { amount: 1000, date, method: "Cash", kind: "Advance" });
    expect(p.receiptNo).toBe("0009");
    confirmBooking(b.id);
    closeEvent(b.id);
    expect(db.bookings.get(b.id)!.status).toBe("closed");
    const snap = deleteBooking(b.id)!;
    expect(db.bookings.get(b.id)).toBeUndefined();
    expect(db.payments.get(p.id)).toBeUndefined();
    restoreBooking(snap);
    expect(db.bookings.get(b.id)).toBeDefined();
    expect(db.payments.get(p.id)).toBeDefined();
  });
});
