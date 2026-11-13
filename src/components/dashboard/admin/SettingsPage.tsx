"use client";
import { useMemo, useRef, useState } from "react";
import { ArrowCounterClockwise, Bell, Buildings, CalendarBlank, Database, DownloadSimple, Gear, Hash, ListMagnifyingGlass, Plus, Trash, UploadSimple, Warning } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { AuditEntry, Settings } from "@/types/crm";
import { ROLE_LABELS } from "@/types/crm";
import { DB_NAMES, downloadFile, exportAll, importAll, previewNumber, repo, resetAll, toCsv, type DbName, type NumberKind } from "@/lib/crm/db";
import { fmtDate, fmtDateTime, taka } from "@/lib/crm/format";
import { useAudit, useCrmUpdate, useSettings, useUsers } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { Item, Stagger } from "../ui/motion";
import { Badge, Button, Card, CardHeader, Field, Input, NumberInput, PageHeader, Segmented, Select, Skeleton, Switch } from "../ui/core";
import { DataTable, type Column } from "../ui/data-table";
import { Drawer, useConfirm } from "../ui/overlay";
import { Tabs } from "../ui/tabs";

const NUMBER_LABELS: Record<NumberKind, string> = { booking: "Booking Form No", client: "Client ID", mr: "Money Receipt", invoice: "Invoice", estimate: "Estimate", refund: "Refund note", doc: "Other documents" };

function useSettingsForm(s: Settings | undefined) {
  const update = useCrmUpdate<Settings>("settings", "Settings saved");
  const save = (patch: Partial<Settings>) => s && update.mutate({ id: s.id, patch });
  return { save, pending: update.isPending };
}

function GeneralTab({ s }: { s: Settings }) {
  const { save, pending } = useSettingsForm(s);
  const [v, setV] = useState(s);
  const set = <K extends keyof Settings>(k: K, val: Settings[K]) => setV((x) => ({ ...x, [k]: val }));
  const [holiday, setHoliday] = useState({ date: "", name: "" });
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader icon={Buildings} title="Organization" description="Shown on documents and emails." />
        <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
          <Field label="Name" className="sm:col-span-2"><Input value={v.orgName} onChange={(e) => set("orgName", e.target.value)} /></Field>
          <Field label="Address" className="sm:col-span-2"><Input value={v.orgAddress} onChange={(e) => set("orgAddress", e.target.value)} /></Field>
          <Field label="Phone"><Input value={v.orgPhone} onChange={(e) => set("orgPhone", e.target.value)} /></Field>
          <Field label="Email"><Input value={v.orgEmail} onChange={(e) => set("orgEmail", e.target.value)} /></Field>
        </div>
      </Card>
      <Card>
        <CardHeader icon={Gear} title="Business rules" />
        <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Full payment due (days before event)" hint="ICCB documents mention both 15 and 7 days.">
            <Segmented value={String(v.balanceDueDays) as "15" | "7"} onChange={(x) => set("balanceDueDays", Number(x))} options={[{ value: "15", label: "15 days" }, { value: "7", label: "7 days" }]} />
          </Field>
          <Field label="Advance to confirm"><NumberInput value={v.advancePct} onChange={(n) => set("advancePct", n)} suffix="% of rent" /></Field>
          <Field label="Discount needs approval above" hint={taka(v.discountApprovalThreshold)}><NumberInput value={v.discountApprovalThreshold} onChange={(n) => set("discountApprovalThreshold", n)} money /></Field>
          <Field label="Reserve / hold time"><NumberInput value={v.holdHours} onChange={(n) => set("holdHours", n)} suffix="hours" /></Field>
          <Field label="First response target"><NumberInput value={v.firstResponseTargetHours} onChange={(n) => set("firstResponseTargetHours", n)} suffix="hours" /></Field>
          <Field label="Hot lead score ≥"><NumberInput value={v.hotLeadScore} onChange={(n) => set("hotLeadScore", n)} /></Field>
          <Field label="Money digit grouping">
            <Segmented value={v.digitGrouping} onChange={(x) => set("digitGrouping", x)} options={[{ value: "intl", label: "1,258,215" }, { value: "bd", label: "12,58,215" }]} />
          </Field>
        </div>
      </Card>
      <Card>
        <CardHeader icon={Bell} title="Notification rules" />
        <div className="flex flex-wrap gap-6 px-5 pb-5">
          <Switch checked={v.notifyHotLead} onChange={(b) => set("notifyHotLead", b)} label="Hot lead alerts" />
          <Switch checked={v.notifyOverdue} onChange={(b) => set("notifyOverdue", b)} label="Overdue task & document alerts" />
        </div>
      </Card>
      <Card>
        <CardHeader icon={CalendarBlank} title="Holidays" description="Skipped when counting working days (e.g. the 15-working-day refund rule). Fri & Sat are weekly holidays." />
        <div className="px-5 pb-5">
          <ul className="mb-3 divide-y divide-crm-line rounded-xl border border-crm-line">
            {v.holidays.map((h) => (
              <li key={h.date + h.name} className="flex items-center justify-between px-3 py-2 text-[13px]">
                <span>
                  <span className="font-medium text-crm-ink">{h.name}</span> <span className="text-crm-muted">· {fmtDate(h.date, "EEE, dd MMM yyyy")}</span>
                </span>
                <Button size="icon-sm" variant="ghost" onClick={() => set("holidays", v.holidays.filter((x) => x !== h))} aria-label="Remove holiday">
                  <Trash size={14} />
                </Button>
              </li>
            ))}
            {!v.holidays.length && <li className="px-3 py-3 text-[13px] text-crm-muted">No holidays.</li>}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Input type="date" value={holiday.date} onChange={(e) => setHoliday((h) => ({ ...h, date: e.target.value }))} className="w-[160px]" />
            <Input value={holiday.name} onChange={(e) => setHoliday((h) => ({ ...h, name: e.target.value }))} placeholder="Holiday name" className="w-56" />
            <Button icon={Plus} disabled={!holiday.date || !holiday.name.trim()} onClick={() => { set("holidays", [...v.holidays, { date: holiday.date, name: holiday.name.trim() }].sort((a, b) => a.date.localeCompare(b.date))); setHoliday({ date: "", name: "" }); }}>
              Add
            </Button>
          </div>
        </div>
      </Card>
      <div className="sticky bottom-4 flex justify-end">
        <Button variant="primary" size="lg" loading={pending} onClick={() => save(v)} className="shadow-[var(--crm-shadow-lg)]">
          Save settings
        </Button>
      </div>
    </div>
  );
}

function NumbersTab({ s }: { s: Settings }) {
  const { save, pending } = useSettingsForm(s);
  const [fmts, setFmts] = useState(s.numberFormats);
  const [regStart, setRegStart] = useState(s.programRegStart);
  return (
    <Card>
      <CardHeader icon={Hash} title="Number formats" description="Auto-generated and unique. Sequences reset monthly when the format includes YYYYMM." />
      <div className="overflow-x-auto px-5 pb-5">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead>
            <tr className="border-b border-crm-line text-[12px] text-crm-muted">
              <th className="py-2 text-start font-medium">Record</th>
              <th className="py-2 text-start font-medium">Prefix</th>
              <th className="py-2 text-start font-medium">Digits</th>
              <th className="py-2 text-start font-medium">YYYYMM</th>
              <th className="py-2 text-start font-medium">Preview</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(fmts) as NumberKind[]).map((k) => (
              <tr key={k} className="border-b border-crm-line last:border-0">
                <td className="py-2 font-medium text-crm-ink">{NUMBER_LABELS[k]}</td>
                <td className="py-2 pe-2"><Input value={fmts[k].prefix} onChange={(e) => setFmts((f) => ({ ...f, [k]: { ...f[k], prefix: e.target.value.toUpperCase() } }))} className="w-28" /></td>
                <td className="py-2 pe-2"><NumberInput value={fmts[k].digits} onChange={(n) => setFmts((f) => ({ ...f, [k]: { ...f[k], digits: Math.max(1, Math.min(10, n)) } }))} className="w-20" /></td>
                <td className="py-2"><Switch checked={fmts[k].monthly} onChange={(b) => setFmts((f) => ({ ...f, [k]: { ...f[k], monthly: b } }))} /></td>
                <td className="py-2 font-mono text-[12.5px] text-crm-brand">{previewNumber(k, fmts[k], 12)}</td>
              </tr>
            ))}
            <tr>
              <td className="py-2 font-medium text-crm-ink">Program Reg. No</td>
              <td colSpan={3} className="py-2"><NumberInput value={regStart} onChange={setRegStart} className="w-40" /></td>
              <td className="py-2 font-mono text-[12.5px] text-crm-brand">{Math.max(s.counters.programReg ?? 0, regStart) + 1}</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" loading={pending} onClick={() => save({ numberFormats: fmts, programRegStart: regStart })}>
            Save formats
          </Button>
        </div>
      </div>
    </Card>
  );
}

function DataTab() {
  const confirm = useConfirm();
  const file = useRef<HTMLInputElement>(null);
  const [table, setTable] = useState<DbName>("bookings");
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader icon={DownloadSimple} title="Export" description="Download everything as JSON, or one table as CSV." />
        <div className="space-y-4 px-5 pb-5">
          <Button icon={DownloadSimple} onClick={() => { downloadFile(`iccb-crm-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(exportAll(), null, 2), "application/json"); toast.success("Export downloaded"); }}>
            Export all data (JSON)
          </Button>
          <div className="flex flex-wrap gap-2">
            <Select value={table} onChange={(v) => setTable(v as DbName)} options={DB_NAMES.map((n) => ({ value: n, label: n }))} className="w-48" />
            <Button
              onClick={() => {
                const rows = repo(table).all().map((r) => r as unknown as Record<string, unknown>);
                downloadFile(`iccb-${table}.csv`, toCsv(rows), "text/csv");
                toast.success(`${rows.length} rows exported`);
              }}
            >
              Export table (CSV)
            </Button>
          </div>
        </div>
      </Card>
      <Card>
        <CardHeader icon={UploadSimple} title="Import" description="Replace data from a previous JSON export." />
        <div className="px-5 pb-5">
          <input
            ref={file}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              const r = await confirm({ title: "Import this file?", description: "Tables in the file replace the current data in this browser.", tone: "danger", confirmLabel: "Import" });
              if (!r.ok) return;
              try {
                const res = importAll(JSON.parse(await f.text()));
                toast.success(`Imported ${res.rows} rows into ${res.tables} tables`);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Import failed");
              }
            }}
          />
          <Button icon={UploadSimple} onClick={() => file.current?.click()}>
            Import JSON
          </Button>
        </div>
      </Card>
      <Card className="border-[#FECDCA] lg:col-span-2">
        <CardHeader icon={Warning} title="Reset demo data" description="Restores every table to the original sample data. Your changes in this browser are lost." />
        <div className="px-5 pb-5">
          <Button
            variant="danger"
            icon={ArrowCounterClockwise}
            onClick={async () => {
              const r = await confirm({ title: "Reset all demo data?", description: "This cannot be undone (export first if you want a backup).", tone: "danger", confirmLabel: "Reset everything" });
              if (r.ok) {
                resetAll();
                toast.success("Demo data reset");
              }
            }}
          >
            Reset demo data
          </Button>
        </div>
      </Card>
    </div>
  );
}

function AuditTab() {
  const audit = useAudit();
  const users = useUsers();
  const [user, setUser] = useState("");
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [open, setOpen] = useState<AuditEntry | null>(null);
  const rows = useMemo(() => (audit.data ?? []).filter((a) => (!user || a.actorId === user) && (!entity || a.entity === entity) && (!action || a.action === action)), [audit.data, user, entity, action]);
  const entities = [...new Set((audit.data ?? []).map((a) => a.entity))].sort();
  const tone = { create: "green", update: "blue", delete: "red", restore: "amber", status: "brand", override: "red", approve: "green", reject: "red", reset: "red", import: "purple" } as const;
  const columns: Column<AuditEntry>[] = [
    { id: "at", header: "When", value: (a) => a.at, cell: (a) => <span className="whitespace-nowrap tabular">{fmtDateTime(a.at)}</span> },
    { id: "who", header: "Who", primary: true, value: (a) => a.actorName, cell: (a) => <span>{a.actorName}<span className="block text-[11.5px] text-crm-muted">{ROLE_LABELS[a.actorRole]}</span></span> },
    { id: "action", header: "Action", value: (a) => a.action, cell: (a) => <Badge tone={tone[a.action]}>{a.action}</Badge> },
    { id: "entity", header: "Entity", value: (a) => a.entity, cell: (a) => <span className="font-mono text-[12px]">{a.entity}</span> },
    { id: "summary", header: "What", value: (a) => a.summary, cell: (a) => <span className="line-clamp-2 max-w-[420px]">{a.summary}</span> },
  ];
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={user} onChange={setUser} placeholder="All users" options={(users.data ?? []).map((u) => ({ value: u.id, label: u.name }))} className="w-auto min-w-[150px]" />
        <Select value={entity} onChange={setEntity} placeholder="All entities" options={entities.map((e) => ({ value: e, label: e }))} className="w-auto min-w-[140px]" />
        <Select value={action} onChange={setAction} placeholder="All actions" options={Object.keys(tone).map((a) => ({ value: a, label: a }))} className="w-auto min-w-[130px]" />
      </div>
      <DataTable rows={rows} loading={audit.isLoading} columns={columns} initialSort={{ id: "at", dir: "desc" }} exportName="iccb-audit-log" onRowClick={setOpen} pageSize={25} dense empty={{ icon: ListMagnifyingGlass, title: "No audit entries" }} />
      {open && (
        <Drawer open onOpenChange={(v) => !v && setOpen(null)} title={open.summary} description={`${open.actorName} · ${fmtDateTime(open.at)}`} width={620}>
          <div className="grid gap-4 md:grid-cols-2">
            {(["before", "after"] as const).map((k) => (
              <div key={k}>
                <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-crm-muted">{k}</p>
                <pre className={cn("crm-scroll max-h-[60vh] overflow-auto rounded-lg border border-crm-line p-3 text-[11.5px]", k === "before" ? "bg-[#FEF3F2]/50 dark:bg-[#2D1414]/40" : "bg-[#ECFDF3]/50 dark:bg-[#0E2A1C]/40")}>{open[k] === undefined ? "—" : JSON.stringify(open[k], (key, val) => (typeof val === "string" && val.startsWith("data:") ? "[file]" : val), 2)}</pre>
              </div>
            ))}
          </div>
        </Drawer>
      )}
    </>
  );
}

export function SettingsPage() {
  const settings = useSettings();
  const [tab, setTab] = useState<"general" | "numbers" | "data" | "audit">("general");
  const s = settings.data;
  return (
    <Stagger>
      <Item>
        <PageHeader eyebrow="Admin" title="Settings" description="Organization, number formats, business rules, holidays, notifications, data tools and the audit log." />
      </Item>
      <Item>
        <Tabs value={tab} onChange={setTab} className="mb-5" tabs={[{ value: "general", label: "General", icon: Gear }, { value: "numbers", label: "Number formats", icon: Hash }, { value: "data", label: "Data", icon: Database }, { value: "audit", label: "Audit log", icon: ListMagnifyingGlass }]} />
      </Item>
      <Item>
        {!s ? (
          <Skeleton className="h-96 rounded-xl" />
        ) : tab === "general" ? (
          <GeneralTab key={s.updatedAt} s={s} />
        ) : tab === "numbers" ? (
          <NumbersTab key={s.updatedAt} s={s} />
        ) : tab === "data" ? (
          <DataTab />
        ) : (
          <AuditTab />
        )}
      </Item>
    </Stagger>
  );
}
