/** The 3-status booking flow with checklist guards (§3). Pure functions. */
import type { Booking, BookingStatus, Invoice, Payment } from "@/types/crm";
import type { Estimate } from "./pricing";

export interface FlowContext {
  estimate: Estimate;
  payments: Payment[];
  documents: Invoice[];
  advancePct: number;
}

export interface ChecklistItem {
  key: string;
  label: string;
  hint?: string;
  required: boolean;
  /** auto = computed from data; manual = staff ticks it */
  mode: "auto" | "manual";
  done: boolean;
  at?: string;
  by?: string;
  /** Workspace tab that resolves this item. */
  tab?: WorkspaceTab;
}

export type WorkspaceTab = "overview" | "services" | "estimate" | "payments" | "documents" | "ppm" | "event" | "feedback" | "activity";

const mark = (b: Booking, key: string) => b.checklist[key];
const manual = (b: Booking, key: string) => !!b.checklist[key]?.done;

export function checklistFor(status: BookingStatus, b: Booking, ctx: FlowContext): ChecklistItem[] {
  const hasDoc = (kind: Invoice["kind"]) => ctx.documents.some((d) => d.kind === kind && !d.deletedAt);
  const advanceDone = ctx.estimate.advancePaid >= ctx.estimate.advanceRequired && ctx.estimate.advanceRequired > 0;
  const item = (i: Omit<ChecklistItem, "at" | "by">): ChecklistItem => ({ ...i, at: mark(b, i.key)?.at, by: mark(b, i.key)?.by });

  if (status === "requested") {
    return [
      item({ key: "form_received", label: "Booking form received", hint: `Source: ${b.source.replace("_", "-")}`, required: true, mode: "auto", done: true, tab: "overview" }),
      item({ key: "estimate", label: "Provisional estimate generated", hint: "Auto-calculated from the pricing engine", required: true, mode: "auto", done: true, tab: "estimate" }),
      item({ key: "assigned", label: "Representative assigned", required: true, mode: "auto", done: !!b.assignedTo, tab: "overview" }),
      item({ key: "called", label: "Client called (first response)", hint: "Target: under 2 hours", required: true, mode: "auto", done: !!b.firstResponseAt, tab: "activity" }),
      item({ key: "meeting", label: "Meeting / site visit scheduled", required: true, mode: "auto", done: !!b.meetingAt, tab: "overview" }),
    ];
  }

  if (status === "confirmed") {
    return [
      item({ key: "id_verified", label: "Client details & NID/Passport verified", required: true, mode: "auto", done: !!b.idVerified, tab: "documents" }),
      item({ key: "finalized", label: "Hall, dates, guests & layout finalized", required: true, mode: "manual", done: manual(b, "finalized"), tab: "overview" }),
      item({ key: "services", label: "Services, add-ons & discount settled", hint: b.discount.approval === "pending" ? "Discount waiting for manager approval" : undefined, required: true, mode: "auto", done: b.discount.approval !== "pending", tab: "services" }),
      item({ key: "booking_form", label: "Booking Form & estimate generated, client acknowledged", required: true, mode: "auto", done: hasDoc("booking_form") && !!b.acknowledgement?.accepted, tab: "estimate" }),
      item({ key: "advance", label: `Advance ≥ ${ctx.advancePct}% of venue rent received`, required: true, mode: "auto", done: advanceDone, tab: "payments" }),
      item({ key: "approved", label: "Approved by Sales Manager", required: true, mode: "auto", done: !!b.approvedBy, tab: "overview" }),
      item({ key: "documents", label: "Document checklist complete", required: false, mode: "auto", done: b.documents.every((d) => d.state !== "pending"), tab: "documents" }),
      item({ key: "ppm", label: "PPM held (≥15 days before)", required: false, mode: "auto", done: !!b.ppm?.done, tab: "ppm" }),
      item({ key: "balance_paid", label: "Full payment received", required: false, mode: "auto", done: ctx.estimate.balance - ctx.estimate.security <= 0 || ctx.estimate.received >= ctx.estimate.grandTotal - ctx.estimate.security, tab: "payments" }),
    ];
  }

  return [
    item({ key: "fact_sheet", label: "Program Fact Sheet filled", required: true, mode: "auto", done: !!b.factSheet?.done, tab: "event" }),
    item({ key: "evaluation", label: "Evaluation of Service collected", required: true, mode: "auto", done: !!b.evaluation, tab: "feedback" }),
    item({ key: "damage", label: "Damage claim recorded (or no damage)", required: true, mode: "auto", done: !!b.damage?.done, tab: "feedback" }),
    item({ key: "final_invoice", label: "Final invoice settled", required: true, mode: "auto", done: hasDoc("invoice") && ctx.estimate.balance <= ctx.estimate.security, tab: "estimate" }),
    item({ key: "refund", label: "Security money refunded / adjusted", required: true, mode: "auto", done: !!b.refund?.refundedAt, tab: "feedback" }),
  ];
}

/** Items that must be done before moving out of `from` into the next status. */
export function missingToAdvance(b: Booking, ctx: FlowContext): ChecklistItem[] {
  if (b.status === "requested") return checklistFor("requested", b, ctx).filter((i) => i.required && !i.done);
  if (b.status === "confirmed") {
    // Approval itself is the action, so it's not a blocker for confirming.
    return [
      ...checklistFor("confirmed", b, ctx).filter((i) => i.required && !i.done && i.key !== "approved"),
    ];
  }
  return [];
}

/** Items blocking completion (while Confirmed). */
export function missingToComplete(b: Booking, ctx: FlowContext): ChecklistItem[] {
  return checklistFor("completed", b, ctx).filter((i) => i.required && !i.done);
}

export const NEXT_STATUS: Record<BookingStatus, BookingStatus | null> = {
  requested: "confirmed",
  confirmed: "completed",
  completed: null,
};
export const PREV_STATUS: Record<BookingStatus, BookingStatus | null> = {
  requested: null,
  confirmed: "requested",
  completed: "confirmed",
};

/**
 * "Confirmed" in the UI means approved. Before approval the booking stays in
 * Requested while the Confirmed-stage meeting items are worked on.
 */
export function guardFor(b: Booking, target: BookingStatus, ctx: FlowContext): ChecklistItem[] {
  if (target === "confirmed" && b.status === "requested") {
    return [
      ...checklistFor("requested", b, ctx).filter((i) => i.required && !i.done),
      ...checklistFor("confirmed", b, ctx).filter((i) => i.required && !i.done && i.key !== "approved"),
    ];
  }
  if (target === "completed" && b.status === "confirmed") return missingToComplete(b, ctx);
  return [];
}

export function stageProgress(b: Booking, ctx: FlowContext) {
  const items = checklistFor(b.status, b, ctx);
  const done = items.filter((i) => i.done).length;
  return { done, total: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
}

export const STATUS_COLORS: Record<BookingStatus, string> = {
  requested: "#F59E0B",
  confirmed: "#E24F5F",
  completed: "#12B76A",
};
