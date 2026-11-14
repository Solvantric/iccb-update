"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ForkKnife, PencilSimple, Plus, Trash, Wrench, X } from "@phosphor-icons/react";
import type { AddOnRates, EventType, Meal, MenuPackage, ServiceCategory, ServiceItem } from "@/types/crm";
import { EVENT_TYPES, MEAL_LABELS, MEALS, SERVICE_CATEGORIES } from "@/types/crm";
import { db, useSettings } from "@/lib/crm/db";
import { useBookings, useMenus, useServices, useSettingsValue, useSpecials } from "@/lib/crm/hooks";
import { fmtDate, money, todayYmd } from "@/lib/crm/format";
import { applySpecialPrice } from "@/services/crm";
import { cn } from "@/lib/utils/cn";
import { Button, Card, CardTitle, EmptyState, Field, FilterRow, Input, PageHeader, SearchInput, Select, Switch, Textarea } from "../ui/core";
import { DataTable, RowActions, Tabs, type Column } from "../ui/data";
import { FilterSelect, FilterSummary, SortSelect, useFilters } from "../ui/filters";
import { Modal, useConfirm } from "../ui/overlay";

type Tab = "addons" | "menus" | "services" | "security" | "specials";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const RATE_GROUPS: { title: string; hint?: string; rows: { key: keyof AddOnRates; label: string; unit: string }[] }[] = [
  {
    title: "Decoration",
    hint: "ICCB Events packages and fees for outside firms.",
    rows: [
      { key: "decorationBasic", label: "ICCB Basic", unit: "event" },
      { key: "decorationStandard", label: "ICCB Standard", unit: "event" },
      { key: "decorationPremium", label: "ICCB Premium", unit: "event" },
      { key: "outsideA", label: "Outside firm — Cat. A", unit: "fee" },
      { key: "outsideB", label: "Outside firm — Cat. B", unit: "fee" },
      { key: "outsideC", label: "Outside firm — Cat. C", unit: "fee" },
    ],
  },
  {
    title: "Food",
    hint: "Default per-person rate when no menu package is picked, and the service charge.",
    rows: [
      { key: "breakfast", label: "Breakfast", unit: "person" },
      { key: "lunch", label: "Lunch", unit: "person" },
      { key: "snacks", label: "Evening snacks", unit: "person" },
      { key: "dinner", label: "Dinner", unit: "person" },
      { key: "serviceChargeMain", label: "Service charge — lunch / dinner", unit: "person" },
      { key: "serviceChargeLight", label: "Service charge — breakfast / snacks", unit: "person" },
    ],
  },
];

function MoneyCell({ value, onSave, label, suffix }: { value: number; onSave: (n: number) => void; label: string; suffix?: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <span className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        aria-label={label}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== null && Number(draft) !== value && Number(draft) >= 0) {
            onSave(Math.round(Number(draft)));
            toast.success(`${label} updated`);
          }
          setDraft(null);
        }}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className="h-9 w-32 text-end tabular"
      />
      {suffix && <span className="w-14 text-[12px] text-crm-muted">{suffix}</span>}
    </span>
  );
}

/* ─── Add-ons & food ─────────────────────────────────────────────────────── */

function AddOnsTab() {
  const settings = useSettingsValue();
  const set = useSettings((s) => s.set);
  const [q, setQ] = useState("");
  const n = q.trim().toLowerCase();
  return (
    <>
      <FilterRow>
        <SearchInput value={q} onChange={setQ} placeholder="Find a price…" />
      </FilterRow>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {RATE_GROUPS.map((g) => {
          const rows = g.rows.filter((r) => !n || r.label.toLowerCase().includes(n));
          if (!rows.length) return null;
          return (
            <Card key={g.title}>
              <CardTitle title={g.title} />
              {g.hint && <p className="-mt-2 px-5 pb-3 text-[12.5px] text-crm-muted">{g.hint}</p>}
              <ul className="divide-y divide-crm-line border-t border-crm-line">
                {rows.map((r) => (
                  <li key={r.key} className="flex items-center justify-between gap-3 px-5 py-2.5">
                    <span className="text-[14px] text-crm-ink">{r.label}</span>
                    <MoneyCell value={settings.addOnRates[r.key]} label={r.label} suffix={`/ ${r.unit}`} onSave={(v) => set({ addOnRates: { ...settings.addOnRates, [r.key]: v } })} />
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
        {(!n || "vat".includes(n)) && (
          <Card>
            <CardTitle title="VAT" />
            <div className="flex items-center justify-between gap-3 px-5 pb-5">
              <span className="text-[14px] text-crm-ink">VAT on food & food service charge</span>
              <MoneyCell value={settings.foodVatPercent} label="Food VAT" suffix="%" onSave={(v) => set({ foodVatPercent: Math.min(100, v) })} />
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

/* ─── Menu packages ──────────────────────────────────────────────────────── */

function MenusTab({ editing, setEditing }: { editing: Partial<MenuPackage> | null; setEditing: (v: Partial<MenuPackage> | null) => void }) {
  const menus = useMenus();
  const confirm = useConfirm();
  const { f, set, reset, active } = useFilters({ q: "", meal: "", status: "", sort: "meal" });
  const rows = useMemo(() => {
    const n = f.q.trim().toLowerCase();
    const list = menus.filter((m) => (!f.meal || m.meal === f.meal) && (!f.status || (f.status === "active") === m.active) && (!n || [m.name, ...m.items].join(" ").toLowerCase().includes(n)));
    return [...list].sort((a, b) => (f.sort === "price-asc" ? a.perHead - b.perHead : f.sort === "price-desc" ? b.perHead - a.perHead : f.sort === "name" ? a.name.localeCompare(b.name) : MEALS.indexOf(a.meal) - MEALS.indexOf(b.meal) || a.perHead - b.perHead));
  }, [menus, f]);

  const save = () => {
    if (!editing?.name?.trim() || !editing.meal || !(Number(editing.perHead) > 0)) return toast.error("Please enter a name, meal and price.");
    const data = { name: editing.name.trim(), meal: editing.meal, perHead: Number(editing.perHead), items: (editing.items ?? []).map((i) => i.trim()).filter(Boolean) };
    if (editing.id) db.menus.update(editing.id, data);
    else db.menus.create({ ...data, active: true, isSample: true });
    toast.success("Menu saved");
    setEditing(null);
  };

  const columns: Column<MenuPackage>[] = [
    { key: "name", header: "Menu", cell: (m) => <span className={cn("font-medium", m.active ? "text-crm-ink" : "text-crm-muted line-through")}>{m.name}</span> },
    { key: "meal", header: "Meal", cell: (m) => MEAL_LABELS[m.meal] },
    { key: "items", header: "Items", cell: (m) => <span className="line-clamp-1 text-[13px] text-crm-muted">{m.items.join(" · ")}</span> },
    { key: "price", header: "Per person", align: "end", cell: (m) => money(m.perHead) },
    { key: "active", header: "Active", cell: (m) => <Switch checked={m.active} onChange={(v) => db.menus.update(m.id, { active: v })} label={`${m.name} active`} /> },
    {
      key: "a",
      header: <span className="sr-only">Actions</span>,
      cell: (m) => (
        <RowActions>
          <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setEditing(m)}>
            <PencilSimple size={16} />
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Delete" onClick={async () => (await confirm({ title: `Delete ${m.name}?`, description: "Bookings using it fall back to the standard rate.", confirmLabel: "Delete", danger: true })) && db.menus.remove(m.id)}>
            <Trash size={16} />
          </Button>
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <FilterRow>
        <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Menu or dish…" />
        <FilterSelect label="Meals" value={f.meal} onChange={(v) => set("meal", v)} options={MEALS.map((m) => ({ value: m, label: MEAL_LABELS[m] }))} />
        <FilterSelect label="Status" all="Active & inactive" value={f.status} onChange={(v) => set("status", v)} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
        <SortSelect value={f.sort} onChange={(v) => set("sort", v)} options={[{ value: "meal", label: "By meal" }, { value: "name", label: "Name A–Z" }, { value: "price-asc", label: "Price: low → high" }, { value: "price-desc", label: "Price: high → low" }]} className="sm:ms-auto" />
      </FilterRow>
      <FilterSummary active={active} onClear={reset} count={rows.length} noun="menu" />
      <DataTable
        rows={rows}
        columns={columns}
        empty={<EmptyState icon={ForkKnife} text="No menus match." action={<Button onClick={reset}>Clear filters</Button>} />}
        mobileCard={(m) => (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-crm-ink">{m.name}</p>
              <p className="text-[12.5px] text-crm-muted">
                {MEAL_LABELS[m.meal]} · {money(m.perHead)}
              </p>
            </div>
            <RowActions>
              <Switch checked={m.active} onChange={(v) => db.menus.update(m.id, { active: v })} label={`${m.name} active`} />
              <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setEditing(m)}>
                <PencilSimple size={16} />
              </Button>
            </RowActions>
          </div>
        )}
      />
      <Modal open={!!editing} onOpenChange={(v) => !v && setEditing(null)} title={editing?.id ? "Edit menu" : "Add menu"} footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" onClick={save}>Save</Button></>}>
        {editing && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" required className="sm:col-span-2">
              <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
            </Field>
            <Field label="Meal" required>
              <Select value={editing.meal ?? ""} onChange={(v) => setEditing({ ...editing, meal: v as Meal })} placeholder="Choose" options={MEALS.map((m) => ({ value: m, label: MEAL_LABELS[m] }))} />
            </Field>
            <Field label="Price per person (৳)" required>
              <Input type="number" min={0} value={editing.perHead ?? ""} onChange={(e) => setEditing({ ...editing, perHead: Number(e.target.value) })} />
            </Field>
            <Field label="Items" hint="One per line" className="sm:col-span-2">
              <Textarea value={(editing.items ?? []).join("\n")} onChange={(e) => setEditing({ ...editing, items: e.target.value.split("\n") })} />
            </Field>
          </div>
        )}
      </Modal>
    </>
  );
}

/* ─── ICCB services ──────────────────────────────────────────────────────── */

function ServicesTab({ editing, setEditing }: { editing: Partial<ServiceItem> | null; setEditing: (v: Partial<ServiceItem> | null) => void }) {
  const services = useServices();
  const bookings = useBookings();
  const confirm = useConfirm();
  const usage = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of bookings) for (const s of b.addOns.services ?? []) m.set(s.serviceId, (m.get(s.serviceId) ?? 0) + 1);
    return m;
  }, [bookings]);
  const { f, set, reset, active } = useFilters({ q: "", category: "", status: "", sort: "category" });
  const rows = useMemo(() => {
    const n = f.q.trim().toLowerCase();
    const list = services.filter((s) => (!f.category || s.category === f.category) && (!f.status || (f.status === "active") === s.active) && (!n || s.name.toLowerCase().includes(n)));
    return [...list].sort((a, b) => (f.sort === "price-desc" ? b.rate - a.rate : f.sort === "used" ? (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0) : f.sort === "name" ? a.name.localeCompare(b.name) : SERVICE_CATEGORIES.indexOf(a.category) - SERVICE_CATEGORIES.indexOf(b.category)));
  }, [services, f, usage]);

  const save = () => {
    if (!editing?.name?.trim() || !editing.category || !editing.unit?.trim()) return toast.error("Please enter a name, category and unit.");
    const data = { name: editing.name.trim(), category: editing.category, unit: editing.unit.trim(), rate: Number(editing.rate) || 0 };
    if (editing.id) db.services.update(editing.id, data);
    else db.services.create({ ...data, active: true, isSample: true });
    toast.success("Service saved");
    setEditing(null);
  };

  const columns: Column<ServiceItem>[] = [
    { key: "name", header: "Service", cell: (s) => <span className={cn("font-medium", s.active ? "text-crm-ink" : "text-crm-muted line-through")}>{s.name}</span> },
    { key: "cat", header: "Category", cell: (s) => s.category },
    { key: "rate", header: "Rate", align: "end", cell: (s) => `${money(s.rate)} / ${s.unit}` },
    { key: "used", header: "Used in", align: "end", cell: (s) => `${usage.get(s.id) ?? 0} booking(s)` },
    { key: "active", header: "Active", cell: (s) => <Switch checked={s.active} onChange={(v) => db.services.update(s.id, { active: v })} label={`${s.name} active`} /> },
    {
      key: "a",
      header: <span className="sr-only">Actions</span>,
      cell: (s) => (
        <RowActions>
          <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setEditing(s)}>
            <PencilSimple size={16} />
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Delete" onClick={async () => (usage.get(s.id) ? toast.error("In use — switch it off instead.") : (await confirm({ title: `Delete ${s.name}?`, confirmLabel: "Delete", danger: true })) && db.services.remove(s.id))}>
            <Trash size={16} />
          </Button>
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <FilterRow>
        <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Service name…" />
        <FilterSelect label="Categories" value={f.category} onChange={(v) => set("category", v)} options={SERVICE_CATEGORIES} />
        <FilterSelect label="Status" all="Active & inactive" value={f.status} onChange={(v) => set("status", v)} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
        <SortSelect value={f.sort} onChange={(v) => set("sort", v)} options={[{ value: "category", label: "By category" }, { value: "name", label: "Name A–Z" }, { value: "price-desc", label: "Highest rate" }, { value: "used", label: "Most used" }]} className="sm:ms-auto" />
      </FilterRow>
      <FilterSummary active={active} onClear={reset} count={rows.length} noun="service" />
      <DataTable
        rows={rows}
        columns={columns}
        empty={<EmptyState icon={Wrench} text="No services match." action={<Button onClick={reset}>Clear filters</Button>} />}
        mobileCard={(s) => (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-crm-ink">{s.name}</p>
              <p className="text-[12.5px] text-crm-muted">
                {s.category} · {money(s.rate)} / {s.unit}
              </p>
            </div>
            <RowActions>
              <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setEditing(s)}>
                <PencilSimple size={16} />
              </Button>
            </RowActions>
          </div>
        )}
      />
      <Modal open={!!editing} onOpenChange={(v) => !v && setEditing(null)} title={editing?.id ? "Edit service" : "Add service"} footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" onClick={save}>Save</Button></>}>
        {editing && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" required className="sm:col-span-2">
              <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
            </Field>
            <Field label="Category" required>
              <Select value={editing.category ?? ""} onChange={(v) => setEditing({ ...editing, category: v as ServiceCategory })} placeholder="Choose" options={SERVICE_CATEGORIES.map((c) => ({ value: c, label: c }))} />
            </Field>
            <Field label="Unit" required hint="day, hour, event, sq ft…">
              <Input value={editing.unit ?? ""} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} />
            </Field>
            <Field label="Rate (৳)">
              <Input type="number" min={0} value={editing.rate ?? ""} onChange={(e) => setEditing({ ...editing, rate: Number(e.target.value) })} />
            </Field>
          </div>
        )}
      </Modal>
    </>
  );
}

/* ─── Security money & weekends ──────────────────────────────────────────── */

function SecurityTab() {
  const settings = useSettingsValue();
  const set = useSettings((s) => s.set);
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card>
        <CardTitle title="Security money by event type" />
        <p className="-mt-2 px-5 pb-3 text-[12.5px] text-crm-muted">Refundable after the event, minus damages.</p>
        <ul className="divide-y divide-crm-line border-t border-crm-line">
          {EVENT_TYPES.map((t) => (
            <li key={t} className="flex items-center justify-between gap-3 px-5 py-2.5">
              <span className="text-[14px] text-crm-ink">{t}</span>
              <MoneyCell value={settings.securityByType[t as EventType] ?? 0} label={`${t} security`} onSave={(v) => set({ securityByType: { ...settings.securityByType, [t]: v } })} />
            </li>
          ))}
        </ul>
      </Card>
      <div className="space-y-5">
        <Card>
          <CardTitle title="Weekend days" />
          <p className="-mt-2 px-5 pb-3 text-[12.5px] text-crm-muted">Weekend hall rates apply on these days.</p>
          <div className="flex flex-wrap gap-2 px-5 pb-5">
            {DAYS.map((d, i) => {
              const on = settings.weekendDays.includes(i);
              return (
                <button key={d} type="button" aria-pressed={on} onClick={() => set({ weekendDays: on ? settings.weekendDays.filter((x) => x !== i) : [...settings.weekendDays, i].sort() })} className={cn("h-9 rounded-full border px-4 text-[13px] font-medium transition-colors", on ? "border-crm-brand bg-crm-tint text-crm-brand-text" : "border-crm-line text-crm-ink-2 hover:bg-crm-surface-2")}>
                  {d}
                </button>
              );
            })}
          </div>
        </Card>
        <Card>
          <CardTitle title="Refund period" />
          <div className="flex items-center justify-between gap-3 px-5 pb-5">
            <span className="text-[14px] text-crm-ink">Refund security money within</span>
            <MoneyCell value={settings.refundDays} label="Refund days" suffix="days" onSave={(v) => set({ refundDays: v })} />
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─── Special prices ─────────────────────────────────────────────────────── */

function SpecialsTab({ adding, setAdding }: { adding: boolean; setAdding: (v: boolean) => void }) {
  const specials = useSpecials();
  const today = todayYmd();
  const [kind, setKind] = useState("");
  const [time, setTime] = useState("");
  const [form, setForm] = useState({ from: today, to: today, percent: -10, label: "Promotion" });
  const rows = specials
    .filter((s) => (!kind || (kind === "up" ? s.percent > 0 : s.percent < 0)) && (!time || (time === "active" ? s.to >= today : s.to < today)))
    .sort((a, b) => a.from.localeCompare(b.from));
  return (
    <>
      <FilterRow>
        <FilterSelect label="Type" all="Increases & discounts" value={kind} onChange={setKind} options={[{ value: "up", label: "Price increases" }, { value: "down", label: "Discounts" }]} />
        <FilterSelect label="Period" all="Any period" value={time} onChange={setTime} options={[{ value: "active", label: "Current & upcoming" }, { value: "past", label: "Past" }]} />
      </FilterRow>
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={Plus} text="No special prices. Apply one from Demand & Pricing or add it here." action={<Button onClick={() => setAdding(true)}>Add special price</Button>} />
        ) : (
          <ul className="divide-y divide-crm-line">
            {rows.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <span>
                  <span className="block text-[14px] text-crm-ink">
                    {fmtDate(s.from, "d MMM")} – {fmtDate(s.to, "d MMM yyyy")}
                  </span>
                  <span className="block text-[12.5px] text-crm-muted">
                    {s.label}
                    {s.to < today ? " · ended" : ""}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[12.5px] font-medium tabular", s.percent > 0 ? "bg-crm-booked-bg text-crm-brand-text" : "bg-crm-success-bg text-crm-success")}>
                    {s.percent > 0 ? "+" : ""}
                    {s.percent}%
                  </span>
                  <Button size="icon-sm" variant="ghost" aria-label="Remove special price" onClick={() => db.specials.remove(s.id)}>
                    <X size={16} />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Modal
        open={adding}
        onOpenChange={setAdding}
        size="sm"
        title="Add special price"
        description="Adjusts hall rent for every booking in the range."
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!form.from || !form.to || form.to < form.from || !form.percent) return toast.error("Please check the dates and percentage.");
                applySpecialPrice(form.from, form.to, form.percent, form.label.trim() || "Special price");
                toast.success("Special price added");
                setAdding(false);
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="From">
            <Input type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
          </Field>
          <Field label="To">
            <Input type="date" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
          </Field>
          <Field label="Change %" hint="−10 = 10% off, 10 = 10% up">
            <Input type="number" value={form.percent} onChange={(e) => setForm({ ...form, percent: Number(e.target.value) })} />
          </Field>
          <Field label="Label">
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </Field>
        </div>
      </Modal>
    </>
  );
}

export function PricingPage() {
  const [tab, setTab] = useState<Tab>("addons");
  const [menu, setMenu] = useState<Partial<MenuPackage> | null>(null);
  const [service, setService] = useState<Partial<ServiceItem> | null>(null);
  const [special, setSpecial] = useState(false);
  const action =
    tab === "menus" ? (
      <Button variant="primary" icon={Plus} onClick={() => setMenu({ items: [] })}>
        Add menu
      </Button>
    ) : tab === "services" ? (
      <Button variant="primary" icon={Plus} onClick={() => setService({})}>
        Add service
      </Button>
    ) : tab === "specials" ? (
      <Button variant="primary" icon={Plus} onClick={() => setSpecial(true)}>
        Add special price
      </Button>
    ) : undefined;
  return (
    <>
      <PageHeader title="Pricing" description="Add-on prices, menus, services, security money and special prices. All values are samples — edit freely." action={action} />
      <Tabs
        id="pricing"
        value={tab}
        onChange={setTab}
        className="mb-6"
        tabs={[
          { value: "addons", label: "Add-ons & food" },
          { value: "menus", label: "Menu packages" },
          { value: "services", label: "ICCB services" },
          { value: "security", label: "Security & weekends" },
          { value: "specials", label: "Special prices" },
        ]}
      />
      {tab === "addons" && <AddOnsTab />}
      {tab === "menus" && <MenusTab editing={menu} setEditing={setMenu} />}
      {tab === "services" && <ServicesTab editing={service} setEditing={setService} />}
      {tab === "security" && <SecurityTab />}
      {tab === "specials" && <SpecialsTab adding={special} setAdding={setSpecial} />}
    </>
  );
}
