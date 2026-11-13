"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, PencilSimple, ShieldCheck, Trash, UserPlus } from "@phosphor-icons/react";
import type { Role, User, UserInput } from "@/types/crm";
import { ROLE_LABELS, ROLES, requireNameAndPhone } from "@/types/crm";
import { useCurrentUser } from "@/lib/crm/db";
import { ago } from "@/lib/crm/format";
import { useCrmCreate, useCrmRemove, useCrmUpdate, useUsers } from "@/services/crm/hooks";
import { Item, Stagger } from "../ui/motion";
import { Avatar, Badge, Button, Card, CardHeader, Field, Input, PageHeader, Select, Switch } from "../ui/core";
import { DataTable, type Column } from "../ui/data-table";
import { Modal, useConfirm } from "../ui/overlay";

const COLORS = ["#E24F5F", "#7A5AF8", "#2E90FA", "#0BA5EC", "#15B79E", "#EE46BC", "#F79009", "#12B76A"];
const ROLE_TONE = { admin: "brand", sales_manager: "purple", sales_executive: "blue", marketing: "amber", operations: "neutral", accounts: "green" } as const;

function UserModal({ user, onClose }: { user?: User; onClose: () => void }) {
  const [v, setV] = useState<UserInput>(() => (user ? { name: user.name, email: user.email, phone: user.phone, role: user.role, department: user.department, designation: user.designation, active: user.active, roundRobinOrder: user.roundRobinOrder } : { name: "", email: "", phone: "", role: "sales_executive", department: "Sales", designation: "Customer Representative", active: true, roundRobinOrder: 9 }));
  const [err, setErr] = useState<string | null>(null);
  const create = useCrmCreate<User>("users", "User created");
  const update = useCrmUpdate<User>("users", "User saved");
  const set = <K extends keyof UserInput>(k: K, val: UserInput[K]) => setV((s) => ({ ...s, [k]: val }));
  const save = () => {
    const e = requireNameAndPhone({ name: v.name, mobile: v.phone });
    setErr(e);
    if (e) return;
    if (user) update.mutate({ id: user.id, patch: v }, { onSuccess: onClose });
    else create.mutate({ ...v, color: COLORS[Math.floor(Math.random() * COLORS.length)] }, { onSuccess: onClose });
  };
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={user ? "Edit user" : "New user"} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save} loading={create.isPending || update.isPending}>Save user</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required error={err?.includes("name") ? err : null}><Input value={v.name} onChange={(e) => set("name", e.target.value)} autoFocus /></Field>
        <Field label="Phone" required error={err?.includes("phone") ? err : null}><Input value={v.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="Email" className="sm:col-span-2"><Input value={v.email} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Role"><Select value={v.role} onChange={(x) => set("role", x as Role)} options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} /></Field>
        <Field label="Department"><Input value={v.department} onChange={(e) => set("department", e.target.value)} /></Field>
        <Field label="Designation"><Input value={v.designation} onChange={(e) => set("designation", e.target.value)} /></Field>
        <div className="flex items-end pb-2"><Switch checked={v.active} onChange={(b) => set("active", b)} label={v.active ? "Active" : "Inactive"} /></div>
      </div>
    </Modal>
  );
}

export function UsersPage() {
  const users = useUsers();
  const me = useCurrentUser();
  const update = useCrmUpdate<User>("users");
  const remove = useCrmRemove("users", "User");
  const confirm = useConfirm();
  const [modal, setModal] = useState<{ user?: User; key: number } | null>(null);
  const reps = (users.data ?? []).filter((u) => u.role === "sales_executive" && u.active).sort((a, b) => a.roundRobinOrder - b.roundRobinOrder);

  const swap = (i: number, j: number) => {
    const a = reps[i];
    const b = reps[j];
    if (!a || !b) return;
    update.mutate({ id: a.id, patch: { roundRobinOrder: b.roundRobinOrder } });
    update.mutate({ id: b.id, patch: { roundRobinOrder: a.roundRobinOrder === b.roundRobinOrder ? a.roundRobinOrder + 1 : a.roundRobinOrder } });
  };

  const columns: Column<User>[] = [
    { id: "name", header: "User", primary: true, pinned: true, value: (u) => u.name, cell: (u) => <div className="flex items-center gap-3"><Avatar name={u.name} color={u.color} size={32} /><div><p className="font-semibold text-crm-ink">{u.name}{u.id === me.id && <span className="ms-1 text-[11px] text-crm-muted">(you)</span>}</p><p className="text-[12px] text-crm-muted">{u.email}</p></div></div> },
    { id: "role", header: "Role", value: (u) => ROLE_LABELS[u.role], cell: (u) => <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABELS[u.role]}</Badge> },
    { id: "dept", header: "Department", value: (u) => u.department, cell: (u) => <span>{u.department}<span className="block text-[12px] text-crm-muted">{u.designation}</span></span> },
    { id: "phone", header: "Phone", value: (u) => u.phone, cell: (u) => <span className="tabular">{u.phone}</span> },
    { id: "active", header: "Active", value: (u) => (u.active ? 1 : 0), cell: (u) => <span onClick={(e) => e.stopPropagation()}><Switch checked={u.active} disabled={u.id === me.id} onChange={(b) => update.mutate({ id: u.id, patch: { active: b } })} /></span> },
    { id: "updated", header: "Updated", value: (u) => u.updatedAt, cell: (u) => ago(u.updatedAt), hidden: true },
  ];

  return (
    <Stagger>
      <Item>
        <PageHeader eyebrow="Admin" title="Users & roles" description="Demo users, one per role. Permissions follow the role; inactive users can't be assigned." actions={<Button variant="primary" icon={UserPlus} onClick={() => setModal({ key: Date.now() })}>New user</Button>} />
      </Item>
      <Item>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <DataTable
            rows={users.data}
            loading={users.isLoading}
            columns={columns}
            initialSort={{ id: "role", dir: "asc" }}
            exportName="iccb-users"
            onRowClick={(u) => setModal({ user: u, key: Date.now() })}
            rowActions={(u) => (
              <>
                <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setModal({ user: u, key: Date.now() })}>
                  <PencilSimple size={15} />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Delete"
                  disabled={u.id === me.id}
                  onClick={async () => {
                    const r = await confirm({ title: `Delete ${u.name}?`, tone: "danger", confirmLabel: "Delete" });
                    if (r.ok) remove.mutate(u.id);
                  }}
                >
                  <Trash size={15} />
                </Button>
              </>
            )}
          />
          <Card className="h-fit">
            <CardHeader icon={ShieldCheck} title="Sales round-robin order" description="New website and chatbot requests are assigned in this order." />
            <ol className="px-5 pb-5">
              {reps.map((u, i) => (
                <li key={u.id} className="flex items-center gap-3 border-b border-crm-line py-2.5 last:border-0">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-crm-surface-2 text-[12px] font-bold text-crm-ink-2">{i + 1}</span>
                  <Avatar name={u.name} color={u.color} size={26} />
                  <span className="flex-1 text-[13px] text-crm-ink">{u.name}</span>
                  <Button size="icon-sm" variant="ghost" disabled={i === 0} onClick={() => swap(i, i - 1)} aria-label="Move up">
                    <ArrowUp size={14} />
                  </Button>
                  <Button size="icon-sm" variant="ghost" disabled={i === reps.length - 1} onClick={() => swap(i, i + 1)} aria-label="Move down">
                    <ArrowDown size={14} />
                  </Button>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </Item>
      {modal && <UserModal key={modal.key} user={modal.user} onClose={() => setModal(null)} />}
    </Stagger>
  );
}
