"use client";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, CaretDown, ChartPieSlice, Copy, Fire, Flag, Lightning, PencilSimple, Timer, Trash, TrendUp, UserPlus } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Lead, LeadInput, LeadStage, Source } from "@/types/crm";
import { LEAD_STAGES, SOURCE_LABELS, SOURCES, requireNameAndPhone } from "@/types/crm";
import { getSettings, useRole } from "@/lib/crm/db";
import { can } from "@/lib/crm/permissions";
import { ago, fmtDate, takaShort } from "@/lib/crm/format";
import { createLead, moveLead } from "@/services/crm/sales.service";
import { useCrmAction, useCrmRemove, useCrmUpdate, useLeads, useUsers } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { m, Item, Stagger } from "../ui/motion";
import { Avatar, Badge, Button, Card, CardHeader, Field, Input, NumberInput, PageHeader, Select, Textarea, type Tone } from "../ui/core";
import { DataTable, type Column } from "../ui/data-table";
import { Drawer, Modal, useConfirm } from "../ui/overlay";
import { KpiCard, ProgressRing } from "../ui/kpi";
import { Bars, Donut } from "../ui/charts";
import { copyText } from "../ui/misc";

const STAGE_TONE: Record<LeadStage, Tone> = { new: "brand", contacted: "blue", meeting: "purple", confirmed: "green", lost: "grey" };
const STAGE_LABEL: Record<LeadStage, string> = { new: "New", contacted: "Contacted", meeting: "Meeting", confirmed: "Confirmed", lost: "Lost" };
const FLOW_SOURCES: Source[] = ["website", "chatbot", "whatsapp", "phone", "radar", "referral"];

const SOP = [
  ["Capture", "Every enquiry — website form, chatbot, WhatsApp, phone, walk-in, Opportunity Radar or referral — is logged in the CRM within 15 minutes. Website and chatbot leads are captured automatically."],
  ["Assign", "Leads are assigned round-robin to Sales Executives. Sales Manager re-assigns VIP / corporate leads when needed."],
  ["First response < 2 hours", "The representative calls (or WhatsApps) the client within 2 hours during business time and logs the outcome. Hot leads (score ≥ threshold) trigger an alert."],
  ["Meeting / site visit", "Book a meeting at ICCB, share the WhatsApp invite, ask the client to bring NID/Passport (and Trade License for organizations)."],
  ["Confirm or close", "Confirmed when advance ≥ 60% of venue rent is received and the Sales Manager approves. Otherwise mark Lost with a reason so the lost-reason report stays accurate."],
] as const;

function LeadModal({ lead, onClose }: { lead?: Lead; onClose: () => void }) {
  const users = useUsers();
  const [v, setV] = useState<LeadInput>(() => (lead ? { name: lead.name, organization: lead.organization, mobile: lead.mobile, email: lead.email, source: lead.source, stage: lead.stage, eventType: lead.eventType, expectedDate: lead.expectedDate, guests: lead.guests, value: lead.value, assignedTo: lead.assignedTo, notes: lead.notes } : { name: "", mobile: "", source: "phone", stage: "new", value: 0 }));
  const [err, setErr] = useState<string | null>(null);
  const update = useCrmUpdate<Lead>("leads", "Lead updated");
  const create = useCrmAction(() => createLead(v), { success: "Lead created", onSuccess: onClose });
  const set = <K extends keyof LeadInput>(k: K, val: LeadInput[K]) => setV((s) => ({ ...s, [k]: val }));
  const reps = (users.data ?? []).filter((u) => u.active && (u.role === "sales_executive" || u.role === "sales_manager"));
  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={lead ? "Edit lead" : "New lead"}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            loading={create.isPending || update.isPending}
            onClick={() => {
              const e = requireNameAndPhone(v);
              setErr(e);
              if (e) return;
              if (lead) update.mutate({ id: lead.id, patch: v as Partial<Lead> }, { onSuccess: onClose });
              else create.mutate(undefined);
            }}
          >
            Save lead
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact name" required error={err?.includes("name") ? err : null}>
          <Input value={v.name} onChange={(e) => set("name", e.target.value)} autoFocus />
        </Field>
        <Field label="Mobile" required error={err?.includes("phone") ? err : null}>
          <Input value={v.mobile} onChange={(e) => set("mobile", e.target.value)} />
        </Field>
        <Field label="Organization">
          <Input value={v.organization ?? ""} onChange={(e) => set("organization", e.target.value)} />
        </Field>
        <Field label="Email">
          <Input value={v.email ?? ""} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Source">
          <Select value={v.source} onChange={(x) => set("source", x as Source)} options={SOURCES.map((s) => ({ value: s, label: SOURCE_LABELS[s] }))} />
        </Field>
        <Field label="Stage">
          <Select value={v.stage} onChange={(x) => set("stage", x as LeadStage)} options={LEAD_STAGES.map((s) => ({ value: s, label: STAGE_LABEL[s] }))} />
        </Field>
        <Field label="Event type">
          <Input value={v.eventType ?? ""} onChange={(e) => set("eventType", e.target.value)} />
        </Field>
        <Field label="Expected date">
          <Input type="date" value={v.expectedDate ?? ""} onChange={(e) => set("expectedDate", e.target.value)} />
        </Field>
        <Field label="Guests">
          <NumberInput value={v.guests} onChange={(n) => set("guests", n)} />
        </Field>
        <Field label="Estimated value">
          <NumberInput value={v.value} onChange={(n) => set("value", n)} money />
        </Field>
        <Field label="Assigned to" className="sm:col-span-2">
          <Select value={v.assignedTo} onChange={(x) => set("assignedTo", x)} placeholder="Round-robin" options={reps.map((u) => ({ value: u.id, label: u.name }))} />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea value={v.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

function FlowNode({ label, n, sub, tone = "neutral", delay = 0 }: { label: string; n: number; sub?: string; tone?: "neutral" | "brand" | "green" | "grey"; delay?: number }) {
return (
  <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className={cn("rounded-xl border px-3 py-2.5 text-center", tone === "brand" ? "border-crm-brand bg-crm-tint" : tone === "green" ? "border-[#ABEFC6] bg-[#ECFDF3] dark:bg-[#0E2A1C] dark:border-[#164A30]" : tone === "grey" ? "border-crm-line bg-crm-surface-2" : "border-crm-line bg-crm-surface")}>
    <p className="text-[11.5px] font-medium text-crm-muted">{label}</p>
    <p className="text-[18px] font-bold text-crm-ink tabular">{n}</p>
    {sub && <p className="text-[11px] text-crm-muted">{sub}</p>}
  </m.div>
);
}

function Arrow() {
return <ArrowRight size={18} className="mx-auto shrink-0 rotate-90 text-crm-muted md:rotate-0 rtl:md:rotate-180" />;
}

export function LeadsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const role = useRole();
  const confirm = useConfirm();
  const leads = useLeads();
  const users = useUsers();
  const remove = useCrmRemove("leads", "Lead");
  const move = useCrmAction((a: { id: string; stage: LeadStage; reason?: string }) => moveLead(a.id, a.stage, a.reason), { success: (l) => `Moved to ${STAGE_LABEL[l.stage]}` });
  const [modal, setModal] = useState<{ lead?: Lead; key: number } | null>(null);
  const [sopOpen, setSopOpen] = useState(false);
  const hot = getSettings().hotLeadScore;
  const list = useMemo(() => leads.data ?? [], [leads.data]);
  const openId = params.get("lead");
  const open = list.find((l) => l.id === openId);
  const canEdit = can(role, "update", "leads");

  const stats = useMemo(() => {
    const closed = list.filter((l) => l.stage === "confirmed" || l.stage === "lost");
    const conv = closed.length ? Math.round((list.filter((l) => l.stage === "confirmed").length / closed.length) * 100) : 0;
    const resp = list.filter((l) => l.firstResponseAt).map((l) => (new Date(l.firstResponseAt!).getTime() - new Date(l.createdAt).getTime()) / 3600000);
    const avgResp = resp.length ? resp.reduce((s, x) => s + x, 0) / resp.length : 0;
    const bySource = SOURCES.map((s) => {
      const ls = list.filter((l) => l.source === s);
      const row: Record<string, string | number> = { source: SOURCE_LABELS[s] };
      for (const st of LEAD_STAGES) row[st] = ls.filter((l) => l.stage === st).length;
      const cl = ls.filter((l) => l.stage === "confirmed" || l.stage === "lost").length;
      row.conv = cl ? Math.round((ls.filter((l) => l.stage === "confirmed").length / cl) * 100) : 0;
      row.total = ls.length;
      return row;
    }).filter((r) => (r.total as number) > 0);
    const lost = Object.entries(list.filter((l) => l.stage === "lost").reduce<Record<string, number>>((acc, l) => ({ ...acc, [l.lostReason ?? "Not specified"]: (acc[l.lostReason ?? "Not specified"] ?? 0) + 1 }), {})).map(([name, value]) => ({ name, value }));
    const hotLeads = list.filter((l) => l.score >= hot && (l.stage === "new" || l.stage === "contacted")).sort((a, b) => b.score - a.score);
    const flow = {
      sources: FLOW_SOURCES.map((s) => ({ s, n: list.filter((l) => l.source === s).length })),
      capture: list.length,
      assigned: list.filter((l) => l.assignedTo).length,
      responded: list.filter((l) => l.firstResponseAt).length,
      fast: list.filter((l) => l.firstResponseAt && new Date(l.firstResponseAt).getTime() - new Date(l.createdAt).getTime() <= 2 * 3600000).length,
      meeting: list.filter((l) => l.stage === "meeting" || l.stage === "confirmed").length,
      confirmed: list.filter((l) => l.stage === "confirmed").length,
      lost: list.filter((l) => l.stage === "lost").length,
    };
    return { conv, avgResp, bySource, lost, hotLeads, flow };
  }, [list, hot]);

  const userOf = (id?: string) => users.data?.find((u) => u.id === id);
  const setOpen = (id?: string) => router.replace(id ? `/dashboard/marketing/leads?lead=${id}` : "/dashboard/marketing/leads", { scroll: false });

  const columns: Column<Lead>[] = [
    { id: "name", header: "Lead", primary: true, pinned: true, value: (l) => l.organization ?? l.name, cell: (l) => <div className="min-w-[180px]"><p className="font-semibold text-crm-ink">{l.organization ?? l.name}</p><p className="text-[12px] text-crm-muted">{l.name} · {l.mobile}</p></div> },
    { id: "score", header: "Score", align: "center", value: (l) => l.score, cell: (l) => <span className="inline-flex items-center gap-1">{l.score >= hot && <Fire size={14} weight="fill" className="text-crm-brand" />}<span className={cn("tabular font-semibold", l.score >= hot ? "text-crm-brand" : "text-crm-ink-2")}>{l.score}</span></span> },
    {
      id: "stage",
      header: "Stage",
      value: (l) => LEAD_STAGES.indexOf(l.stage),
      cell: (l) =>
        canEdit ? (
          <span onClick={(e) => e.stopPropagation()}>
            <Select
              value={l.stage}
              onChange={async (v) => {
                let reason: string | undefined;
                if (v === "lost") {
                  const r = await confirm({ title: "Mark lead as lost?", reason: { label: "Lost reason", required: true, placeholder: "Budget, chose another venue, date not available…" } });
                  if (!r.ok) return;
                  reason = r.reason;
                }
                move.mutate({ id: l.id, stage: v as LeadStage, reason });
              }}
              options={LEAD_STAGES.map((s) => ({ value: s, label: STAGE_LABEL[s] }))}
              className="h-8 w-[130px] text-[12.5px]"
            />
          </span>
        ) : (
          <Badge tone={STAGE_TONE[l.stage]}>{STAGE_LABEL[l.stage]}</Badge>
        ),
    },
    { id: "source", header: "Source", value: (l) => SOURCE_LABELS[l.source], cell: (l) => SOURCE_LABELS[l.source] },
    { id: "event", header: "Event", value: (l) => l.eventType ?? "", cell: (l) => <span className="whitespace-nowrap">{l.eventType ?? "—"}{l.guests ? <span className="text-crm-muted"> · {l.guests.toLocaleString("en-US")}</span> : null}</span> },
    { id: "date", header: "Expected", value: (l) => l.expectedDate ?? "", cell: (l) => fmtDate(l.expectedDate) },
    { id: "value", header: "Value", align: "end", value: (l) => l.value, cell: (l) => <span className="tabular">{takaShort(l.value)}</span> },
    { id: "rep", header: "Owner", value: (l) => userOf(l.assignedTo)?.name ?? "", cell: (l) => { const u = userOf(l.assignedTo); return u ? <Avatar name={u.name} color={u.color} size={24} /> : <Badge tone="amber">—</Badge>; } },
    { id: "created", header: "Created", value: (l) => l.createdAt, cell: (l) => ago(l.createdAt), hidden: true },
  ];

  return (
    <Stagger>
      <Item>
        <PageHeader
          eyebrow="Marketing"
          title="Lead generation"
          description="Pipeline by source, scoring, first-response SLA, hot-lead alerts and lost reasons."
          actions={
            can(role, "create", "leads") && (
              <Button variant="primary" icon={UserPlus} onClick={() => setModal({ key: Date.now() })}>
                New lead
              </Button>
            )
          }
        />
      </Item>
      <Item>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Leads" value={list.length} icon={Flag} loading={leads.isLoading} />
          <KpiCard label="Conversion (closed)" value={stats.conv} format={(n) => `${Math.round(n)}%`} icon={TrendUp} tone="green" loading={leads.isLoading} />
          <KpiCard label="Hot leads" value={stats.hotLeads.length} icon={Fire} tone="brand" loading={leads.isLoading} />
          <KpiCard label="Avg first response" value={stats.avgResp} format={(n) => `${n.toFixed(1)} h`} icon={Timer} tone="amber" invertDelta loading={leads.isLoading} />
        </div>
      </Item>

      <Item>
        <Card className="mb-6">
          <CardHeader icon={Lightning} title="Lead intake flow" description="Every channel lands in one pipeline. Target: first response under 2 hours." action={<Button size="sm" variant="ghost" iconRight={CaretDown} onClick={() => setSopOpen((v) => !v)}>{sopOpen ? "Hide SOP" : "Show SOP"}</Button>} />
          <div className="px-5 pb-5">
            <div className="grid items-center gap-2 md:grid-cols-[1.4fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr]">
              <div className="grid grid-cols-3 gap-1.5 md:grid-cols-2">
                {stats.flow.sources.map((x, i) => (
                  <m.div key={x.s} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="rounded-lg border border-crm-line bg-crm-surface-2 px-2 py-1.5 text-center">
                    <p className="truncate text-[11px] text-crm-muted">{SOURCE_LABELS[x.s]}</p>
                    <p className="text-[13px] font-semibold text-crm-ink tabular">{x.n}</p>
                  </m.div>
                ))}
              </div>
              <Arrow />
              <FlowNode label="Capture" n={stats.flow.capture} delay={0.1} />
              <Arrow />
              <FlowNode label="Assign" n={stats.flow.assigned} delay={0.15} />
              <Arrow />
              <FlowNode label="First response" n={stats.flow.responded} sub={`${stats.flow.fast} under 2 h`} tone="brand" delay={0.2} />
              <Arrow />
              <FlowNode label="Meeting" n={stats.flow.meeting} delay={0.25} />
              <Arrow />
              <div className="grid gap-1.5">
                <FlowNode label="Confirmed" n={stats.flow.confirmed} tone="green" delay={0.3} />
                <FlowNode label="Lost" n={stats.flow.lost} tone="grey" delay={0.35} />
              </div>
            </div>
            <AnimatePresence initial={false}>
              {sopOpen && (
                <m.ol initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-5 overflow-hidden">
                  {SOP.map(([t, d], i) => (
                    <li key={t} className="flex gap-3 border-t border-crm-line py-3">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-crm-brand text-[12px] font-bold text-white">{i + 1}</span>
                      <span>
                        <span className="block text-[13.5px] font-semibold text-crm-ink">{t}</span>
                        <span className="text-[13px] text-crm-ink-2">{d}</span>
                      </span>
                    </li>
                  ))}
                </m.ol>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </Item>

      <Item>
        <div className="mb-6 grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader title="Pipeline by source" description="Leads per stage, with conversion per source." />
            <div className="px-3 pb-2">
              <Bars data={stats.bySource} x="source" stacked series={[{ key: "new", label: "New", color: "#EB2127" }, { key: "contacted", label: "Contacted", color: "#F16A6E" }, { key: "meeting", label: "Meeting", color: "#AC090A" }, { key: "confirmed", label: "Confirmed", color: "#55525A" }, { key: "lost", label: "Lost", color: "#D9D6DC" }]} height={260} />
            </div>
            <div className="flex flex-wrap gap-2 px-5 pb-5">
              {stats.bySource.map((r) => (
                <Badge key={r.source as string} tone="neutral">
                  {r.source}: <strong className="ms-1 text-crm-ink">{r.conv}%</strong>
                </Badge>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader icon={Fire} title="Hot lead alerts" description={`Score ≥ ${hot}, not yet in a meeting.`} />
            <ul className="crm-scroll max-h-[320px] divide-y divide-crm-line overflow-y-auto px-5 pb-3">
              {stats.hotLeads.map((l) => (
                <li key={l.id} className="flex items-center gap-3 py-2.5">
                  <ProgressRing value={l.score} size={38} label={String(l.score)} />
                  <button onClick={() => setOpen(l.id)} className="min-w-0 flex-1 text-start">
                    <p className="truncate text-[13.5px] font-semibold text-crm-ink">{l.organization ?? l.name}</p>
                    <p className="text-[12px] text-crm-muted">
                      {l.eventType} · {SOURCE_LABELS[l.source]} · {ago(l.createdAt)}
                    </p>
                  </button>
                  {!l.firstResponseAt && <Badge tone="red">No response</Badge>}
                </li>
              ))}
              {!stats.hotLeads.length && <li className="py-4 text-[13px] text-crm-muted">No hot leads waiting.</li>}
            </ul>
          </Card>
        </div>
      </Item>

      <Item>
        <div className="mb-6 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card>
            <CardHeader icon={ChartPieSlice} title="Lost reasons" />
            <div className="px-5 pb-5">{stats.lost.length ? <Donut data={stats.lost} height={170} /> : <p className="text-[13px] text-crm-muted">No lost leads.</p>}</div>
          </Card>
          <DataTable
            rows={leads.data}
            loading={leads.isLoading}
            columns={columns}
            initialSort={{ id: "score", dir: "desc" }}
            searchPlaceholder="Search lead, organization, mobile…"
            onRowClick={(l) => setOpen(l.id)}
            exportName="iccb-leads"
            empty={{ icon: Flag, title: "No leads yet" }}
            rowActions={(l) =>
              canEdit && (
                <>
                  <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setModal({ lead: l, key: Date.now() })}>
                    <PencilSimple size={15} />
                  </Button>
                  <Button size="icon-sm" variant="ghost" aria-label="Delete" onClick={() => remove.mutate(l.id)}>
                    <Trash size={15} />
                  </Button>
                </>
              )
            }
          />
        </div>
      </Item>

      {open && (
        <Drawer open onOpenChange={(v) => !v && setOpen()} title={open.organization ?? open.name} description={`${SOURCE_LABELS[open.source]} · created ${ago(open.createdAt)}`} width={560}
          footer={
            <>
              {canEdit && <Button icon={PencilSimple} onClick={() => setModal({ lead: open, key: Date.now() })}>Edit</Button>}
              {can(role, "create", "bookings") || role === "marketing" ? (
                <Button variant="primary" iconRight={ArrowRight} onClick={() => router.push(`/dashboard/sales/bookings/new?name=${encodeURIComponent(open.name)}&mobile=${encodeURIComponent(open.mobile)}${open.guests ? `&guests=${open.guests}` : ""}`)}>
                  Create booking
                </Button>
              ) : null}
            </>
          }
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <ProgressRing value={open.score} size={56} label={String(open.score)} />
              <div>
                <Badge tone={STAGE_TONE[open.stage]}>{STAGE_LABEL[open.stage]}</Badge>
                {open.score >= hot && <Badge tone="brand" className="ms-1"><Fire size={11} weight="fill" /> Hot</Badge>}
                <p className="mt-1 text-[12.5px] text-crm-muted">{open.firstResponseAt ? `First response ${ago(open.firstResponseAt)}` : "Not contacted yet"}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-[13px]">
              {[["Contact", open.name], ["Mobile", open.mobile], ["Email", open.email], ["Event", open.eventType], ["Expected", fmtDate(open.expectedDate)], ["Guests", open.guests?.toLocaleString("en-US")], ["Value", takaShort(open.value)], ["Owner", userOf(open.assignedTo)?.name], ["Lost reason", open.lostReason]].map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-[12px] text-crm-muted">{k}</dt>
                  <dd className="text-crm-ink">{v || "—"}</dd>
                </div>
              ))}
            </dl>
            {open.notes && <p className="rounded-lg bg-crm-surface-2 p-3 text-[13px] text-crm-ink-2">{open.notes}</p>}
            {open.pitch && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-crm-ink">Pre-filled pitch</p>
                  <Button size="sm" icon={Copy} onClick={async () => (await copyText(open.pitch!)) && toast.success("Pitch copied")}>
                    Copy
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap rounded-lg border border-crm-line p-3 font-sans text-[12.5px] text-crm-ink-2">{open.pitch}</pre>
              </div>
            )}
          </div>
        </Drawer>
      )}
      {modal && <LeadModal key={modal.key} lead={modal.lead} onClose={() => setModal(null)} />}
    </Stagger>
  );
}

