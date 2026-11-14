"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Buildings, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import type { Hall } from "@/types/crm";
import { db } from "@/lib/crm/db";
import { useBookings, useHalls } from "@/lib/crm/hooks";
import { money, num, todayYmd } from "@/lib/crm/format";
import { cn } from "@/lib/utils/cn";
import { Button, EmptyState, Field, FilterRow, Input, PageHeader, SearchInput, Switch, Textarea } from "../ui/core";
import { DataTable, RowActions, type Column } from "../ui/data";
import { FilterSelect, FilterSummary, SortSelect, useFilters } from "../ui/filters";
import { Modal, useConfirm } from "../ui/overlay";

const CAPACITY = [
  { value: "600", label: "Up to 600" },
  { value: "1500", label: "Up to 1,500" },
  { value: "big", label: "More than 1,500" },
];

export function VenuesPage() {
  const halls = useHalls();
  const bookings = useBookings();
  const confirm = useConfirm();
  const today = todayYmd();
  const [editing, setEditing] = useState<Partial<Hall> | null>(null);
  const { f, set, reset, active } = useFilters({ q: "", status: "", capacity: "", sort: "name" });

  const stats = useMemo(() => {
    const m = new Map<string, { upcoming: number; total: number }>();
    for (const b of bookings) {
      if (b.status === "cancelled") continue;
      const s = m.get(b.hallId) ?? { upcoming: 0, total: 0 };
      s.total++;
      if (b.date >= today) s.upcoming++;
      m.set(b.hallId, s);
    }
    return m;
  }, [bookings, today]);

  const rows = useMemo(() => {
    const n = f.q.trim().toLowerCase();
    const list = halls.filter(
      (h) =>
        (!f.status || (f.status === "active") === h.active) &&
        (!f.capacity || (f.capacity === "big" ? h.capacity > 1500 : h.capacity <= Number(f.capacity))) &&
        (!n || [h.name, h.code, ...h.features].join(" ").toLowerCase().includes(n))
    );
    return [...list].sort((a, b) =>
      f.sort === "capacity" ? b.capacity - a.capacity : f.sort === "rate" ? b.weekendRate - a.weekendRate : f.sort === "busy" ? (stats.get(b.id)?.upcoming ?? 0) - (stats.get(a.id)?.upcoming ?? 0) : a.code.localeCompare(b.code, undefined, { numeric: true })
    );
  }, [halls, f, stats]);

  const save = () => {
    if (!editing?.name?.trim() || !(Number(editing.capacity) > 0)) return toast.error("Please enter a name and capacity.");
    const data = {
      name: editing.name.trim(),
      code: editing.code?.trim() || `Hall-${halls.length + 1}`,
      capacity: Number(editing.capacity),
      areaSqft: Number(editing.areaSqft) || 0,
      weekdayRate: Number(editing.weekdayRate) || 0,
      weekendRate: Number(editing.weekendRate) || 0,
      extraHourRate: Number(editing.extraHourRate) || 0,
      features: (editing.features ?? []).map((x) => x.trim()).filter(Boolean),
    };
    if (editing.id) db.halls.update(editing.id, data);
    else db.halls.create({ ...data, active: true, isSample: true });
    toast.success("Venue saved");
    setEditing(null);
  };

  const columns: Column<Hall>[] = [
    {
      key: "name",
      header: "Venue",
      cell: (h) => (
        <span>
          <span className={cn("block font-medium", h.active ? "text-crm-ink" : "text-crm-muted line-through")}>{h.name}</span>
          <span className="block text-[12px] text-crm-muted">
            {h.code} · {num(h.areaSqft)} sq ft
          </span>
        </span>
      ),
    },
    { key: "cap", header: "Capacity", align: "end", cell: (h) => num(h.capacity) },
    { key: "wd", header: "Weekday", align: "end", cell: (h) => money(h.weekdayRate) },
    { key: "we", header: "Weekend", align: "end", cell: (h) => money(h.weekendRate) },
    { key: "xh", header: "Extra hour", align: "end", cell: (h) => money(h.extraHourRate) },
    { key: "up", header: "Upcoming", align: "end", cell: (h) => stats.get(h.id)?.upcoming ?? 0 },
    { key: "active", header: "Active", cell: (h) => <Switch checked={h.active} onChange={(v) => db.halls.update(h.id, { active: v })} label={`${h.name} active`} /> },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      cell: (h) => (
        <RowActions>
          <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setEditing(h)}>
            <PencilSimple size={16} />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Delete"
            onClick={async () => {
              if (stats.get(h.id)?.total) return toast.error("This venue has bookings — switch it off instead.");
              if (await confirm({ title: `Delete ${h.name}?`, confirmLabel: "Delete", danger: true })) db.halls.remove(h.id);
            }}
          >
            <Trash size={16} />
          </Button>
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Venues"
        description="Halls, capacity, rent and facilities. Inactive halls are hidden from the booking form."
        action={
          <Button variant="primary" icon={Plus} onClick={() => setEditing({ features: [] })}>
            Add venue
          </Button>
        }
      />
      <FilterRow>
        <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Name, code, facility…" />
        <FilterSelect label="Status" all="Active & inactive" value={f.status} onChange={(v) => set("status", v)} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
        <FilterSelect label="Capacity" all="Any capacity" value={f.capacity} onChange={(v) => set("capacity", v)} options={CAPACITY} />
        <SortSelect value={f.sort} onChange={(v) => set("sort", v)} options={[{ value: "name", label: "Hall number" }, { value: "capacity", label: "Largest first" }, { value: "rate", label: "Highest rent" }, { value: "busy", label: "Most upcoming" }]} className="sm:ms-auto" />
      </FilterRow>
      <FilterSummary active={active} onClear={reset} count={rows.length} noun="venue" />
      <DataTable
        rows={rows}
        columns={columns}
        empty={<EmptyState icon={Buildings} text="No venues match." action={<Button onClick={reset}>Clear filters</Button>} />}
        mobileCard={(h) => (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-crm-ink">
                {h.name} <span className="text-[12px] font-normal text-crm-muted">{h.code}</span>
              </p>
              <p className="text-[12.5px] text-crm-muted">
                {num(h.capacity)} guests · {money(h.weekdayRate)} / {money(h.weekendRate)}
              </p>
            </div>
            <RowActions>
              <Switch checked={h.active} onChange={(v) => db.halls.update(h.id, { active: v })} label={`${h.name} active`} />
              <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setEditing(h)}>
                <PencilSimple size={16} />
              </Button>
            </RowActions>
          </div>
        )}
      />

      <Modal
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        size="lg"
        title={editing?.id ? "Edit venue" : "Add venue"}
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Name" required className="sm:col-span-2">
              <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
            </Field>
            <Field label="Code">
              <Input value={editing.code ?? ""} onChange={(e) => setEditing({ ...editing, code: e.target.value })} placeholder="Hall-6" />
            </Field>
            <Field label="Capacity" required>
              <Input type="number" min={1} value={editing.capacity ?? ""} onChange={(e) => setEditing({ ...editing, capacity: Number(e.target.value) })} />
            </Field>
            <Field label="Area (sq ft)">
              <Input type="number" min={0} value={editing.areaSqft ?? ""} onChange={(e) => setEditing({ ...editing, areaSqft: Number(e.target.value) })} />
            </Field>
            <Field label="Extra hour (৳)">
              <Input type="number" min={0} value={editing.extraHourRate ?? ""} onChange={(e) => setEditing({ ...editing, extraHourRate: Number(e.target.value) })} />
            </Field>
            <Field label="Weekday rent (৳)">
              <Input type="number" min={0} value={editing.weekdayRate ?? ""} onChange={(e) => setEditing({ ...editing, weekdayRate: Number(e.target.value) })} />
            </Field>
            <Field label="Weekend rent (৳)">
              <Input type="number" min={0} value={editing.weekendRate ?? ""} onChange={(e) => setEditing({ ...editing, weekendRate: Number(e.target.value) })} />
            </Field>
            <div />
            <Field label="Facilities" hint="One per line" className="sm:col-span-3">
              <Textarea value={(editing.features ?? []).join("\n")} onChange={(e) => setEditing({ ...editing, features: e.target.value.split("\n") })} />
            </Field>
          </div>
        )}
      </Modal>
    </>
  );
}
