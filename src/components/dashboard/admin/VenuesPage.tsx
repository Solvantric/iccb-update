"use client";
import { useState } from "react";
import { Buildings, Lightning, PencilSimple, Plus, Ruler, Trash, Users } from "@phosphor-icons/react";
import type { CapacityHall, CapacityRow, Hall } from "@/types/crm";
import { useRole } from "@/lib/crm/db";
import { can } from "@/lib/crm/permissions";
import { useCapacities, useCrmCreate, useCrmRemove, useCrmUpdate, useHalls } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { Item, Stagger } from "../ui/motion";
import { Badge, Button, Card, CardHeader, Field, Input, NumberInput, PageHeader, Select, Skeleton, Switch, Textarea } from "../ui/core";
import { Drawer, useConfirm } from "../ui/overlay";
import { Tabs } from "../ui/tabs";
import { RateTable } from "./RateTable";

const KIND_LABEL = { hall: "Convention hall", expo: "Expo zone", seminar: "Seminar hall" } as const;
const CAP_HALLS: CapacityHall[] = ["hall-1", "hall-2", "hall-3", "hall-4"];

function HallDrawer({ hall, onClose }: { hall?: Hall; onClose: () => void }) {
  const [v, setV] = useState<Partial<Hall>>(() => hall ?? { code: "", name: "", number: "", kind: "hall", tariffGroup: "h123", facilities: [], active: true, order: 99 });
  const create = useCrmCreate<Hall>("halls", "Venue added");
  const update = useCrmUpdate<Hall>("halls", "Venue saved");
  const set = <K extends keyof Hall>(k: K, val: Hall[K]) => setV((s) => ({ ...s, [k]: val }));
  const save = () => {
    if (!v.name?.trim()) return;
    if (hall) update.mutate({ id: hall.id, patch: v }, { onSuccess: onClose });
    else create.mutate({ ...(v as Hall), code: v.code || v.name!.toLowerCase().replace(/\s+/g, "-") }, { onSuccess: onClose });
  };
  return (
    <Drawer open onOpenChange={(o) => !o && onClose()} title={hall ? hall.name : "New venue"} description={hall?.number} width={620} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!v.name?.trim()} loading={create.isPending || update.isPending} onClick={save}>Save venue</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required><Input value={v.name ?? ""} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Number"><Input value={v.number ?? ""} onChange={(e) => set("number", e.target.value)} placeholder="Hall-6" /></Field>
        <Field label="Kind"><Select value={v.kind} onChange={(x) => set("kind", x as Hall["kind"])} options={Object.entries(KIND_LABEL).map(([value, label]) => ({ value, label }))} /></Field>
        <Field label="Tariff group"><Select value={v.tariffGroup} onChange={(x) => set("tariffGroup", x as Hall["tariffGroup"])} options={[{ value: "h123", label: "Hall 1/2/3" }, { value: "h4", label: "Hall 4" }, { value: "h5", label: "Hall 5" }, { value: "expoA", label: "Expo Zone A" }, { value: "expoB", label: "Expo Zone B" }, { value: "seminar", label: "Seminar" }]} /></Field>
        <Field label="Generator capacity (KVA)"><NumberInput value={v.generatorKva} onChange={(n) => set("generatorKva", n || undefined)} suffix="KVA" /></Field>
        <Field label="Area"><Input value={v.areaSqft ?? ""} onChange={(e) => set("areaSqft", e.target.value)} placeholder="e.g. 45,000 sq ft" /></Field>
        <Field label="Facilities" hint="Comma separated" className="sm:col-span-2"><Input value={(v.facilities ?? []).join(", ")} onChange={(e) => set("facilities", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} /></Field>
        <Field label="Adjacent areas" className="sm:col-span-2"><Input value={v.adjacentAreas ?? ""} onChange={(e) => set("adjacentAreas", e.target.value)} placeholder="Foyer, prayer room, parking block B…" /></Field>
        <Field label="Photo URL" className="sm:col-span-2"><Input value={v.photo ?? ""} onChange={(e) => set("photo", e.target.value)} /></Field>
        <Field label="Notes" className="sm:col-span-2"><Textarea value={v.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></Field>
        <Field label="Display order"><NumberInput value={v.order} onChange={(n) => set("order", n)} /></Field>
        <div className="flex items-end pb-2"><Switch checked={!!v.active} onChange={(b) => set("active", b)} label={v.active ? "Active (bookable)" : "Inactive"} /></div>
        {v.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.photo} alt={v.name ?? ""} className="sm:col-span-2 aspect-[16/7] w-full rounded-xl object-cover" />
        )}
      </div>
    </Drawer>
  );
}

function CapacityEditor({ canEdit }: { canEdit: boolean }) {
  const caps = useCapacities();
  const update = useCrmUpdate<CapacityRow>("capacities", "Capacity saved");
  const [draft, setDraft] = useState<Record<string, CapacityRow>>({});
  const rows = caps.data ?? [];
  const get = (r: CapacityRow) => draft[r.id] ?? r;
  const setCell = (r: CapacityRow, h: CapacityHall, k: "main" | "extra" | "waiting", n: number) => {
    const cur = get(r);
    setDraft((d) => ({ ...d, [r.id]: { ...cur, byHall: { ...cur.byHall, [h]: { ...cur.byHall[h], [k]: n } } } }));
  };
  return (
    <Card>
      <CardHeader icon={Users} title="Capacity by layout" description="Stage 29' × 19'. main + mezzanine/gallery (+ waiting). Used to warn when guests exceed capacity." />
      <div className="overflow-x-auto px-5 pb-5">
        {caps.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <table className="w-full min-w-[820px] text-[13px]">
            <thead>
              <tr className="border-b border-crm-line text-[12px] text-crm-muted">
                <th className="py-2 text-start font-medium">Layout</th>
                {CAP_HALLS.map((h) => (
                  <th key={h} className="py-2 text-center font-medium">{h.replace("hall-", "Hall-")}</th>
                ))}
                {canEdit && <th className="w-20" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const cur = get(r);
                const dirty = !!draft[r.id];
                return (
                  <tr key={r.id} className={cn("border-b border-crm-line last:border-0", dirty && "bg-crm-tint/40")}>
                    <td className="py-2 pe-3">
                      <span className="font-medium text-crm-ink">{r.label}</span>
                      {r.isCount && <Badge tone="grey" className="ms-2">count</Badge>}
                    </td>
                    {CAP_HALLS.map((h) => {
                      const c = cur.byHall[h];
                      return (
                        <td key={h} className="px-1 py-1.5">
                          {canEdit ? (
                            <div className="flex items-center gap-1">
                              <NumberInput value={c.main} onChange={(n) => setCell(r, h, "main", n)} className="w-20" />
                              {!r.isCount && (
                                <>
                                  <span className="text-crm-muted">+</span>
                                  <NumberInput value={c.extra} onChange={(n) => setCell(r, h, "extra", n)} className="w-16" />
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="block text-center tabular">
                              {c.main}
                              {c.extra ? ` + ${c.extra}` : ""}
                              {c.waiting ? ` (+${c.waiting} waiting)` : ""}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    {canEdit && (
                      <td className="py-1.5 text-end">
                        {dirty && (
                          <Button size="sm" variant="primary" onClick={() => update.mutate({ id: r.id, patch: { byHall: cur.byHall } }, { onSuccess: () => setDraft((d) => { const n = { ...d }; delete n[r.id]; return n; }) })}>
                            Save
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}

export function VenuesPage() {
  const role = useRole();
  const canEdit = can(role, "update", "venues");
  const halls = useHalls();
  const remove = useCrmRemove("halls", "Venue");
  const confirm = useConfirm();
  const [tab, setTab] = useState<"halls" | "capacity" | "expo">("halls");
  const [edit, setEdit] = useState<{ hall?: Hall; key: number } | null>(null);
  const list = [...(halls.data ?? [])].sort((a, b) => a.order - b.order);
  return (
    <Stagger>
      <Item>
        <PageHeader eyebrow="Admin" title="Venues" description="Halls, expo zones, capacity by layout, facilities and generator capacity." actions={canEdit && <Button variant="primary" icon={Plus} onClick={() => setEdit({ key: Date.now() })}>Add venue</Button>} />
      </Item>
      <Item>
        <Tabs value={tab} onChange={setTab} className="mb-5" tabs={[{ value: "halls", label: "Halls & zones", icon: Buildings, count: list.length }, { value: "capacity", label: "Capacity by layout", icon: Users }, { value: "expo", label: "Expo zone sizes", icon: Ruler }]} />
      </Item>
      <Item>
        {tab === "halls" && (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {halls.isLoading
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
              : list.map((h) => (
                  <Card key={h.id} className={cn("overflow-hidden", !h.active && "opacity-60")}>
                    {h.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.photo} alt={h.name} className="aspect-[16/7] w-full object-cover" />
                    ) : (
                      <div className="grid aspect-[16/7] place-items-center bg-gradient-to-br from-crm-tint to-crm-surface-2 text-crm-brand">
                        <Buildings size={40} weight="duotone" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[15px] font-semibold text-crm-ink">{h.name}</p>
                          <p className="text-[12px] text-crm-muted">
                            {h.number} · {KIND_LABEL[h.kind]}
                          </p>
                        </div>
                        <Badge tone={h.active ? "green" : "grey"}>{h.active ? "Active" : "Inactive"}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {h.generatorKva && (
                          <Badge tone="amber">
                            <Lightning size={11} weight="fill" /> {h.generatorKva} KVA
                          </Badge>
                        )}
                        {h.areaSqft && <Badge tone="neutral">{h.areaSqft}</Badge>}
                        {h.isSample && <Badge tone="grey">sample</Badge>}
                      </div>
                      <p className="mt-3 line-clamp-2 text-[12.5px] text-crm-ink-2">{h.facilities.join(" · ")}</p>
                      {h.notes && <p className="mt-1 text-[12px] text-crm-muted">{h.notes}</p>}
                      {canEdit && (
                        <div className="mt-4 flex gap-2 border-t border-crm-line pt-3">
                          <Button size="sm" icon={PencilSimple} onClick={() => setEdit({ hall: h, key: Date.now() })}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={Trash}
                            onClick={async () => {
                              const r = await confirm({ title: `Delete ${h.name}?`, description: "Existing bookings keep their data. Consider making it inactive instead.", tone: "danger", confirmLabel: "Delete" });
                              if (r.ok) remove.mutate(h.id);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
          </div>
        )}
        {tab === "capacity" && <CapacityEditor canEdit={canEdit} />}
        {tab === "expo" && (
          <RateTable
            name="expo"
            title="Expo zone sizes"
            description="Zone A up to 60,000 sq ft; Zone B 60,001–150,000 sq ft. Rates live in Admin → Pricing."
            canEdit={canEdit}
            defaults={{} as never}
            fields={[
              { key: "label", label: "Zone", type: "text" },
              { key: "minSqft", label: "Min sq ft", type: "number" },
              { key: "maxSqft", label: "Max sq ft", type: "number" },
              { key: "freeParkingPct", label: "Free parking", type: "pct" },
            ]}
          />
        )}
      </Item>
      {edit && <HallDrawer key={edit.key} hall={edit.hall} onClose={() => setEdit(null)} />}
    </Stagger>
  );
}
