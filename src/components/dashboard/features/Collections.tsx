"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { BellRinging, CalendarCheck, ChatCircleText, Copy, CurrencyCircleDollar, DownloadSimple, HandCoins, Receipt, Scales, ShieldCheck, Vault, Wallet, WhatsappLogo } from "@phosphor-icons/react";
import type { Booking } from "@/types/crm";
import { downloadFile, getFeatureSettings, toCsv, useCurrentUser } from "@/lib/crm/db";
import { can } from "@/lib/crm/permissions";
import { firstEventDate } from "@/lib/crm/pricing";
import { AGING_BUCKETS, dueSchedule, expectedWithin, refundRow, reminderText, weeklyForecast, type Receivable, type RefundRow } from "@/lib/crm/collections";
import { fmtDate, taka, takaShort, todayYmd } from "@/lib/crm/format";
import { estimateFor, markRefunded } from "@/services/crm/bookings.service";
import { logReminder, setPromiseDate, setRefundStatus } from "@/services/crm/features.service";
import { useBookings, useCrmAction, usePayments, useUsers } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { m } from "../ui/motion";
import { Badge, Button, Card, CardHeader, Field, Input, Segmented, Textarea } from "../ui/core";
import { KpiCard } from "../ui/kpi";
import { DataTable, type Column } from "../ui/data-table";
import { Donut } from "../ui/charts";
import { Modal } from "../ui/overlay";
import { copyText } from "../ui/misc";
import { PaymentModal } from "../workspace/tabs/PaymentsTab";
import { ComposedBars } from "./charts";

interface RecRow extends Receivable {
  id: string;
  createdAt: string;
  b: Booking;
  event: string;
}

const AGING_COLORS = ["#F79009", "#F16A6E", "#D11319", "#740F12"];

export function CollectionsTab() {
  const bookings = useBookings();
  const payments = usePayments();
  const users = useUsers();
  const me = useCurrentUser();
  const today = todayYmd();
  const canEdit = can(me.role, "update", "collections");
  const [remind, setRemind] = useState<RecRow | null>(null);
  const [pay, setPay] = useState<Booking | null>(null);
  const [refundFor, setRefundFor] = useState<RefundRow & { b: Booking } | null>(null);

  const data = useMemo(() => {
    if (!bookings.data || !payments.data) return null;
    const fs = getFeatureSettings();
    const ctx = { today, balanceDueDays: fs.balanceDueDays, advancePct: fs.advancePct, holidays: fs.holidays };
    const live = bookings.data.filter((b) => !b.closed && b.status !== "requested");
    const recs: RecRow[] = [];
    const refunds: (RefundRow & { b: Booking })[] = [];
    let held = 0;
    for (const b of live) {
      const est = estimateFor(b, payments.data.filter((p) => p.bookingId === b.id));
      const r = dueSchedule(b, est, ctx);
      if (r.balance > 0) recs.push({ ...r, id: b.id, createdAt: b.createdAt, b, event: firstEventDate(b) });
      const rf = refundRow(b, est, ctx);
      if (rf && rf.status !== "refunded") refunds.push({ ...rf, b });
      if (!b.refund?.refundedAt) held += Math.min(est.security, est.received);
    }
    const month = today.slice(0, 7);
    const collected = payments.data.filter((p) => p.date.startsWith(month) && p.purpose !== "security").reduce((s, p) => s + p.amount, 0);
    const overdue = recs.reduce((s, r) => s + r.overdue, 0);
    const aging = AGING_BUCKETS.map((bk, i) => ({ name: `${bk} days`, value: recs.filter((r) => r.bucket === bk).reduce((s, r) => s + r.overdue, 0), color: AGING_COLORS[i] }));
    return {
      recs,
      refunds: refunds.sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
      held,
      collected,
      overdue,
      aging,
      e30: expectedWithin(recs, today, 30),
      e60: expectedWithin(recs, today, 60),
      e90: expectedWithin(recs, today, 90),
      weekly: weeklyForecast(recs, payments.data, today),
    };
  }, [bookings.data, payments.data, today]);

  const promise = useCrmAction((a: { id: string; date: string }) => setPromiseDate(a.id, a.date), { success: "Promise date saved" });
  const userName = (id?: string) => users.data?.find((u) => u.id === id)?.name ?? "—";

  const columns: Column<RecRow>[] = [
    { id: "client", header: "Client", primary: true, pinned: true, value: (r) => r.b.contact.name, cell: (r) => <Link href={`/dashboard/sales/bookings/${r.b.id}?tab=payments`} onClick={(e) => e.stopPropagation()} className="block max-w-[220px] hover:text-crm-brand"><span className="block truncate font-medium text-crm-ink">{r.b.contact.name}</span><span className="block truncate text-[12px] text-crm-muted">{r.b.eventTitle}</span></Link> },
    { id: "bf", header: "BF No", value: (r) => r.b.bfNo, cell: (r) => <span className="font-mono text-[12px]">{r.b.bfNo}</span>, hideOnMobile: true },
    { id: "event", header: "Event", value: (r) => r.event, cell: (r) => fmtDate(r.event) },
    { id: "total", header: "Total", align: "end", value: (r) => r.total, cell: (r) => <span className="tabular">{takaShort(r.total)}</span>, hideOnMobile: true },
    { id: "received", header: "Received", align: "end", value: (r) => r.received, cell: (r) => <span className="tabular">{takaShort(r.received)}</span>, hideOnMobile: true },
    { id: "balance", header: "Balance", align: "end", value: (r) => r.balance, cell: (r) => <span className="font-semibold tabular text-crm-ink">{taka(r.balance)}</span> },
    { id: "due", header: "Due", value: (r) => r.nextDue?.dueDate ?? "", cell: (r) => (r.nextDue ? <span><span className="block">{fmtDate(r.nextDue.dueDate)}</span><span className="text-[11.5px] text-crm-muted">{r.nextDue.label}</span></span> : "—") },
    { id: "aging", header: "Overdue", value: (r) => r.overdueDays, cell: (r) => (r.bucket ? <span className="crm-shake-once inline-block"><Badge tone={r.overdueDays > 15 ? "red" : "amber"}>{r.overdueDays} d · {r.bucket}</Badge></span> : <Badge tone="green">On time</Badge>) },
    { id: "rep", header: "Rep", value: (r) => userName(r.b.assignedTo), cell: (r) => userName(r.b.assignedTo), hidden: true },
    {
      id: "promise",
      header: "Promise to pay",
      value: (r) => r.b.promiseDate ?? "",
      cell: (r) =>
        canEdit ? (
          <span onClick={(e) => e.stopPropagation()} className="block w-[140px]">
            <Input type="date" value={r.b.promiseDate ?? ""} onChange={(e) => promise.mutate({ id: r.b.id, date: e.target.value })} className={cn("h-8 text-[12.5px]", r.b.promiseDate && r.b.promiseDate < today && "border-[#D92D20] text-[#D92D20]")} aria-label="Promise-to-pay date" />
          </span>
        ) : (
          fmtDate(r.b.promiseDate)
        ),
      hideOnMobile: true,
    },
  ];

  const loading = !data;
  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard label="Expected next 30 days" value={data?.e30 ?? 0} format={takaShort} icon={CalendarCheck} tone="blue" loading={loading} />
        <KpiCard label="Expected 60 / 90 days" value={data?.e90 ?? 0} format={(n) => `${takaShort(data?.e60 ?? 0)} / ${takaShort(n)}`} icon={Receipt} tone="blue" loading={loading} />
        <KpiCard label="Overdue total" value={data?.overdue ?? 0} format={takaShort} icon={Scales} tone="brand" loading={loading} />
        <KpiCard label="Collected this month" value={data?.collected ?? 0} format={takaShort} icon={Wallet} tone="green" loading={loading} />
        <KpiCard label="Security money held" value={data?.held ?? 0} format={takaShort} icon={Vault} tone="amber" loading={loading} />
        <KpiCard label="Refunds due / overdue" value={data?.refunds.length ?? 0} format={(n) => `${Math.round(n)} / ${data?.refunds.filter((r) => r.overdue).length ?? 0}`} icon={HandCoins} tone="amber" loading={loading} />
      </div>

      <div className="mb-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader icon={CurrencyCircleDollar} title="Weekly cash-flow" description="13 weeks: scheduled dues (bars) vs money received (line). This week is highlighted." />
          <div className="px-3 pb-4">{data && <ComposedBars data={data.weekly} />}</div>
        </Card>
        <Card>
          <CardHeader icon={Scales} title="Overdue by age" />
          <div className="px-5 pb-5">{data && <Donut data={data.aging} format={(n) => taka(n)} center={<div><p className="text-[11px] text-crm-muted">Overdue</p><p className="text-[15px] font-bold text-crm-ink">{takaShort(data.overdue)}</p></div>} />}</div>
        </Card>
      </div>

      <Card className="mb-6 overflow-hidden">
        <CardHeader
          icon={Receipt}
          title="Receivables"
          description="One row per booking with money still to collect. Oldest overdue first."
          action={
            <Button size="sm" icon={DownloadSimple} disabled={!data} onClick={() => data && downloadFile(`iccb-receivables-${today}.csv`, toCsv(data.recs.map((r) => ({ client: r.b.contact.name, bfNo: r.b.bfNo, event: r.event, total: r.total, received: r.received, balance: r.balance, due: r.nextDue?.dueDate ?? "", overdueDays: r.overdueDays, bucket: r.bucket ?? "", rep: userName(r.b.assignedTo), promise: r.b.promiseDate ?? "" }))), "text/csv")}>
              Export CSV
            </Button>
          }
        />
        <div className="px-5 pb-5">
          <DataTable
            rows={data?.recs}
            loading={loading}
            columns={columns}
            initialSort={{ id: "aging", dir: "desc" }}
            searchText={(r) => `${r.b.contact.name} ${r.b.bfNo} ${r.b.eventTitle}`}
            exportName="iccb-receivables"
            empty={{ icon: ShieldCheck, title: "Nothing to collect" }}
            rowActions={(r) =>
              canEdit ? (
                <>
                  <Button size="sm" variant="secondary" onClick={() => setPay(r.b)}>
                    Record payment
                  </Button>
                  <Button size="icon-sm" variant="ghost" aria-label="Send reminder" onClick={() => setRemind(r)}>
                    <BellRinging size={15} />
                  </Button>
                </>
              ) : null
            }
          />
        </div>
      </Card>

      <Card>
        <CardHeader icon={HandCoins} title="Security refund queue" description="Security − damages − dues. Due event + 15 working days (Fri, Sat and holidays skipped)." />
        <ul className="divide-y divide-crm-line">
          {data?.refunds.map((r) => (
            <m.li key={r.bookingId} layout className="flex flex-wrap items-center gap-4 px-5 py-3">
              <div className="min-w-0 flex-1">
                <Link href={`/dashboard/sales/bookings/${r.b.id}?tab=feedback`} className="block truncate text-[13.5px] font-medium text-crm-ink hover:text-crm-brand">
                  {r.b.contact.name} · {r.b.eventTitle}
                </Link>
                <p className="text-[12px] text-crm-muted tabular">
                  Held {taka(r.securityHeld)} − damages {taka(r.damages)} − dues {taka(r.dues)}
                </p>
              </div>
              <span className={cn("text-[12.5px] font-semibold tabular", r.overdue ? "text-[#D92D20]" : "text-crm-ink-2")}>{r.overdue ? `${Math.abs(r.daysLeft)} days overdue` : r.daysLeft === 0 ? "Due today" : `${r.daysLeft} days left`}</span>
              <span className="w-28 text-end font-semibold tabular text-crm-ink">{taka(r.amount)}</span>
              <Badge tone={r.status === "cheque_prepared" ? "blue" : r.overdue ? "red" : "amber"}>{r.status === "cheque_prepared" ? "Cheque prepared" : "Pending"}</Badge>
              {canEdit && (
                <div className="flex gap-1.5">
                  {r.status === "pending" && <RefundStatusButton id={r.b.id} />}
                  <Button size="sm" variant="primary" onClick={() => setRefundFor(r)}>
                    Mark refunded
                  </Button>
                </div>
              )}
            </m.li>
          ))}
          {data && !data.refunds.length && <li className="px-5 py-4 text-[13px] text-crm-muted">No refunds pending.</li>}
        </ul>
      </Card>

      {remind && <ReminderModal row={remind} onClose={() => setRemind(null)} />}
      {pay && <RecordPaymentModal b={pay} onClose={() => setPay(null)} />}
      {refundFor && <RefundModal row={refundFor} onClose={() => setRefundFor(null)} />}
    </>
  );
}

function RecordPaymentModal({ b, onClose }: { b: Booking; onClose: () => void }) {
  const me = useCurrentUser();
  const est = useMemo(() => estimateFor(b), [b]);
  return <PaymentModal b={b} est={est} me={me} onClose={onClose} />;
}

function RefundStatusButton({ id }: { id: string }) {
  const a = useCrmAction(() => setRefundStatus(id, "cheque_prepared"), { success: "Marked cheque prepared" });
  return (
    <Button size="sm" variant="ghost" loading={a.isPending} onClick={() => a.mutate(undefined)}>
      Cheque prepared
    </Button>
  );
}

function RefundModal({ row, onClose }: { row: RefundRow & { b: Booking }; onClose: () => void }) {
  const [cheque, setCheque] = useState("");
  const a = useCrmAction(() => markRefunded(row.b.id, cheque), { success: "Refund recorded", onSuccess: onClose });
  return (
    <Modal open onOpenChange={(v) => !v && onClose()} title="Mark security refunded" description={`${row.b.contact.name} · ${taka(row.amount)}`} size="sm" footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!cheque.trim()} loading={a.isPending} onClick={() => a.mutate(undefined)}>Save</Button></>}>
      <Field label="Cheque no." required>
        <Input value={cheque} onChange={(e) => setCheque(e.target.value)} autoFocus />
      </Field>
    </Modal>
  );
}

function ReminderModal({ row, onClose }: { row: RecRow; onClose: () => void }) {
  const me = useCurrentUser();
  const [lang, setLang] = useState<"en" | "bn">("en");
  const amount = row.overdue || row.nextDue?.remaining || row.balance;
  const text = reminderText(lang, { name: row.b.contact.name, amount: taka(amount), due: fmtDate(row.nextDue?.dueDate), bfNo: row.b.bfNo, event: row.b.eventTitle, rep: me.name, phone: me.phone });
  const [body, setBody] = useState(text);
  const log = useCrmAction((ch: "whatsapp" | "sms" | "copy") => logReminder(row.b.id, ch, lang, amount), { success: "Reminder logged to activity" });
  const phone = row.b.contact.mobile.replace(/\D/g, "").replace(/^0/, "880");
  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      title="Send payment reminder"
      description={`${row.b.contact.name} · ${row.b.contact.mobile}`}
      footer={
        <>
          <Button icon={Copy} onClick={() => { void copyText(body); log.mutate("copy"); }}>
            Copy
          </Button>
          <a href={`sms:${row.b.contact.mobile}?body=${encodeURIComponent(body)}`} onClick={() => log.mutate("sms")}>
            <Button icon={ChatCircleText}>SMS</Button>
          </a>
          <a href={`https://wa.me/${phone}?text=${encodeURIComponent(body)}`} target="_blank" rel="noreferrer" onClick={() => { log.mutate("whatsapp"); onClose(); }}>
            <Button variant="primary" icon={WhatsappLogo}>WhatsApp</Button>
          </a>
        </>
      }
    >
      <div className="space-y-3">
        <Segmented size="sm" value={lang} onChange={(v) => { setLang(v); setBody(reminderText(v, { name: row.b.contact.name, amount: taka(amount), due: fmtDate(row.nextDue?.dueDate), bfNo: row.b.bfNo, event: row.b.eventTitle, rep: me.name, phone: me.phone })); }} options={[{ value: "en", label: "English" }, { value: "bn", label: "বাংলা" }]} />
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[150px]" />
      </div>
    </Modal>
  );
}

