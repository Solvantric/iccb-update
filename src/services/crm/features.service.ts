"use client";
/**
 * Business features: Leakage Guard actions, Readiness automation, Client Portal,
 * Idle-date offers, Collections and the Vendor scorecard. All writes go to the
 * same persisted stores as the rest of the CRM — no API routes.
 */
import { addDays, format, subMonths } from "date-fns";
import { customAlphabet, nanoid } from "nanoid";
import type { ActivityItem, Booking, Evaluation, Offer, OfferRecipient, OfferSegment, PortalAccess, PortalPpmAnswers, Role, Vendor, VendorReview, VendorStatus } from "@/types/crm";
import { currentUser, db, getFeatureSettings, getRates, getSettings } from "@/lib/crm/db";
import { findHall, firstEventDate, hallRent, lastEventDate, parseYmd } from "@/lib/crm/pricing";
import { openFindings } from "@/lib/crm/leakage";
import { dueMilestones, readiness, type ReadinessResult } from "@/lib/crm/readiness";
import { vendorScore } from "@/lib/crm/vendor-score";
import { taka } from "@/lib/crm/format";
import { compactDates, fillTemplate } from "@/lib/crm/idle";
import { estimateFor, findingsFor, notify, saveEvaluation, syncLeakage } from "./bookings.service";
import { withLatency } from "./base";

const now = () => new Date().toISOString();
const ymd = (d: Date) => format(d, "yyyy-MM-dd");
const MANAGERS: Role[] = ["sales_manager", "admin"];

const getBooking = (id: string) => {
  const b = db.bookings.get(id);
  if (!b) throw new Error("Booking not found");
  return b;
};
const act = (type: ActivityItem["type"], text: string, by = currentUser().name): ActivityItem => ({ id: nanoid(8), at: now(), by, type, text });
const push = (b: Booking, type: ActivityItem["type"], text: string, by?: string) => ({ activity: [...b.activity, act(type, text, by)] });

/* ═══ 1. Revenue Leakage Guard ═════════════════════════════════════════════ */

export async function addFindingsToBill(bookingId: string, findingIds: string[]) {
  return withLatency(() => {
    const b = getBooking(bookingId);
    const list = findingsFor(b);
    const pick = openFindings(list).filter((f) => findingIds.includes(f.id) && f.line);
    if (!pick.length) throw new Error("Nothing to add");
    const u = currentUser();
    const addons = [...b.addons, ...pick.map((f) => ({ id: nanoid(6), kind: "extra" as const, name: f.line!.name, unit: f.line!.unit, qty: f.line!.qty, rate: f.line!.rate, reason: `leakage:${f.ruleId}` }))];
    const leakage = list.map((f) => (pick.some((p) => p.id === f.id) ? { ...f, status: "added" as const, resolvedBy: u.name, resolvedAt: now() } : f));
    const total = pick.reduce((s, f) => s + f.expectedAmount, 0);
    const text = `Leakage Guard: added ${pick.length} item${pick.length > 1 ? "s" : ""} to the bill (${taka(total)}) — ${pick.map((f) => f.title).join(", ")}`;
    db.bookings.update(bookingId, { addons, leakage, ...push(b, "change", text) }, { summary: text });
    return syncLeakage(bookingId) ?? getBooking(bookingId);
  });
}

export async function waiveFinding(bookingId: string, findingId: string, reason: string) {
  return withLatency(() => {
    const u = currentUser();
    if (!MANAGERS.includes(u.role)) throw new Error("Only a Sales Manager or Admin can waive a finding.");
    if (!reason.trim()) throw new Error("Write a reason for the waiver.");
    const b = getBooking(bookingId);
    const list = findingsFor(b);
    const f = list.find((x) => x.id === findingId);
    if (!f) throw new Error("Finding not found");
    const leakage = list.map((x) => (x.id === findingId ? { ...x, status: "waived" as const, waivedReason: reason.trim(), resolvedBy: u.name, resolvedAt: now() } : x));
    const text = `Leakage Guard: waived "${f.title}" (${taka(f.expectedAmount)}) — ${reason.trim()}`;
    return db.bookings.update(bookingId, { leakage, ...push(b, "approval", text) }, { action: "waive", summary: text });
  });
}

/* ═══ 2. Event Readiness ═══════════════════════════════════════════════════ */

export function vendorScoreFor(vendorId?: string) {
  if (!vendorId) return null;
  return vendorScore(db.vendorReviews.active().filter((r) => r.vendorId === vendorId));
}

export function readinessOf(b: Booking, today = ymd(new Date())): ReadinessResult {
  const fs = getFeatureSettings();
  return readiness(b, today, { est: estimateFor(b), balanceDueDays: fs.balanceDueDays, weights: fs.readinessWeights, vendorScore: b.decoration.provider === "outside" ? vendorScoreFor(b.decoration.vendorId) : null });
}

const opsLead = () => db.users.active().find((u) => u.role === "operations" && u.active)?.id;

let automationRan = false;
/**
 * Runs once per dashboard session: readiness milestones (D-15 / D-7 / D-3 tasks),
 * Risk escalation at ≤ D-7, and "Review vendor" tasks after completed events.
 */
export function runAutomations(force = false) {
  if (automationRan && !force) return { tasks: 0, escalations: 0 };
  automationRan = true;
  const today = ymd(new Date());
  let tasks = 0;
  let escalations = 0;
  const openTask = (bookingId: string, title: string) => db.tasks.active().some((t) => t.bookingId === bookingId && t.status === "open" && t.title === title);

  for (const b of db.bookings.active()) {
    if (b.closed) continue;

    // Readiness — confirmed, upcoming events.
    if (b.status === "confirmed" && firstEventDate(b) >= today) {
      const r = readinessOf(b, today);
      const log = b.readiness ?? { milestones: [] };
      const due = dueMilestones(r.daysToEvent, log.milestones);
      let next = log;
      if (due.length) {
        const at = new Date();
        at.setHours(10, 0, 0, 0);
        for (const item of r.items) {
          for (const o of item.open) {
            const title = `Readiness: ${o.label} — ${b.eventTitle}`;
            if (openTask(b.id, title)) continue;
            db.tasks.create({ title, type: item.area === "payment" ? "balance_due" : item.area === "ppm" ? "ppm_due" : "document_due", dueAt: (o.dueDate && o.dueDate > today ? parseYmd(o.dueDate) : at).toISOString(), status: "open", assignedTo: item.area === "vendors" ? opsLead() : b.assignedTo, bookingId: b.id, auto: true, notes: `${due.join(", ")} milestone · ${item.label} ${Math.round(item.credit * 100)}%` }, { silent: true });
            tasks++;
          }
        }
        next = { ...next, milestones: [...log.milestones, ...due], levelAtD15: log.levelAtD15 ?? (due.includes("D-15") ? r.level : undefined) };
      }
      if (r.level === "risk" && r.daysToEvent <= 7 && !log.escalatedAt) {
        notify({ title: "⚠ Event at risk", body: `${b.eventTitle} in ${r.daysToEvent} day${r.daysToEvent === 1 ? "" : "s"} — readiness ${r.score}/100`, kind: "booking", href: `/dashboard/sales/bookings/${b.id}`, roles: ["sales_manager", "operations", "admin"] });
        next = { ...next, escalatedAt: now() };
        escalations++;
      }
      if (next !== log) db.bookings.update(b.id, { readiness: next }, { silent: true });
    }

    // Vendor review task after an event with an outside vendor.
    const vid = b.decoration.provider === "outside" ? b.decoration.vendorId : undefined;
    if (vid && lastEventDate(b) < today && (b.status === "completed" || b.factSheet?.done)) {
      const v = db.vendors.get(vid);
      const reviewed = db.vendorReviews.active().some((r) => r.vendorId === vid && r.bookingId === b.id);
      const title = `Review vendor ${v?.name ?? ""} — ${b.eventTitle}`;
      if (v && !reviewed && !db.tasks.active().some((t) => t.bookingId === b.id && t.title === title)) {
        db.tasks.create({ title, type: "follow_up", dueAt: addDays(parseYmd(lastEventDate(b)), 2).toISOString(), status: "open", assignedTo: opsLead(), bookingId: b.id, auto: true, notes: "Operations → Quality → Vendors" }, { silent: true });
        tasks++;
      }
    }
  }
  return { tasks, escalations };
}

/* ═══ 3. Client Self-Service Portal ════════════════════════════════════════ */

const tokenOf = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789", 24);

export const portalUrl = (token: string) => `${typeof window !== "undefined" ? window.location.origin : ""}/portal/${token}`;

export function activePortalLink(bookingId: string) {
  return db.portal.active().find((p) => p.bookingId === bookingId && !p.revoked && p.expiresAt > now());
}

export async function createPortalLink(bookingId: string) {
  return withLatency(() => {
    const b = getBooking(bookingId);
    const u = currentUser();
    // Regenerate = revoke the old link, issue a new one.
    for (const old of db.portal.active().filter((p) => p.bookingId === bookingId && !p.revoked)) db.portal.update(old.id, { revoked: true }, { action: "revoke", summary: `Revoked portal link for ${b.bfNo}` });
    const expiresAt = addDays(parseYmd(lastEventDate(b)), getFeatureSettings().portalExpiryDays);
    expiresAt.setHours(23, 59, 0, 0);
    const link = db.portal.create({ token: tokenOf(), bookingId, createdBy: u.name, expiresAt: expiresAt.toISOString(), revoked: false }, { summary: `Created client portal link for ${b.bfNo}` });
    db.bookings.update(bookingId, push(b, "document", "Client portal link created"), { silent: true });
    return link;
  });
}

export async function revokePortalLink(id: string) {
  return withLatency(() => {
    const p = db.portal.get(id);
    if (!p) throw new Error("Link not found");
    const b = db.bookings.get(p.bookingId);
    if (b) db.bookings.update(b.id, push(b, "document", "Client portal link revoked"), { silent: true });
    return db.portal.update(id, { revoked: true }, { action: "revoke", summary: `Revoked portal link${b ? ` for ${b.bfNo}` : ""}` });
  });
}

export function portalWhatsApp(b: Booking, url: string, lang: "en" | "bn") {
  const text =
    lang === "bn"
      ? `আসসালামু আলাইকুম ${b.contact.name},\nআপনার ICCB বুকিং (${b.bfNo}) দেখতে, ডকুমেন্ট আপলোড করতে ও প্রোগ্রামের তথ্য দিতে এই লিংকটি ব্যবহার করুন:\n${url}\n— ICCB`
      : `Hello ${b.contact.name},\nUse this secure link to see your ICCB booking (${b.bfNo}), upload documents and share your event details:\n${url}\n— ICCB`;
  const phone = b.contact.mobile.replace(/\D/g, "").replace(/^0/, "880");
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export type PortalState = { state: "ok"; link: PortalAccess; booking: Booking } | { state: "expired" | "revoked" | "invalid"; link?: PortalAccess; booking?: Booking };

/** Frontend-only token check against the store. Real validation moves to the backend later. */
export function resolvePortal(token: string): PortalState {
  const link = db.portal.all().find((p) => p.token === token && !p.deletedAt);
  if (!link) return { state: "invalid" };
  const booking = db.bookings.get(link.bookingId);
  if (!booking || booking.deletedAt) return { state: "invalid", link };
  if (link.revoked) return { state: "revoked", link, booking };
  if (link.expiresAt < now()) return { state: "expired", link, booking };
  return { state: "ok", link, booking };
}

const portalGuard = (token: string) => {
  const r = resolvePortal(token);
  if (r.state !== "ok") throw new Error("This link is no longer valid.");
  return r;
};

function clientActivity(b: Booking, text: string, title: string) {
  if (b.assignedTo) notify({ title, body: `${b.bfNo} · ${b.contact.name}`, kind: "booking", href: `/dashboard/sales/bookings/${b.id}?tab=documents`, userId: b.assignedTo });
  return { portalUnread: (b.portalUnread ?? 0) + 1, ...push(b, "document", text, `${b.contact.name} (portal)`) };
}

export function touchPortal(token: string) {
  const link = db.portal.all().find((p) => p.token === token);
  if (link) db.portal.update(link.id, { lastOpenedAt: now() }, { silent: true });
}

export async function portalUpload(token: string, docKey: string, fileName: string, fileData: string) {
  return withLatency(() => {
    const { booking: b } = portalGuard(token);
    const doc = b.documents.find((d) => d.key === docKey);
    if (!doc) throw new Error("Unknown document");
    const documents = b.documents.map((d) => (d.key === docKey ? { ...d, state: "pending" as const, fileName, fileData, uploadedVia: "portal" as const, uploadedAt: now(), review: "pending" as const, reviewNote: undefined } : d));
    return db.bookings.update(b.id, { documents, ...clientActivity(b, `Client uploaded "${doc.label}" (${fileName})`, "Client uploaded a document") }, { silent: true });
  });
}

export async function reviewDocument(bookingId: string, docKey: string, accept: boolean, note?: string) {
  return withLatency(() => {
    const b = getBooking(bookingId);
    const doc = b.documents.find((d) => d.key === docKey);
    if (!doc) throw new Error("Document not found");
    if (!accept && !note?.trim()) throw new Error("Write a note so the client knows what to fix.");
    const documents = b.documents.map((d) => (d.key === docKey ? { ...d, state: accept ? ("yes" as const) : ("pending" as const), review: accept ? ("accepted" as const) : ("rejected" as const), reviewNote: note?.trim() || undefined } : d));
    const text = `Document "${doc.label}" ${accept ? "accepted" : `rejected — ${note}`}`;
    return db.bookings.update(bookingId, { documents, ...push(b, "document", text) }, { action: accept ? "approve" : "reject", summary: `${b.bfNo}: ${text}` });
  });
}

const AGENDA_MAP: [keyof PortalPpmAnswers, number, (v: unknown) => string][] = [
  ["guests", 1, (v) => `${v} guests (client)`],
  ["management", 2, (v) => (v === "own" ? "Own event management" : "ICCB")],
  ["setup", 3, (v) => String(v)],
  ["sound", 5, (v) => String(v)],
  ["stageSize", 6, (v) => String(v)],
  ["sofaRows", 8, (v) => `${v} sofa rows`],
  ["headTable", 10, (v) => `${v} head table(s)`],
  ["special", 11, (v) => String(v)],
  ["banners", 13, (v) => String(v)],
  ["servingTime", 16, (v) => String(v)],
  ["driverFood", 21, (v) => (v === "packet" ? "Outside packet" : v === "inside" ? "Inside" : "None")],
  ["vehicles", 22, (v) => `${v} vehicles`],
];

export async function portalSubmitAnswers(token: string, answers: PortalPpmAnswers) {
  return withLatency(() => {
    const { booking: b } = portalGuard(token);
    const portalAnswers = { ...answers, submittedAt: now() };
    // Prefill the staff PPM draft (never overwrite a completed PPM or staff text).
    let ppm = b.ppm;
    if (!ppm?.done) {
      const agenda = { ...(ppm?.agenda ?? {}) };
      for (const [k, idx, f] of AGENDA_MAP) {
        const v = answers[k];
        if (v !== undefined && v !== "" && !agenda[idx]) agenda[idx] = f(v);
      }
      ppm = { date: ppm?.date ?? ymd(addDays(new Date(), 1)), time: ppm?.time ?? "15:00", venue: ppm?.venue ?? "ICCB Sales Office", attendees: ppm?.attendees ?? `${b.contact.name} (client)`, notes: ppm?.notes ?? "", done: false, agenda, extras: ppm?.extras };
    }
    return db.bookings.update(b.id, { portalAnswers, ppm, ...clientActivity(b, "Client submitted the pre-event questionnaire (PPM prefilled)", "Client answered the PPM questions") }, { silent: true });
  });
}

export async function portalAcceptPolicies(token: string, name: string) {
  return withLatency(() => {
    const { booking: b } = portalGuard(token);
    if (name.trim().length < 3) throw new Error("Type your full name to confirm.");
    return db.bookings.update(b.id, { policyAccepted: { name: name.trim(), at: now() }, ...push(b, "document", `Client accepted ICCB policies — signed "${name.trim()}"`, `${b.contact.name} (portal)`) }, { silent: true });
  });
}

export async function portalFeedback(token: string, ratings: Evaluation["ratings"], suggestion: string) {
  const { booking: b } = portalGuard(token);
  const r = await saveEvaluation(b.id, ratings, suggestion, "public");
  db.bookings.update(b.id, { portalUnread: (r.portalUnread ?? 0) + 1 }, { silent: true });
  return r;
}

export async function markPortalSeen(bookingId: string) {
  const b = db.bookings.get(bookingId);
  if (b?.portalUnread) db.bookings.update(bookingId, { portalUnread: 0 }, { silent: true });
}

/* ═══ 4. Idle Date Recovery — offers ═══════════════════════════════════════ */

export interface AudienceContact {
  key: string;
  name: string;
  mobile: string;
  segment: OfferSegment;
  detail: string;
}

export function audienceContacts(segments: OfferSegment[], eventType?: string): AudienceContact[] {
  const out: AudienceContact[] = [];
  const since = subMonths(new Date(), 12).toISOString();
  const seen = new Set<string>();
  const add = (c: AudienceContact) => {
    const k = c.mobile.replace(/\D/g, "").slice(-10) || c.key;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(c);
  };
  if (segments.includes("lost_leads")) for (const l of db.leads.active().filter((x) => x.stage === "lost")) add({ key: `lead-${l.id}`, name: l.name, mobile: l.mobile, segment: "lost_leads", detail: `${l.organization ?? l.eventType ?? "Lead"} · ${l.lostReason ?? "lost"}` });
  if (segments.includes("enquiries")) for (const e of db.enquiries.active().filter((x) => x.status !== "converted" && x.createdAt >= since && x.mobile !== "—")) add({ key: `enq-${e.id}`, name: e.name, mobile: e.mobile, segment: "enquiries", detail: `${e.eventType ?? e.type} · ${e.guests ? `${e.guests} guests` : "enquiry"}` });
  if (segments.includes("past_clients"))
    for (const b of db.bookings.active().filter((x) => x.status === "completed" && (!eventType || x.eventNature === eventType))) add({ key: `cl-${b.clientId}`, name: b.contact.name, mobile: b.contact.mobile, segment: "past_clients", detail: `${b.eventNature} · ${b.eventTitle}` });
  if (segments.includes("radar"))
    for (const r of db.radar.active().filter((x) => x.status !== "dismissed")) {
      const lead = r.leadId ? db.leads.get(r.leadId) : undefined;
      add({ key: `radar-${r.id}`, name: lead?.name ?? `${r.organizer} team`, mobile: lead?.mobile && lead.mobile !== "—" ? lead.mobile : "", segment: "radar", detail: `${r.title} · ${r.category}` });
    }
  if (segments.includes("repeat"))
    for (const t of db.tasks.active().filter((x) => x.type === "repeat_event")) {
      const b = t.bookingId ? db.bookings.get(t.bookingId) : undefined;
      if (b) add({ key: `rep-${b.id}`, name: b.contact.name, mobile: b.contact.mobile, segment: "repeat", detail: `Repeat: ${b.eventTitle}` });
    }
  return out;
}

export interface OfferDraft {
  name: string;
  code: string;
  halls: string[];
  dates: string[];
  discountType: "percent" | "amount";
  discountValue: number;
  validUntil: string;
  audience: OfferSegment[];
  messageEn: string;
  messageBn: string;
  contacts: AudienceContact[];
  activate: boolean;
}

/** Discount as a % of the cheapest rent in the offer (for the approval rule). */
export function offerDiscountPct(o: Pick<Offer, "discountType" | "discountValue" | "halls" | "dates">) {
  if (o.discountType === "percent") return o.discountValue;
  const rents = o.halls.flatMap((h) => o.dates.map((d) => estimateRent(h, d))).filter((n) => n > 0);
  const min = rents.length ? Math.min(...rents) : 0;
  return min ? Math.round((o.discountValue / min) * 100) : 0;
}
function estimateRent(hallId: string, date: string) {
  const rates = getRates();
  const hall = findHall(rates, hallId);
  return hall ? hallRent(hall, date, rates) : 0;
}

export async function createOffer(draft: OfferDraft) {
  return withLatency(() => {
    const u = currentUser();
    if (!draft.name.trim()) throw new Error("Give the offer a name.");
    if (!draft.halls.length || !draft.dates.length) throw new Error("Select at least one idle hall-day.");
    if (!(draft.discountValue > 0)) throw new Error("Enter a discount.");
    const code = draft.code.trim().toUpperCase();
    if (!/^[A-Z0-9-]{4,20}$/.test(code)) throw new Error("Code: 4–20 letters, numbers or dashes.");
    if (db.offers.active().some((o) => o.code === code)) throw new Error(`Code ${code} is already used.`);
    const pct = offerDiscountPct(draft);
    const max = getFeatureSettings().maxOfferDiscount;
    const needsApproval = pct > max && !MANAGERS.includes(u.role);
    const status: Offer["status"] = !draft.activate ? "draft" : needsApproval ? "pending_approval" : "active";
    const offer = db.offers.create({
      code,
      name: draft.name.trim(),
      halls: draft.halls,
      dates: [...new Set(draft.dates)].sort(),
      discountType: draft.discountType,
      discountValue: draft.discountValue,
      validUntil: draft.validUntil,
      audience: draft.audience,
      messageEn: draft.messageEn,
      messageBn: draft.messageBn,
      status,
      createdBy: u.id,
      approvedBy: status === "active" && pct > max ? u.name : undefined,
      stats: { sent: 0, responded: 0, booked: 0, revenue: 0 },
    });
    for (const c of draft.contacts) db.offerRecipients.create({ offerId: offer.id, contactName: c.name, mobile: c.mobile, source: c.segment }, { silent: true });
    if (status === "pending_approval") notify({ title: "Offer needs approval", body: `${offer.code} · ${pct}% off (max ${max}%)`, kind: "approval", href: `/dashboard/marketing/demand?tab=idle`, roles: MANAGERS });
    return offer;
  });
}

export async function setOfferStatus(id: string, status: Offer["status"]) {
  return withLatency(() => {
    const o = db.offers.get(id);
    if (!o) throw new Error("Offer not found");
    const u = currentUser();
    if (o.status === "pending_approval" && status === "active") {
      if (!MANAGERS.includes(u.role)) throw new Error("Only a Sales Manager or Admin can approve this discount.");
      if (o.createdBy) notify({ title: "Offer approved", body: `${o.code} is live`, kind: "approval", href: `/dashboard/marketing/demand?tab=idle`, userId: o.createdBy });
      return db.offers.update(id, { status, approvedBy: u.name }, { action: "approve", summary: `Approved offer ${o.code}` });
    }
    if (status === "active" && offerDiscountPct(o) > getFeatureSettings().maxOfferDiscount && !MANAGERS.includes(u.role)) {
      notify({ title: "Offer needs approval", body: `${o.code} · above the max discount`, kind: "approval", href: `/dashboard/marketing/demand?tab=idle`, roles: MANAGERS });
      return db.offers.update(id, { status: "pending_approval" });
    }
    return db.offers.update(id, { status }, { summary: `Offer ${o.code} → ${status.replace("_", " ")}` });
  });
}

export async function markRecipient(id: string, patch: Partial<Pick<OfferRecipient, "sentAt" | "respondedAt">>) {
  return withLatency(() => db.offerRecipients.update(id, patch, { silent: true }));
}

/** Mark sent without latency (used while stepping through WhatsApp links). */
export function markSentNow(id: string) {
  return db.offerRecipients.update(id, { sentAt: now() }, { silent: true });
}

export function offerMessage(o: Pick<Offer, "messageEn" | "messageBn" | "halls" | "dates" | "discountType" | "discountValue" | "code">, lang: "en" | "bn", name: string) {
  const halls = o.halls.map((h) => db.halls.get(h)?.name ?? h).join(" / ");
  const discount = o.discountType === "percent" ? `${o.discountValue}%` : taka(o.discountValue);
  const rep = currentUser();
  return fillTemplate(lang === "bn" ? o.messageBn : o.messageEn, { name, hall: halls, dates: compactDates(o.dates), discount, code: o.code, repPhone: rep.phone });
}

export async function applyOfferCode(bookingId: string, rawCode: string) {
  return withLatency(() => {
    const b = getBooking(bookingId);
    const code = rawCode.trim().toUpperCase();
    const o = db.offers.active().find((x) => x.code === code);
    if (!o) throw new Error(`No offer with code ${code}.`);
    if (o.status !== "active") throw new Error(`Offer ${code} is ${o.status.replace("_", " ")}.`);
    if (o.validUntil < ymd(new Date())) throw new Error(`Offer ${code} expired on ${o.validUntil}.`);
    const matched = b.days.filter((d) => o.halls.includes(d.hallId) && o.dates.includes(d.date));
    if (!matched.length) throw new Error(`${code} is for ${o.halls.map((h) => db.halls.get(h)?.name).join(" / ")} on ${compactDates(o.dates)}.`);
    const est = estimateFor(b);
    const rent = est.lines.filter((l) => l.group === "venue" && l.id.startsWith("rent-") && matched.some((d) => l.id === `rent-${d.id}`)).reduce((s, l) => s + l.amount, 0);
    const amount = o.discountType === "percent" ? Math.round((rent * o.discountValue) / 100) : o.discountValue;
    const addons = [...b.addons.filter((a) => !a.reason?.startsWith("offer:")), { id: nanoid(6), kind: "custom" as const, name: `Offer ${o.code} — ${o.discountType === "percent" ? `${o.discountValue}% off rent` : `${taka(o.discountValue)} off`}`, unit: "event", qty: 1, rate: -amount, reason: `offer:${o.code}` }];
    const rc = db.offerRecipients.active().find((r) => r.offerId === o.id && r.mobile.replace(/\D/g, "").slice(-10) === b.contact.mobile.replace(/\D/g, "").slice(-10));
    if (rc) db.offerRecipients.update(rc.id, { bookingId: b.id, respondedAt: rc.respondedAt ?? now() }, { silent: true });
    const text = `Offer code ${o.code} applied — ${taka(amount)} discount`;
    db.bookings.update(b.id, { addons, offerId: o.id, offerCode: o.code, ...push(b, "change", text) }, { summary: text });
    return syncLeakage(b.id) ?? getBooking(b.id);
  });
}

export async function removeOfferCode(bookingId: string) {
  return withLatency(() => {
    const b = getBooking(bookingId);
    return db.bookings.update(bookingId, { addons: b.addons.filter((a) => !a.reason?.startsWith("offer:")), offerId: undefined, offerCode: undefined, ...push(b, "change", `Offer code ${b.offerCode ?? ""} removed`) });
  });
}

/* ═══ 6. Collections ═══════════════════════════════════════════════════════ */

export async function setPromiseDate(bookingId: string, date: string) {
  return withLatency(() => {
    const b = getBooking(bookingId);
    return db.bookings.update(bookingId, { promiseDate: date || undefined, ...push(b, "payment", date ? `Client promised to pay by ${date}` : "Promise-to-pay date cleared") });
  });
}

export async function logReminder(bookingId: string, channel: "whatsapp" | "sms" | "copy", lang: "en" | "bn", amount: number) {
  return withLatency(() => {
    const b = getBooking(bookingId);
    return db.bookings.update(bookingId, push(b, "payment", `Payment reminder sent (${channel === "copy" ? "copied" : channel === "whatsapp" ? "WhatsApp" : "SMS"}, ${lang.toUpperCase()}) — ${taka(amount)}`), { silent: true });
  });
}

export async function setRefundStatus(bookingId: string, status: "pending" | "cheque_prepared") {
  return withLatency(() => {
    const b = getBooking(bookingId);
    const refund = { amount: b.refund?.amount ?? 0, dueDate: b.refund?.dueDate ?? lastEventDate(b), ...b.refund, status };
    return db.bookings.update(bookingId, { refund, ...push(b, "payment", status === "cheque_prepared" ? "Refund cheque prepared" : "Refund back to pending") });
  });
}

/* ═══ 7. Vendors ═══════════════════════════════════════════════════════════ */

export async function saveVendor(input: Omit<Vendor, "id" | "createdAt" | "updatedAt">, id?: string) {
  return withLatency(() => {
    if (!input.name.trim()) throw new Error("Enter the vendor name.");
    const u = currentUser();
    const prev = id ? db.vendors.get(id) : undefined;
    if (input.status === "blacklisted" && prev?.status !== "blacklisted" && u.role !== "admin") throw new Error("Only Admin can blacklist a vendor.");
    if (prev?.status === "blacklisted" && input.status !== "blacklisted" && u.role !== "admin") throw new Error("Only Admin can lift a blacklist.");
    if (id) return db.vendors.update(id, input, input.status !== prev?.status ? { action: input.status === "blacklisted" ? "override" : "update", summary: `Vendor ${input.name}: ${prev?.status} → ${input.status}` } : undefined);
    return db.vendors.create(input);
  });
}

export async function setVendorStatus(id: string, status: VendorStatus, reason: string) {
  return withLatency(() => {
    const v = db.vendors.get(id);
    if (!v) throw new Error("Vendor not found");
    if ((status === "blacklisted" || v.status === "blacklisted") && currentUser().role !== "admin") throw new Error("Only Admin can blacklist or lift a blacklist.");
    if (!reason.trim()) throw new Error("Write a reason.");
    return db.vendors.update(id, { status, notes: `${v.notes ? `${v.notes}\n` : ""}${format(new Date(), "dd MMM yyyy")}: ${status} — ${reason.trim()}` }, { action: status === "blacklisted" ? "override" : "update", summary: `Vendor ${v.name}: ${v.status} → ${status} — ${reason.trim()}` });
  });
}

export async function saveVendorReview(input: Omit<VendorReview, "id" | "createdAt" | "updatedAt" | "reviewedBy">, id?: string) {
  return withLatency(() => {
    if (!input.vendorId || !input.bookingId) throw new Error("Choose the vendor and the event.");
    const u = currentUser();
    const r = id ? db.vendorReviews.update(id, input) : db.vendorReviews.create({ ...input, reviewedBy: u.name });
    const v = db.vendors.get(input.vendorId);
    db.tasks.active().filter((t) => t.bookingId === input.bookingId && t.status === "open" && t.title.startsWith(`Review vendor ${v?.name ?? ""}`)).forEach((t) => db.tasks.update(t.id, { status: "done" }, { silent: true }));
    return r;
  });
}

/** Choose the outside decorator. Blacklisted vendors need an Admin override (audited). */
export async function selectDecorator(bookingId: string, vendorId: string, overrideReason?: string) {
  return withLatency(() => {
    const b = getBooking(bookingId);
    const v = db.vendors.get(vendorId);
    if (!v) throw new Error("Vendor not found");
    const u = currentUser();
    let override: Booking["decoration"]["override"];
    if (v.status === "blacklisted") {
      if (u.role !== "admin") throw new Error(`${v.name} is blacklisted. Only Admin can override.`);
      if (!overrideReason?.trim()) throw new Error("Write a reason for the override.");
      override = { by: u.name, reason: overrideReason.trim(), at: now() };
    }
    const text = `Outside decorator: ${v.name}${override ? ` (blacklist overridden — ${override.reason})` : ""}`;
    db.bookings.update(bookingId, { decoration: { ...b.decoration, provider: "outside", firm: v.name, vendorId: v.id, override }, ...push(b, "change", text) }, { action: override ? "override" : "update", summary: `${b.bfNo}: ${text}` });
    return syncLeakage(bookingId) ?? getBooking(bookingId);
  });
}

export { getSettings };
