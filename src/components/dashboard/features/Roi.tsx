"use client";
import { useMemo } from "react";
import Link from "next/link";
import { format, startOfMonth, subMonths } from "date-fns";
import { ArrowRight, CalendarCheck, CoinVertical, Megaphone, ShieldCheck, Timer } from "@phosphor-icons/react";
import type { Booking, Payment } from "@/types/crm";
import { getFeatureSettings } from "@/lib/crm/db";
import { firstEventDate } from "@/lib/crm/pricing";
import { dueSchedule } from "@/lib/crm/collections";
import { takaShort, todayYmd } from "@/lib/crm/format";
import { estimateFor, findingsFor } from "@/services/crm/bookings.service";
import { readinessOf } from "@/services/crm/features.service";
import { m } from "../ui/motion";
import { Card, CardHeader } from "../ui/core";
import { AnimatedNumber, Sparkline } from "../ui/kpi";

interface Metric {
  key: string;
  label: string;
  value: number;
  format: (n: number) => string;
  hint: string;
  spark: number[];
  href: string;
  icon: typeof CoinVertical;
  good: boolean;
}

/** "Value delivered this month" — the money value of the CRM, for Admin & Sales Manager. */
export function RoiWidget({ bookings, payments }: { bookings: Booking[]; payments: Payment[] }) {
  const metrics = useMemo<Metric[]>(() => {
    const today = todayYmd();
    const months = Array.from({ length: 6 }, (_, i) => format(startOfMonth(subMonths(new Date(), 5 - i)), "yyyy-MM"));
    const thisMonth = months[5];
    const fs = getFeatureSettings();
    const live = bookings.filter((b) => !b.closed && !b.deletedAt);
    const pays = (id: string) => payments.filter((p) => p.bookingId === id);

    // 1. Leakage recovered (added to bills), by month resolved.
    const findings = live.filter((b) => b.status !== "requested").flatMap((b) => findingsFor(b));
    const recovered = (mo: string) => findings.filter((f) => f.status === "added" && f.resolvedAt?.startsWith(mo)).reduce((s, f) => s + f.expectedAmount, 0);

    // 2. Revenue from idle-date offers, by event month.
    const offerBookings = live.filter((b) => b.offerId);
    const offerRev = (mo?: string) => offerBookings.filter((b) => !mo || firstEventDate(b).startsWith(mo)).reduce((s, b) => s + estimateFor(b, pays(b.id)).grandTotal, 0);

    // 3. First response time (hours), requests created that month.
    const resp = (mo: string) => {
      const xs = bookings.filter((b) => b.createdAt.startsWith(mo) && b.firstResponseAt).map((b) => (new Date(b.firstResponseAt!).getTime() - new Date(b.createdAt).getTime()) / 3600000);
      return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
    };

    // 4. On-time collections: balance due dates in the month, paid in full by the due date.
    const ctx = { today, balanceDueDays: fs.balanceDueDays, advancePct: fs.advancePct, holidays: fs.holidays };
    const dueRows = live.filter((b) => b.status !== "requested").map((b) => ({ b, r: dueSchedule(b, estimateFor(b, pays(b.id)), ctx) }));
    const onTime = (mo: string) => {
      const items = dueRows.filter(({ r }) => r.items[1]?.dueDate.startsWith(mo) && r.items[1].dueDate <= today);
      if (!items.length) return 0;
      const ok = items.filter(({ b, r }) => {
        const due = r.items[1].dueDate;
        const paidBy = pays(b.id).filter((p) => p.date <= due && p.purpose !== "security").reduce((s, p) => s + p.amount, 0);
        return paidBy >= r.items[0].amount + r.items[1].amount;
      }).length;
      return Math.round((ok / items.length) * 100);
    };

    // 5. Events at risk at D-15 that still reached the event ready / completed.
    const prevented = (mo: string) =>
      live.filter((b) => b.readiness?.levelAtD15 === "risk" && firstEventDate(b).startsWith(mo) && firstEventDate(b) <= today && (b.status === "completed" || readinessOf(b, firstEventDate(b)).level === "ready")).length;

    const target = 2;
    return [
      { key: "leak", label: "Recovered by Leakage Guard", value: recovered(thisMonth), format: (n) => takaShort(n), hint: "Unbilled items added to bills", spark: months.map(recovered), href: "/dashboard/sales/invoices?tab=leakage", icon: CoinVertical, good: true },
      { key: "idle", label: "Revenue from idle-date offers", value: offerRev(), format: (n) => takaShort(n), hint: `${offerBookings.length} booking${offerBookings.length === 1 ? "" : "s"} won with an offer code`, spark: months.map((mo) => offerRev(mo)), href: "/dashboard/marketing/demand?tab=idle", icon: Megaphone, good: true },
      { key: "resp", label: "Avg first response", value: resp(thisMonth), format: (n) => `${n.toFixed(1)} h`, hint: `Target under ${target} h`, spark: months.map(resp), href: "/dashboard/sales/bookings", icon: Timer, good: resp(thisMonth) <= target },
      { key: "ontime", label: "On-time collections", value: onTime(thisMonth), format: (n) => `${Math.round(n)}%`, hint: "Balances paid by the due date", spark: months.map(onTime), href: "/dashboard/sales/invoices?tab=collections", icon: CalendarCheck, good: onTime(thisMonth) >= 80 },
      { key: "risk", label: "Events at risk prevented", value: months.reduce((s, mo) => s + prevented(mo), 0), format: (n) => String(Math.round(n)), hint: "Risk at D-15 → ready on the day (6 months)", spark: months.map(prevented), href: "/dashboard/operations/events", icon: ShieldCheck, good: true },
    ];
  }, [bookings, payments]);

  return (
    <Card className="mb-6">
      <CardHeader icon={CoinVertical} title="Value delivered this month" description="What the CRM is worth in money and time. Click a figure for its report." />
      <div className="grid divide-y divide-crm-line border-t border-crm-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x rtl:lg:divide-x-reverse">
        {metrics.map((x, i) => (
          <m.div key={x.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            <Link href={x.href} className="group flex h-full flex-col gap-1 px-5 py-4 transition-colors hover:bg-crm-surface-2">
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-crm-muted">
                <x.icon size={15} className="text-crm-brand" /> {x.label}
              </span>
              <span className="font-display text-[26px] font-semibold leading-tight" style={{ color: x.good ? "var(--crm-ink)" : "#B54708" }}>
                <AnimatedNumber value={x.value} format={x.format} />
              </span>
              <span className="text-[11.5px] text-crm-muted">{x.hint}</span>
              <span className="mt-auto flex items-end justify-between gap-2 pt-1">
                <Sparkline data={x.spark} className="max-w-[110px]" height={26} />
                <ArrowRight size={14} className="text-crm-muted transition-transform group-hover:translate-x-0.5 group-hover:text-crm-brand rtl:rotate-180" />
              </span>
            </Link>
          </m.div>
        ))}
      </div>
    </Card>
  );
}
