"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarPlus, Eye, PencilSimple, Trash, UserPlus, UsersThree, Warning } from "@phosphor-icons/react";
import type { Client } from "@/types/crm";
import { CLIENT_TYPE_LABELS, CLIENT_TYPES, DOC_KIND_LABELS } from "@/types/crm";
import { useRole } from "@/lib/crm/db";
import { can } from "@/lib/crm/permissions";
import { firstEventDate } from "@/lib/crm/pricing";
import { fmtDate, taka } from "@/lib/crm/format";
import { duplicateClients } from "@/services/crm/sales.service";
import { useBookings, useClients, useCrmRemove, useCrmUpdate, useInvoices, usePayments } from "@/services/crm/hooks";
import { Item, Stagger } from "../ui/motion";
import { Avatar, Badge, Button, FilterBar, KeyValue, PageHeader, Select, Textarea } from "../ui/core";
import { DataTable, type Column } from "../ui/data-table";
import { Drawer, useConfirm } from "../ui/overlay";
import { StatusPill, ClosedTag } from "../ui/status";
import { ClientFormModal } from "../forms/QuickForms";
import { useDocs } from "../documents/useDocs";

interface Row {
  id: string;
  createdAt: string;
  c: Client;
  bookings: number;
  spent: number;
  lastEvent?: string;
}

function ClientDrawer({ client, onClose, onEdit }: { client: Client; onClose: () => void; onEdit: () => void }) {
  const bookings = useBookings();
  const payments = usePayments();
  const invoices = useInvoices();
  const update = useCrmUpdate<Client>("clients", "Notes saved");
  const [notes, setNotes] = useState(client.notes ?? "");
  const docs = useDocs();
  const mine = (bookings.data ?? []).filter((b) => b.clientId === client.id);
  const ids = new Set(mine.map((b) => b.id));
  const spent = (payments.data ?? []).filter((p) => ids.has(p.bookingId)).reduce((s, p) => s + p.amount, 0);
  const documents = (invoices.data ?? []).filter((d) => ids.has(d.bookingId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <Drawer
      open
      onOpenChange={(v) => !v && onClose()}
      title={client.name}
      description={`${client.clientNo} · ${CLIENT_TYPE_LABELS[client.type]}`}
      width={600}
      footer={
        <>
          <Link href={`/dashboard/sales/bookings/new?name=${encodeURIComponent(client.name)}&mobile=${encodeURIComponent(client.mobile)}`}>
            <Button icon={CalendarPlus}>New booking</Button>
          </Link>
          <Button variant="primary" icon={PencilSimple} onClick={onEdit}>
            Edit client
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar name={client.name} size={52} color="#55525A" />
          <div className="flex flex-wrap gap-1.5">
            {client.tags.map((t) => (
              <Badge key={t} tone={t === "VIP" ? "brand" : t === "repeat" ? "green" : "neutral"}>
                {t}
              </Badge>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-crm-surface-2 p-3">
            <p className="text-[12px] text-crm-muted">Bookings</p>
            <p className="text-[18px] font-bold text-crm-ink tabular">{mine.length}</p>
          </div>
          <div className="col-span-2 rounded-xl bg-crm-surface-2 p-3">
            <p className="text-[12px] text-crm-muted">Total paid</p>
            <p className="text-[18px] font-bold text-crm-ink tabular">{taka(spent)}</p>
          </div>
        </div>
        <KeyValue items={[["Mobile", client.mobile], ["Email", client.email], ["Organization", client.organization], ["Phone", client.phone], ["Address", client.address], ["Client since", fmtDate(client.createdAt)]]} />
        <div>
          <p className="mb-2 text-[13px] font-semibold text-crm-ink">Bookings</p>
          {mine.length === 0 ? (
            <p className="text-[13px] text-crm-muted">No bookings yet.</p>
          ) : (
            <ul className="divide-y divide-crm-line rounded-xl border border-crm-line">
              {mine.map((b) => (
                <li key={b.id}>
                  <Link href={`/dashboard/sales/bookings/${b.id}`} className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-crm-surface-2">
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-crm-ink">{b.eventTitle}</span>
                      <span className="text-[12px] text-crm-muted">
                        {b.bfNo} · {fmtDate(firstEventDate(b))}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <StatusPill status={b.status} size="sm" />
                      <ClosedTag closed={b.closed} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="mb-2 text-[13px] font-semibold text-crm-ink">Documents</p>
          {documents.length === 0 ? (
            <p className="text-[13px] text-crm-muted">No documents.</p>
          ) : (
            <ul className="space-y-1">
              {documents.slice(0, 12).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="truncate text-crm-ink-2">
                    {DOC_KIND_LABELS[d.kind]} <span className="font-mono text-[11.5px] text-crm-muted">{d.number}</span>
                  </span>
                  <Button size="icon-sm" variant="ghost" onClick={() => docs.preview(d)} aria-label="Preview">
                    <Eye size={15} />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="mb-2 text-[13px] font-semibold text-crm-ink">Notes</p>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button size="sm" className="mt-2" disabled={notes === (client.notes ?? "")} onClick={() => update.mutate({ id: client.id, patch: { notes } })}>
            Save notes
          </Button>
        </div>
      </div>
      {docs.viewer}
    </Drawer>
  );
}

export function ClientsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const role = useRole();
  const confirm = useConfirm();
  const clients = useClients();
  const bookings = useBookings();
  const payments = usePayments();
  const remove = useCrmRemove("clients", "Client");
  const [type, setType] = useState("");
  const [tag, setTag] = useState("");
  const [form, setForm] = useState<{ client?: Client; key: number } | null>(null);
  const openId = params.get("c");
  const open = (clients.data ?? []).find((c) => c.id === openId);

  const rows = useMemo<Row[] | undefined>(() => {
    if (!clients.data || !bookings.data || !payments.data) return undefined;
    return clients.data
      .filter((c) => (!type || c.type === type) && (!tag || c.tags.includes(tag)))
      .map((c) => {
        const mine = bookings.data!.filter((b) => b.clientId === c.id);
        const ids = new Set(mine.map((b) => b.id));
        return { id: c.id, createdAt: c.createdAt, c, bookings: mine.length, spent: payments.data!.filter((p) => ids.has(p.bookingId)).reduce((s, p) => s + p.amount, 0), lastEvent: mine.map((b) => firstEventDate(b)).sort().pop() };
      });
  }, [clients.data, bookings.data, payments.data, type, tag]);

  const dups = useMemo(() => (clients.data ? duplicateClients() : []), [clients.data]);
  const allTags = [...new Set((clients.data ?? []).flatMap((c) => c.tags))].sort();
  const setOpen = (id?: string) => router.replace(id ? `/dashboard/sales/clients?c=${id}` : "/dashboard/sales/clients", { scroll: false });

  const columns: Column<Row>[] = [
    {
      id: "name",
      header: "Client",
      primary: true,
      pinned: true,
      value: (r) => r.c.name,
      cell: (r) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <Avatar name={r.c.name} size={30} color="#55525A" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-crm-ink">{r.c.name}</p>
            <p className="truncate text-[12px] text-crm-muted">{r.c.organization ?? r.c.clientNo}</p>
          </div>
        </div>
      ),
    },
    { id: "clientNo", header: "Client ID", value: (r) => r.c.clientNo, cell: (r) => <span className="font-mono text-[12px]">{r.c.clientNo}</span> },
    { id: "mobile", header: "Mobile", value: (r) => r.c.mobile, cell: (r) => <span className="tabular">{r.c.mobile}</span> },
    { id: "type", header: "Type", value: (r) => CLIENT_TYPE_LABELS[r.c.type], cell: (r) => CLIENT_TYPE_LABELS[r.c.type] },
    { id: "tags", header: "Tags", value: (r) => r.c.tags.join(" "), cell: (r) => <div className="flex flex-wrap gap-1">{r.c.tags.map((t) => <Badge key={t} tone={t === "VIP" ? "brand" : t === "repeat" ? "green" : "neutral"}>{t}</Badge>)}</div> },
    { id: "bookings", header: "Bookings", align: "end", value: (r) => r.bookings, cell: (r) => <span className="tabular">{r.bookings}</span> },
    { id: "spent", header: "Total paid", align: "end", value: (r) => r.spent, cell: (r) => <span className="font-semibold text-crm-ink tabular">{taka(r.spent)}</span> },
    { id: "last", header: "Last event", value: (r) => r.lastEvent ?? "", cell: (r) => fmtDate(r.lastEvent) },
    { id: "email", header: "Email", value: (r) => r.c.email ?? "", cell: (r) => r.c.email ?? "—", hidden: true },
  ];

  return (
    <Stagger>
      <Item>
        <PageHeader
          eyebrow="Sales"
          title="Clients"
          description="Profiles, bookings, payments and documents in one place. Duplicates are detected by mobile number."
          actions={
            can(role, "create", "clients") && (
              <Button variant="primary" icon={UserPlus} onClick={() => setForm({ key: Date.now() })}>
                New client
              </Button>
            )
          }
        />
      </Item>
      {dups.length > 0 && (
        <Item>
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#FDE7C2] bg-[#FEF6E7] px-4 py-3 text-[13px] text-[#B54708] dark:bg-[#2B2010] dark:border-[#4A3510]">
            <Warning size={17} weight="fill" /> {dups.length} possible duplicate client group{dups.length > 1 ? "s" : ""} (same mobile).
          </div>
        </Item>
      )}
      <Item>
        <FilterBar>
          <Select value={type} onChange={setType} placeholder="All types" options={CLIENT_TYPES.map((t) => ({ value: t, label: CLIENT_TYPE_LABELS[t] }))} className="w-auto min-w-[140px]" />
          <Select value={tag} onChange={setTag} placeholder="All tags" options={allTags.map((t) => ({ value: t, label: t }))} className="w-auto min-w-[120px]" />
        </FilterBar>
      </Item>
      <Item>
        <DataTable
          rows={rows}
          loading={clients.isLoading}
          columns={columns}
          initialSort={{ id: "name", dir: "asc" }}
          searchPlaceholder="Search name, mobile, client ID…"
          searchText={(r) => `${r.c.name} ${r.c.mobile} ${r.c.clientNo} ${r.c.organization ?? ""} ${r.c.email ?? ""}`}
          onRowClick={(r) => setOpen(r.id)}
          exportName="iccb-clients"
          empty={{ icon: UsersThree, title: "No clients yet", description: "Clients are created automatically from booking requests, or add one manually." }}
          rowActions={(r) => (
            <>
              <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setForm({ client: r.c, key: Date.now() })}>
                <PencilSimple size={15} />
              </Button>
              {can(role, "delete", "clients") && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Delete"
                  onClick={async () => {
                    const ok = await confirm({ title: `Delete ${r.c.name}?`, description: r.bookings ? `This client has ${r.bookings} booking(s). Bookings stay; the client moves to trash.` : "Moves to trash (undo available).", tone: "danger", confirmLabel: "Delete" });
                    if (ok.ok) remove.mutate(r.id);
                  }}
                >
                  <Trash size={15} />
                </Button>
              )}
            </>
          )}
        />
      </Item>
      {open && <ClientDrawer key={open.id} client={open} onClose={() => setOpen()} onEdit={() => setForm({ client: open, key: Date.now() })} />}
      {form && <ClientFormModal key={form.key} open client={form.client} onOpenChange={(v) => !v && setForm(null)} />}
    </Stagger>
  );
}
