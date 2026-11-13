"use client";
import { addDays } from "date-fns";
import type { Enquiry, EnquiryInput, Lead, LeadInput, RadarEvent, Task, TaskInput } from "@/types/crm";
import { requireNameAndPhone } from "@/types/crm";
import { currentUser, db, getSettings } from "@/lib/crm/db";
import { radarRefreshPool } from "@/data/crm/radar-events";
import { withLatency, latency } from "./base";
import { findClientByMobile, nextRepresentative, notify } from "./bookings.service";

const now = () => new Date().toISOString();

/* ─── Enquiries (website, ask, chatbot, exhibitor, contact) ──────────────── */

/** Called by public forms and the chatbot. Writes to the same store the dashboard reads. */
export async function submitEnquiry(input: EnquiryInput): Promise<Enquiry> {
  return withLatency(() => {
    // Minimal validation: a name and a way to reply (phone, or email for contact/ask forms).
    const err = requireNameAndPhone({ name: input.name, mobile: input.mobile || (input.email ? "000000" : "") });
    if (err) throw new Error(err);
    const e = db.enquiries.create({
      type: input.type ?? "enquiry",
      source: input.source ?? "website",
      name: input.name.trim(),
      mobile: input.mobile?.trim() || "—",
      email: input.email,
      eventType: input.eventType,
      preferredDate: input.preferredDate,
      guests: input.guests,
      hallPreference: input.hallPreference,
      message: input.message ?? "",
      language: input.language,
      status: "new",
    });
    const score = scoreLead({ guests: input.guests, preferredDate: input.preferredDate, eventType: input.eventType, email: input.email });
    const lead = db.leads.create(
      { name: e.name, mobile: e.mobile, email: e.email, source: e.source, stage: "new", score, eventType: e.eventType, expectedDate: e.preferredDate, guests: e.guests, value: (e.guests ?? 300) * 2500, enquiryId: e.id },
      { silent: true }
    );
    const hot = score >= getSettings().hotLeadScore;
    notify({
      title: hot ? "🔥 Hot lead" : `New ${e.type === "chatbot" ? "chatbot lead" : e.type}`,
      body: `${e.name}${e.eventType ? ` · ${e.eventType}` : ""}${e.guests ? ` · ${e.guests} guests` : ""}`,
      kind: hot ? "hot_lead" : "lead",
      href: hot ? `/dashboard/marketing/leads?lead=${lead.id}` : `/dashboard/sales/enquiries?e=${e.id}`,
      userId: null,
    });
    return e;
  });
}

/** Lightweight lead score 0–100. */
export function scoreLead(l: { guests?: number; preferredDate?: string; eventType?: string; email?: string; organization?: string }) {
  let s = 40;
  if (l.guests) s += Math.min(25, Math.round(l.guests / 120));
  if (l.preferredDate) {
    const days = (new Date(l.preferredDate).getTime() - Date.now()) / 86400000;
    if (days > 0 && days < 120) s += 15;
  }
  if (l.eventType && /fair|expo|exhibition|conference|wedding|convocation/i.test(l.eventType)) s += 10;
  if (l.email) s += 5;
  if (l.organization) s += 5;
  return Math.min(99, s);
}

export async function assignEnquiry(id: string, userId: string) {
  return withLatency(() => {
    const e = db.enquiries.update(id, { assignedTo: userId, status: "assigned" });
    notify({ title: "Enquiry assigned to you", body: `${e.name} — ${e.message.slice(0, 80)}`, kind: "lead", href: `/dashboard/sales/enquiries?e=${id}`, userId });
    return e;
  });
}

export async function replyEnquiry(id: string, replyNote: string) {
  return withLatency(() => {
    const e = db.enquiries.update(id, { replyNote, status: "replied" });
    db.leads.active().filter((l) => l.enquiryId === id && l.stage === "new").forEach((l) => db.leads.update(l.id, { stage: "contacted", firstResponseAt: now() }, { silent: true }));
    return e;
  });
}

/* ─── Leads ──────────────────────────────────────────────────────────────── */

export async function createLead(input: LeadInput): Promise<Lead> {
  return withLatency(() => {
    const err = requireNameAndPhone(input);
    if (err) throw new Error(err);
    return db.leads.create({ stage: "new", value: 0, ...input, score: scoreLead({ ...input }), assignedTo: input.assignedTo || nextRepresentative() } as Omit<Lead, "id" | "createdAt" | "updatedAt">);
  });
}

export async function moveLead(id: string, stage: Lead["stage"], lostReason?: string) {
  return withLatency(() => {
    const l = db.leads.get(id);
    if (!l) throw new Error("Lead not found");
    return db.leads.update(id, { stage, lostReason: stage === "lost" ? lostReason || l.lostReason || "Not specified" : undefined, firstResponseAt: l.firstResponseAt ?? (stage !== "new" ? now() : undefined) });
  });
}

/* ─── Opportunity Radar ──────────────────────────────────────────────────── */

export function pitchText(r: RadarEvent, channel: "email" | "whatsapp", sender = currentUser().name) {
  const dates = `${r.startDate} – ${r.endDate}`;
  if (channel === "whatsapp") {
    return `Assalamu Alaikum! This is ${sender} from ICCB (International Convention City Bashundhara), Dhaka.\n\nWe saw that ${r.title} (${dates}) is planning its next edition. ${r.suggestedHall} would be a strong fit:\n${r.pitch.map((p) => `• ${p}`).join("\n")}\n\nCould we hold your preferred dates and arrange a site visit?`;
  }
  return `Subject: Hosting ${r.title} at ICCB, Dhaka\n\nDear ${r.organizer} team,\n\nI am ${sender} from International Convention City Bashundhara (ICCB), South Asia's largest event venue. We understand ${r.title} is expected to welcome about ${r.expectedAttendance.toLocaleString("en-US")} visitors (${dates}).\n\nWhy ICCB:\n${r.pitch.map((p) => `- ${p}`).join("\n")}\n\nWe would be glad to share an indicative proposal and hold dates for you. Would a short call this week work?\n\nBest regards,\n${sender}\nICCB Sales · +88-01991-197719 · iccb@bga-bd.com`;
}

export async function convertRadarToLead(id: string): Promise<Lead> {
  return withLatency(() => {
    const r = db.radar.get(id);
    if (!r) throw new Error("Radar item not found");
    const assignedTo = nextRepresentative();
    const lead = db.leads.create({
      name: `${r.organizer} contact`,
      organization: r.organizer,
      mobile: "—",
      source: "radar",
      stage: "new",
      score: r.score,
      eventType: r.category,
      expectedDate: r.startDate,
      guests: r.expectedAttendance,
      value: Math.round(r.expectedAttendance * 80),
      assignedTo,
      radarId: r.id,
      pitch: pitchText(r, "email"),
      notes: r.summary,
    });
    db.tasks.create({ title: `Pitch ${r.organizer} — ${r.title}`, type: "follow_up", dueAt: addDays(new Date(), 2).toISOString(), status: "open", assignedTo, leadId: lead.id, notes: r.pitch.join("\n"), auto: true }, { silent: true });
    db.radar.update(id, { status: "converted", leadId: lead.id, isNew: false });
    notify({ title: "Radar opportunity converted", body: `${r.title} → lead`, kind: "lead", href: `/dashboard/marketing/leads?lead=${lead.id}`, userId: assignedTo ?? null });
    return lead;
  });
}

/** Simulated AI scan: 2 s shimmer, then 2–3 new items appear. */
export async function refreshRadar(): Promise<RadarEvent[]> {
  await latency(1800, 2200);
  const existing = new Set(db.radar.all().map((r) => r.title));
  const pool = radarRefreshPool.filter((r) => !existing.has(r.title));
  const take = pool.slice(0, pool.length >= 3 ? 3 : pool.length);
  // Clear old "New" badges first.
  db.radar.active().filter((r) => r.isNew).forEach((r) => db.radar.update(r.id, { isNew: false }, { silent: true }));
  return take.map((r) => db.radar.create({ ...r, id: undefined, createdAt: now(), publishedAt: now().slice(0, 10), isNew: true }));
}

/* ─── Tasks ──────────────────────────────────────────────────────────────── */

export async function createTask(input: TaskInput): Promise<Task> {
  return withLatency(() => {
    if (!input.title?.trim()) throw new Error("Please enter a title");
    return db.tasks.create({ status: "open", ...input, assignedTo: input.assignedTo || currentUser().id });
  });
}

export async function completeTask(id: string, done = true) {
  return withLatency(() => db.tasks.update(id, { status: done ? "done" : "open" }));
}

export async function snoozeTask(id: string, days = 1) {
  return withLatency(() => {
    const t = db.tasks.get(id);
    if (!t) throw new Error("Task not found");
    const base = new Date(Math.max(Date.now(), new Date(t.dueAt).getTime()));
    return db.tasks.update(id, { dueAt: addDays(base, days).toISOString(), snoozedUntil: addDays(base, days).toISOString() });
  });
}

/* ─── Clients ────────────────────────────────────────────────────────────── */

export function duplicateClients() {
  const groups = new Map<string, string[]>();
  for (const c of db.clients.active()) {
    const k = c.mobile.replace(/\D/g, "").slice(-11);
    groups.set(k, [...(groups.get(k) ?? []), c.id]);
  }
  return [...groups.values()].filter((g) => g.length > 1);
}

export { findClientByMobile };
