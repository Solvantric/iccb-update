"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { Plus, Prohibit, ShieldCheck, Star, Storefront, Warning, PencilSimple, ClipboardText } from "@phosphor-icons/react";
import type { Booking, Vendor, VendorReview, VendorStatus, VendorType } from "@/types/crm";
import { VENDOR_TYPE_LABELS, VENDOR_TYPES } from "@/types/crm";
import { getFeatureSettings, useCurrentUser } from "@/lib/crm/db";
import { can } from "@/lib/crm/permissions";
import { lastEventDate } from "@/lib/crm/pricing";
import { reviewPoints, suggestedStatus, vendorScore } from "@/lib/crm/vendor-score";
import { PREMISES_GUIDELINES, guidelineTitle } from "@/data/crm/premises-guidelines";
import { fmtDate, taka, takaShort, todayYmd } from "@/lib/crm/format";
import { saveVendor, saveVendorReview, selectDecorator, setVendorStatus } from "@/services/crm/features.service";
import { useBookings, useCrmAction, useCrmRemove, useVendorReviews, useVendors } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { m } from "../ui/motion";
import { Badge, Button, Card, CardHeader, Checkbox, EmptyState, Field, Input, NumberInput, Segmented, Select, Textarea } from "../ui/core";
import { KpiCard } from "../ui/kpi";
import { DataTable, type Column } from "../ui/data-table";
import { Bars } from "../ui/charts";
import { Drawer, Modal, useConfirm } from "../ui/overlay";
import { ReadinessRing } from "./Readiness";

const STATUS_STYLE: Record<VendorStatus, { bg: string; fg: string; label: string }> = {
  active: { bg: "rgba(18,183,106,0.12)", fg: "#067647", label: "Active" },
  warning: { bg: "rgba(247,144,9,0.14)", fg: "#B54708", label: "Warning" },
  blacklisted: { bg: "rgba(217,45,32,0.12)", fg: "#B42318", label: "Blacklisted" },
};

/** Status chip — colour crossfades when the status changes. */
export function VendorStatusChip({ status }: { status: VendorStatus }) {
  const st = STATUS_STYLE[status];
  return (
    <m.span initial={false} animate={{ backgroundColor: st.bg, color: st.fg }} transition={{ duration: 0.35 }} className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-semibold whitespace-nowrap">
      <m.span initial={false} animate={{ backgroundColor: st.fg }} className="h-1.5 w-1.5 rounded-full" />
      {st.label}
    </m.span>
  );
}

export function ScoreRing({ score, size = 36 }: { score: number; size?: number }) {
  return <ReadinessRing score={score} level={score >= 70 ? "ready" : score >= 50 ? "attention" : "risk"} size={size} />;
}

interface Row extends Vendor {
  score: number;
  events: number;
  damages: number;
  lastEvent?: string;
  reviews: VendorReview[];
}

function useVendorRows() {
  const vendors = useVendors();
  const reviews = useVendorReviews();
  const bookings = useBookings();
  const rows = useMemo<Row[] | undefined>(() => {
    if (!vendors.data || !reviews.data || !bookings.data) return undefined;
    return vendors.data.map((v) => {
      const rv = reviews.data!.filter((r) => r.vendorId === v.id);
      const linked = bookings.data!.filter((b) => b.decoration.vendorId === v.id || rv.some((r) => r.bookingId === b.id));
      const lastEvent = linked.map((b) => lastEventDate(b)).filter((d) => d <= todayYmd()).sort().pop();
      return { ...v, reviews: rv, score: vendorScore(rv), events: linked.length, damages: rv.reduce((s, r) => s + r.damageAmount, 0), lastEvent };
    });
  }, [vendors.data, reviews.data, bookings.data]);
  return { rows, loading: vendors.isLoading || reviews.isLoading, bookings: bookings.data ?? [] };
}

/* ─── Operations → Quality → Vendors ─────────────────────────────────────── */

export function VendorsTab() {
  const me = useCurrentUser();
  const { rows, loading, bookings } = useVendorRows();
  const [open, setOpen] = useState<string | null>(null);
  const [edit, setEdit] = useState<Vendor | "new" | null>(null);
  const [review, setReview] = useState<{ vendorId?: string; bookingId?: string } | null>(null);
  const remove = useCrmRemove("vendors", "Vendor");
  const confirm = useConfirm();
  const canEdit = can(me.role, "update", "vendors");
  const pendingReviews = useMemo(() => {
    const today = todayYmd();
    return bookings.filter((b) => !b.closed && b.decoration.vendorId && lastEventDate(b) < today && (b.status === "completed" || b.factSheet?.done) && !(rows ?? []).some((v) => v.id === b.decoration.vendorId && v.reviews.some((r) => r.bookingId === b.id)));
  }, [bookings, rows]);
  const current = rows?.find((r) => r.id === open);

  const columns: Column<Row>[] = [
    { id: "name", header: "Vendor", primary: true, pinned: true, value: (r) => r.name, cell: (r) => <span><span className="block font-medium text-crm-ink">{r.name}</span><span className="text-[12px] text-crm-muted">{r.contactPerson} · {r.mobile}</span></span> },
    { id: "type", header: "Type", value: (r) => VENDOR_TYPE_LABELS[r.type], cell: (r) => VENDOR_TYPE_LABELS[r.type] },
    { id: "events", header: "Events", align: "end", value: (r) => r.events, cell: (r) => <span className="tabular">{r.events}</span> },
    { id: "score", header: "Score", align: "center", value: (r) => r.score, cell: (r) => <ScoreRing score={r.score} /> },
    { id: "damages", header: "Damages", align: "end", value: (r) => r.damages, cell: (r) => <span className={cn("tabular", r.damages && "font-semibold text-[#B42318]")}>{r.damages ? taka(r.damages) : "—"}</span> },
    { id: "last", header: "Last event", value: (r) => r.lastEvent ?? "", cell: (r) => fmtDate(r.lastEvent), hideOnMobile: true },
    { id: "status", header: "Status", value: (r) => r.status, cell: (r) => <VendorStatusChip status={r.status} /> },
  ];

  const list = rows ?? [];
  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Vendors" value={list.length} icon={Storefront} tone="blue" loading={loading} />
        <KpiCard label="Average score" value={list.length ? Math.round(list.reduce((s, r) => s + r.score, 0) / list.length) : 0} format={(n) => `${Math.round(n)}/100`} icon={Star} tone="green" loading={loading} />
        <KpiCard label="Warning / blacklisted" value={list.filter((r) => r.status !== "active").length} icon={Warning} tone="amber" loading={loading} />
        <KpiCard label="Vendor damages" value={list.reduce((s, r) => s + r.damages, 0)} format={takaShort} icon={Prohibit} tone="brand" loading={loading} />
      </div>
      {pendingReviews.length > 0 && canEdit && (
        <Card className="mb-5 border-s-[3px] border-s-[#F79009]">
          <CardHeader icon={ClipboardText} title={`${pendingReviews.length} vendor review${pendingReviews.length > 1 ? "s" : ""} to write`} description="Completed events that used an outside vendor." />
          <ul className="flex flex-wrap gap-2 px-5 pb-4">
            {pendingReviews.slice(0, 8).map((b) => (
              <li key={b.id}>
                <Button size="sm" onClick={() => setReview({ vendorId: b.decoration.vendorId, bookingId: b.id })}>
                  {list.find((v) => v.id === b.decoration.vendorId)?.name} · {b.eventTitle}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <DataTable
        rows={rows}
        loading={loading}
        columns={columns}
        initialSort={{ id: "score", dir: "asc" }}
        searchText={(r) => `${r.name} ${r.contactPerson} ${r.mobile}`}
        exportName="iccb-vendors"
        onRowClick={(r) => setOpen(r.id)}
        toolbar={canEdit && (
          <div className="flex gap-2">
            <Button size="sm" icon={Star} onClick={() => setReview({})}>Add review</Button>
            <Button size="sm" variant="primary" icon={Plus} onClick={() => setEdit("new")}>New vendor</Button>
          </div>
        )}
        rowActions={(r) =>
          canEdit ? (
            <>
              <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setEdit(r)}>
                <PencilSimple size={15} />
              </Button>
              <Button size="icon-sm" variant="ghost" aria-label="Delete" onClick={async () => { const c = await confirm({ title: `Delete ${r.name}?`, description: "It moves to Trash.", tone: "danger", confirmLabel: "Delete" }); if (c.ok) remove.mutate(r.id); }}>
                <Prohibit size={15} />
              </Button>
            </>
          ) : null
        }
        empty={{ icon: Storefront, title: "No vendors yet" }}
      />
      {current && <VendorDrawer v={current} bookings={bookings} onClose={() => setOpen(null)} onReview={() => setReview({ vendorId: current.id })} onEdit={() => setEdit(current)} />}
      {edit && <VendorFormModal vendor={edit === "new" ? undefined : edit} onClose={() => setEdit(null)} />}
      {review && <ReviewFormModal initial={review} vendors={list} bookings={bookings} onClose={() => setReview(null)} />}
    </>
  );
}

function VendorDrawer({ v, bookings, onClose, onReview, onEdit }: { v: Row; bookings: Booking[]; onClose: () => void; onReview: () => void; onEdit: () => void }) {
  const me = useCurrentUser();
  const confirm = useConfirm();
  const t = getFeatureSettings().vendorThresholds;
  const suggestion = suggestedStatus(v.score, t);
  const status = useCrmAction((a: { s: VendorStatus; reason: string }) => setVendorStatus(v.id, a.s, a.reason), { success: (r) => `${r.name} is now ${r.status}` });
  const violations = useMemo(() => {
    const m = new Map<string, number>();
    v.reviews.forEach((r) => r.violations.forEach((g) => m.set(g, (m.get(g) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [v.reviews]);
  const history = [...v.reviews].sort((a, b) => b.date.localeCompare(a.date));
  const chart = [...history].reverse().map((r) => ({ date: fmtDate(r.date, "dd MMM yy"), damage: r.damageAmount, points: reviewPoints(r) }));
  const change = async (s: VendorStatus) => {
    const r = await confirm({ title: `Set ${v.name} to ${STATUS_STYLE[s].label}?`, description: s === "blacklisted" ? "Blacklisted vendors can't be selected on bookings without an Admin override." : undefined, tone: s === "blacklisted" ? "danger" : "primary", confirmLabel: STATUS_STYLE[s].label, reason: { label: "Reason", required: true } });
    if (r.ok && r.reason) status.mutate({ s, reason: r.reason });
  };
  const isAdmin = me.role === "admin";
  const canEdit = can(me.role, "update", "vendors");
  return (
    <Drawer
      open
      onOpenChange={(o) => !o && onClose()}
      title={v.name}
      description={`${VENDOR_TYPE_LABELS[v.type]} · ${v.contactPerson} · ${v.mobile}`}
      width={640}
      headerExtra={<div className="mt-2"><VendorStatusChip status={v.status} /></div>}
      footer={canEdit && <><Button onClick={onEdit} icon={PencilSimple}>Edit</Button><Button variant="primary" icon={Star} onClick={onReview}>Add review</Button></>}
    >
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <ScoreRing score={v.score} size={64} />
          <div>
            <p className="text-[13px] text-crm-muted">Score (last 10 reviews)</p>
            <p className="text-[14px] font-semibold text-crm-ink">
              Suggested: {suggestion === "review_blacklist" ? "review for blacklist" : STATUS_STYLE[suggestion].label}
            </p>
            <p className="text-[12px] text-crm-muted">{v.events} events · {taka(v.damages)} damages</p>
          </div>
        </div>
        {(canEdit || isAdmin) && (
          <div className="flex flex-wrap gap-2">
            {(["active", "warning"] as VendorStatus[]).filter((s) => s !== v.status && (isAdmin || v.status !== "blacklisted")).map((s) => (
              <Button key={s} size="sm" onClick={() => change(s)}>Mark {STATUS_STYLE[s].label.toLowerCase()}</Button>
            ))}
            {isAdmin && v.status !== "blacklisted" && <Button size="sm" variant="danger" icon={Prohibit} onClick={() => change("blacklisted")}>Blacklist</Button>}
            {!isAdmin && suggestion === "review_blacklist" && <p className="text-[12px] text-[#B42318]">Score below {t.warning} — ask an Admin to review for blacklist.</p>}
          </div>
        )}
        {v.notes && <p className="whitespace-pre-wrap rounded-[var(--radius-btn)] bg-crm-surface-2 px-3 py-2 text-[12.5px] text-crm-ink-2">{v.notes}</p>}
        <Card>
          <CardHeader title="Damages & points per event" />
          <div className="px-3 pb-3">{chart.length ? <Bars data={chart} x="date" series={[{ key: "damage", label: "Damage ৳" }, { key: "points", label: "Points", color: "#12B76A" }]} height={200} /> : <p className="px-2 pb-2 text-[13px] text-crm-muted">No reviews yet.</p>}</div>
        </Card>
        <Card>
          <CardHeader title="Violations" description="ICCB premises guidelines broken." />
          <ul className="px-5 pb-4 text-[13px]">
            {violations.map(([g, n]) => (
              <li key={g} className="flex justify-between gap-3 py-1">
                <span className="text-crm-ink-2">{guidelineTitle(g)}</span>
                <Badge tone="red">{n}×</Badge>
              </li>
            ))}
            {!violations.length && <li className="text-crm-muted">None recorded.</li>}
          </ul>
        </Card>
        <Card>
          <CardHeader title="History" />
          <ul className="divide-y divide-crm-line">
            {history.map((r) => {
              const b = bookings.find((x) => x.id === r.bookingId);
              return (
                <li key={r.id} className="flex items-start gap-3 px-5 py-3">
                  <ScoreRing score={reviewPoints(r)} size={34} />
                  <div className="min-w-0 flex-1 text-[12.5px]">
                    <Link href={`/dashboard/sales/bookings/${r.bookingId}`} className="block truncate text-[13.5px] font-medium text-crm-ink hover:text-crm-brand">{b?.eventTitle ?? r.bookingId}</Link>
                    <p className="text-crm-muted">
                      {fmtDate(r.date)} · {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} · {r.setupOnTime ? "on time" : "late set-up"} · {r.dismantledWithin24h ? "cleared < 24 h" : "dismantle > 24 h"}
                      {r.damageAmount ? ` · damage ${taka(r.damageAmount)}` : ""}
                    </p>
                    {r.notes && <p className="text-crm-ink-2">{r.notes}</p>}
                  </div>
                </li>
              );
            })}
            {!history.length && <EmptyState icon={Star} title="No reviews yet" className="py-6" />}
          </ul>
        </Card>
      </div>
    </Drawer>
  );
}

function VendorFormModal({ vendor, onClose }: { vendor?: Vendor; onClose: () => void }) {
  const me = useCurrentUser();
  const [v, setV] = useState<Omit<Vendor, "id" | "createdAt" | "updatedAt">>(() => vendor ? { name: vendor.name, type: vendor.type, contactPerson: vendor.contactPerson, mobile: vendor.mobile, email: vendor.email, tradeLicenseNo: vendor.tradeLicenseNo, status: vendor.status, notes: vendor.notes, isSample: vendor.isSample } : { name: "", type: "decorator", contactPerson: "", mobile: "", status: "active", notes: "" });
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((s) => ({ ...s, [k]: val }));
  const save = useCrmAction(() => saveVendor(v, vendor?.id), { success: vendor ? "Vendor updated" : "Vendor added", onSuccess: onClose });
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={vendor ? `Edit ${vendor.name}` : "New vendor"} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={save.isPending} disabled={!v.name.trim()} onClick={() => save.mutate(undefined)}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required className="sm:col-span-2"><Input value={v.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Type"><Select value={v.type} onChange={(x) => set("type", x as VendorType)} options={VENDOR_TYPES.map((t) => ({ value: t, label: VENDOR_TYPE_LABELS[t] }))} /></Field>
        <Field label="Status" hint={me.role !== "admin" ? "Only Admin can blacklist." : undefined}>
          <Select value={v.status} onChange={(x) => set("status", x as VendorStatus)} options={(["active", "warning", "blacklisted"] as VendorStatus[]).filter((s) => me.role === "admin" || s !== "blacklisted" || v.status === "blacklisted").map((s) => ({ value: s, label: STATUS_STYLE[s].label }))} />
        </Field>
        <Field label="Contact person"><Input value={v.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} /></Field>
        <Field label="Mobile"><Input value={v.mobile} onChange={(e) => set("mobile", e.target.value)} /></Field>
        <Field label="Email"><Input value={v.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Trade license no."><Input value={v.tradeLicenseNo ?? ""} onChange={(e) => set("tradeLicenseNo", e.target.value)} /></Field>
        <Field label="Notes" className="sm:col-span-2"><Textarea value={v.notes} onChange={(e) => set("notes", e.target.value)} className="min-h-[60px]" /></Field>
      </div>
    </Modal>
  );
}

function ReviewFormModal({ initial, vendors, bookings, onClose }: { initial: { vendorId?: string; bookingId?: string }; vendors: Vendor[]; bookings: Booking[]; onClose: () => void }) {
  const today = todayYmd();
  const past = bookings.filter((b) => !b.closed && b.status !== "requested" && lastEventDate(b) < today).sort((a, b) => lastEventDate(b).localeCompare(lastEventDate(a)));
  const damageOf = (id?: string) => (bookings.find((b) => b.id === id)?.damage?.rows ?? []).reduce((s, r) => s + r.qty * r.rate, 0);
  const [v, setV] = useState({ vendorId: initial.vendorId ?? "", bookingId: initial.bookingId ?? "", setupOnTime: true, dismantledWithin24h: true, damageAmount: damageOf(initial.bookingId), violations: [] as string[], rating: 4, notes: "", date: today });
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((s) => ({ ...s, [k]: val }));
  const save = useCrmAction(() => saveVendorReview(v), { success: "Review saved", onSuccess: onClose });
  const preview = reviewPoints(v);
  return (
    <Modal open size="lg" onOpenChange={(o) => !o && onClose()} title="Vendor review" description="After a completed event. Damage is prefilled from the Damage Claim." footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={save.isPending} disabled={!v.vendorId || !v.bookingId} onClick={() => save.mutate(undefined)}>Save review</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Vendor" required><Select value={v.vendorId} onChange={(x) => set("vendorId", x)} placeholder="Choose…" options={vendors.map((x) => ({ value: x.id, label: x.name }))} /></Field>
        <Field label="Event" required>
          <Select value={v.bookingId} onChange={(x) => setV((s) => ({ ...s, bookingId: x, damageAmount: damageOf(x) }))} placeholder="Choose…" options={past.map((b) => ({ value: b.id, label: `${fmtDate(lastEventDate(b), "dd MMM")} · ${b.eventTitle}` }))} />
        </Field>
        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:gap-8">
          <Checkbox checked={v.setupOnTime} onChange={(x) => set("setupOnTime", x)} label="Set-up on time" />
          <Checkbox checked={v.dismantledWithin24h} onChange={(x) => set("dismantledWithin24h", x)} label="Dismantled within 24 h" />
        </div>
        <Field label="Damage amount" hint="From the event's Damage Claim; edit if the vendor caused only part of it."><NumberInput value={v.damageAmount} onChange={(n) => set("damageAmount", n)} money /></Field>
        <Field label="Rating">
          <Segmented value={String(v.rating)} onChange={(x) => set("rating", Number(x))} options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}★` }))} />
        </Field>
        <Field label={`Violations (${v.violations.length})`} className="sm:col-span-2">
          <div className="crm-scroll grid max-h-52 gap-1.5 overflow-y-auto rounded-[var(--radius-input)] border border-crm-line p-3 sm:grid-cols-2">
            {PREMISES_GUIDELINES.map((g) => (
              <Checkbox key={g.id} checked={v.violations.includes(g.id)} onChange={(on) => set("violations", on ? [...v.violations, g.id] : v.violations.filter((x) => x !== g.id))} label={<span className="text-[12.5px]">{g.title}</span>} />
            ))}
          </div>
        </Field>
        <Field label="Notes" className="sm:col-span-2"><Textarea value={v.notes} onChange={(e) => set("notes", e.target.value)} className="min-h-[60px]" /></Field>
        <div className="flex items-center gap-3 sm:col-span-2">
          <ScoreRing score={preview} size={40} />
          <p className="text-[12.5px] text-crm-muted">Points for this event. The vendor score averages the last 10 reviews.</p>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Booking workspace: outside decorator picker with score badge ──────── */

export function DecoratorPicker({ b, disabled }: { b: Booking; disabled?: boolean }) {
  const me = useCurrentUser();
  const { rows } = useVendorRows();
  const confirm = useConfirm();
  const pick = useCrmAction((a: { id: string; reason?: string }) => selectDecorator(b.id, a.id, a.reason), { success: (r) => `Decorator: ${r.decoration.firm}` });
  const decorators = (rows ?? []).filter((v) => v.type === "decorator" || v.type === "event_firm");
  const current = decorators.find((v) => v.id === b.decoration.vendorId);
  const choose = async (id: string) => {
    const v = decorators.find((x) => x.id === id);
    if (!v) return;
    if (v.status === "blacklisted") {
      if (me.role !== "admin") {
        pick.mutate({ id }); // service refuses with a clear message
        return;
      }
      const r = await confirm({ title: `Override blacklist for ${v.name}?`, description: "This is recorded in the audit log.", tone: "danger", confirmLabel: "Override", reason: { label: "Reason", required: true } });
      if (r.ok && r.reason) pick.mutate({ id, reason: r.reason });
      return;
    }
    pick.mutate({ id });
  };
  return (
    <div className="space-y-2">
      <Field label="Outside vendor" hint={!current && b.decoration.firm ? `Typed firm "${b.decoration.firm}" isn't linked to a vendor yet.` : undefined}>
        <Select
          value={b.decoration.vendorId}
          disabled={disabled}
          onChange={choose}
          placeholder="Choose a vendor…"
          options={decorators.map((v) => ({ value: v.id, label: `${v.name} · score ${v.score}${v.status === "blacklisted" ? ` · BLACKLISTED${me.role === "admin" ? " (override)" : ""}` : v.status === "warning" ? " · warning" : ""}` }))}
        />
      </Field>
      <AnimatePresence mode="wait">
        {current && (
          <m.div key={current.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn("flex items-center gap-3 rounded-[var(--radius-btn)] px-3 py-2 text-[12.5px]", current.status === "warning" ? "bg-[#FEF6E7] text-[#B54708] dark:bg-[#2B2010]" : current.status === "blacklisted" ? "bg-[#FEF3F2] text-[#B42318] dark:bg-[#2D1414]" : "bg-crm-surface-2 text-crm-ink-2")}>
            <ScoreRing score={current.score} size={32} />
            <span className="min-w-0 flex-1">
              <span className="font-semibold">{current.name}</span> · {current.events} events · damages {taka(current.damages)}
              {current.status === "warning" && <span className="block">⚠ On warning — {current.notes.split("\n")[0] || "brief them on ICCB premises guidelines."}</span>}
              {current.status === "blacklisted" && b.decoration.override && <span className="block">Blacklisted — overridden by {b.decoration.override.by}: {b.decoration.override.reason}</span>}
            </span>
            <VendorStatusChip status={current.status} />
          </m.div>
        )}
      </AnimatePresence>
      {decorators.some((v) => v.status === "blacklisted") && me.role !== "admin" && <p className="text-[11.5px] text-crm-muted"><ShieldCheck size={12} className="inline" /> Blacklisted vendors can only be selected by an Admin.</p>}
    </div>
  );
}
