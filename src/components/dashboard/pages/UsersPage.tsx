"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PencilSimple, Plus, Trash, UsersThree } from "@phosphor-icons/react";
import type { Role, User } from "@/types/crm";
import { ROLE_LABELS } from "@/types/crm";
import { db, useCurrentUser } from "@/lib/crm/db";
import { useBookings, useMeetings, usePayments, useUsers } from "@/lib/crm/hooks";
import { fmtDate } from "@/lib/crm/format";
import { Avatar, Button, EmptyState, Field, FilterRow, Input, PageHeader, SearchInput, Select, Switch } from "../ui/core";
import { DataTable, RowActions, type Column } from "../ui/data";
import { FilterSelect, FilterSummary, SortSelect, useFilters } from "../ui/filters";
import { Modal, useConfirm } from "../ui/overlay";

const ROLES = (Object.keys(ROLE_LABELS) as Role[]).map((r) => ({ value: r, label: ROLE_LABELS[r] }));

export function UsersPage() {
  const users = useUsers();
  const meetings = useMeetings();
  const payments = usePayments();
  const bookings = useBookings();
  const me = useCurrentUser();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<Partial<User> | null>(null);
  const { f, set, reset, active } = useFilters({ q: "", role: "", status: "", sort: "name" });

  /** Workload: meetings as rep, payments received, events coordinated. */
  const work = useMemo(() => {
    const m = new Map<string, { meetings: number; payments: number; events: number }>();
    const get = (n: string) => m.get(n) ?? (m.set(n, { meetings: 0, payments: 0, events: 0 }), m.get(n)!);
    meetings.forEach((x) => get(x.rep).meetings++);
    payments.forEach((x) => get(x.receivedBy).payments++);
    bookings.forEach((x) => x.coordinator && get(x.coordinator).events++);
    return m;
  }, [meetings, payments, bookings]);
  const rows = useMemo(() => {
    const load = (u: User) => {
      const w = work.get(u.name);
      return (w?.meetings ?? 0) + (w?.payments ?? 0) + (w?.events ?? 0);
    };
    const n = f.q.trim().toLowerCase();
    const list = users.filter((u) => (!f.role || u.role === f.role) && (!f.status || (f.status === "active") === u.active) && (!n || [u.name, u.email, u.phone].join(" ").toLowerCase().includes(n)));
    return [...list].sort((a, b) => (f.sort === "role" ? a.role.localeCompare(b.role) : f.sort === "busy" ? load(b) - load(a) : f.sort === "newest" ? b.createdAt.localeCompare(a.createdAt) : a.name.localeCompare(b.name)));
  }, [users, f, work]);

  const save = () => {
    if (!editing?.name?.trim() || !editing.email?.includes("@")) return toast.error("Please enter a name and a valid email.");
    const data = { name: editing.name.trim(), email: editing.email.trim(), phone: editing.phone?.trim() || undefined, role: editing.role ?? "sales" };
    if (editing.id) db.users.update(editing.id, data);
    else db.users.create({ ...data, active: true, isSample: true });
    toast.success("User saved");
    setEditing(null);
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Name",
      cell: (u) => (
        <span className="flex items-center gap-3">
          <Avatar name={u.name} size={30} />
          <span>
            <span className="block font-medium text-crm-ink">
              {u.name}
              {u.id === me.id && <span className="ms-1.5 text-[12px] font-normal text-crm-muted">(you)</span>}
            </span>
            <span className="block text-[12px] text-crm-muted">{u.email}</span>
          </span>
        </span>
      ),
    },
    { key: "phone", header: "Phone", cell: (u) => u.phone ?? "—" },
    { key: "role", header: "Role", cell: (u) => ROLE_LABELS[u.role] },
    {
      key: "work",
      header: "Workload",
      cell: (u) => {
        const w = work.get(u.name);
        return <span className="text-[13px] text-crm-muted">{w ? `${w.meetings} meetings · ${w.payments} payments · ${w.events} events` : "—"}</span>;
      },
    },
    { key: "since", header: "Since", cell: (u) => fmtDate(u.createdAt, "MMM yyyy") },
    { key: "active", header: "Active", cell: (u) => <Switch checked={u.active} onChange={(v) => (u.id === me.id && !v ? toast.error("You can't deactivate yourself.") : db.users.update(u.id, { active: v }))} label={`${u.name} active`} /> },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      cell: (u) => (
        <RowActions>
          <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setEditing(u)}>
            <PencilSimple size={16} />
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Delete" disabled={u.id === me.id} onClick={async () => (await confirm({ title: `Delete ${u.name}?`, confirmLabel: "Delete", danger: true })) && db.users.remove(u.id)}>
            <Trash size={16} />
          </Button>
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        description="Who can sign in and what they can see."
        action={
          <Button variant="primary" icon={Plus} onClick={() => setEditing({ role: "sales" })}>
            Add user
          </Button>
        }
      />
      <FilterRow>
        <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Name, email, phone…" />
        <FilterSelect label="Roles" value={f.role} onChange={(v) => set("role", v)} options={ROLES} />
        <FilterSelect label="Status" all="Active & inactive" value={f.status} onChange={(v) => set("status", v)} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
        <SortSelect value={f.sort} onChange={(v) => set("sort", v)} options={[{ value: "name", label: "Name A–Z" }, { value: "role", label: "By role" }, { value: "busy", label: "Busiest" }, { value: "newest", label: "Newest" }]} className="sm:ms-auto" />
      </FilterRow>
      <FilterSummary active={active} onClear={reset} count={rows.length} noun="user" />
      <DataTable
        rows={rows}
        columns={columns}
        empty={<EmptyState icon={UsersThree} text="No users match." action={<Button onClick={reset}>Clear filters</Button>} />}
        mobileCard={(u) => (
          <div className="flex items-center gap-3">
            <Avatar name={u.name} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-crm-ink">{u.name}</p>
              <p className="truncate text-[12.5px] text-crm-muted">
                {ROLE_LABELS[u.role]} · {u.email}
              </p>
            </div>
            <RowActions>
              <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setEditing(u)}>
                <PencilSimple size={16} />
              </Button>
            </RowActions>
          </div>
        )}
      />
      <Modal
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        size="sm"
        title={editing?.id ? "Edit user" : "Add user"}
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
          <div className="space-y-4">
            <Field label="Name" required>
              <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
            </Field>
            <Field label="Email" required>
              <Input type="email" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input type="tel" value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            </Field>
            <Field label="Role">
              <Select value={editing.role ?? "sales"} onChange={(r) => setEditing({ ...editing, role: r as Role })} options={ROLES} />
            </Field>
          </div>
        )}
      </Modal>
    </>
  );
}
