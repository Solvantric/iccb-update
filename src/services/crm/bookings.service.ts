"use client";
import { addDays, format, subDays } from "date-fns";
import { nanoid } from "nanoid";
import type {
  ActivityItem,
  Booking,
  BookingRequestInput,
  BookingStatus,
  Client,
  DamageClaim,
  DocKind,
  Evaluation,
  FactSheet,
  Invoice,
  Notification,
  Payment,
  PaymentInput,
  Role,
  Task,
} from "@/types/crm";
import { requireNameAndPhone, STATUS_LABELS } from "@/types/crm";
import { currentUser, db, getRates, getSettings, nextNumber, nextProgramRegNo } from "@/lib/crm/db";
import { buildEstimate, cancellationCharge, extraGuestCharge, firstEventDate, lastEventDate, parseYmd, tariffFor, type Estimate } from "@/lib/crm/pricing";
import { balanceDueDate, defaultDocuments, evaluationScore, ppmDueDate, refundDueDate } from "@/lib/crm/rules";
import { guardFor, type FlowContext } from "@/lib/crm/workflow";
import { taka } from "@/lib/crm/format";
import { buildDocModel, type DocInput } from "@/lib/crm/documents";
import { liveFindings, openFindings } from "@/lib/crm/leakage";
import { withLatency } from "./base";

const ymd = (d: Date) => format(d, "yyyy-MM-dd");
const now = () => new Date().toISOString();
const MANAGERS: Role[] = ["sales_manager", "admin"];

/* ─── Shared helpers ─────────────────────────────────────────────────────── */

export function notify(n: Omit<Notification, "id" | "createdAt" | "updatedAt" | "read"> & { read?: boolean }) {
  return db.notifications.create({ read: false, ...n }, { silent: true });
}

export function estimateFor(b: Booking, payments = db.payments.active().filter((p) => p.bookingId === b.id)): Estimate {
  return buildEstimate(b, getRates(b.priceVersion), { payments, advancePct: getSettings().advancePct });
}

export function flowContext(b: Booking): FlowContext {
  const payments = db.payments.active().filter((p) => p.bookingId === b.id);
  return {
    estimate: estimateFor(b, payments),
    payments,
    documents: db.invoices.active().filter((d) => d.bookingId === b.id),
    advancePct: getSettings().advancePct,
  };
}

/** Live leakage findings for a booking (detection merged with the stored resolution history). */
export function findingsFor(b: Booking) {
  return liveFindings(b, getRates(b.priceVersion), { discountApprovalThreshold: getSettings().discountApprovalThreshold }, estimateFor(b));
}

/** Recompute and store findings after the PPM, Fact Sheet or bill lines change. */
export function syncLeakage(id: string) {
  const b = db.bookings.get(id);
  if (!b || b.status === "requested") return b;
  const leakage = findingsFor(b);
  const same = JSON.stringify(leakage.map((f) => [f.id, f.status, f.expectedAmount])) === JSON.stringify((b.leakage ?? []).map((f) => [f.id, f.status, f.expectedAmount]));
  if (same) return b;
  const before = openFindings(b.leakage ?? []).length;
  const after = openFindings(leakage).length;
  if (after > before && b.assignedTo) {
    const amount = openFindings(leakage).reduce((s, f) => s + f.expectedAmount, 0);
    notify({ title: "Unbilled items found", body: `${b.bfNo} · ${taka(amount)} not on the bill (${after} item${after > 1 ? "s" : ""})`, kind: "payment", href: `/dashboard/sales/bookings/${id}?tab=services`, userId: b.assignedTo });
  }
  return db.bookings.update(id, { leakage }, { silent: true });
}

function activity(type: ActivityItem["type"], text: string): ActivityItem {
  return { id: nanoid(8), at: now(), by: currentUser().name, type, text };
}

function pushActivity(b: Booking, type: ActivityItem["type"], text: string): Pick<Booking, "activity"> {
  return { activity: [...b.activity, activity(type, text)] };
}

const getBooking = (id: string) => {
  const b = db.bookings.get(id);
  if (!b) throw new Error("Booking not found");
  return b;
};

const userName = (id?: string) => (id ? db.users.get(id)?.name ?? "Unknown" : "Unassigned");

/** Round-robin among active Sales Executives. */
export function nextRepresentative(): string | undefined {
  const reps = db.users.active().filter((u) => u.role === "sales_executive" && u.active).sort((a, b) => a.roundRobinOrder - b.roundRobinOrder);
  if (!reps.length) return undefined;
  const s = getSettings();
  const rep = reps[s.roundRobinCursor % reps.length];
  db.settings.update(s.id, { roundRobinCursor: s.roundRobinCursor + 1 }, { silent: true });
  return rep.id;
}

const digits = (m: string) => m.replace(/\D/g, "").slice(-11);

export function findClientByMobile(mobile: string): Client | undefined {
  const d = digits(mobile);
  return d ? db.clients.active().find((c) => digits(c.mobile) === d) : undefined;
}

function createTask(t: Omit<Task, "id" | "createdAt" | "updatedAt" | "status"> & { status?: Task["status"] }) {
  return db.tasks.create({ status: "open", ...t }, { silent: true });
}

/** Balance (30/20/16 days) + PPM due reminders after confirmation. */
function scheduleConfirmedTasks(b: Booking) {
  const event = firstEventDate(b);
  if (!event) return;
  const ev = parseYmd(event);
  const today = new Date();
  const due = balanceDueDate(event, getSettings().balanceDueDays);
  for (const d of [30, 20, 16]) {
    const at = subDays(ev, d);
    if (at < today) continue;
    at.setHours(10, 0, 0, 0);
    createTask({ title: `Balance reminder (${d} days) — ${b.eventTitle}`, type: "balance_due", dueAt: at.toISOString(), assignedTo: b.assignedTo, bookingId: b.id, auto: true, notes: `Full payment due ${due}` });
  }
  const ppm = parseYmd(ppmDueDate(event));
  ppm.setHours(11, 0, 0, 0);
  createTask({ title: `PPM due — ${b.eventTitle}`, type: "ppm_due", dueAt: (ppm < today ? today : ppm).toISOString(), assignedTo: b.assignedTo, bookingId: b.id, auto: true });
  const docs = subDays(ev, 5);
  docs.setHours(10, 0, 0, 0);
  if (docs > today) createTask({ title: `Documents due (5 days before) — ${b.eventTitle}`, type: "document_due", dueAt: docs.toISOString(), assignedTo: b.assignedTo, bookingId: b.id, auto: true });
}

/* ─── Create ─────────────────────────────────────────────────────────────── */

export async function createBookingFromRequest(input: BookingRequestInput, opts: { staff?: boolean } = {}) {
  return withLatency(() => {
    const err = requireNameAndPhone(input);
    if (err) throw new Error(err);
    if (!input.days.length) throw new Error("Please add at least one date");

    const today = new Date();
    let client = findClientByMobile(input.mobile);
    if (!client) {
      client = db.clients.create({
        clientNo: nextNumber("client"),
        name: input.name.trim(),
        organization: input.organization || undefined,
        type: input.clientType,
        mobile: input.mobile.trim(),
        phone: input.phone,
        email: input.email || undefined,
        address: input.address,
        tags: input.clientType === "personal" ? ["family"] : ["corporate"],
      });
    }

    const assignedTo = input.assignedTo || nextRepresentative();
    const days = input.days.map((d) => ({ ...d, id: nanoid(6) }));
    const event = days.find((d) => d.dayType === "program")?.date ?? days[0].date;
    const hasFood = input.food.breakfast || input.food.lunch || input.food.snacks || input.food.dinner;
    const source = input.source ?? (opts.staff ? "walk_in" : "website");
    const by = opts.staff ? currentUser().name : "Website";

    const booking = db.bookings.create({
      bfNo: nextNumber("booking"),
      refNo: `${opts.staff ? "STF" : "WEB"}-${nanoid(6).toUpperCase()}`,
      programRegNo: "",
      bookingDate: ymd(today),
      priceVersion: ymd(today),
      clientId: client.id,
      clientType: input.clientType,
      eventTitle: input.eventTitle.trim() || `${input.eventNature} — ${input.name}`,
      eventNature: input.eventNature,
      contact: { name: input.name.trim(), organization: input.organization, address: input.address, phone: input.phone, mobile: input.mobile.trim(), email: input.email },
      emergency: { name: input.emergencyName, mobile: input.emergencyMobile },
      refundAccountName: input.name.trim(),
      days,
      guests: { optimum: input.guests.optimum || 0, maximum: input.guests.maximum || input.guests.optimum || 0 },
      cars: input.cars,
      layout: input.layout ?? "banquet_stage",
      food: input.food,
      menus: [],
      addons: [],
      decoration: { provider: input.decorationProvider },
      discount: { mode: "amount", value: 0, approval: "none" },
      applyAit: false,
      status: "requested",
      closed: null,
      checklist: { form_received: { done: true, at: now(), by }, estimate: { done: true, at: now(), by: "System" } },
      documents: defaultDocuments(input.clientType, input.eventNature, event, hasFood),
      shiftRequest: null,
      assignedTo,
      referredBy: input.referredBy ? { name: input.referredBy } : undefined,
      source,
      tags: [],
      notes: input.notes,
      preferredMeetingTime: input.preferredMeetingTime,
      activity: [
        { id: nanoid(8), at: now(), by, type: "system", text: `Booking request received via ${source.replace("_", "-")}` },
        ...(assignedTo ? [{ id: nanoid(8), at: now(), by: "System", type: "system" as const, text: `Assigned to ${userName(assignedTo)}${input.assignedTo ? "" : " (round-robin)"}` }] : []),
      ],
    });

    const est = estimateFor(booking, []);
    db.invoices.create({ number: nextNumber("estimate"), kind: "estimate", bookingId: booking.id, clientName: client.name, version: 1, total: est.grandTotal, received: 0, balance: est.grandTotal, createdBy: "System" }, { silent: true });

    const dueCall = new Date(Date.now() + getSettings().firstResponseTargetHours * 3600000).toISOString();
    createTask({ title: `Call ${input.name} — new booking request`, type: "call", dueAt: dueCall, assignedTo, bookingId: booking.id, auto: true });

    notify({ title: "New booking request", body: `${input.name} · ${booking.eventTitle} · ${event}`, kind: "booking", href: `/dashboard/sales/bookings/${booking.id}`, userId: null });

    db.leads.create(
      { name: input.name, organization: input.organization, mobile: input.mobile, email: input.email, source, stage: "new", score: 70, eventType: input.eventNature, expectedDate: event, guests: input.guests.optimum, value: est.grandTotal, assignedTo, bookingId: booking.id },
      { silent: true }
    );
    db.analytics.create({ type: "booking_form", page: "/booking", source: "Direct", device: "Desktop", country: "Bangladesh", language: "en", visitorId: client.id, leadName: input.name, hallCode: db.halls.get(days[0].hallId)?.code, at: now() }, { silent: true });

    return booking;
  });
}

/* ─── Generic updates ────────────────────────────────────────────────────── */

export async function updateBooking(id: string, patch: Partial<Booking>, note?: string) {
  return withLatency(() => {
    const b = getBooking(id);
    const after = db.bookings.update(id, { ...patch, ...(note ? pushActivity(b, "change", note) : {}) });
    if ("addons" in patch || "menus" in patch || "decoration" in patch || "days" in patch || "guests" in patch || "food" in patch) return syncLeakage(id) ?? after;
    return after;
  });
}

export async function addNote(id: string, text: string, type: ActivityItem["type"] = "note") {
  return withLatency(() => {
    const b = getBooking(id);
    // Mentions notify the user.
    for (const u of db.users.active()) {
      if (text.includes(`@${u.name.split(" ")[0]}`)) notify({ title: `${currentUser().name} mentioned you`, body: text.slice(0, 120), kind: "booking", href: `/dashboard/sales/bookings/${id}`, userId: u.id });
    }
    return db.bookings.update(id, pushActivity(b, type, text), { silent: true });
  });
}

export async function logCall(id: string, outcome: string) {
  return withLatency(() => {
    const b = getBooking(id);
    db.tasks.active().filter((t) => t.bookingId === id && t.type === "call" && t.status === "open").forEach((t) => db.tasks.update(t.id, { status: "done" }, { silent: true }));
    return db.bookings.update(id, { firstResponseAt: b.firstResponseAt ?? now(), ...pushActivity(b, "call", `Call logged: ${outcome}`) });
  });
}

export async function scheduleMeeting(id: string, at: string, repId?: string) {
  return withLatency(() => {
    const b = getBooking(id);
    const assignedTo = repId || b.assignedTo;
    createTask({ title: `Meeting / site visit — ${b.contact.name}`, type: "meeting", dueAt: at, assignedTo, bookingId: id, auto: true });
    return db.bookings.update(id, { meetingAt: at, assignedTo, ...pushActivity(b, "change", `Meeting scheduled for ${format(new Date(at), "dd MMM yyyy, h:mm a")} with ${userName(assignedTo)}`) });
  });
}

export async function assignBookings(ids: string[], userId: string) {
  return withLatency(() => {
    for (const id of ids) {
      const b = getBooking(id);
      db.bookings.update(id, { assignedTo: userId, ...pushActivity(b, "change", `Assigned to ${userName(userId)}`) });
      notify({ title: "Booking assigned to you", body: `${b.bfNo} · ${b.eventTitle}`, kind: "booking", href: `/dashboard/sales/bookings/${id}`, userId });
    }
  });
}

export async function toggleChecklist(id: string, key: string, done: boolean) {
  return withLatency(() => {
    const b = getBooking(id);
    return db.bookings.update(id, { checklist: { ...b.checklist, [key]: { done, at: now(), by: currentUser().name } } });
  });
}

/* ─── Status flow ────────────────────────────────────────────────────────── */

export class GuardError extends Error {
  missing: string[];
  constructor(missing: string[]) {
    super(`Missing: ${missing.join(", ")}`);
    this.missing = missing;
  }
}

export async function changeStatus(id: string, target: BookingStatus, opts: { reason?: string; override?: boolean } = {}) {
  return withLatency(() => {
    const b = getBooking(id);
    const u = currentUser();
    if (b.status === target) return b;
    const order: BookingStatus[] = ["requested", "confirmed", "completed"];
    const backward = order.indexOf(target) < order.indexOf(b.status);

    if (backward) {
      if (!MANAGERS.includes(u.role)) throw new Error("Only a Sales Manager or Admin can move a booking backward.");
      if (!opts.reason?.trim()) throw new Error("A reason is required to move a booking backward.");
    } else {
      if (target === "confirmed" && !MANAGERS.includes(u.role)) throw new Error("Only a Sales Manager or Admin can approve & confirm.");
      const missing = guardFor(b, target, flowContext(b));
      if (missing.length) {
        if (!opts.override) throw new GuardError(missing.map((m) => m.label));
        if (u.role !== "admin") throw new Error("Only Admin can override the checklist.");
        if (!opts.reason?.trim()) throw new Error("Write a reason for the override.");
      }
    }

    const patch: Partial<Booking> = { status: target };
    if (target === "confirmed" && !backward) {
      patch.approvedBy = u.name;
      patch.approvedAt = now();
      patch.programRegNo = b.programRegNo || nextProgramRegNo();
      patch.checklist = { ...b.checklist, approved: { done: true, at: now(), by: u.name } };
    }
    if (target === "completed") patch.completedAt = now();

    const text = `Status changed: ${STATUS_LABELS[b.status]} → ${STATUS_LABELS[target]}${opts.override ? " (admin override)" : ""}${opts.reason ? ` — ${opts.reason}` : ""}`;
    const after = db.bookings.update(id, { ...patch, ...pushActivity(b, "status", text) }, { action: opts.override ? "override" : backward ? "status" : target === "confirmed" ? "approve" : "status", summary: text });

    if (target === "confirmed" && !backward) scheduleConfirmedTasks(after);
    if (b.assignedTo) notify({ title: `Booking ${STATUS_LABELS[target].toLowerCase()}`, body: `${b.bfNo} · ${b.eventTitle}`, kind: "booking", href: `/dashboard/sales/bookings/${id}`, userId: b.assignedTo });
    if (target === "confirmed") {
      db.leads.active().filter((l) => l.bookingId === id).forEach((l) => db.leads.update(l.id, { stage: "confirmed" }, { silent: true }));
      db.analytics.create({ type: "confirmed", page: "/dashboard", source: "Direct", device: "Desktop", country: "Bangladesh", language: "en", visitorId: b.clientId, leadName: b.contact.name, at: now() }, { silent: true });
    }
    return after;
  });
}

export async function closeBooking(id: string, kind: "cancelled" | "lost", reason: string) {
  return withLatency(() => {
    const b = getBooking(id);
    if (!reason.trim()) throw new Error("Please give a reason.");
    const charge = kind === "cancelled" && b.status !== "requested" ? cancellationCharge(b, ymd(new Date()), "cancel", getRates(b.priceVersion)).charge : 0;
    db.leads.active().filter((l) => l.bookingId === id).forEach((l) => db.leads.update(l.id, { stage: "lost", lostReason: reason }, { silent: true }));
    db.tasks.active().filter((t) => t.bookingId === id && t.status === "open").forEach((t) => db.tasks.update(t.id, { status: "done" }, { silent: true }));
    const text = kind === "cancelled" ? `Booking cancelled — ${reason}${charge ? ` · cancellation charge ${taka(charge)}` : ""}` : `Marked lost — ${reason}`;
    return db.bookings.update(id, { closed: { kind, reason, at: now(), charge }, ...pushActivity(b, "status", text) }, { action: "status", summary: text });
  });
}

export async function reopenBooking(id: string) {
  return withLatency(() => {
    const b = getBooking(id);
    return db.bookings.update(id, { closed: null, ...pushActivity(b, "status", "Booking reopened") }, { action: "status", summary: "Reopened booking" });
  });
}

export async function duplicateBooking(id: string) {
  return withLatency(() => {
    const b = getBooking(id);
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = b;
    void _id; void _c; void _u;
    return db.bookings.create({
      ...rest,
      bfNo: nextNumber("booking"),
      refNo: `DUP-${nanoid(6).toUpperCase()}`,
      programRegNo: "",
      bookingDate: ymd(new Date()),
      priceVersion: ymd(new Date()),
      status: "requested",
      closed: null,
      checklist: { form_received: { done: true, at: now(), by: currentUser().name }, estimate: { done: true, at: now(), by: "System" } },
      ppm: undefined,
      factSheet: undefined,
      evaluation: undefined,
      damage: undefined,
      refund: undefined,
      approvedBy: undefined,
      approvedAt: undefined,
      completedAt: undefined,
      meetingAt: undefined,
      firstResponseAt: undefined,
      idVerified: undefined,
      acknowledgement: undefined,
      shiftRequest: null,
      isSample: false,
      activity: [activity("system", `Duplicated from ${b.bfNo}`)],
    });
  });
}

/* ─── Discount approval ──────────────────────────────────────────────────── */

export async function setDiscount(id: string, d: { mode: "amount" | "percent"; value: number; reason?: string }) {
  return withLatency(() => {
    const b = getBooking(id);
    const est = estimateFor({ ...b, discount: { ...d, approval: "approved" } });
    const amount = d.mode === "percent" ? Math.round((est.subtotal * d.value) / 100) : d.value;
    const threshold = getSettings().discountApprovalThreshold;
    const u = currentUser();
    const needs = amount > threshold && !MANAGERS.includes(u.role);
    const approval = amount <= 0 ? "none" : needs ? "pending" : amount > threshold ? "approved" : "none";
    if (needs) {
      notify({ title: "Discount approval needed", body: `${taka(amount)} on ${b.bfNo} (${b.eventTitle}) — ${d.reason || "no reason"}`, kind: "approval", href: `/dashboard/sales/bookings/${id}`, roles: MANAGERS });
    }
    const text = amount > 0 ? `Discount ${taka(amount)} ${needs ? "requested — waiting for approval" : "applied"}${d.reason ? ` (${d.reason})` : ""}` : "Discount removed";
    const after = db.bookings.update(id, { discount: { ...d, approval, requestedBy: u.id, decidedBy: needs ? undefined : approval === "approved" ? u.id : undefined }, ...pushActivity(b, "approval", text) });
    return syncLeakage(id) ?? after;
  });
}

export async function decideDiscount(id: string, approve: boolean) {
  return withLatency(() => {
    const b = getBooking(id);
    const u = currentUser();
    if (!MANAGERS.includes(u.role)) throw new Error("Only a Sales Manager or Admin can approve discounts.");
    const text = `Discount ${approve ? "approved" : "rejected"} by ${u.name}`;
    if (b.discount.requestedBy) notify({ title: `Discount ${approve ? "approved" : "rejected"}`, body: `${b.bfNo} · ${b.eventTitle}`, kind: "approval", href: `/dashboard/sales/bookings/${id}`, userId: b.discount.requestedBy });
    const after = db.bookings.update(id, { discount: { ...b.discount, approval: approve ? "approved" : "rejected", decidedBy: u.id }, ...pushActivity(b, "approval", text) }, { action: approve ? "approve" : "reject", summary: text });
    return syncLeakage(id) ?? after;
  });
}

/* ─── Shift / postpone ───────────────────────────────────────────────────── */

/** Charge preview for shifting/postponing, based on today's distance to the event. */
export function shiftPreview(b: Booking) {
  return cancellationCharge(b, ymd(new Date()), "shift", getRates(b.priceVersion));
}

export async function requestShift(id: string, newDate: string, newHallId: string, reason: string) {
  return withLatency(() => {
    const b = getBooking(id);
    const { charge, pct } = cancellationCharge(b, ymd(new Date()), "shift", getRates(b.priceVersion));
    const u = currentUser();
    const auto = MANAGERS.includes(u.role);
    const req = { newDate, newHallId, charge, pct, reason, status: auto ? ("approved" as const) : ("pending" as const), requestedBy: u.id, decidedBy: auto ? u.id : undefined };
    if (auto) return applyShift(b, req);
    notify({ title: "Date shift needs approval", body: `${b.bfNo} → ${newDate} · charge ${taka(charge)}`, kind: "approval", href: `/dashboard/sales/bookings/${id}`, roles: MANAGERS });
    return db.bookings.update(id, { shiftRequest: req, ...pushActivity(b, "approval", `Shift to ${newDate} requested — charge ${taka(charge)} (${pct}%)`) });
  });
}

function applyShift(b: Booking, req: NonNullable<Booking["shiftRequest"]>) {
  const first = firstEventDate(b);
  const delta = Math.round((parseYmd(req.newDate).getTime() - parseYmd(first).getTime()) / 86400000);
  const oldHall = b.days[0]?.hallId;
  const days = b.days.map((d) => ({ ...d, date: ymd(addDays(parseYmd(d.date), delta)), hallId: d.hallId === oldHall ? req.newHallId : d.hallId }));
  const addons = req.charge > 0 ? [...b.addons, { id: nanoid(6), kind: "extra" as const, name: `Shift / postpone charge (${req.pct}%)`, unit: "event", qty: 1, rate: req.charge, reason: req.reason }] : b.addons;
  const event = firstEventDate({ days });
  const documents = b.documents.map((d) => (d.dueDate ? { ...d, dueDate: ymd(addDays(parseYmd(d.dueDate), delta)) } : d));
  return db.bookings.update(
    b.id,
    { days, addons, documents, shiftRequest: { ...req, status: "approved" }, ...pushActivity(b, "change", `Shifted to ${event}${req.newHallId !== oldHall ? ` · ${db.halls.get(req.newHallId)?.name}` : ""} — charge ${taka(req.charge)}`) },
    { action: "approve", summary: `Shifted ${b.bfNo} to ${event}` }
  );
}

export async function decideShift(id: string, approve: boolean) {
  return withLatency(() => {
    const b = getBooking(id);
    if (!b.shiftRequest) throw new Error("No shift request");
    if (!MANAGERS.includes(currentUser().role)) throw new Error("Only a Sales Manager or Admin can approve a shift.");
    if (approve) return applyShift(b, { ...b.shiftRequest, decidedBy: currentUser().id });
    return db.bookings.update(id, { shiftRequest: { ...b.shiftRequest, status: "rejected", decidedBy: currentUser().id }, ...pushActivity(b, "approval", "Shift request rejected") }, { action: "reject", summary: "Rejected shift" });
  });
}

/* ─── Payments & documents ───────────────────────────────────────────────── */

export async function recordPayment(input: PaymentInput) {
  return withLatency(() => {
    const b = getBooking(input.bookingId);
    if (!(input.amount > 0)) throw new Error("Enter an amount");
    const p = db.payments.create({ ...input, mrNo: nextNumber("mr", new Date(input.date)), clientId: b.clientId });
    db.invoices.create({ number: p.mrNo, kind: "money_receipt", bookingId: b.id, clientName: b.contact.name, version: 1, total: p.amount, received: p.amount, balance: 0, paymentId: p.id, createdBy: currentUser().name }, { silent: true });
    db.bookings.update(b.id, pushActivity(b, "payment", `Money receipt ${p.mrNo} — ${taka(p.amount)} (${p.purpose}, ${p.method.replace("_", " ")})`), { silent: true });
    if (b.assignedTo) notify({ title: "Payment received", body: `${taka(p.amount)} · ${b.bfNo}`, kind: "payment", href: `/dashboard/sales/bookings/${b.id}`, userId: b.assignedTo });
    return p;
  });
}

export async function updatePayment(id: string, patch: Partial<Payment>) {
  return withLatency(() => db.payments.update(id, patch));
}

/** Everything a document builder needs, read from the store. */
export function docInputFor(bookingId: string, number: string, opts: { version?: number; paymentId?: string; generatedAt?: string } = {}): DocInput {
  const b = getBooking(bookingId);
  const payments = db.payments.active().filter((p) => p.bookingId === b.id).sort((a, c) => a.date.localeCompare(c.date));
  return { b, est: estimateFor(b, payments), payments, halls: db.halls.all(), users: db.users.all(), settings: getSettings(), number, clientNo: db.clients.get(b.clientId)?.clientNo, ...opts };
}

export async function generateDocument(bookingId: string, kind: DocKind, paymentId?: string): Promise<Invoice> {
  return withLatency(() => {
    const b = getBooking(bookingId);
    if (kind === "invoice") {
      const open = openFindings(findingsFor(b));
      if (open.length) throw new Error(`Resolve ${open.length} unbilled item${open.length > 1 ? "s" : ""} (Leakage Guard) before the final invoice — add them to the bill or waive them.`);
    }
    const est = estimateFor(b);
    const prior = db.invoices.active().filter((d) => d.bookingId === bookingId && d.kind === kind && (!paymentId || d.paymentId === paymentId));
    const version = prior.length + 1;
    const existingNo = prior[0]?.number;
    const number =
      existingNo ??
      (kind === "estimate" ? nextNumber("estimate") : kind === "invoice" ? nextNumber("invoice") : kind === "booking_form" ? b.bfNo : kind === "refund_note" ? nextNumber("refund") : kind === "money_receipt" ? db.payments.get(paymentId ?? "")?.mrNo ?? nextNumber("mr") : nextNumber("doc"));
    const snapshot = buildDocModel(kind, docInputFor(bookingId, number, { version, paymentId, generatedAt: now() }));
    const doc = db.invoices.create({ number, kind, bookingId, clientName: b.contact.name, version, total: est.grandTotal, received: est.received, balance: est.balance, paymentId, createdBy: currentUser().name, snapshot });
    db.bookings.update(bookingId, pushActivity(b, "document", `Generated ${kind.replace("_", " ")} ${number} (v${version})`), { silent: true });
    return doc;
  });
}

export async function acknowledge(id: string, signature?: string) {
  return withLatency(() => {
    const b = getBooking(id);
    return db.bookings.update(id, { acknowledgement: { accepted: true, signature, at: now() }, ...pushActivity(b, "document", "Client acknowledged the booking form & estimate") });
  });
}

/* ─── Operations ─────────────────────────────────────────────────────────── */

export async function saveFactSheet(id: string, fs: FactSheet) {
  return withLatency(() => {
    const b = getBooking(id);
    const rates = getRates(b.priceVersion);
    const firstHall = db.halls.get(b.days[0]?.hallId ?? "");
    const tariff = firstHall ? tariffFor(rates, firstHall.tariffGroup, b.days[0]?.date) : undefined;
    // Replace previous auto extras.
    const addons = b.addons.filter((a) => !(a.kind === "extra" && a.reason === "fact-sheet"));
    if (fs.extraHours > 0 && tariff?.extraHour) addons.push({ id: nanoid(6), kind: "extra", name: "Extra business hours (fact sheet)", unit: "hour", qty: fs.extraHours, rate: tariff.extraHour, reason: "fact-sheet" });
    const xg = extraGuestCharge(b.guests.optimum, fs.actualGuests, rates);
    if (xg.amount > 0) addons.push({ id: nanoid(6), kind: "extra", name: `Extra guests over +10% (${fs.actualGuests} vs ${b.guests.optimum})`, unit: "person", qty: xg.extra, rate: xg.rate, reason: "fact-sheet" });
    const after = db.bookings.update(id, { factSheet: fs, addons, ...pushActivity(b, "change", fs.done ? "Program Fact Sheet completed" : "Program Fact Sheet saved (draft)") });
    return syncLeakage(id) ?? after;
  });
}

export async function saveEvaluation(id: string, ratings: Evaluation["ratings"], suggestion: string, via: Evaluation["submittedVia"] = "staff") {
  return withLatency(() => {
    const b = getBooking(id);
    const evaluation: Evaluation = { ratings, suggestion, score: evaluationScore(ratings), submittedAt: now(), submittedVia: via };
    notify({ title: "New service evaluation", body: `${b.eventTitle} scored ${evaluation.score}/100`, kind: "system", href: `/dashboard/operations/quality`, roles: ["operations", "admin", "sales_manager"] });
    return db.bookings.update(id, { evaluation, ...pushActivity(b, "change", `Evaluation received — score ${evaluation.score}/100${via === "public" ? " (client form)" : ""}`) });
  });
}

export function refundCalc(b: Booking) {
  const est = estimateFor(b);
  const damages = (b.damage?.rows ?? []).reduce((s, r) => s + r.qty * r.rate, 0);
  // Dues = anything unpaid besides security.
  const dues = Math.max(0, est.grandTotal - est.received);
  const securityHeld = Math.min(est.security, est.received);
  return { security: est.security, securityHeld, damages, dues, amount: Math.max(0, securityHeld - damages - dues) };
}

export async function saveDamage(id: string, damage: DamageClaim) {
  return withLatency(() => {
    const b = getBooking(id);
    const next = { ...b, damage };
    const calc = refundCalc(next);
    const event = lastEventDate(b);
    const refund = { ...(b.refund ?? {}), amount: calc.amount, dueDate: b.refund?.dueDate ?? refundDueDate(event, getSettings().holidays.map((h) => h.date)) };
    if (damage.done && !b.refund?.refundedAt) {
      const due = parseYmd(refund.dueDate);
      due.setHours(11, 0, 0, 0);
      if (!db.tasks.active().some((t) => t.bookingId === id && t.type === "refund_due")) {
        createTask({ title: `Security refund due — ${b.contact.name}`, type: "refund_due", dueAt: due.toISOString(), assignedTo: db.users.active().find((u) => u.role === "accounts")?.id, bookingId: id, auto: true });
      }
    }
    const total = damage.rows.reduce((s, r) => s + r.qty * r.rate, 0);
    return db.bookings.update(id, { damage, refund, ...pushActivity(b, "change", damage.noDamage ? "No damage recorded" : `Damage claim ${taka(total)} recorded`) });
  });
}

export async function markRefunded(id: string, chequeNo: string) {
  return withLatency(() => {
    const b = getBooking(id);
    const calc = refundCalc(b);
    const refund = { amount: calc.amount, dueDate: b.refund?.dueDate ?? refundDueDate(lastEventDate(b)), refundedAt: now(), chequeNo, status: "refunded" as const };
    db.tasks.active().filter((t) => t.bookingId === id && t.type === "refund_due" && t.status === "open").forEach((t) => db.tasks.update(t.id, { status: "done" }, { silent: true }));
    return db.bookings.update(id, { refund, ...pushActivity(b, "payment", `Security money refunded ${taka(calc.amount)} — cheque ${chequeNo}`) });
  });
}

export async function savePpm(id: string, ppm: NonNullable<Booking["ppm"]>, addonsPatch?: Booking["addons"]) {
  return withLatency(() => {
    const b = getBooking(id);
    const documents = ppm.done ? b.documents.map((d) => (d.key === "ppm_copy" ? { ...d, state: "yes" as const } : d)) : b.documents;
    if (ppm.done) db.tasks.active().filter((t) => t.bookingId === id && t.type === "ppm_due" && t.status === "open").forEach((t) => db.tasks.update(t.id, { status: "done" }, { silent: true }));
    const after = db.bookings.update(id, { ppm, documents, ...(addonsPatch ? { addons: addonsPatch } : {}), ...pushActivity(b, "change", ppm.done ? "PPM minutes completed" : "PPM minutes saved") });
    return syncLeakage(id) ?? after;
  });
}

/** Public "Evaluation of Service" link: /evaluation?b=<id> */
export async function submitPublicEvaluation(bookingId: string, ratings: Evaluation["ratings"], suggestion: string) {
  return saveEvaluation(bookingId, ratings, suggestion, "public");
}
