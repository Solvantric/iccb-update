"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { CheckCircle, CoinVertical, HandCoins, MagnifyingGlassPlus, Plus, Prohibit, ShieldCheck, Warning } from "@phosphor-icons/react";
import type { Booking, LeakageFinding } from "@/types/crm";
import { LEAKAGE_RULES } from "@/types/crm";
import { LEAKAGE_RULE_LABELS, openAmount, openFindings } from "@/lib/crm/leakage";
import { can } from "@/lib/crm/permissions";
import { fmtDate, taka, takaShort, todayYmd } from "@/lib/crm/format";
import { findingsFor } from "@/services/crm/bookings.service";
import { addFindingsToBill, waiveFinding } from "@/services/crm/features.service";
import { useBookings, useCrmAction, useHalls, usePayments, useUsers } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { m } from "../ui/motion";
import { Badge, Button, Card, CardHeader, FilterBar, Select } from "../ui/core";
import { AnimatedMoney, KpiCard } from "../ui/kpi";
import { DataTable, type Column } from "../ui/data-table";
import { Bars } from "../ui/charts";
import { useConfirm } from "../ui/overlay";
import { useWs } from "../workspace/context";

const SRC_TONE = { PPM: "purple", FactSheet: "blue", Booking: "neutral" } as const;

/** Booking workspace → Services & Bill: unbilled items above the bill. */
export function LeakageAlert() {
  const { b, me } = useWs();
  const confirm = useConfirm();
  const findings = useMemo(() => findingsFor(b), [b]);
  const open = openFindings(findings);
  const resolved = findings.filter((f) => f.status !== "open");
  const [showResolved, setShowResolved] = useState(false);
  const canAdd = can(me.role, "create", "leakage") && !b.closed;
  const canWaive = can(me.role, "approve", "leakage") && !b.closed;
  const add = useCrmAction((ids: string[]) => addFindingsToBill(b.id, ids), { success: (r) => `Added to the bill · ${taka(r.addons.filter((a) => a.reason?.startsWith("leakage:")).reduce((s, a) => s + a.qty * a.rate, 0))} recovered on this booking` });
  const waive = useCrmAction((a: { id: string; reason: string }) => waiveFinding(b.id, a.id, a.reason), { success: "Finding waived" });

  if (b.status === "requested" || (!open.length && !resolved.length)) return null;

  const addable = open.filter((f) => f.line);
  return (
    <m.div initial={{ opacity: 0, y: -14, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
      <Card className={cn("border-s-[3px]", open.length ? "border-s-crm-brand" : "border-s-[#12B76A]")}>
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <span className={cn("grid h-9 w-9 place-items-center rounded-[var(--radius-btn)]", open.length ? "bg-crm-tint text-crm-brand" : "bg-[#ECFDF3] text-[#079455] dark:bg-[#0E2A1C]")}>
              {open.length ? <Warning size={19} weight="fill" /> : <ShieldCheck size={19} weight="fill" />}
            </span>
            <div>
              {open.length ? (
                <p className="text-[15px] font-semibold text-crm-ink">
                  ⚠ <AnimatedMoney value={openAmount(findings)} className="text-crm-brand" /> not billed ({open.length} item{open.length > 1 ? "s" : ""})
                </p>
              ) : (
                <p className="text-[15px] font-semibold text-crm-ink">Leakage Guard: nothing left unbilled</p>
              )}
              <p className="text-[12.5px] text-crm-muted">Checked against the PPM, the Program Fact Sheet and the booking. The final invoice is blocked until every item is added or waived.</p>
            </div>
          </div>
          {canAdd && addable.length > 1 && (
            <Button variant="primary" size="sm" icon={Plus} loading={add.isPending && add.variables?.length === addable.length} onClick={() => add.mutate(addable.map((f) => f.id))}>
              Add all
            </Button>
          )}
        </div>
        {open.length > 0 && (
          <ul className="divide-y divide-crm-line border-t border-crm-line">
            <AnimatePresence initial={false}>
              {open.map((f) => (
                <m.li key={f.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: 36, scale: 0.97, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium text-crm-ink">
                      {f.title} <Badge tone={SRC_TONE[f.source]}>{f.source === "FactSheet" ? "Fact sheet" : f.source}</Badge>
                    </p>
                    <p className="text-[12.5px] text-crm-muted">{f.detail}</p>
                  </div>
                  <span className="font-semibold tabular text-crm-ink">{f.line ? taka(f.expectedAmount) : "Flag"}</span>
                  <div className="flex gap-1.5">
                    {canAdd && f.line && (
                      <Button size="sm" variant="secondary" icon={Plus} loading={add.isPending && add.variables?.length === 1 && add.variables[0] === f.id} onClick={() => add.mutate([f.id])}>
                        Add to bill
                      </Button>
                    )}
                    {canWaive && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Prohibit}
                        onClick={async () => {
                          const r = await confirm({ title: `Waive "${f.title}"?`, description: `${f.line ? taka(f.expectedAmount) : "This flag"} will not be billed. The reason is saved in the audit log.`, confirmLabel: "Waive", reason: { label: "Reason", required: true, placeholder: "Goodwill, included in package, measured wrong…" } });
                          if (r.ok && r.reason) waive.mutate({ id: f.id, reason: r.reason });
                        }}
                      >
                        Waive
                      </Button>
                    )}
                  </div>
                </m.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
        {!canWaive && open.length > 0 && <p className="border-t border-crm-line px-5 py-2 text-[12px] text-crm-muted">Only a Sales Manager or Admin can waive a finding.</p>}
        {resolved.length > 0 && (
          <div className="border-t border-crm-line px-5 py-2.5">
            <button className="text-[12.5px] font-medium text-crm-ink-2 hover:text-crm-brand" onClick={() => setShowResolved((v) => !v)}>
              {showResolved ? "Hide" : "Show"} {resolved.length} resolved
            </button>
            {showResolved && (
              <ul className="mt-2 space-y-1.5">
                {resolved.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
                    <span className="text-crm-ink-2">
                      <Badge tone={f.status === "added" ? "green" : "grey"}>{f.status === "added" ? "Added" : "Waived"}</Badge> <span className="ms-1">{f.title}</span>
                      {f.waivedReason && <span className="text-crm-muted"> — {f.waivedReason}</span>}
                    </span>
                    <span className="text-crm-muted">
                      {taka(f.expectedAmount)} · {f.resolvedBy} · {fmtDate(f.resolvedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>
    </m.div>
  );
}

/* ─── Sales → Invoices → Leakage (report) ────────────────────────────────── */

interface Row extends LeakageFinding {
  createdAt: string;
  b: Booking;
  hallId: string;
  rep?: string;
}

export function LeakageReport() {
  const bookings = useBookings();
  const payments = usePayments(); // estimates depend on payments
  const halls = useHalls();
  const users = useUsers();
  const [rule, setRule] = useState("");
  const [hall, setHall] = useState("");
  const [rep, setRep] = useState("");
  const [status, setStatus] = useState("");
  const month = todayYmd().slice(0, 7);

  const all = useMemo<Row[] | undefined>(() => {
    if (!bookings.data || !payments.data) return undefined;
    return bookings.data
      .filter((b) => b.status !== "requested" && !b.closed)
      .flatMap((b) => findingsFor(b).map((f) => ({ ...f, createdAt: f.resolvedAt ?? f.detectedAt ?? b.updatedAt, b, hallId: b.days[0]?.hallId ?? "", rep: b.assignedTo })));
  }, [bookings.data, payments.data]);

  const rows = useMemo(() => all?.filter((r) => (!rule || r.ruleId === rule) && (!hall || r.hallId === hall) && (!rep || r.rep === rep) && (!status || r.status === status)), [all, rule, hall, rep, status]);

  const k = useMemo(() => {
    const list = all ?? [];
    const inMonth = (d?: string) => !!d && d.startsWith(month);
    const found = list.filter((f) => inMonth(f.detectedAt) || inMonth(f.resolvedAt)).reduce((s, f) => s + f.expectedAmount, 0);
    const recovered = list.filter((f) => f.status === "added" && inMonth(f.resolvedAt)).reduce((s, f) => s + f.expectedAmount, 0);
    const waived = list.filter((f) => f.status === "waived" && inMonth(f.resolvedAt)).reduce((s, f) => s + f.expectedAmount, 0);
    const open = list.filter((f) => f.status === "open").reduce((s, f) => s + f.expectedAmount, 0);
    const rate = recovered + waived + open ? Math.round((recovered / (recovered + waived + open)) * 100) : 0;
    const byRule = LEAKAGE_RULES.map((r) => ({ rule: LEAKAGE_RULE_LABELS[r], recovered: list.filter((f) => f.ruleId === r && f.status === "added").reduce((s, f) => s + f.expectedAmount, 0), open: list.filter((f) => f.ruleId === r && f.status === "open").reduce((s, f) => s + f.expectedAmount, 0) })).filter((x) => x.recovered || x.open);
    return { found, recovered, waived, open, rate, byRule };
  }, [all, month]);

  const hallName = (id: string) => halls.data?.find((h) => h.id === id)?.name ?? "—";
  const userName = (id?: string) => users.data?.find((u) => u.id === id)?.name ?? "Unassigned";
  const columns: Column<Row>[] = [
    { id: "booking", header: "Booking", primary: true, pinned: true, value: (r) => r.b.eventTitle, cell: (r) => <Link href={`/dashboard/sales/bookings/${r.b.id}?tab=services`} onClick={(e) => e.stopPropagation()} className="block max-w-[240px] hover:text-crm-brand"><span className="block truncate font-medium text-crm-ink">{r.b.eventTitle}</span><span className="text-[12px] text-crm-muted">{r.b.bfNo}</span></Link> },
    { id: "rule", header: "Rule", value: (r) => r.title, cell: (r) => <span><span className="block text-crm-ink">{r.title}</span><span className="text-[12px] text-crm-muted">{r.detail}</span></span> },
    { id: "hall", header: "Hall", value: (r) => hallName(r.hallId), cell: (r) => hallName(r.hallId), hideOnMobile: true },
    { id: "rep", header: "Rep", value: (r) => userName(r.rep), cell: (r) => userName(r.rep), hideOnMobile: true },
    { id: "amount", header: "Amount", align: "end", value: (r) => r.expectedAmount, cell: (r) => <span className="font-semibold tabular text-crm-ink">{r.line ? taka(r.expectedAmount) : "Flag"}</span> },
    { id: "status", header: "Status", value: (r) => r.status, cell: (r) => <Badge tone={r.status === "open" ? "brand" : r.status === "added" ? "green" : "grey"}>{r.status === "open" ? "Open" : r.status === "added" ? "Added" : "Waived"}</Badge> },
    { id: "date", header: "Date", value: (r) => r.createdAt, cell: (r) => fmtDate(r.createdAt) },
  ];

  const loading = !all;
  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Found this month" value={k.found} format={takaShort} icon={MagnifyingGlassPlus} tone="amber" loading={loading} />
        <div className="crm-pulse-once rounded-[var(--radius-card-lg)]" style={{ ["--pulse" as string]: "#12B76A" }}>
          <KpiCard label="Recovered (added)" value={k.recovered} format={takaShort} icon={CoinVertical} tone="green" loading={loading} />
        </div>
        <KpiCard label="Waived" value={k.waived} format={takaShort} icon={HandCoins} tone="blue" loading={loading} />
        <KpiCard label="Recovery rate" value={k.rate} format={(n) => `${Math.round(n)}%`} icon={CheckCircle} loading={loading} />
      </div>
      <div className="mb-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader title="Recovered by rule" description="Amounts added to bills by the Leakage Guard, and what is still open." />
          <div className="px-3 pb-4">
            <Bars data={k.byRule} x="rule" series={[{ key: "recovered", label: "Recovered", color: "#12B76A" }, { key: "open", label: "Still open" }]} height={260} format={(n) => taka(n)} />
          </div>
        </Card>
        <Card className="p-5">
          <p className="meta-label text-[11px]">Open right now</p>
          <p className="mt-1 font-display text-[32px] font-semibold text-crm-brand"><AnimatedMoney value={k.open} /></p>
          <p className="mt-1 text-[13px] text-crm-muted">{all?.filter((f) => f.status === "open").length ?? 0} findings on {new Set(all?.filter((f) => f.status === "open").map((f) => f.b.id)).size} bookings. Final invoices stay blocked until they are added or waived.</p>
        </Card>
      </div>
      <FilterBar>
        <Select value={rule} onChange={setRule} placeholder="All rules" options={LEAKAGE_RULES.map((r) => ({ value: r, label: LEAKAGE_RULE_LABELS[r] }))} className="w-auto min-w-[170px]" />
        <Select value={hall} onChange={setHall} placeholder="All halls" options={(halls.data ?? []).filter((h) => !h.deletedAt).map((h) => ({ value: h.id, label: h.name }))} className="w-auto min-w-[150px]" />
        <Select value={rep} onChange={setRep} placeholder="All reps" options={(users.data ?? []).filter((u) => u.role === "sales_executive" || u.role === "sales_manager").map((u) => ({ value: u.id, label: u.name }))} className="w-auto min-w-[150px]" />
        <Select value={status} onChange={setStatus} placeholder="Any status" options={[{ value: "open", label: "Open" }, { value: "added", label: "Added" }, { value: "waived", label: "Waived" }]} className="w-auto min-w-[130px]" />
      </FilterBar>
      <DataTable rows={rows} loading={loading} columns={columns} initialSort={{ id: "amount", dir: "desc" }} searchText={(r) => `${r.b.eventTitle} ${r.b.bfNo} ${r.title}`} exportName="iccb-leakage" empty={{ icon: ShieldCheck, title: "No findings", description: "Nothing unbilled in this view." }} />
    </>
  );
}
