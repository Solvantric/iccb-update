/**
 * Collections & cash-flow — pure. Due schedule per booking, aging buckets and a weekly forecast.
 * Money owed to ICCB (advance, balance, extras) and money ICCB owes back (security refunds).
 */
import { addDays, differenceInCalendarDays, format, startOfWeek, subDays } from "date-fns";
import type { Booking, Payment } from "@/types/crm";
import { firstEventDate, lastEventDate, parseYmd, type Estimate } from "./pricing";
import { refundDueDate } from "./rules";

export type DueKind = "advance" | "balance" | "extras";
export interface DueItem {
  kind: DueKind;
  label: string;
  dueDate: string;
  amount: number;
  paid: number;
  remaining: number;
  overdueDays: number; // 0 when not overdue
}

export interface Receivable {
  bookingId: string;
  items: DueItem[];
  total: number;
  received: number;
  balance: number;
  nextDue?: DueItem;
  overdue: number; // overdue amount
  overdueDays: number; // oldest overdue item
  bucket: AgingBucket | null;
}

export type AgingBucket = "1–7" | "8–15" | "16–30" | "30+";
export const AGING_BUCKETS: AgingBucket[] = ["1–7", "8–15", "16–30", "30+"];

export function agingBucket(days: number): AgingBucket | null {
  if (days <= 0) return null;
  if (days <= 7) return "1–7";
  if (days <= 15) return "8–15";
  if (days <= 30) return "16–30";
  return "30+";
}

export interface CollectionsCtx {
  today: string;
  balanceDueDays: number;
  advancePct: number;
  holidays: string[];
}

/**
 * Due schedule: advance (advancePct of venue rent) at confirmation, the balance by
 * event − balanceDueDays, extras / leakage lines after the event (+7 days).
 * Payments are allocated oldest-first.
 */
export function dueSchedule(b: Booking, est: Estimate, ctx: CollectionsCtx): Receivable {
  const event = firstEventDate(b);
  const last = lastEventDate(b);
  const confirmedOn = (b.approvedAt ?? b.createdAt).slice(0, 10);
  const extras = est.lines.filter((l) => l.group === "extra" || l.group === "damage").reduce((s, l) => s + l.amount, 0) + b.addons.filter((a) => a.reason?.startsWith("leakage:") && a.kind !== "extra").reduce((s, a) => s + a.qty * a.rate, 0);
  const advance = Math.min(est.grandTotal, Math.round((est.venueRent * ctx.advancePct) / 100));
  const balance = Math.max(0, est.grandTotal - advance - extras);
  const plan: Omit<DueItem, "paid" | "remaining" | "overdueDays">[] = [
    { kind: "advance", label: `Advance ${ctx.advancePct}%`, dueDate: confirmedOn, amount: advance },
    { kind: "balance", label: "Balance", dueDate: format(subDays(parseYmd(event), ctx.balanceDueDays), "yyyy-MM-dd"), amount: balance },
  ];
  if (extras > 0) plan.push({ kind: "extras", label: "Extras after the event", dueDate: format(addDays(parseYmd(last), 7), "yyyy-MM-dd"), amount: extras });

  let pool = est.received;
  const items: DueItem[] = plan.map((p) => {
    const paid = Math.min(p.amount, Math.max(0, pool));
    pool -= paid;
    const remaining = p.amount - paid;
    const overdueDays = remaining > 0 && p.dueDate < ctx.today ? differenceInCalendarDays(parseYmd(ctx.today), parseYmd(p.dueDate)) : 0;
    return { ...p, paid, remaining, overdueDays };
  });
  const overdueItems = items.filter((i) => i.overdueDays > 0);
  const overdueDays = Math.max(0, ...overdueItems.map((i) => i.overdueDays));
  return {
    bookingId: b.id,
    items,
    total: est.grandTotal,
    received: est.received,
    balance: Math.max(0, est.grandTotal - est.received),
    nextDue: items.find((i) => i.remaining > 0),
    overdue: overdueItems.reduce((s, i) => s + i.remaining, 0),
    overdueDays,
    bucket: agingBucket(overdueDays),
  };
}

/** Security refund: held security − damages − dues, due event + 15 working days. */
export interface RefundRow {
  bookingId: string;
  securityHeld: number;
  damages: number;
  dues: number;
  amount: number;
  dueDate: string;
  daysLeft: number;
  status: "pending" | "cheque_prepared" | "refunded";
  overdue: boolean;
}

export function refundRow(b: Booking, est: Estimate, ctx: Pick<CollectionsCtx, "today" | "holidays">): RefundRow | null {
  const last = lastEventDate(b);
  if (!last || last >= ctx.today) return null;
  if (b.status === "requested" || b.closed?.kind === "lost") return null;
  const securityHeld = Math.min(est.security, est.received);
  if (securityHeld <= 0 && !b.refund) return null;
  const damages = (b.damage?.rows ?? []).reduce((s, r) => s + r.qty * r.rate, 0);
  const dues = Math.max(0, est.grandTotal - est.received);
  const amount = b.refund?.refundedAt ? b.refund.amount : Math.max(0, securityHeld - damages - dues);
  const dueDate = b.refund?.dueDate ?? refundDueDate(last, ctx.holidays);
  const status = b.refund?.refundedAt ? "refunded" : b.refund?.status === "cheque_prepared" ? "cheque_prepared" : "pending";
  const daysLeft = differenceInCalendarDays(parseYmd(dueDate), parseYmd(ctx.today));
  return { bookingId: b.id, securityHeld, damages, dues, amount, dueDate, daysLeft, status, overdue: status !== "refunded" && daysLeft < 0 };
}

/** 13 weekly buckets (6 past, this week, 6 ahead): scheduled dues vs money received. */
export function weeklyForecast(receivables: Receivable[], payments: Pick<Payment, "date" | "amount" | "purpose">[], today: string, weeks = 13) {
  const thisWeek = startOfWeek(parseYmd(today), { weekStartsOn: 0 });
  const start = subDays(thisWeek, 7 * Math.floor((weeks - 1) / 2));
  return Array.from({ length: weeks }, (_, i) => {
    const from = addDays(start, i * 7);
    const to = addDays(from, 6);
    const f = format(from, "yyyy-MM-dd");
    const t = format(to, "yyyy-MM-dd");
    const expected = receivables.flatMap((r) => r.items).filter((it) => it.dueDate >= f && it.dueDate <= t).reduce((s, it) => s + (it.dueDate < today ? it.amount : it.remaining), 0);
    const received = payments.filter((p) => p.purpose !== "security" && p.date >= f && p.date <= t).reduce((s, p) => s + p.amount, 0);
    return { week: format(from, "dd MMM"), from: f, to: t, expected, received, current: today >= f && today <= t };
  });
}

/** Amount expected to come in within the next N days (unpaid, not yet overdue). */
export function expectedWithin(receivables: Receivable[], today: string, days: number) {
  const end = format(addDays(parseYmd(today), days), "yyyy-MM-dd");
  return receivables.flatMap((r) => r.items).filter((i) => i.remaining > 0 && i.dueDate >= today && i.dueDate <= end).reduce((s, i) => s + i.remaining, 0);
}

/** Reminder text (WhatsApp / SMS) in EN or BN. */
export function reminderText(lang: "en" | "bn", v: { name: string; amount: string; due: string; bfNo: string; event: string; rep: string; phone: string }) {
  if (lang === "bn")
    return `আসসালামু আলাইকুম ${v.name},\nICCB-তে আপনার "${v.event}" (বুকিং ${v.bfNo})-এর বকেয়া ${v.amount}, পরিশোধের শেষ তারিখ ${v.due}।\nনগদ / চেক / পে-অর্ডার (International Convention City Bashundhara-এর নামে) দিয়ে পরিশোধ করা যাবে।\n— ${v.rep}, ICCB · ${v.phone}`;
  return `Dear ${v.name},\nThis is a friendly reminder from ICCB: ${v.amount} is due by ${v.due} for "${v.event}" (booking ${v.bfNo}).\nPay by cash, cheque or pay order in favor of "International Convention City Bashundhara".\n— ${v.rep}, ICCB · ${v.phone}`;
}
