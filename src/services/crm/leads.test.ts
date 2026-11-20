import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  const m = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size; }, clear: () => m.clear() },
  });
});
import { addDays, format } from "date-fns";
import { db } from "@/lib/crm/db";
import { LEAD_STAGES } from "@/types/crm";
import { assignLead, cancelBooking, confirmBooking, createBooking, createManualLead, setLeadStage } from "./index";

const date = format(addDays(new Date(), 90), "yyyy-MM-dd");

describe("leads funnel", () => {
  it("seeds a 50 → 38 → 22 → 15 → 10 funnel", () => {
    const l = db.leads.all();
    expect(LEAD_STAGES.map((_, i) => l.filter((x) => LEAD_STAGES.indexOf(x.stage) >= i).length)).toEqual([50, 38, 22, 15, 10]);
  });

  it("staff cannot mark a lead Customer by hand", () => {
    const lead = createManualLead({ name: "Lead Test", mobile: "01711-111111", eventName: "Gala", eventType: "Corporate", guests: 300, channel: "Phone call" });
    expect(() => setLeadStage(lead.id, "customer")).toThrow();
    expect(db.leads.get(lead.id)!.stage).toBe("discover");
  });

  it("booking reserved → Confirmed, booked → Customer, cancelled → Lost", () => {
    const lead = createManualLead({ name: "Lead Two", mobile: "01711-222222", eventName: "Dinner", eventType: "Corporate", guests: 300, channel: "Walk-in" });
    const b = createBooking({ leadId: lead.id, name: lead.name, mobile: lead.mobile, eventName: "Dinner", eventType: "Corporate", hallId: "pushpanjali", date, guests: 300 }, "staff");
    expect(db.leads.get(lead.id)).toMatchObject({ stage: "confirmed", bookingId: b.id });
    confirmBooking(b.id);
    expect(db.leads.get(lead.id)!.stage).toBe("customer");
    cancelBooking(b.id);
    expect(db.leads.get(lead.id)).toMatchObject({ stage: "confirmed", lost: true, lostReason: "Booking cancelled" });
  });

  it("a lead can be assigned to several people", () => {
    const lead = createManualLead({ name: "Lead Three", mobile: "01711-444444", eventName: "Expo", eventType: "Exhibition", guests: 900, channel: "Referral", ownerIds: ["u-sales"] });
    assignLead(lead.id, ["u-sales", "u-sales2"]);
    expect(db.leads.get(lead.id)!.ownerIds).toEqual(["u-sales", "u-sales2"]);
    expect(db.leads.get(lead.id)!.activity[0].text).toBe("Assigned to Nusrat Jahan, Rafiq Hasan");
    expect(db.leads.all().some((l) => l.ownerIds.length > 1)).toBe(true);
  });

  it("website booking creates a traceable Website lead", () => {
    const b = createBooking({ name: "Web Visitor", mobile: "01711-333333", eventName: "Holud", eventType: "Wedding", hallId: "rajdarshan", date, guests: 400 }, "website");
    const lead = db.leads.all().find((l) => l.bookingId === b.id)!;
    expect(lead).toMatchObject({ source: "website", stage: "discover" });
    expect(lead.trace.bookingRef).toBe(b.ref);
  });
});
