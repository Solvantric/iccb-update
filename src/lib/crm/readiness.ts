/**
 * Event Readiness Score — pure. How ready a Confirmed event is (0–100).
 * Not-yet-due items are "on track" (50% credit); overdue items score 0.
 */
import { subDays, format } from "date-fns";
import type { Booking, ReadinessWeights } from "@/types/crm";
import { firstEventDate, parseYmd, type Estimate } from "./pricing";
import { DEFAULT_READINESS_WEIGHTS } from "./feature-settings";
import { ppmDueDate } from "./rules";

export type ReadinessArea = keyof ReadinessWeights;
export type ReadinessLevel = "ready" | "attention" | "risk";
export type ItemState = "done" | "on_track" | "overdue";

export const AREA_LABELS: Record<ReadinessArea, string> = {
  payment: "Payment",
  documents: "Documents",
  ppm: "PPM",
  permissions: "Permissions",
  vendors: "Vendors",
};

export const LEVEL_LABELS: Record<ReadinessLevel, string> = { ready: "Ready", attention: "Attention", risk: "Risk" };
/** Status token colours (success / warning / danger). */
export const LEVEL_COLORS: Record<ReadinessLevel, string> = { ready: "#12B76A", attention: "#F79009", risk: "#D92D20" };

export interface ReadinessItem {
  area: ReadinessArea;
  label: string;
  weight: number;
  credit: number; // 0..1
  state: ItemState;
  dueDate?: string;
  detail: string;
  /** Sub-items that are not done (for tasks / popover). */
  open: { label: string; dueDate?: string; state: ItemState }[];
}

export interface ReadinessResult {
  score: number;
  level: ReadinessLevel;
  items: ReadinessItem[];
  nextDeadline?: string;
  daysToEvent: number;
}

export interface ReadinessCtx {
  est: Pick<Estimate, "advancePaid" | "advanceRequired" | "balance">;
  balanceDueDays: number;
  weights?: ReadinessWeights;
  /** Score of the linked outside decorator (null = not linked to a known vendor). */
  vendorScore?: number | null;
}

const PERMISSION_KEYS = new Set(["police", "nbr", "commerce", "cultural", "education"]);
const ymd = (d: Date) => format(d, "yyyy-MM-dd");

export const levelFor = (score: number): ReadinessLevel => (score >= 80 ? "ready" : score >= 50 ? "attention" : "risk");

function stateOf(done: boolean, dueDate: string | undefined, today: string): ItemState {
  if (done) return "done";
  if (dueDate && dueDate < today) return "overdue";
  return "on_track";
}
const creditOf = (s: ItemState) => (s === "done" ? 1 : s === "on_track" ? 0.5 : 0);
const worst = (states: ItemState[]): ItemState => (states.includes("overdue") ? "overdue" : states.includes("on_track") ? "on_track" : "done");

export function readiness(b: Booking, today: string, ctx: ReadinessCtx): ReadinessResult {
  const w = { ...DEFAULT_READINESS_WEIGHTS, ...(ctx.weights ?? {}) };
  const event = firstEventDate(b);
  const daysToEvent = Math.round((parseYmd(event).getTime() - parseYmd(today).getTime()) / 86400000);
  const docsDue = ymd(subDays(parseYmd(event), 5));
  const items: ReadinessItem[] = [];

  /* Payment — advance at confirmation, full balance by event − balanceDueDays. */
  {
    const balanceDue = ymd(subDays(parseYmd(event), ctx.balanceDueDays));
    const advanceOk = ctx.est.advanceRequired <= 0 || ctx.est.advancePaid >= ctx.est.advanceRequired;
    const paid = ctx.est.balance <= 0;
    const open: ReadinessItem["open"] = [];
    let state: ItemState;
    if (!advanceOk) {
      state = "overdue";
      open.push({ label: "Advance (60% of venue rent)", state: "overdue", dueDate: b.approvedAt?.slice(0, 10) });
    } else if (paid) state = "done";
    else {
      state = today >= balanceDue ? "overdue" : "on_track";
      open.push({ label: "Full balance payment", dueDate: balanceDue, state });
    }
    items.push({ area: "payment", label: AREA_LABELS.payment, weight: w.payment, credit: creditOf(state), state, dueDate: paid ? undefined : balanceDue, detail: !advanceOk ? "Advance not received" : paid ? "Fully paid" : `Balance due ${balanceDue}`, open });
  }

  /* Documents & permissions — from the booking checklist. */
  const docs = b.documents.filter((d) => d.state !== "na" && d.key !== "ppm_copy");
  const scoreDocs = (list: typeof docs, area: "documents" | "permissions") => {
    if (!list.length) {
      items.push({ area, label: AREA_LABELS[area], weight: w[area], credit: 1, state: "done", detail: "None required", open: [] });
      return;
    }
    const rows = list.map((d) => {
      const due = d.dueDate ?? docsDue;
      return { label: d.label, dueDate: due, state: stateOf(d.state === "yes", due, today) };
    });
    const credit = rows.reduce((s, r) => s + creditOf(r.state), 0) / rows.length;
    const done = rows.filter((r) => r.state === "done").length;
    const pending = rows.filter((r) => r.state !== "done");
    items.push({
      area,
      label: AREA_LABELS[area],
      weight: w[area],
      credit,
      state: worst(rows.map((r) => r.state)),
      dueDate: pending.map((r) => r.dueDate).sort()[0],
      detail: `${done}/${rows.length} received`,
      open: pending,
    });
  };
  scoreDocs(docs.filter((d) => !PERMISSION_KEYS.has(d.key)), "documents");
  scoreDocs(docs.filter((d) => PERMISSION_KEYS.has(d.key)), "permissions");

  /* PPM — held and minutes saved by event − 15 days. */
  {
    const due = ppmDueDate(event);
    const state = stateOf(!!b.ppm?.done, due, today);
    items.push({ area: "ppm", label: AREA_LABELS.ppm, weight: w.ppm, credit: creditOf(state), state, dueDate: state === "done" ? undefined : due, detail: state === "done" ? `Held ${b.ppm?.date ?? ""}` : `Due ${due}`, open: state === "done" ? [] : [{ label: "PPM minutes", dueDate: due, state }] });
  }

  /* Vendors — decoration provider OK + sound/stage provider noted. */
  {
    const ppmDue = ppmDueDate(event);
    const open: ReadinessItem["open"] = [];
    let deco: ItemState;
    if (b.decoration.provider !== "outside") deco = "done";
    else if (ctx.vendorScore != null && ctx.vendorScore >= 60) deco = "done";
    else if (ctx.vendorScore != null) deco = "overdue"; // low-score vendor
    else deco = stateOf(false, ppmDue, today);
    if (deco !== "done") open.push({ label: ctx.vendorScore != null ? `Decorator score ${ctx.vendorScore} (< 60)` : "Link the outside decorator to a vendor", dueDate: ppmDue, state: deco });
    const soundNoted = !!(b.ppm?.extras?.soundProvider || b.ppm?.agenda?.[5]);
    const sound = stateOf(soundNoted, ppmDue, today);
    if (sound !== "done") open.push({ label: "Sound / stage provider", dueDate: ppmDue, state: sound });
    const credit = (creditOf(deco) + creditOf(sound)) / 2;
    items.push({ area: "vendors", label: AREA_LABELS.vendors, weight: w.vendors, credit, state: worst([deco, sound]), dueDate: open.length ? ppmDue : undefined, detail: open.length ? `${2 - open.length}/2 settled` : "Settled", open });
  }

  const totalWeight = items.reduce((s, i) => s + i.weight, 0) || 1;
  const score = Math.round((items.reduce((s, i) => s + i.weight * i.credit, 0) / totalWeight) * 100);
  const nextDeadline = items
    .flatMap((i) => i.open.map((o) => o.dueDate))
    .filter((d): d is string => !!d && d >= today)
    .sort()[0];
  return { score, level: levelFor(score), items, nextDeadline, daysToEvent };
}

/** Milestones (days before the event) that trigger follow-up tasks. */
export const MILESTONES = [15, 7, 3] as const;
export function dueMilestones(daysToEvent: number, done: string[] = []) {
  return MILESTONES.filter((d) => daysToEvent <= d && daysToEvent >= 0 && !done.includes(`D-${d}`)).map((d) => `D-${d}`);
}
