"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DownloadSimple, Eye, FileText, HandCoins, Printer, Receipt, Scales, ShieldWarning, Wallet, Coins } from "@phosphor-icons/react";
import { useCurrentUser } from "@/lib/crm/db";
import { can } from "@/lib/crm/permissions";
import { Tabs } from "../ui/tabs";
import { CollectionsTab } from "../features/Collections";
import { LeakageReport } from "../features/Leakage";
import type { DocKind, Invoice } from "@/types/crm";
import { DOC_KIND_LABELS } from "@/types/crm";
import { firstEventDate } from "@/lib/crm/pricing";
import { fmtDate, taka, takaShort, todayYmd } from "@/lib/crm/format";
import { estimateFor } from "@/services/crm/bookings.service";
import { useBookings, useInvoices, usePayments } from "@/services/crm/hooks";
import { Item, Stagger } from "../ui/motion";
import { Badge, Button, Card, CardHeader, FilterBar, Input, PageHeader, Select, type Tone } from "../ui/core";
import { DataTable, type Column } from "../ui/data-table";
import { KpiCard } from "../ui/kpi";
import { useDocs } from "../documents/useDocs";

const KIND_TONE: Record<DocKind, Tone> = { estimate: "blue", invoice: "brand", money_receipt: "green", booking_form: "purple", refund_note: "amber", ppm: "neutral", fact_sheet: "neutral", evaluation: "neutral", damage_claim: "red" };

interface Row extends Invoice {
  eventTitle: string;
}

type InvTab = "documents" | "collections" | "leakage";

export function InvoicesPage() {
  const me = useCurrentUser();
  const router = useRouter();
  const params = useSearchParams();
  const showCollections = can(me.role, "view", "collections");
  const showLeakage = can(me.role, "view", "leakage");
  const want = params.get("tab") as InvTab | null;
  const tab: InvTab = want === "collections" && showCollections ? "collections" : want === "leakage" && showLeakage ? "leakage" : "documents";
  const setTab = (t: InvTab) => router.replace(t === "documents" ? "/dashboard/sales/invoices" : `/dashboard/sales/invoices?tab=${t}`, { scroll: false });
  const invoices = useInvoices();
  const bookings = useBookings();
  const payments = usePayments();
  const docs = useDocs();
  const [kind, setKind] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows = useMemo<Row[] | undefined>(() => {
    if (!invoices.data || !bookings.data) return undefined;
    return invoices.data
      .filter((d) => (!kind || d.kind === kind) && (!from || d.createdAt.slice(0, 10) >= from) && (!to || d.createdAt.slice(0, 10) <= to))
      .map((d) => ({ ...d, eventTitle: bookings.data!.find((b) => b.id === d.bookingId)?.eventTitle ?? "—" }));
  }, [invoices.data, bookings.data, kind, from, to]);

  const summary = useMemo(() => {
    const live = (bookings.data ?? []).filter((b) => !b.closed && b.status !== "requested");
    const ps = payments.data ?? [];
    let outstanding = 0;
    const dueList: { id: string; title: string; client: string; balance: number; event: string }[] = [];
    for (const b of live) {
      const est = estimateFor(b, ps.filter((p) => p.bookingId === b.id));
      const bal = est.balance;
      if (bal > 0) {
        outstanding += bal;
        dueList.push({ id: b.id, title: b.eventTitle, client: b.contact.name, balance: bal, event: firstEventDate(b) });
      }
    }
    const refunds = (bookings.data ?? []).filter((b) => b.refund && !b.refund.refundedAt).sort((a, b) => a.refund!.dueDate.localeCompare(b.refund!.dueDate));
    const month = todayYmd().slice(0, 7);
    const collected = ps.filter((p) => p.date.startsWith(month)).reduce((s, p) => s + p.amount, 0);
    return { outstanding, dueList: dueList.sort((a, b) => a.event.localeCompare(b.event)), refunds, collected };
  }, [bookings.data, payments.data]);

  const today = todayYmd();
  const columns: Column<Row>[] = [
    { id: "number", header: "Number", primary: true, pinned: true, value: (r) => r.number, cell: (r) => <span className="font-mono text-[12.5px] font-semibold text-crm-ink">{r.number}</span> },
    { id: "kind", header: "Type", value: (r) => DOC_KIND_LABELS[r.kind], cell: (r) => <Badge tone={KIND_TONE[r.kind]}>{DOC_KIND_LABELS[r.kind]}</Badge> },
    { id: "version", header: "Ver.", align: "center", value: (r) => r.version, cell: (r) => <span className="tabular">v{r.version}</span> },
    {
      id: "booking",
      header: "Booking",
      value: (r) => r.eventTitle,
      cell: (r) => (
        <Link href={`/dashboard/sales/bookings/${r.bookingId}`} onClick={(e) => e.stopPropagation()} className="block max-w-[220px] truncate hover:text-crm-brand">
          {r.eventTitle}
          <span className="block text-[12px] text-crm-muted">{r.clientName}</span>
        </Link>
      ),
    },
    { id: "date", header: "Date", value: (r) => r.createdAt, cell: (r) => fmtDate(r.createdAt) },
    { id: "total", header: "Amount", align: "end", value: (r) => r.total, cell: (r) => <span className="font-semibold text-crm-ink tabular">{taka(r.total)}</span> },
    { id: "balance", header: "Balance", align: "end", value: (r) => r.balance, cell: (r) => (r.kind === "money_receipt" ? "—" : <span className="tabular">{takaShort(r.balance)}</span>) },
    { id: "by", header: "Created by", value: (r) => r.createdBy, cell: (r) => r.createdBy, hidden: true },
  ];

  return (
    <Stagger>
      <Item>
        <PageHeader eyebrow="Sales · Accounts" title="Invoices & receipts" description="Documents, collections & cash-flow, and the Revenue Leakage Guard report." />
      </Item>
      <Item>
        <Tabs
          tabs={[
            { value: "documents" as const, label: "Documents", icon: FileText },
            { value: "collections" as const, label: "Collections", icon: Coins, hidden: !showCollections },
            { value: "leakage" as const, label: "Leakage", icon: ShieldWarning, hidden: !showLeakage },
          ]}
          value={tab}
          onChange={setTab}
          className="mb-6"
        />
      </Item>
      {tab === "collections" && <Item><CollectionsTab /></Item>}
      {tab === "leakage" && <Item><LeakageReport /></Item>}
      {tab === "documents" && (<>
      <Item>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Outstanding balance" value={summary.outstanding} format={(n) => takaShort(n)} icon={Scales} tone="brand" loading={!bookings.data} />
          <KpiCard label="Collected this month" value={summary.collected} format={(n) => takaShort(n)} icon={Wallet} tone="green" loading={!payments.data} />
          <KpiCard label="Refunds pending" value={summary.refunds.length} icon={HandCoins} tone="amber" loading={!bookings.data} />
          <KpiCard label="Documents" value={invoices.data?.length ?? 0} icon={FileText} tone="blue" loading={!invoices.data} />
        </div>
      </Item>
      <Item>
        <div className="mb-6 grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader icon={Receipt} title="Balance due" description="Confirmed bookings with money still to collect, by event date." />
            <ul className="crm-scroll max-h-64 divide-y divide-crm-line overflow-y-auto px-5 pb-3">
              {summary.dueList.slice(0, 20).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2">
                  <Link href={`/dashboard/sales/bookings/${d.id}`} className="min-w-0 hover:text-crm-brand">
                    <span className="block truncate text-[13px] text-crm-ink">{d.title}</span>
                    <span className="text-[12px] text-crm-muted">
                      {d.client} · event {fmtDate(d.event)}
                    </span>
                  </Link>
                  <span className="shrink-0 font-semibold text-crm-ink tabular">{taka(d.balance)}</span>
                </li>
              ))}
              {!summary.dueList.length && <li className="py-3 text-[13px] text-crm-muted">All settled.</li>}
            </ul>
          </Card>
          <Card>
            <CardHeader icon={HandCoins} title="Security refunds due" description="Event + 15 working days. Mark refunded in the booking's Feedback tab." />
            <ul className="crm-scroll max-h-64 divide-y divide-crm-line overflow-y-auto px-5 pb-3">
              {summary.refunds.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2">
                  <Link href={`/dashboard/sales/bookings/${b.id}`} className="min-w-0 hover:text-crm-brand">
                    <span className="block truncate text-[13px] text-crm-ink">{b.contact.name}</span>
                    <span className={b.refund!.dueDate < today ? "text-[12px] font-semibold text-[#D92D20]" : "text-[12px] text-crm-muted"}>Due {fmtDate(b.refund!.dueDate)}</span>
                  </Link>
                  <span className="shrink-0 font-semibold text-crm-ink tabular">{taka(b.refund!.amount)}</span>
                </li>
              ))}
              {!summary.refunds.length && <li className="py-3 text-[13px] text-crm-muted">No refunds pending.</li>}
            </ul>
          </Card>
        </div>
      </Item>
      <Item>
        <FilterBar>
          <Select value={kind} onChange={setKind} placeholder="All document types" options={Object.entries(DOC_KIND_LABELS).map(([value, label]) => ({ value, label }))} className="w-auto min-w-[180px]" />
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[150px]" aria-label="From" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[150px]" aria-label="To" />
        </FilterBar>
      </Item>
      <Item>
        <DataTable
          rows={rows}
          loading={invoices.isLoading}
          columns={columns}
          initialSort={{ id: "date", dir: "desc" }}
          searchPlaceholder="Search number, client, event…"
          searchText={(r) => `${r.number} ${r.clientName} ${r.eventTitle}`}
          exportName="iccb-documents"
          onRowClick={(r) => docs.preview(r)}
          empty={{ icon: FileText, title: "No documents yet" }}
          rowActions={(r) => (
            <>
              <Button size="icon-sm" variant="ghost" aria-label="Preview" onClick={() => docs.preview(r)}>
                <Eye size={15} />
              </Button>
              <Button size="icon-sm" variant="ghost" aria-label="Download PDF" onClick={() => docs.download(r)}>
                <DownloadSimple size={15} />
              </Button>
              <Button size="icon-sm" variant="ghost" aria-label="Print" onClick={() => docs.print(r)}>
                <Printer size={15} />
              </Button>
            </>
          )}
        />
      </Item>
      </>)}
      {docs.viewer}
    </Stagger>
  );
}
