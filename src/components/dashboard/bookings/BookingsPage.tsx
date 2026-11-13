"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowCounterClockwise, CalendarPlus, Kanban as KanbanIcon, Rows, Trash, TrashSimple, UserSwitch, CalendarX, Eye } from "@phosphor-icons/react";
import type { BookingStatus, ClientType, Source } from "@/types/crm";
import { CLIENT_TYPE_LABELS, CLIENT_TYPES, SOURCE_LABELS, SOURCES, STATUS_LABELS, BOOKING_STATUSES } from "@/types/crm";
import { downloadFile, toCsv, useRole } from "@/lib/crm/db";
import { can } from "@/lib/crm/permissions";
import { fmtDate, taka, takaShort } from "@/lib/crm/format";
import { assignBookings } from "@/services/crm/bookings.service";
import { useCrmAction, useCrmRemove, useCrmRestore, useHalls, useUsers } from "@/services/crm/hooks";
import { Avatar, Badge, Button, FilterBar, Input, PageHeader, Segmented, Select } from "../ui/core";
import { DataTable, type Column } from "../ui/data-table";
import { ClosedTag, StatusPill } from "../ui/status";
import { useConfirm } from "../ui/overlay";
import { Item, Stagger } from "../ui/motion";
import { Kanban } from "./Kanban";
import { SOURCE_TONE, useBookingRows, type BookingRow } from "./shared";

type View = "table" | "kanban";
const VIEW_KEY = "iccb-crm-v1:bookings-view";

export function BookingsPage() {
  const router = useRouter();
  const role = useRole();
  const confirm = useConfirm();
  const [view, setViewState] = useState<View>(() => {
    try {
      return (localStorage.getItem(VIEW_KEY) as View) || "table";
    } catch {
      return "table";
    }
  });
  const setView = (v: View) => {
    setViewState(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {}
  };
  const [hall, setHall] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("");
  const [rep, setRep] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [closed, setClosed] = useState<"open" | "closed" | "all">("open");
  const [trash, setTrash] = useState(false);
  const [bulkRep, setBulkRep] = useState("");

  const { rows, loading } = useBookingRows({ includeDeleted: trash });
  const halls = useHalls();
  const users = useUsers();
  const remove = useCrmRemove("bookings", "Booking");
  const restore = useCrmRestore("bookings", "Booking");
  const assign = useCrmAction((a: { ids: string[]; userId: string }) => assignBookings(a.ids, a.userId), { success: "Assigned" });

  const filtered = useMemo(() => {
    if (!rows) return undefined;
    return rows.filter((r) => {
      const b = r.b;
      if (hall && !b.days.some((d) => d.hallId === hall)) return false;
      if (from && r.endDate < from) return false;
      if (to && r.eventDate > to) return false;
      if (type && b.clientType !== type) return false;
      if (rep && (rep === "none" ? b.assignedTo : b.assignedTo !== rep)) return false;
      if (source && b.source !== source) return false;
      if (status && b.status !== status) return false;
      if (!trash && closed === "open" && b.closed) return false;
      if (!trash && closed === "closed" && !b.closed) return false;
      return true;
    });
  }, [rows, hall, from, to, type, rep, source, status, closed, trash]);

  const reps = (users.data ?? []).filter((u) => u.role === "sales_executive" || u.role === "sales_manager");
  const canEdit = can(role, "update", "bookings");
  const canDelete = can(role, "delete", "bookings");

  const columns: Column<BookingRow>[] = [
    {
      id: "event",
      header: "Event",
      primary: true,
      pinned: true,
      value: (r) => r.b.eventTitle,
      cell: (r) => (
        <div className="min-w-[200px]">
          <Link href={`/dashboard/sales/bookings/${r.id}`} className="font-semibold text-crm-ink hover:text-crm-brand">
            {r.b.eventTitle}
          </Link>
          <p className="text-[12px] text-crm-muted">
            {r.b.contact.name}
            {r.b.contact.organization ? ` · ${r.b.contact.organization}` : ""}
          </p>
        </div>
      ),
    },
    { id: "bfNo", header: "BF No", value: (r) => r.b.bfNo, cell: (r) => <span className="font-mono text-[12px] text-crm-ink-2">{r.b.bfNo}</span> },
    { id: "date", header: "Event date", value: (r) => r.eventDate, cell: (r) => <span className="whitespace-nowrap tabular">{fmtDate(r.eventDate)}{r.endDate !== r.eventDate ? ` → ${fmtDate(r.endDate, "dd MMM")}` : ""}</span> },
    { id: "hall", header: "Hall", value: (r) => r.hallLabel, cell: (r) => <span className="whitespace-nowrap">{r.hallLabel}</span> },
    { id: "type", header: "Type", value: (r) => CLIENT_TYPE_LABELS[r.b.clientType], cell: (r) => <span className="whitespace-nowrap">{r.b.eventNature}</span> },
    { id: "guests", header: "Guests", align: "end", value: (r) => r.b.guests.optimum, cell: (r) => <span className="tabular">{r.b.guests.optimum.toLocaleString("en-US")}</span> },
    {
      id: "status",
      header: "Status",
      value: (r) => (r.b.closed ? `z-${r.b.closed.kind}` : r.b.status),
      cell: (r) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill status={r.b.status} size="sm" />
          <ClosedTag closed={r.b.closed} />
        </div>
      ),
    },
    { id: "rep", header: "Rep", value: (r) => r.rep?.name ?? "", cell: (r) => (r.rep ? <span className="flex items-center gap-2 whitespace-nowrap"><Avatar name={r.rep.name} color={r.rep.color} size={22} />{r.rep.name.split(" ")[0]}</span> : <Badge tone="amber">Unassigned</Badge>) },
    { id: "source", header: "Source", value: (r) => SOURCE_LABELS[r.b.source], cell: (r) => <Badge tone={SOURCE_TONE[r.b.source]}>{SOURCE_LABELS[r.b.source]}</Badge>, hidden: true },
    { id: "total", header: "Total", align: "end", value: (r) => r.est.grandTotal, cell: (r) => <span className="font-semibold text-crm-ink tabular whitespace-nowrap">{taka(r.est.grandTotal)}</span> },
    { id: "balance", header: "Balance", align: "end", value: (r) => r.est.balance, cell: (r) => <span className={r.est.balance > 0 ? "tabular text-crm-ink" : "tabular text-[#067647]"}>{takaShort(r.est.balance)}</span> },
    { id: "bookedOn", header: "Booked on", value: (r) => r.b.bookingDate, cell: (r) => fmtDate(r.b.bookingDate), hidden: true },
  ];

  const exportRows = (list: BookingRow[]) =>
    downloadFile(
      "iccb-bookings.csv",
      toCsv(
        list.map((r) => ({
          "BF No": r.b.bfNo,
          Event: r.b.eventTitle,
          Client: r.b.contact.name,
          Mobile: r.b.contact.mobile,
          "Event date": r.eventDate,
          Hall: r.hallLabel,
          Guests: r.b.guests.optimum,
          Status: STATUS_LABELS[r.b.status],
          Closed: r.b.closed?.kind ?? "",
          Rep: r.rep?.name ?? "",
          Source: SOURCE_LABELS[r.b.source],
          Total: r.est.grandTotal,
          Received: r.est.received,
          Balance: r.est.balance,
        }))
      ),
      "text/csv"
    );

  const clearFilters = () => {
    setHall("");
    setFrom("");
    setTo("");
    setType("");
    setRep("");
    setSource("");
    setStatus("");
    setClosed("open");
  };
  const active = [hall, from, to, type, rep, source, status].filter(Boolean).length + (closed !== "open" ? 1 : 0);

  return (
    <Stagger>
      <Item>
        <PageHeader
          eyebrow="Sales"
          title="Bookings"
          description="Every booking from request to completion. Drag cards on the board to change status — the checklist guards each step."
          actions={
            <>
              <Segmented value={view} onChange={setView} options={[{ value: "table", label: "Table", icon: Rows }, { value: "kanban", label: "Board", icon: KanbanIcon }]} />
              {can(role, "create", "bookings") && (
                <Link href="/dashboard/sales/bookings/new">
                  <Button variant="primary" icon={CalendarPlus}>
                    New booking
                  </Button>
                </Link>
              )}
            </>
          }
        />
      </Item>

      <Item>
        <FilterBar>
          <Select value={hall} onChange={setHall} placeholder="All halls" options={(halls.data ?? []).map((h) => ({ value: h.id, label: h.name }))} className="w-auto min-w-[140px]" />
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[150px]" aria-label="From date" title="From" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[150px]" aria-label="To date" title="To" />
          <Select value={type} onChange={setType} placeholder="All types" options={CLIENT_TYPES.map((t) => ({ value: t, label: CLIENT_TYPE_LABELS[t as ClientType] }))} className="w-auto min-w-[130px]" />
          {role !== "sales_executive" && <Select value={rep} onChange={setRep} placeholder="All reps" options={[{ value: "none", label: "Unassigned" }, ...reps.map((u) => ({ value: u.id, label: u.name }))]} className="w-auto min-w-[130px]" />}
          <Select value={source} onChange={setSource} placeholder="All sources" options={SOURCES.map((s) => ({ value: s, label: SOURCE_LABELS[s as Source] }))} className="w-auto min-w-[130px]" />
          {view === "table" && <Select value={status} onChange={setStatus} placeholder="All statuses" options={BOOKING_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s as BookingStatus] }))} className="w-auto min-w-[130px]" />}
          <Segmented size="sm" value={closed} onChange={setClosed} options={[{ value: "open", label: "Open" }, { value: "closed", label: "Closed" }, { value: "all", label: "All" }]} />
          {active > 0 && (
            <Button size="sm" variant="ghost" icon={ArrowCounterClockwise} onClick={clearFilters}>
              Clear ({active})
            </Button>
          )}
          {canDelete && (
            <Button size="sm" variant={trash ? "soft" : "ghost"} icon={TrashSimple} className="ms-auto" onClick={() => setTrash((v) => !v)}>
              Trash
            </Button>
          )}
        </FilterBar>
      </Item>

      <Item>
        {view === "kanban" && !trash ? (
          <Kanban rows={filtered} loading={loading} />
        ) : (
          <DataTable
            rows={filtered}
            loading={loading}
            columns={columns}
            initialSort={{ id: "date", dir: "asc" }}
            searchPlaceholder="Search BF No, client, mobile, event…"
            searchText={(r) => `${r.b.bfNo} ${r.b.eventTitle} ${r.b.contact.name} ${r.b.contact.mobile} ${r.b.contact.organization ?? ""} ${r.hallLabel}`}
            selectable={!trash && (canEdit || can(role, "export", "bookings"))}
            onRowClick={trash ? undefined : (r) => router.push(`/dashboard/sales/bookings/${r.id}`)}
            exportName="iccb-bookings"
            rowClassName={(r) => (r.b.closed ? "opacity-60" : undefined)}
            empty={{ icon: trash ? Trash : CalendarX, title: trash ? "Trash is empty" : "No bookings match", description: trash ? "Deleted bookings appear here for restore." : "Try clearing filters or create a new booking." }}
            bulkActions={(sel, clear) => (
              <>
                {canEdit && role !== "sales_executive" && (
                  <>
                    <Select value={bulkRep} onChange={setBulkRep} placeholder="Assign to…" options={reps.map((u) => ({ value: u.id, label: u.name }))} className="h-8 w-44 text-[12.5px]" />
                    <Button
                      size="sm"
                      variant="primary"
                      icon={UserSwitch}
                      disabled={!bulkRep}
                      loading={assign.isPending}
                      onClick={() => assign.mutate({ ids: sel.map((s) => s.id), userId: bulkRep }, { onSuccess: clear })}
                    >
                      Assign
                    </Button>
                  </>
                )}
                <Button size="sm" onClick={() => exportRows(sel)}>
                  Export selected
                </Button>
              </>
            )}
            rowActions={(r) =>
              trash ? (
                <Button size="sm" icon={ArrowCounterClockwise} onClick={() => restore.mutate(r.id)}>
                  Restore
                </Button>
              ) : (
                <>
                  <Button size="icon-sm" variant="ghost" aria-label="Open" onClick={() => router.push(`/dashboard/sales/bookings/${r.id}`)}>
                    <Eye size={15} />
                  </Button>
                  {canDelete && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Delete"
                      onClick={async () => {
                        const ok = await confirm({ title: `Delete ${r.b.bfNo}?`, description: "It moves to Trash. You can undo for 8 seconds or restore from Trash.", tone: "danger", confirmLabel: "Delete" });
                        if (ok.ok) remove.mutate(r.id);
                      }}
                    >
                      <Trash size={15} />
                    </Button>
                  )}
                </>
              )
            }
          />
        )}
      </Item>
    </Stagger>
  );
}
