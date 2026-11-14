"use client";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckSquareOffset, FilePdf, Plus, Ticket, Trash } from "@phosphor-icons/react";
import type { Booking, BookingStatus } from "@/types/crm";
import { STATUS_LABELS } from "@/types/crm";
import { useBills, useBookings, useHallMap, useHalls } from "@/lib/crm/hooks";
import { fmtDate, money } from "@/lib/crm/format";
import { pdfBooking, pdfBookingList } from "@/lib/pdf/actions";
import { Button, EmptyState, FilterRow, PageHeader, SearchInput, Segmented } from "../ui/core";
import { FilterSelect, FilterSummary, SortSelect, useFilters } from "../ui/filters";
import { DataTable, RowActions, type Column } from "../ui/data";
import { StatusPill } from "../ui/status";
import { useNewBooking } from "../bookings/NewBookingModal";
import { useBookingActions } from "../bookings/useBookingActions";

type StatusFilter = "all" | BookingStatus;

export function BookingsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const bookings = useBookings();
  const halls = useHalls();
  const hallMap = useHallMap();
  const newBooking = useNewBooking();
  const actions = useBookingActions();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [initialQ] = useState(() => ({ q: params.get("q") ?? "", hall: "", payment: "", sort: "date-desc" }));
  const { f, set, reset, active } = useFilters(initialQ);
  const allBills = useBills(bookings);

  const rows = useMemo(() => {
    const n = f.q.trim().toLowerCase();
    const list = bookings.filter((b) => {
      const bill = allBills.get(b.id);
      const pay = !f.payment || (f.payment === "unpaid" ? (bill?.paid ?? 0) === 0 : f.payment === "partial" ? (bill?.paid ?? 0) > 0 && (bill?.due ?? 0) > 0 : (bill?.due ?? 0) === 0);
      return (
        (status === "all" || b.status === status) &&
        (!f.hall || b.hallId === f.hall) &&
        pay &&
        (!n || [b.name, b.mobile, b.ref, b.eventName, b.organization].join(" ").toLowerCase().includes(n))
      );
    });
    const tot = (b: Booking) => allBills.get(b.id)?.total ?? 0;
    const due = (b: Booking) => allBills.get(b.id)?.due ?? 0;
    return [...list].sort((a, b) =>
      f.sort === "date-asc" ? a.date.localeCompare(b.date) : f.sort === "created" ? b.createdAt.localeCompare(a.createdAt) : f.sort === "total" ? tot(b) - tot(a) : f.sort === "due" ? due(b) - due(a) : b.date.localeCompare(a.date)
    );
  }, [bookings, status, f, allBills]);
  const bills = allBills;
  const counts = useMemo(() => Object.fromEntries((["reserved", "booked", "closed", "cancelled"] as BookingStatus[]).map((s) => [s, bookings.filter((b) => b.status === s).length])), [bookings]);

  const filterText =
    [status !== "all" && STATUS_LABELS[status], f.hall && hallMap.get(f.hall)?.name, f.q && `“${f.q}”`].filter(Boolean).join(" · ") || "All bookings";

  const dueOf = (b: Booking) => (b.status === "cancelled" ? 0 : (bills.get(b.id)?.due ?? 0));
  const columns: Column<Booking>[] = [
    { key: "ref", header: "Ref no", cell: (b) => <span className="text-[13px] text-crm-muted tabular">{b.ref.replace(/^.*-(\d+)$/, "#$1")}</span> },
    { key: "name", header: "Client", cell: (b) => <span className="font-medium text-crm-ink">{b.name}</span> },
    { key: "event", header: "Event", cell: (b) => <span className="line-clamp-1">{b.eventName}</span> },
    { key: "hall", header: "Hall", cell: (b) => hallMap.get(b.hallId)?.name ?? "—" },
    { key: "date", header: "Date", cell: (b) => <span className="whitespace-nowrap tabular">{fmtDate(b.date)}</span> },
    { key: "status", header: "Status", cell: (b) => <StatusPill status={b.status} /> },
    { key: "total", header: "Total", align: "end", cell: (b) => <span className={b.status === "cancelled" ? "text-crm-muted" : "text-crm-ink"}>{money(bills.get(b.id)?.total ?? 0)}</span> },
    { key: "due", header: "Due", align: "end", cell: (b) => (dueOf(b) > 0 ? <span className="font-medium text-crm-brand-text">{money(dueOf(b))}</span> : <span className="text-crm-muted">—</span>) },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      cell: (b) => (
        <RowActions className="opacity-50 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Button size="icon-sm" variant="ghost" aria-label="Download PDF" title="Download PDF" onClick={() => pdfBooking(b)}>
            <FilePdf size={17} />
          </Button>
          {b.status === "booked" && (
            <Button size="icon-sm" variant="ghost" aria-label="Close event" title="Close event" onClick={() => actions.close(b)}>
              <CheckSquareOffset size={17} />
            </Button>
          )}
          <Button size="icon-sm" variant="ghost" aria-label="Delete" title="Delete" onClick={() => actions.remove(b)}>
            <Trash size={17} />
          </Button>
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Every booking, from reserved to closed."
        action={
          <>
            <Button icon={FilePdf} onClick={() => pdfBookingList(rows, filterText)} disabled={!rows.length}>
              Export PDF
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => newBooking()}>
              New booking
            </Button>
          </>
        }
      />
      <FilterRow>
        <Segmented id="bk-status" value={status} onChange={setStatus} options={[{ value: "all", label: `All ${bookings.length}` }, ...(["reserved", "booked", "closed", "cancelled"] as BookingStatus[]).map((x) => ({ value: x, label: `${STATUS_LABELS[x]} ${counts[x]}` }))]} />
        <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Name, mobile, ref…" />
        <FilterSelect label="Halls" value={f.hall} onChange={(v) => set("hall", v)} options={halls.map((h) => ({ value: h.id, label: h.name }))} />
        <FilterSelect label="Payment" all="Any payment" value={f.payment} onChange={(v) => set("payment", v)} options={[{ value: "unpaid", label: "Nothing paid" }, { value: "partial", label: "Partly paid" }, { value: "paid", label: "Fully paid" }]} />
        <SortSelect value={f.sort} onChange={(v) => set("sort", v)} options={[{ value: "date-desc", label: "Event date (latest)" }, { value: "date-asc", label: "Event date (soonest)" }, { value: "created", label: "Newest created" }, { value: "total", label: "Highest total" }, { value: "due", label: "Highest due" }]} />
      </FilterRow>
      <FilterSummary active={active + (status !== "all" ? 1 : 0)} onClear={() => { reset(); setStatus("all"); }} count={rows.length} noun="booking" />
      <DataTable
        rows={rows}
        columns={columns}
        onRowClick={(b) => router.push(`/dashboard/bookings/${b.id}`)}
        empty={<EmptyState icon={Ticket} text="No bookings match these filters." action={<Button onClick={() => newBooking()}>New booking</Button>} />}
        mobileCard={(b) => (
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-crm-ink">{b.name}</p>
                <p className="truncate text-[13px] text-crm-ink-2">{b.eventName}</p>
              </div>
              <StatusPill status={b.status} />
            </div>
            <p className="mt-2 text-[12.5px] text-crm-muted">
              {b.ref} · {hallMap.get(b.hallId)?.name} · {fmtDate(b.date)}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-crm-line pt-3">
              <span className="text-[13px] tabular">
                {money(bills.get(b.id)?.total ?? 0)} <span className="text-crm-muted">· due {money(dueOf(b))}</span>
              </span>
              <RowActions>
                <Button size="icon-sm" variant="ghost" aria-label="Download PDF" onClick={() => pdfBooking(b)}>
                  <FilePdf size={17} />
                </Button>
                {b.status === "booked" && (
                  <Button size="icon-sm" variant="ghost" aria-label="Close event" onClick={() => actions.close(b)}>
                    <CheckSquareOffset size={17} />
                  </Button>
                )}
                <Button size="icon-sm" variant="ghost" aria-label="Delete" onClick={() => actions.remove(b)}>
                  <Trash size={17} />
                </Button>
              </RowActions>
            </div>
          </div>
        )}
      />
    </>
  );
}
