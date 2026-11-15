"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AddressBook, Buildings, FilePdf, Money, PencilSimple, Phone, Plus, Repeat, Trash, UsersThree, WhatsappLogo } from "@phosphor-icons/react";
import type { Client, ClientType } from "@/types/crm";
import { CLIENT_TYPES, isBillPayment } from "@/types/crm";
import { useBills, useBookings, useClients, useHallMap, usePayments } from "@/lib/crm/hooks";
import { fmtDate, money, telHref, todayYmd, waHref } from "@/lib/crm/format";
import { deleteClient, saveClient } from "@/services/crm";
import { pdfClientStatement } from "@/lib/pdf/actions";
import { Avatar, Button, EmptyState, Field, FilterRow, Input, KeyValue, LinkButton, PageHeader, SearchInput, Select, Textarea } from "../ui/core";
import { DataTable, Kpi, RowActions, type Column } from "../ui/data";
import { FilterSelect, FilterSummary, SortSelect, useFilters } from "../ui/filters";
import { Drawer, Modal, useConfirm } from "../ui/overlay";
import { Item, Stagger } from "../ui/motion";
import { StatusPill } from "../ui/status";
import { useNewBooking } from "../bookings/NewBookingModal";

interface Stats {
  bookings: number;
  billed: number;
  paid: number;
  due: number;
  last?: string;
  next?: string;
}

const emptyClient = (): Partial<Client> => ({ type: "Individual", tags: [] });

export function ClientsPage() {
  const params = useSearchParams();
  const clients = useClients();
  const bookings = useBookings();
  const payments = usePayments();
  const bills = useBills(bookings);
  const halls = useHallMap();
  const newBooking = useNewBooking();
  const confirm = useConfirm();
  const [openId, setOpenId] = useState<string | null>(params.get("c"));
  const [editing, setEditing] = useState<Partial<Client> | null>(null);
  const { f, set, reset, active } = useFilters({ q: "", type: "", activity: "", due: "", sort: "recent" });
  const today = todayYmd();

  const stats = useMemo(() => {
    const m = new Map<string, Stats>();
    for (const b of bookings) {
      if (!b.clientId || b.status === "cancelled") continue;
      const s = m.get(b.clientId) ?? { bookings: 0, billed: 0, paid: 0, due: 0 };
      const bill = bills.get(b.id);
      s.bookings++;
      s.billed += bill?.total ?? 0;
      s.paid += bill?.paid ?? 0;
      s.due += bill?.due ?? 0;
      if (b.date < today && (!s.last || b.date > s.last)) s.last = b.date;
      if (b.date >= today && (!s.next || b.date < s.next)) s.next = b.date;
      m.set(b.clientId, s);
    }
    return m;
  }, [bookings, bills, today]);
  const st = (id: string): Stats => stats.get(id) ?? { bookings: 0, billed: 0, paid: 0, due: 0 };

  const rows = useMemo(() => {
    const n = f.q.trim().toLowerCase();
    const list = clients.filter((c) => {
      const s = stats.get(c.id);
      const count = s?.bookings ?? 0;
      return (
        (!f.type || c.type === f.type) &&
        (!f.activity || (f.activity === "none" ? count === 0 : f.activity === "repeat" ? count > 1 : f.activity === "upcoming" ? !!s?.next : count > 0)) &&
        (!f.due || (f.due === "due" ? (s?.due ?? 0) > 0 : (s?.due ?? 0) === 0)) &&
        (!n || [c.name, c.organization, c.mobile, c.email, c.clientNo, ...c.tags].join(" ").toLowerCase().includes(n))
      );
    });
    const g = (c: Client) => stats.get(c.id);
    return [...list].sort((a, b) =>
      f.sort === "name" ? a.name.localeCompare(b.name) : f.sort === "billed" ? (g(b)?.billed ?? 0) - (g(a)?.billed ?? 0) : f.sort === "due" ? (g(b)?.due ?? 0) - (g(a)?.due ?? 0) : f.sort === "bookings" ? (g(b)?.bookings ?? 0) - (g(a)?.bookings ?? 0) : b.createdAt.localeCompare(a.createdAt)
    );
  }, [clients, stats, f]);

  const kpi = useMemo(() => {
    const all = [...stats.values()];
    return { total: clients.length, corporate: clients.filter((c) => c.type !== "Individual").length, repeat: all.filter((s) => s.bookings > 1).length, due: all.reduce((t, s) => t + s.due, 0) };
  }, [clients, stats]);

  const save = () => {
    if (!editing) return;
    try {
      const c = saveClient({ id: editing.id, name: editing.name ?? "", mobile: editing.mobile ?? "", type: editing.type ?? "Individual", organization: editing.organization?.trim() || undefined, email: editing.email?.trim() || undefined, address: editing.address?.trim() || undefined, idNo: editing.idNo?.trim() || undefined, tags: editing.tags ?? [], notes: editing.notes?.trim() || undefined });
      toast.success(editing.id ? "Client updated" : `${c.clientNo} added`);
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    }
  };

  const remove = async (c: Client) => {
    if (!(await confirm({ title: `Delete ${c.name}?`, confirmLabel: "Delete", danger: true }))) return;
    try {
      deleteClient(c.id);
      setOpenId(null);
      toast("Client deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete");
    }
  };

  const columns: Column<Client>[] = [
    {
      key: "name",
      header: "Client",
      cell: (c) => (
        <span className="flex items-center gap-3">
          <Avatar name={c.name} size={32} />
          <span className="min-w-0">
            <span className="block truncate font-medium text-crm-ink">{c.name}</span>
            <span className="block truncate text-[12px] text-crm-muted">
              {c.clientNo}
              {c.organization ? ` · ${c.organization}` : ""}
            </span>
          </span>
        </span>
      ),
    },
    { key: "type", header: "Type", cell: (c) => c.type },
    { key: "mobile", header: "Mobile", cell: (c) => <span className="whitespace-nowrap tabular">{c.mobile}</span> },
    { key: "next", header: "Next / last event", cell: (c) => <span className="whitespace-nowrap text-[13px]">{st(c.id).next ? fmtDate(st(c.id).next) : st(c.id).last ? <span className="text-crm-muted">{fmtDate(st(c.id).last)}</span> : "—"}</span> },
    {
      key: "a",
      header: <span className="sr-only">Actions</span>,
      cell: (c) => (
        <RowActions>
          <Button size="icon-sm" variant="ghost" aria-label="Statement PDF" title="Statement PDF" onClick={() => pdfClientStatement(c)}>
            <FilePdf size={17} />
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setEditing(c)}>
            <PencilSimple size={16} />
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Delete" onClick={() => remove(c)}>
            <Trash size={16} />
          </Button>
        </RowActions>
      ),
    },
  ];

  const open = clients.find((c) => c.id === openId);
  const openBookings = open ? bookings.filter((b) => b.clientId === open.id).sort((a, b) => b.date.localeCompare(a.date)) : [];
  const openPayments = open ? payments.filter((p) => openBookings.some((b) => b.id === p.bookingId)).sort((a, b) => b.date.localeCompare(a.date)) : [];

  return (
    <>
      <PageHeader
        title="Clients"
        description="Everyone who has booked or asked — individuals, companies, government and NGOs."
        action={
          <Button variant="primary" icon={Plus} onClick={() => setEditing(emptyClient())}>
            New client
          </Button>
        }
      />
      <Stagger className="mb-6 grid grid-cols-2 gap-5 xl:grid-cols-4">
        <Item>
          <Kpi label="Clients" value={kpi.total} icon={AddressBook} />
        </Item>
        <Item>
          <Kpi label="Organisations" value={kpi.corporate} icon={Buildings} hint="Corporate, government, NGO" />
        </Item>
        <Item>
          <Kpi label="Repeat clients" value={kpi.repeat} icon={Repeat} hint="2+ bookings" />
        </Item>
        <Item>
          <Kpi label="Outstanding due" value={kpi.due} icon={Money} format={money} />
        </Item>
      </Stagger>
      <FilterRow>
        <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Name, org, mobile, tag…" />
        <FilterSelect label="Types" value={f.type} onChange={(v) => set("type", v)} options={CLIENT_TYPES} />
        <FilterSelect label="Activity" all="Any activity" value={f.activity} onChange={(v) => set("activity", v)} options={[{ value: "booked", label: "Has bookings" }, { value: "upcoming", label: "Upcoming event" }, { value: "repeat", label: "Repeat (2+)" }, { value: "none", label: "No bookings yet" }]} />
        <FilterSelect label="Payment" all="Any payment" value={f.due} onChange={(v) => set("due", v)} options={[{ value: "due", label: "Has due" }, { value: "clear", label: "Fully paid" }]} />
        <SortSelect value={f.sort} onChange={(v) => set("sort", v)} options={[{ value: "recent", label: "Newest" }, { value: "name", label: "Name A–Z" }, { value: "bookings", label: "Most bookings" }, { value: "billed", label: "Highest billed" }, { value: "due", label: "Highest due" }]} className="sm:ms-auto" />
      </FilterRow>
      <FilterSummary active={active} onClear={reset} count={rows.length} noun="client" />
      <DataTable
        rows={rows}
        columns={columns}
        onRowClick={(c) => setOpenId(c.id)}
        empty={<EmptyState icon={UsersThree} text="No clients match these filters." action={<Button onClick={reset}>Clear filters</Button>} />}
        mobileCard={(c) => (
          <div>
            <div className="flex items-center gap-3">
              <Avatar name={c.name} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-crm-ink">{c.name}</p>
                <p className="truncate text-[12.5px] text-crm-muted">
                  {c.type}
                  {c.organization ? ` · ${c.organization}` : ""}
                </p>
              </div>
            </div>
            <p className="mt-3 flex justify-between border-t border-crm-line pt-3 text-[13px]">
              <span className="text-crm-muted">{st(c.id).bookings} booking(s)</span>
              <span className="tabular">
                {money(st(c.id).billed)} <span className="text-crm-muted">· due {money(st(c.id).due)}</span>
              </span>
            </p>
          </div>
        )}
      />

      <Drawer open={!!open} onOpenChange={(v) => !v && setOpenId(null)} title={open?.name} description={open ? `${open.clientNo} · ${open.type}${open.organization ? ` · ${open.organization}` : ""}` : undefined}>
        {open && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <LinkButton href={telHref(open.mobile)} icon={Phone}>
                Call
              </LinkButton>
              <LinkButton href={waHref(open.mobile)} icon={WhatsappLogo} external>
                WhatsApp
              </LinkButton>
              <Button size="sm" icon={FilePdf} onClick={() => pdfClientStatement(open)}>
                Statement
              </Button>
              <Button size="sm" icon={PencilSimple} onClick={() => setEditing(open)}>
                Edit
              </Button>
            </div>
            <KeyValue
              items={[
                ["Mobile", open.mobile],
                ["Email", open.email],
                ["Address", open.address],
                ["NID / trade licence", open.idNo],
                ["Tags", open.tags.join(", ")],
                ["Client since", fmtDate(open.createdAt)],
              ]}
            />
            {open.notes && <p className="rounded-[10px] bg-crm-surface-2 p-3 text-[13.5px] text-crm-ink">{open.notes}</p>}
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[10px] border border-crm-line bg-crm-line text-center">
              {(
                [
                  ["Billed", st(open.id).billed],
                  ["Paid", st(open.id).paid],
                  ["Due", st(open.id).due],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="bg-crm-surface px-2 py-2.5">
                  <p className="text-[12px] text-crm-muted">{k}</p>
                  <p className="text-[14px] font-semibold text-crm-ink tabular">{money(v)}</p>
                </div>
              ))}
            </div>
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[14.5px] font-semibold text-crm-ink">Bookings</h3>
                <Button size="sm" variant="ghost" icon={Plus} onClick={() => newBooking({ name: open.name, mobile: open.mobile, email: open.email, organization: open.organization })}>
                  New booking
                </Button>
              </div>
              {openBookings.length === 0 ? (
                <p className="text-[13.5px] text-crm-muted">No bookings yet.</p>
              ) : (
                <ul className="divide-y divide-crm-line rounded-[10px] border border-crm-line">
                  {openBookings.map((b) => (
                    <li key={b.id}>
                      <Link href={`/dashboard/bookings/${b.id}`} className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-crm-surface-2">
                        <span className="min-w-0">
                          <span className="block truncate text-[13.5px] font-medium text-crm-ink">{b.eventName}</span>
                          <span className="block text-[12px] text-crm-muted">
                            {b.ref} · {halls.get(b.hallId)?.name} · {fmtDate(b.date)}
                          </span>
                        </span>
                        <StatusPill status={b.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h3 className="mb-2 text-[14.5px] font-semibold text-crm-ink">Payments</h3>
              {openPayments.length === 0 ? (
                <p className="text-[13.5px] text-crm-muted">No payments yet.</p>
              ) : (
                <ul className="space-y-1.5 text-[13.5px]">
                  {openPayments.map((p) => (
                    <li key={p.id} className="flex justify-between gap-3">
                      <span className="text-crm-ink-2">
                        {fmtDate(p.date)} · {p.kind} · {p.method}
                      </span>
                      <span className={isBillPayment(p.kind) ? "text-crm-ink tabular" : "text-crm-muted tabular"}>{money(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <div className="border-t border-crm-line pt-4">
              <Button size="sm" variant="danger" icon={Trash} onClick={() => remove(open)}>
                Delete client
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        size="lg"
        title={editing?.id ? "Edit client" : "New client"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save}>
              Save
            </Button>
          </>
        }
      >
        {editing && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" required>
              <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
            </Field>
            <Field label="Mobile" required>
              <Input type="tel" value={editing.mobile ?? ""} onChange={(e) => setEditing({ ...editing, mobile: e.target.value })} placeholder="01XXXXXXXXX" />
            </Field>
            <Field label="Type">
              <Select value={editing.type ?? "Individual"} onChange={(v) => setEditing({ ...editing, type: v as ClientType })} options={CLIENT_TYPES.map((t) => ({ value: t, label: t }))} />
            </Field>
            <Field label="Organisation">
              <Input value={editing.organization ?? ""} onChange={(e) => setEditing({ ...editing, organization: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </Field>
            <Field label="NID / passport / trade licence">
              <Input value={editing.idNo ?? ""} onChange={(e) => setEditing({ ...editing, idNo: e.target.value })} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Input value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
            </Field>
            <Field label="Tags" hint="Comma separated, e.g. VIP, Repeat" className="sm:col-span-2">
              <Input value={(editing.tags ?? []).join(", ")} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(",") })} />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>
    </>
  );
}
