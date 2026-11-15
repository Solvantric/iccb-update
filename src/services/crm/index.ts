"use client";
/**
 * CRM actions. Every page and the public website call these — swap the bodies
 * for API calls later; the UI stays the same.
 */
import { addDays, format } from "date-fns";
import { nanoid } from "nanoid";
import type { AddOns, Booking, BookingStatus, Client, ContentItem, DamageItem, Enquiry, EnquirySource, EventType, Feedback, Layout, Meeting, Payment, PaymentKind, PaymentMethod, RadarItem, RunStep, Slot } from "@/types/crm";
import { normMobile, validateContact } from "@/types/crm";
import { db, currentUser, getSettings } from "@/lib/crm/db";
import { radarExtra } from "@/data/crm/seed";
import { trackCrm } from "@/lib/crm/track";

const nowIso = () => new Date().toISOString();
const staffName = () => currentUser()?.name ?? "Staff";
const pad = (n: number) => String(n).padStart(4, "0");

/* ─── Availability ───────────────────────────────────────────────────────── */

const HOLDS: BookingStatus[] = ["reserved", "booked"];

/** A hall + date can have only one Reserved or Booked record. */
export function isDateTaken(hallId: string, date: string, exceptId?: string) {
  return db.bookings.all().some((b) => b.hallId === hallId && b.date === date && HOLDS.includes(b.status) && b.id !== exceptId);
}

export function takenDates(bookings: Booking[], hallId: string): Set<string> {
  return new Set(bookings.filter((b) => b.hallId === hallId && HOLDS.includes(b.status)).map((b) => b.date));
}

/* ─── Bookings ───────────────────────────────────────────────────────────── */

function nextRef() {
  const prefix = getSettings().refPrefix || "ICCB";
  const year = new Date().getFullYear();
  const max = db.bookings.all().reduce((m, b) => Math.max(m, Number(b.ref.match(/(\d+)$/)?.[1] ?? 0)), 0);
  return `${prefix}-${year}-${pad(max + 1)}`;
}

export interface BookingInput {
  name: string;
  mobile: string;
  email?: string;
  eventName: string;
  eventType: EventType;
  hallId: string;
  date: string;
  guests: number;
  slot?: Slot;
  layout?: Layout;
  organization?: string;
  note?: string;
  /** "I'd like to meet ICCB at the venue" */
  meeting?: { date: string; time: string } | null;
}

export function validateBooking(i: BookingInput): string | null {
  const c = validateContact(i.name, i.mobile);
  if (c) return c;
  if (!i.eventName.trim()) return "Please enter an event name.";
  if (!i.hallId) return "Please choose a hall.";
  if (!i.date) return "Please choose a date.";
  if (!i.guests || i.guests < 1) return "Please enter the approximate number of guests.";
  if (isDateTaken(i.hallId, i.date)) return "This hall is already reserved on that date. Please pick another date.";
  return null;
}

/** Website form or "New booking" modal → a Reserved booking (+ enquiry, + meeting if asked). */
export function createBooking(input: BookingInput, source: "website" | "staff"): Booking {
  const err = validateBooking(input);
  if (err) throw new Error(err);
  const by = source === "website" ? "Website" : staffName();
  const client = upsertClient({ name: input.name, mobile: input.mobile, email: input.email, organization: input.organization });
  const booking = db.bookings.create({
    ref: nextRef(),
    clientId: client.id,
    organization: input.organization?.trim() || client.organization,
    name: input.name.trim(),
    mobile: input.mobile.trim(),
    email: input.email?.trim() || undefined,
    eventName: input.eventName.trim(),
    eventType: input.eventType,
    hallId: input.hallId,
    date: input.date,
    guests: Number(input.guests),
    slot: input.slot ?? "Evening (5 PM – 11 PM)",
    layout: input.layout ?? (["Conference", "Corporate"].includes(input.eventType) ? "Theatre" : input.eventType === "Exhibition" ? "Exhibition booths" : "Banquet with stage"),
    note: input.note?.trim().slice(0, 300) || undefined,
    status: "reserved",
    contacted: false,
    addOns: { decoration: "none" },
    discount: 0,
    source,
    history: [{ at: nowIso(), by, text: source === "website" ? "Reserved from the website form" : "Created by staff" }],
  });
  const hall = db.halls.get(input.hallId)?.name ?? "";
  // Enquiries list website submissions only; walk-in/phone bookings skip it.
  if (source === "website") {
    db.enquiries.create({
      type: "booking",
      source: "Booking form",
      bookingId: booking.id,
      name: booking.name,
      mobile: booking.mobile,
      email: booking.email,
      message: [booking.eventName, hall, `${booking.guests.toLocaleString("en-IN")} guests`].filter(Boolean).join(" · ") + (booking.note ? `\n${booking.note}` : ""),
      seen: false,
    });
  }
  if (input.meeting?.date) {
    createMeeting({ bookingId: booking.id, clientName: booking.name, mobile: booking.mobile, date: input.meeting.date, time: input.meeting.time || "11:00", type: "Site visit", rep: "Unassigned", location: "ICCB reception", note: "Requested on the booking form" });
  }
  if (source === "website") trackCrm("form_submit", "/booking");
  return booking;
}

const log = (b: Booking, text: string) => [...b.history, { at: nowIso(), by: staffName(), text }];

export function updateBooking(id: string, patch: Partial<Booking>, note = "Details updated") {
  const prev = db.bookings.get(id);
  if (!prev) throw new Error("Booking not found");
  const hallId = patch.hallId ?? prev.hallId;
  const date = patch.date ?? prev.date;
  if ((hallId !== prev.hallId || date !== prev.date) && HOLDS.includes(prev.status) && isDateTaken(hallId, date, id)) throw new Error("That hall is already taken on this date.");
  return db.bookings.update(id, (b) => ({ ...patch, history: note ? log(b, note) : b.history }));
}

export function setAddOns(id: string, addOns: AddOns, discount?: number) {
  return db.bookings.update(id, (b) => ({ addOns, discount: discount ?? b.discount }));
}

function setStatus(id: string, status: BookingStatus, text: string) {
  return db.bookings.update(id, (b) => ({ status, history: log(b, text) }));
}

export const confirmBooking = (id: string) => setStatus(id, "booked", "Booking confirmed");
export const closeEvent = (id: string) => setStatus(id, "closed", "Event closed");
export const cancelBooking = (id: string) => setStatus(id, "cancelled", "Cancelled — date released");

export function toggleContacted(id: string) {
  return db.bookings.update(id, (b) => ({ contacted: !b.contacted, history: log(b, b.contacted ? "Contacted tag removed" : "Marked as contacted") }));
}

export interface BookingSnapshot {
  booking: Booking;
  payments: Payment[];
  meetings: Meeting[];
  enquiries: Enquiry[];
  index: number;
}

/** Delete a booking with its payments/meetings; returns a snapshot for "Undo". */
export function deleteBooking(id: string): BookingSnapshot | null {
  const booking = db.bookings.get(id);
  if (!booking) return null;
  const snap: BookingSnapshot = {
    booking,
    index: db.bookings.all().findIndex((b) => b.id === id),
    payments: db.payments.all().filter((p) => p.bookingId === id),
    meetings: db.meetings.all().filter((m) => m.bookingId === id),
    enquiries: db.enquiries.all().filter((e) => e.bookingId === id),
  };
  db.bookings.remove(id);
  snap.payments.forEach((p) => db.payments.remove(p.id));
  snap.meetings.forEach((m) => db.meetings.remove(m.id));
  snap.enquiries.forEach((e) => db.enquiries.update(e.id, { bookingId: undefined }));
  return snap;
}

export function restoreBooking(s: BookingSnapshot) {
  db.bookings.insert(s.booking, s.index);
  s.payments.forEach((p) => db.payments.insert(p));
  s.meetings.forEach((m) => db.meetings.insert(m));
  s.enquiries.forEach((e) => db.enquiries.update(e.id, { bookingId: s.booking.id }));
}

/* ─── Payments ───────────────────────────────────────────────────────────── */

export function addPayment(bookingId: string, input: { amount: number; date: string; method: PaymentMethod; kind?: PaymentKind; reference?: string; note?: string }) {
  if (!(input.amount > 0)) throw new Error("Please enter an amount.");
  if (!input.date) throw new Error("Please pick a date.");
  const max = db.payments.all().reduce((m, p) => Math.max(m, Number(p.receiptNo) || 0), 0);
  const p = db.payments.create({
    receiptNo: pad(max + 1),
    bookingId,
    kind: input.kind ?? "Installment",
    amount: Math.round(input.amount),
    date: input.date,
    method: input.method,
    reference: input.reference?.trim() || undefined,
    note: input.note?.trim() || undefined,
    receivedBy: staffName(),
  });
  db.bookings.update(bookingId, (b) => ({ history: log(b, `${p.kind} ${p.receiptNo} recorded`) }));
  return p;
}

export function deletePayment(id: string) {
  const p = db.payments.remove(id);
  if (p && db.bookings.get(p.bookingId)) db.bookings.update(p.bookingId, (b) => ({ history: log(b, `Payment ${p.receiptNo} removed`) }));
  return p;
}

/* ─── Meetings ───────────────────────────────────────────────────────────── */

export function createMeeting(input: Omit<Meeting, "id" | "createdAt" | "status"> & { status?: Meeting["status"] }) {
  const m = db.meetings.create({ ...input, status: input.status ?? "scheduled" });
  if (m.bookingId && db.bookings.get(m.bookingId)) {
    db.bookings.update(m.bookingId, (b) => ({ history: [...b.history, { at: nowIso(), by: staffName(), text: `Meeting scheduled for ${format(new Date(`${m.date}T00:00:00`), "d MMM")}, ${m.time}` }] }));
  }
  return m;
}
export const updateMeeting = (id: string, patch: Partial<Meeting>) => db.meetings.update(id, patch);
export const deleteMeeting = (id: string) => db.meetings.remove(id);

/* ─── Enquiries ──────────────────────────────────────────────────────────── */

export const markEnquirySeen = (id: string) => db.enquiries.get(id)?.seen === false && db.enquiries.update(id, { seen: true });

/** Website question / contact / chatbot forms → a "question" enquiry. */
const SOURCE_BY_TYPE: Record<string, EnquirySource> = { ask: "Ask a question", contact: "Contact form", enquiry: "Enquiry form", chatbot: "Chatbot" };

export async function submitEnquiry(input: { name: string; mobile?: string; email?: string; message?: string; type?: string; [extra: string]: unknown }): Promise<Enquiry> {
  await new Promise((r) => setTimeout(r, 300));
  if (!input.name?.trim()) throw new Error("Please enter your name.");
  if (!input.mobile?.trim() && !input.email?.trim()) throw new Error("Please enter a phone number or email.");
  return db.enquiries.create({ type: "question", source: SOURCE_BY_TYPE[input.type ?? ""] ?? "Contact form", name: input.name.trim(), mobile: input.mobile?.trim() || "—", email: input.email?.trim() || undefined, message: (input.message ?? "").trim() || "(no message)", seen: false });
}

/* ─── Clients ──────────────────────────────────────────────────────────── */

function nextClientNo() {
  const max = db.clients.all().reduce((m, c) => Math.max(m, Number(c.clientNo.match(/(\d+)$/)?.[1] ?? 0)), 0);
  return `C-${pad(max + 1)}`;
}

export const findClientByMobile = (mobile: string) => db.clients.all().find((c) => normMobile(c.mobile) === normMobile(mobile));

/** Same mobile = same client. New clients are created; known ones get missing details filled in. */
export function upsertClient(input: { name: string; mobile: string; email?: string; organization?: string }): Client {
  const found = findClientByMobile(input.mobile);
  if (found) {
    const patch: Partial<Client> = {};
    if (!found.email && input.email?.trim()) patch.email = input.email.trim();
    if (!found.organization && input.organization?.trim()) patch.organization = input.organization.trim();
    return Object.keys(patch).length ? db.clients.update(found.id, patch) : found;
  }
  return db.clients.create({
    clientNo: nextClientNo(),
    name: input.name.trim(),
    mobile: input.mobile.trim(),
    email: input.email?.trim() || undefined,
    organization: input.organization?.trim() || undefined,
    type: input.organization?.trim() ? "Corporate" : "Individual",
    tags: [],
  });
}

export function saveClient(input: Omit<Client, "id" | "createdAt" | "clientNo"> & { id?: string }) {
  const err = validateContact(input.name, input.mobile);
  if (err) throw new Error(err);
  const dup = findClientByMobile(input.mobile);
  if (dup && dup.id !== input.id) throw new Error(`${dup.name} (${dup.clientNo}) already uses this mobile.`);
  const data = { ...input, name: input.name.trim(), mobile: input.mobile.trim(), tags: input.tags.map((t) => t.trim()).filter(Boolean) };
  if (input.id) {
    const c = db.clients.update(input.id, data);
    // keep linked bookings' contact details in sync
    db.bookings.all().filter((b) => b.clientId === c.id).forEach((b) => db.bookings.update(b.id, { name: c.name, mobile: c.mobile, email: c.email, organization: c.organization }));
    return c;
  }
  return db.clients.create({ ...data, clientNo: nextClientNo() });
}

export function deleteClient(id: string) {
  if (db.bookings.all().some((b) => b.clientId === id)) throw new Error("This client has bookings — delete those first.");
  return db.clients.remove(id);
}

/* ─── Operations ─────────────────────────────────────────────────────────── */

export function toggleRunStep(id: string, step: RunStep) {
  return db.bookings.update(id, (b) => {
    const on = !b.runSheet?.[step];
    return { runSheet: { ...b.runSheet, [step]: on }, history: on ? log(b, `Run sheet: ${step}`) : b.history };
  });
}

export function saveFeedback(id: string, feedback: Omit<Feedback, "at">, actualGuests?: number) {
  return db.bookings.update(id, (b) => ({ feedback: { ...feedback, at: nowIso() }, actualGuests: actualGuests ?? b.actualGuests, history: log(b, "Client feedback recorded") }));
}

export function saveDamages(id: string, damages: DamageItem[]) {
  const clean = damages.filter((d) => d.item.trim() && d.qty > 0);
  return db.bookings.update(id, (b) => ({ damages: clean, history: log(b, clean.length ? `Damage claim: ${clean.length} item(s)` : "Damage claim cleared") }));
}

/* ─── Client review links ────────────────────────────────────────────────── */

/** A one-time review link for a booking's client (or a general one). */
export function createReviewLink(bookingId?: string) {
  const b = bookingId ? db.bookings.get(bookingId) : undefined;
  const open = db.reviews.all().find((r) => r.bookingId && r.bookingId === bookingId && r.status === "pending");
  if (open) return open;
  return db.reviews.create({
    token: nanoid(14),
    bookingId: b?.id,
    clientName: b?.name ?? "Any client",
    mobile: b?.mobile,
    eventName: b?.eventName,
    sentBy: staffName(),
    status: "pending",
  });
}

export const findReview = (token: string) => db.reviews.all().find((r) => r.token === token);

export function submitReview(token: string, input: { answers: number[]; comment?: string; reviewerName: string; reviewerMobile?: string }) {
  const r = findReview(token);
  if (!r) throw new Error("This review link is not valid.");
  if (r.status === "submitted") throw new Error("This review was already submitted. Thank you!");
  if (input.answers.length !== 10 || input.answers.some((a) => !(a >= 1 && a <= 4))) throw new Error("Please answer all 10 questions.");
  if (!input.reviewerName.trim()) throw new Error("Please enter your name.");
  const done = db.reviews.update(r.id, { status: "submitted", answers: input.answers, comment: input.comment?.trim() || undefined, reviewerName: input.reviewerName.trim(), reviewerMobile: input.reviewerMobile?.trim() || undefined, submittedAt: nowIso() });
  if (r.bookingId && db.bookings.get(r.bookingId)) db.bookings.update(r.bookingId, (b) => ({ history: [...b.history, { at: nowIso(), by: done.reviewerName ?? "Client", text: "Client review submitted" }] }));
  return done;
}

export const deleteReview = (id: string) => db.reviews.remove(id);

/* ─── Marketing ──────────────────────────────────────────────────────────── */

export const dismissRadar = (id: string) => db.radar.update(id, { dismissed: true });

/** Simulated refresh: the next sample idea appears (live AI connects later). */
export function refreshRadar(scope: RadarItem["scope"]): RadarItem | null {
  const titles = new Set(db.radar.all().map((r) => r.title));
  const next = radarExtra.find((r) => r.scope === scope && !titles.has(r.title)) ?? radarExtra.find((r) => !titles.has(r.title));
  if (!next) return null;
  return db.radar.create({ ...next, createdAt: nowIso() });
}

export function applySpecialPrice(from: string, to: string, percent: number, label: string) {
  return db.specials.create({ from, to, percent, label });
}

export function reorderContent(section: ContentItem["section"], orderedIds: string[]) {
  const pos = new Map(orderedIds.map((id, i) => [id, i]));
  db.content.replaceAll(db.content.all().map((c) => (c.section === section && pos.has(c.id) ? { ...c, order: pos.get(c.id)! } : c)));
}

/* ─── Small helpers ──────────────────────────────────────────────────────── */

export const dateAfter = (date: string, days: number) => format(addDays(new Date(`${date}T00:00:00`), days), "yyyy-MM-dd");
