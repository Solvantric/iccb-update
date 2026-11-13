"use client";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ClockCounterClockwise, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { BaseRecord } from "@/types/crm";
import { repo, type DbName } from "@/lib/crm/db";
import { resolveVersions } from "@/lib/crm/pricing";
import { fmtDate, taka } from "@/lib/crm/format";
import { useCrmAll, useCrmRemove } from "@/services/crm/hooks";
import { withLatency } from "@/services/crm/base";
import { useCrmAction } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { Badge, Button, Card, Checkbox, Field, Input, NumberInput, Select, Skeleton, Switch, Textarea } from "../ui/core";
import { Modal, useConfirm } from "../ui/overlay";

export interface RateField<T> {
  key: keyof T & string;
  label: string;
  type: "money" | "number" | "pct" | "text" | "textarea" | "select" | "list" | "bool";
  options?: { value: string; label: string }[];
  /** Show in the table (default true). */
  column?: boolean;
  /** Can't be edited after creation (e.g. key). */
  fixed?: boolean;
  width?: string;
}

type Row = BaseRecord & Record<string, unknown> & { key?: string; effectiveFrom?: string };

const show = (v: unknown, type: RateField<Row>["type"]) => {
  if (v === undefined || v === null || v === "") return "—";
  if (type === "money") return taka(Number(v));
  if (type === "pct") return `${v}%`;
  if (type === "list") return (v as string[]).join(", ");
  if (type === "bool") return v ? "Yes" : "No";
  return String(v);
};

export function RateTable<T extends Row>({ name, title, description, fields, versioned = true, defaults, canEdit, sortBy }: { name: DbName; title: string; description?: string; fields: RateField<T>[]; versioned?: boolean; defaults: Partial<T>; canEdit: boolean; sortBy?: (a: T, b: T) => number }) {
  const all = useCrmAll<T>(name);
  const remove = useCrmRemove(name, "Rate");
  const confirm = useConfirm();
  const [history, setHistory] = useState(false);
  const [edit, setEdit] = useState<{ row?: T; key: number } | null>(null);

  const rows = useMemo(() => {
    const data = all.data ?? [];
    const list = versioned && !history ? (resolveVersions(data as never) as unknown as T[]) : data;
    return [...list].sort(sortBy ?? ((a, b) => String(a.key ?? a.id).localeCompare(String(b.key ?? b.id)) || String(b.effectiveFrom ?? "").localeCompare(String(a.effectiveFrom ?? ""))));
  }, [all.data, versioned, history, sortBy]);

  const cols = fields.filter((f) => f.column !== false);
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div>
          <h3 className="text-[14.5px] font-semibold text-crm-ink">{title}</h3>
          {description && <p className="mt-0.5 text-[12.5px] text-crm-muted">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {versioned && <Switch checked={history} onChange={setHistory} label={<span className="inline-flex items-center gap-1"><ClockCounterClockwise size={14} /> History</span>} />}
          {canEdit && (
            <Button size="sm" variant="primary" icon={Plus} onClick={() => setEdit({ key: Date.now() })}>
              Add
            </Button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        {all.isLoading ? (
          <div className="space-y-2 px-5 pb-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <table className="w-full min-w-[640px] text-[13px]">
            <thead className="bg-crm-surface-2">
              <tr className="border-y border-crm-line text-[12px] text-crm-muted">
                {cols.map((f) => (
                  <th key={f.key} className={cn("px-4 py-2 font-medium", ["money", "number", "pct"].includes(f.type) ? "text-end" : "text-start")} style={{ width: f.width }}>
                    {f.label}
                  </th>
                ))}
                {versioned && <th className="px-4 py-2 text-start font-medium">Effective from</th>}
                {canEdit && <th className="w-20" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const future = versioned && r.effectiveFrom && r.effectiveFrom > today;
                return (
                  <tr key={r.id} className={cn("border-b border-crm-line last:border-0 hover:bg-crm-surface-2", history && rows.some((x) => x.key === r.key && x !== r && (x.effectiveFrom ?? "") > (r.effectiveFrom ?? "")) && "opacity-55")}>
                    {cols.map((f) => (
                      <td key={f.key} className={cn("px-4 py-2.5", ["money", "number", "pct"].includes(f.type) ? "text-end tabular text-crm-ink" : "text-crm-ink-2")}>
                        {show(r[f.key], f.type)}
                        {f.key === cols[0].key && r.isSample ? <Badge tone="grey" className="ms-2">sample</Badge> : null}
                      </td>
                    ))}
                    {versioned && (
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {fmtDate(r.effectiveFrom)} {future && <Badge tone="amber">scheduled</Badge>}
                      </td>
                    )}
                    {canEdit && (
                      <td className="px-2 py-2 text-end">
                        <div className="flex justify-end gap-1">
                          <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setEdit({ row: r, key: Date.now() })}>
                            <PencilSimple size={15} />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Delete"
                            onClick={async () => {
                              const ok = await confirm({ title: "Delete this rate?", description: versioned ? "Only this version is removed; older versions stay." : undefined, tone: "danger", confirmLabel: "Delete" });
                              if (ok.ok) remove.mutate(r.id);
                            }}
                          >
                            <Trash size={15} />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {edit && <RateEditor key={edit.key} name={name} row={edit.row} fields={fields} versioned={versioned} defaults={defaults} onClose={() => setEdit(null)} />}
    </Card>
  );
}

function RateEditor<T extends Row>({ name, row, fields, versioned, defaults, onClose }: { name: DbName; row?: T; fields: RateField<T>[]; versioned: boolean; defaults: Partial<T>; onClose: () => void }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [v, setV] = useState<Record<string, unknown>>(() => ({ ...defaults, ...(row ?? {}), ...(versioned ? { effectiveFrom: today } : {}) }));
  const [asNewVersion, setAsNewVersion] = useState(versioned && !!row);
  const save = useCrmAction(
    () =>
      withLatency(() => {
        const r = repo(name);
        const { id: _id, createdAt: _c, updatedAt: _u, deletedAt: _d, ...data } = v as Row;
        void _id; void _c; void _u; void _d;
        if (row && !(versioned && asNewVersion && data.effectiveFrom !== row.effectiveFrom)) return r.update(row.id, { ...data, ...(versioned ? { effectiveFrom: asNewVersion ? data.effectiveFrom : row.effectiveFrom } : {}) });
        if (versioned && !data.key) data.key = `custom-${Date.now().toString(36)}`;
        return r.create({ ...data, isSample: false });
      }),
    { success: row && asNewVersion ? "New version saved — applies to new estimates" : "Saved", onSuccess: onClose }
  );
  const set = (k: string, val: unknown) => setV((s) => ({ ...s, [k]: val }));
  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={row ? "Edit rate" : "Add rate"}
      description={versioned ? "Rates are versioned. Bookings keep the rates effective on their price date." : undefined}
      size="lg"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            loading={save.isPending}
            onClick={() => {
              const missing = fields.find((f) => (f.type === "text" && !f.fixed && f.key !== "note" && f.key !== "description" && !String(v[f.key] ?? "").trim() && f.column !== false));
              if (missing && ["name", "label", "description", "layout"].includes(missing.key)) return toast.error(`${missing.label} is required`);
              save.mutate(undefined);
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const val = v[f.key];
          const disabled = !!row && f.fixed;
          return (
            <Field key={f.key} label={f.label} className={f.type === "textarea" || f.type === "list" ? "sm:col-span-2" : undefined}>
              {f.type === "money" || f.type === "number" || f.type === "pct" ? (
                <NumberInput value={Number(val ?? 0)} onChange={(n) => set(f.key, n)} money={f.type === "money"} suffix={f.type === "pct" ? "%" : undefined} />
              ) : f.type === "select" ? (
                <Select value={String(val ?? "")} onChange={(x) => set(f.key, x)} options={f.options ?? []} disabled={disabled} />
              ) : f.type === "textarea" ? (
                <Textarea value={String(val ?? "")} onChange={(e) => set(f.key, e.target.value)} />
              ) : f.type === "list" ? (
                <Input value={((val as string[]) ?? []).join(", ")} onChange={(e) => set(f.key, e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} />
              ) : f.type === "bool" ? (
                <Switch checked={!!val} onChange={(b) => set(f.key, b)} />
              ) : (
                <Input value={String(val ?? "")} onChange={(e) => set(f.key, e.target.value)} disabled={disabled} />
              )}
            </Field>
          );
        })}
        {versioned && (
          <>
            <Field label="Effective from" hint={row && !asNewVersion ? `Editing in place keeps ${fmtDate(row.effectiveFrom)}` : undefined}>
              <Input type="date" value={String(v.effectiveFrom ?? today)} onChange={(e) => set("effectiveFrom", e.target.value)} />
            </Field>
            {row && (
              <div className="flex items-end pb-2">
                <Checkbox checked={asNewVersion} onChange={setAsNewVersion} label="Save as a new version" description="Keeps the old rate for existing bookings" />
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
