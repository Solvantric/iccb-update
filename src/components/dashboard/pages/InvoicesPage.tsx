"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { FilePdf, Receipt } from "@phosphor-icons/react";
import type { Payment } from "@/types/crm";
import { PAYMENT_KINDS, PAYMENT_METHODS, isBillPayment } from "@/types/crm";
import { useBookings, usePayments } from "@/lib/crm/hooks";
import { fmtDate, money } from "@/lib/crm/format";
import { pdfPaymentList, pdfReceipt } from "@/lib/pdf/actions";
import { cn } from "@/lib/utils/cn";
import { Button, EmptyState, FilterRow, PageHeader, SearchInput } from "../ui/core";
import { DataTable, RowActions, type Column } from "../ui/data";
import { DateRange, FilterSelect, FilterSummary, SortSelect, inRange, useFilters } from "../ui/filters";
import { AnimatedNumber } from "../ui/motion";

const signed = (p: Payment) => (p.kind === "Security refund" ? -p.amount : p.amount);

export function InvoicesPage() {
  const router = useRouter();
  const payments = usePayments();
  const bookings = useBookings();
  const bookingMap = useMemo(() => new Map(bookings.map((b) => [b.id, b])), [bookings]);
  const { f, set, reset, active } = useFilters({ q: "", from: "", to: "", kind: "", method: "", sort: "newest" });

  const rows = useMemo(() => {
    const n = f.q.trim().toLowerCase();
    const list = payments.filter((p) => {
      const b = bookingMap.get(p.bookingId);
      return (
        inRange(p.date, f.from, f.to) &&
        (!f.kind || (f.kind === "bill" ? isBillPayment(p.kind) : f.kind === "security" ? !isBillPayment(p.kind) : p.kind === f.kind)) &&
        (!f.method || p.method === f.method) &&
        (!n || [b?.name, b?.eventName, b?.ref, p.receiptNo, p.reference, p.receivedBy].join(" ").toLowerCase().includes(n))
      );
    });
    return [...list].sort((a, b) => (f.sort === "oldest" ? a.date.localeCompare(b.date) : f.sort === "amount" ? b.amount - a.amount : b.date.localeCompare(a.date) || b.receiptNo.localeCompare(a.receiptNo)));
  }, [payments, bookingMap, f]);

  const totals = useMemo(() => {
    const bill = rows.filter((p) => isBillPayment(p.kind)).reduce((s, p) => s + p.amount, 0);
    const security = rows.filter((p) => !isBillPayment(p.kind)).reduce((s, p) => s + signed(p), 0);
    return { bill, security };
  }, [rows]);
  const period = f.from || f.to ? `${f.from ? fmtDate(f.from) : "start"} – ${f.to ? fmtDate(f.to) : "today"}` : "all time";
  const filterText = [`Period: ${period}`, f.kind, f.method, f.q && `“${f.q}”`].filter(Boolean).join(" · ");

  const columns: Column<Payment>[] = [
    { key: "no", header: "Receipt", cell: (p) => <span className="text-[13px] text-crm-muted tabular">#{p.receiptNo}</span> },
    { key: "date", header: "Date", cell: (p) => <span className="whitespace-nowrap tabular">{fmtDate(p.date)}</span> },
    { key: "client", header: "Client name", cell: (p) => <span className="font-medium text-crm-ink">{bookingMap.get(p.bookingId)?.name ?? "—"}</span> },
    { key: "event", header: "Event name", cell: (p) => <span className="line-clamp-1">{bookingMap.get(p.bookingId)?.eventName ?? "—"}</span> },
    { key: "kind", header: "Type", cell: (p) => <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-[12px]", isBillPayment(p.kind) ? "bg-crm-surface-2 text-crm-ink-2" : "bg-crm-reserved-bg text-crm-reserved-ink")}>{p.kind}</span> },
    { key: "amount", header: "Amount (৳)", align: "end", cell: (p) => <span className="font-medium text-crm-ink">{p.kind === "Security refund" ? `− ${money(p.amount)}` : money(p.amount)}</span> },
    {
      key: "method",
      header: "Method",
      cell: (p) => (
        <span>
          <span className="block">{p.method}</span>
          {p.reference && <span className="block text-[12px] text-crm-muted">{p.reference}</span>}
        </span>
      ),
    },
    { key: "by", header: "Received by", cell: (p) => p.receivedBy },
    {
      key: "pdf",
      header: <span className="sr-only">Receipt</span>,
      cell: (p) => (
        <RowActions>
          <Button size="sm" variant="ghost" icon={Receipt} onClick={() => pdfReceipt(p)}>
            Receipt PDF
          </Button>
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Every payment recorded by staff — bill payments and security money."
        action={
          <Button variant="primary" icon={FilePdf} onClick={() => pdfPaymentList(rows, filterText)} disabled={!rows.length}>
            Export PDF
          </Button>
        }
      />
      <FilterRow>
        <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Client, event, receipt, ref…" />
        <DateRange from={f.from} to={f.to} onFrom={(v) => set("from", v)} onTo={(v) => set("to", v)} label="Payment date" />
        <FilterSelect label="Type" all="All types" value={f.kind} onChange={(v) => set("kind", v)} options={[{ value: "bill", label: "Bill payments" }, { value: "security", label: "Security money" }, ...PAYMENT_KINDS.map((k) => ({ value: k, label: k }))]} />
        <FilterSelect label="Methods" value={f.method} onChange={(v) => set("method", v)} options={PAYMENT_METHODS} />
        <SortSelect value={f.sort} onChange={(v) => set("sort", v)} options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "amount", label: "Largest amount" }]} className="sm:ms-auto" />
      </FilterRow>
      <FilterSummary active={active} onClear={reset} count={rows.length} noun="payment" />
      <p className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-[14px] text-crm-ink-2">
        <span>
          Total collected in selected period: <AnimatedNumber value={totals.bill} format={money} className="font-semibold text-crm-ink" />
        </span>
        {totals.security !== 0 && (
          <span className="text-crm-muted">
            Security money held (net): <AnimatedNumber value={totals.security} format={money} className="text-crm-ink" />
          </span>
        )}
      </p>
      <DataTable
        rows={rows}
        columns={columns}
        onRowClick={(p) => bookingMap.get(p.bookingId) && router.push(`/dashboard/bookings/${p.bookingId}`)}
        empty={<EmptyState icon={Receipt} text="No payments match these filters." action={<Button onClick={reset}>Clear filters</Button>} />}
        mobileCard={(p) => {
          const b = bookingMap.get(p.bookingId);
          return (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-crm-ink">{b?.name ?? "—"}</p>
                  <p className="truncate text-[13px] text-crm-ink-2">{b?.eventName}</p>
                </div>
                <span className="font-semibold text-crm-ink tabular">{p.kind === "Security refund" ? `− ${money(p.amount)}` : money(p.amount)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-crm-line pt-3">
                <span className="text-[12.5px] text-crm-muted">
                  {fmtDate(p.date)} · {p.kind} · {p.method}
                </span>
                <RowActions>
                  <Button size="icon-sm" variant="ghost" aria-label="Receipt PDF" onClick={() => pdfReceipt(p)}>
                    <Receipt size={17} />
                  </Button>
                </RowActions>
              </div>
            </div>
          );
        }}
      />
    </>
  );
}
