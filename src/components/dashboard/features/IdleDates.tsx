"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { addDays, format } from "date-fns";
import { ArrowLeft, ArrowRight, CalendarX, Check, Copy, CurrencyCircleDollar, EnvelopeSimple, Megaphone, PaperPlaneTilt, Sparkle, Trash, WhatsappLogo, X } from "@phosphor-icons/react";
import type { Offer, OfferSegment } from "@/types/crm";
import { OFFER_SEGMENT_LABELS, OFFER_SEGMENTS } from "@/types/crm";
import { db, getFeatureSettings, getRates, useCurrentUser } from "@/lib/crm/db";
import { can } from "@/lib/crm/permissions";
import { compactDates, idleDays } from "@/lib/crm/idle";
import { parseYmd } from "@/lib/crm/pricing";
import { fmtDate, pct, taka, takaShort, todayYmd } from "@/lib/crm/format";
import { OFFER_TEMPLATE_BN, OFFER_TEMPLATE_EN } from "@/data/crm/offers";
import { estimateFor } from "@/services/crm/bookings.service";
import { audienceContacts, createOffer, markSentNow, offerDiscountPct, offerMessage, setOfferStatus, type AudienceContact } from "@/services/crm/features.service";
import { useBookings, useCrmAction, useCrmRemove, useHalls, useOfferRecipients, useOffers, usePayments } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { m } from "../ui/motion";
import { Badge, Button, Card, CardHeader, Checkbox, Field, Input, NumberInput, Segmented, Textarea, type Tone } from "../ui/core";
import { KpiCard } from "../ui/kpi";
import { DataTable, type Column } from "../ui/data-table";
import { Drawer, useConfirm } from "../ui/overlay";
import { copyText } from "../ui/misc";

const STATUS_TONE: Record<Offer["status"], Tone> = { draft: "grey", pending_approval: "amber", active: "green", ended: "neutral" };
const STATUS_LABEL: Record<Offer["status"], string> = { draft: "Draft", pending_approval: "Needs approval", active: "Active", ended: "Ended" };
type Cell = `${string}|${string}`;

export function IdleDatesTab() {
  const me = useCurrentUser();
  const halls = useHalls();
  const bookings = useBookings();
  const payments = usePayments();
  const offers = useOffers();
  const recipients = useOfferRecipients();
  const [sel, setSel] = useState<Set<Cell>>(new Set());
  const [builder, setBuilder] = useState(false);
  const [sending, setSending] = useState<Offer | null>(null);
  const drag = useRef<null | "add" | "remove">(null);
  const canCreate = can(me.role, "create", "offers");
  const canApprove = can(me.role, "approve", "offers");
  const today = todayYmd();

  useEffect(() => {
    const up = () => (drag.current = null);
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  const hallList = useMemo(() => (halls.data ?? []).filter((h) => h.active && !h.deletedAt && h.kind === "hall").sort((a, b) => a.order - b.order), [halls.data]);
  const idle = useMemo(() => (bookings.data ? idleDays({ from: today, days: 90 }, hallList, bookings.data, getRates()) : null), [bookings.data, hallList, today]);
  const idleMap = useMemo(() => new Map((idle?.days ?? []).map((d) => [`${d.hallId}|${d.date}` as Cell, d])), [idle]);
  const maxRent = useMemo(() => Math.max(1, ...(idle?.days ?? []).map((d) => d.rentAtRisk)), [idle]);

  const stats = useMemo(() => {
    const out = new Map<string, { sent: number; responded: number; booked: number; revenue: number }>();
    for (const o of offers.data ?? []) {
      const rs = (recipients.data ?? []).filter((r) => r.offerId === o.id);
      const won = (bookings.data ?? []).filter((b) => b.offerId === o.id && !b.closed);
      out.set(o.id, { sent: rs.filter((r) => r.sentAt).length, responded: rs.filter((r) => r.respondedAt).length, booked: won.length, revenue: won.reduce((s, b) => s + estimateFor(b, (payments.data ?? []).filter((p) => p.bookingId === b.id)).grandTotal, 0) });
    }
    return out;
  }, [offers.data, recipients.data, bookings.data, payments.data]);
  const recovered = [...stats.values()].reduce((s, x) => s + x.revenue, 0);

  const toggle = (c: Cell, mode?: "add" | "remove") =>
    setSel((s) => {
      const n = new Set(s);
      const on = mode ? mode === "add" : !n.has(c);
      if (on) n.add(c);
      else n.delete(c);
      return n;
    });
  const selected = [...sel].map((c) => idleMap.get(c)).filter(Boolean) as NonNullable<ReturnType<typeof idleMap.get>>[];
  const selRent = selected.reduce((s, d) => s + d.rentAtRisk, 0);

  const columns: Column<Offer>[] = [
    { id: "name", header: "Offer", primary: true, pinned: true, value: (o) => o.name, cell: (o) => <span><span className="block font-medium text-crm-ink">{o.name}</span><span className="font-mono text-[12px] text-crm-muted">{o.code}</span></span> },
    { id: "status", header: "Status", value: (o) => o.status, cell: (o) => <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge> },
    { id: "dates", header: "Halls & dates", value: (o) => o.dates[0], cell: (o) => <span className="block max-w-[220px] text-[12.5px]"><span className="block truncate text-crm-ink">{o.halls.map((h) => hallList.find((x) => x.id === h)?.name ?? h).join(", ")}</span><span className="text-crm-muted">{compactDates(o.dates)}</span></span>, hideOnMobile: true },
    { id: "discount", header: "Discount", align: "end", value: (o) => o.discountValue, cell: (o) => (o.discountType === "percent" ? `${o.discountValue}%` : taka(o.discountValue)) },
    { id: "sent", header: "Sent", align: "end", value: (o) => stats.get(o.id)?.sent ?? 0, cell: (o) => <span className="tabular">{stats.get(o.id)?.sent ?? 0}</span> },
    { id: "resp", header: "Responded", align: "end", value: (o) => stats.get(o.id)?.responded ?? 0, cell: (o) => <span className="tabular">{stats.get(o.id)?.responded ?? 0}</span>, hideOnMobile: true },
    { id: "booked", header: "Booked", align: "end", value: (o) => stats.get(o.id)?.booked ?? 0, cell: (o) => <span className="tabular font-semibold text-crm-ink">{stats.get(o.id)?.booked ?? 0}</span> },
    { id: "revenue", header: "Recovered", align: "end", value: (o) => stats.get(o.id)?.revenue ?? 0, cell: (o) => <span className="tabular">{takaShort(stats.get(o.id)?.revenue ?? 0)}</span> },
    { id: "conv", header: "Conversion", align: "end", value: (o) => pct(stats.get(o.id)?.booked ?? 0, stats.get(o.id)?.sent ?? 0), cell: (o) => `${pct(stats.get(o.id)?.booked ?? 0, stats.get(o.id)?.sent ?? 0)}%`, hideOnMobile: true },
  ];

  const status = useCrmAction((a: { id: string; s: Offer["status"] }) => setOfferStatus(a.id, a.s), { success: (o) => `${o.code}: ${STATUS_LABEL[o.status]}` });
  const remove = useCrmRemove("offers", "Offer");
  const confirm = useConfirm();
  const loading = !idle;

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Idle hall-days (90 days)" value={idle?.totalDays ?? 0} icon={CalendarX} tone="amber" loading={loading} />
        <KpiCard label="Revenue at risk" value={idle?.totalRent ?? 0} format={takaShort} icon={CurrencyCircleDollar} tone="brand" loading={loading} />
        <KpiCard label="Active offers" value={(offers.data ?? []).filter((o) => o.status === "active").length} icon={Megaphone} tone="blue" loading={offers.isLoading} />
        <KpiCard label="Recovered revenue" value={recovered} format={takaShort} icon={Sparkle} tone="green" loading={loading} />
      </div>

      <Card className="mb-6">
        <CardHeader
          icon={CalendarX}
          title="Idle hall-days — next 90 days"
          description="Darker = more rent at risk. Click or drag across idle cells to select, then create an offer."
          action={
            sel.size > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12.5px] text-crm-muted tabular">{sel.size} day{sel.size > 1 ? "s" : ""} · {takaShort(selRent)}</span>
                <Button size="sm" variant="ghost" onClick={() => setSel(new Set())}>Clear</Button>
                {canCreate && <Button size="sm" variant="primary" icon={Megaphone} onClick={() => setBuilder(true)}>Create offer for {sel.size} day{sel.size > 1 ? "s" : ""}</Button>}
              </div>
            )
          }
        />
        <div className="crm-scroll overflow-x-auto px-5 pb-5 select-none">
          {idle && (
            <table className="border-separate border-spacing-[3px] text-[10.5px]">
              <thead>
                <tr>
                  <th className="sticky start-0 z-10 bg-crm-surface" />
                  {idle.dates.map((d) => {
                    const dt = parseYmd(d);
                    return (
                      <th key={d} className={cn("w-7 min-w-7 pb-1 text-center font-medium", [4, 5, 6].includes(dt.getDay()) ? "text-crm-ink" : "text-crm-muted")}>
                        {dt.getDate() === 1 || d === idle.dates[0] ? <span className="block text-[10px] font-semibold uppercase text-crm-brand">{format(dt, "MMM")}</span> : <span className="block">&nbsp;</span>}
                        {format(dt, "d")}
                        <span className="block text-[9px] opacity-70">{format(dt, "EEEEE")}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {hallList.map((h, ri) => (
                  <tr key={h.id}>
                    <th className="sticky start-0 z-10 whitespace-nowrap bg-crm-surface pe-2 text-start text-[12px] font-medium text-crm-ink-2">
                      {h.name}
                      <span className="block text-[10.5px] font-normal text-crm-muted">{idle.byHall[h.id]?.days ?? 0} idle · {takaShort(idle.byHall[h.id]?.rent ?? 0)}</span>
                    </th>
                    {idle.dates.map((d, ci) => {
                      const c = `${h.id}|${d}` as Cell;
                      const day = idleMap.get(c);
                      const isSel = sel.has(c);
                      return (
                        <td key={d} className="p-0">
                          <m.button
                            type="button"
                            disabled={!day}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(0.6, (ri + ci) * 0.006), duration: 0.25 }}
                            onMouseDown={() => {
                              if (!day) return;
                              drag.current = isSel ? "remove" : "add";
                              toggle(c, drag.current);
                            }}
                            onMouseEnter={() => day && drag.current && toggle(c, drag.current)}
                            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && day && toggle(c)}
                            title={day ? `${h.name} · ${fmtDate(d, "EEE dd MMM")} · idle · ${taka(day.rentAtRisk)} at risk` : `${h.name} · ${fmtDate(d, "EEE dd MMM")} · booked / requested`}
                            className={cn("block h-7 w-7 rounded-[3px] transition-shadow", day ? "cursor-pointer hover:ring-2 hover:ring-crm-brand/40" : "cursor-not-allowed", isSel && "ring-2 ring-crm-brand ring-offset-1 ring-offset-crm-surface")}
                            style={{ background: day ? `color-mix(in srgb, var(--accent) ${Math.round(14 + (day.rentAtRisk / maxRent) * 46)}%, var(--crm-surface))` : "var(--crm-line)" }}
                            aria-pressed={isSel}
                            aria-label={day ? `${h.name} ${d} idle` : `${h.name} ${d} used`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[11.5px] text-crm-muted">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[2px]" style={{ background: "color-mix(in srgb, var(--accent) 20%, var(--crm-surface))" }} /> Idle (lower rent)</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[2px]" style={{ background: "color-mix(in srgb, var(--accent) 60%, var(--crm-surface))" }} /> Idle (higher rent)</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[2px] bg-crm-line" /> Booked / requested / preparation</span>
            <span>Bold weekday letters = Thu–Sat</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader icon={Megaphone} title="Offers" description="Sent / responded / booked and the revenue they brought back." />
        <div className="px-5 pb-5">
          <DataTable
            rows={offers.data}
            loading={offers.isLoading}
            columns={columns}
            initialSort={{ id: "status", dir: "asc" }}
            searchText={(o) => `${o.name} ${o.code}`}
            exportName="iccb-offers"
            empty={{ icon: Megaphone, title: "No offers yet", description: "Select idle days above to create one." }}
            rowActions={(o) => (
              <>
                {o.status === "active" && canCreate && <Button size="sm" variant="secondary" icon={PaperPlaneTilt} onClick={() => setSending(o)}>Send</Button>}
                {o.status === "pending_approval" && canApprove && <Button size="sm" variant="primary" icon={Check} onClick={() => status.mutate({ id: o.id, s: "active" })}>Approve</Button>}
                {o.status === "draft" && canCreate && <Button size="sm" onClick={() => status.mutate({ id: o.id, s: "active" })}>Activate</Button>}
                {o.status === "active" && canCreate && <Button size="sm" variant="ghost" onClick={() => status.mutate({ id: o.id, s: "ended" })}>End</Button>}
                {canCreate && (
                  <Button size="icon-sm" variant="ghost" aria-label="Delete offer" onClick={async () => { const r = await confirm({ title: `Delete ${o.code}?`, tone: "danger", confirmLabel: "Delete" }); if (r.ok) remove.mutate(o.id); }}>
                    <Trash size={15} />
                  </Button>
                )}
              </>
            )}
          />
        </div>
      </Card>

      {builder && <OfferBuilder cells={selected} onClose={() => setBuilder(false)} onCreated={(o) => { setSel(new Set()); setBuilder(false); if (o.status === "active") setSending(o); }} />}
      {sending && <SendDrawer offer={sending} onClose={() => setSending(null)} />}
    </>
  );
}

/* ─── Offer builder (3 steps) ────────────────────────────────────────────── */

function OfferBuilder({ cells, onClose, onCreated }: { cells: { hallId: string; date: string; rentAtRisk: number }[]; onClose: () => void; onCreated: (o: Offer) => void }) {
  const me = useCurrentUser();
  const fs = getFeatureSettings();
  const [step, setStep] = useState(0);
  const halls = [...new Set(cells.map((c) => c.hallId))];
  const dates = [...new Set(cells.map((c) => c.date))].sort();
  const hallNames = halls.map((h) => db.halls.get(h)?.name ?? h).join(" / ");
  const [v, setV] = useState({
    name: `${hallNames} — ${compactDates(dates)}`,
    code: `ICCB-${format(parseYmd(dates[0]), "MMM").toUpperCase()}${String(dates.length).padStart(2, "0")}${halls.length}`,
    discountType: "percent" as "percent" | "amount",
    discountValue: 10,
    validUntil: format(addDays(new Date(), 14) < parseYmd(dates[0]) ? addDays(new Date(), 14) : addDays(parseYmd(dates[0]), -3), "yyyy-MM-dd"),
    messageEn: OFFER_TEMPLATE_EN,
    messageBn: OFFER_TEMPLATE_BN,
  });
  const [segments, setSegments] = useState<OfferSegment[]>(["lost_leads", "enquiries"]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [lang, setLang] = useState<"en" | "bn">("en");
  const contacts = useMemo(() => audienceContacts(segments), [segments]);
  const counts = useMemo(() => Object.fromEntries(OFFER_SEGMENTS.map((s) => [s, audienceContacts([s]).length])) as Record<OfferSegment, number>, []);
  const chosen = contacts.filter((c) => !excluded.has(c.key));
  const pctOff = offerDiscountPct({ ...v, halls, dates });
  const needsApproval = pctOff > fs.maxOfferDiscount && me.role !== "sales_manager" && me.role !== "admin";
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((s) => ({ ...s, [k]: val }));
  const create = useCrmAction((activate: boolean) => createOffer({ ...v, halls, dates, audience: segments, contacts: chosen, activate }), { success: (o) => (o.status === "pending_approval" ? `${o.code} sent for approval` : o.status === "active" ? `${o.code} is live` : `${o.code} saved as draft`), onSuccess: onCreated });
  const preview = offerMessage({ ...v, halls, dates, code: v.code.toUpperCase() }, lang, chosen[0]?.name ?? "Rahim");
  const steps = ["Dates & discount", "Audience", "Message"];

  return (
    <Drawer
      open
      onOpenChange={(o) => !o && onClose()}
      title="Create offer"
      description={`${dates.length} date${dates.length > 1 ? "s" : ""} · ${hallNames} · ${takaShort(cells.reduce((s, c) => s + c.rentAtRisk, 0))} at risk`}
      width={640}
      headerExtra={
        <div className="mt-3 flex items-center gap-2">
          {steps.map((s, i) => (
            <span key={s} className={cn("flex items-center gap-1.5 text-[12px] font-medium", i === step ? "text-crm-brand" : i < step ? "text-crm-ink" : "text-crm-muted")}>
              <span className={cn("grid h-5 w-5 place-items-center rounded-full text-[11px]", i <= step ? "bg-crm-brand text-white" : "bg-crm-surface-2")}>{i < step ? <Check size={11} weight="bold" /> : i + 1}</span>
              {s}
              {i < steps.length - 1 && <span className="mx-1 h-px w-5 bg-crm-line" />}
            </span>
          ))}
        </div>
      }
      footer={
        <>
          {step > 0 && <Button icon={ArrowLeft} onClick={() => setStep((s) => s - 1)}>Back</Button>}
          {step < 2 ? (
            <Button variant="primary" iconRight={ArrowRight} disabled={step === 1 && !chosen.length} onClick={() => setStep((s) => s + 1)}>Next</Button>
          ) : (
            <>
              <Button loading={create.isPending && create.variables === false} onClick={() => create.mutate(false)}>Save draft</Button>
              <Button variant="primary" icon={needsApproval ? Check : Megaphone} loading={create.isPending && create.variables === true} onClick={() => create.mutate(true)}>
                {needsApproval ? "Send for approval" : "Activate & send"}
              </Button>
            </>
          )}
        </>
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {cells.map((c) => (
                  <Badge key={`${c.hallId}${c.date}`} tone="brand">{db.halls.get(c.hallId)?.name} · {fmtDate(c.date, "EEE dd MMM")}</Badge>
                ))}
              </div>
              <Field label="Offer name"><Input value={v.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Code" hint="Clients quote this when booking."><Input value={v.code} onChange={(e) => set("code", e.target.value.toUpperCase())} className="font-mono" /></Field>
                <Field label="Valid until"><Input type="date" value={v.validUntil} onChange={(e) => set("validUntil", e.target.value)} /></Field>
                <Field label="Discount">
                  <Segmented size="sm" value={v.discountType} onChange={(x) => set("discountType", x)} options={[{ value: "percent", label: "% of rent" }, { value: "amount", label: "Amount ৳" }]} className="mb-2" />
                  <NumberInput value={v.discountValue} onChange={(n) => set("discountValue", n)} money={v.discountType === "amount"} suffix={v.discountType === "percent" ? "%" : undefined} />
                </Field>
                <div className={cn("self-end rounded-[var(--radius-btn)] px-3 py-2 text-[12.5px]", pctOff > fs.maxOfferDiscount ? "bg-[#FEF6E7] text-[#B54708] dark:bg-[#2B2010]" : "bg-crm-surface-2 text-crm-ink-2")}>
                  ≈ {pctOff}% off rent · max without approval {fs.maxOfferDiscount}%
                  {pctOff > fs.maxOfferDiscount && <span className="block font-semibold">{needsApproval ? "Needs Sales Manager approval" : "Above the max — you are approving it"}</span>}
                </div>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {OFFER_SEGMENTS.map((s) => (
                  <label key={s} className={cn("flex cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-btn)] border px-3 py-2.5 transition-colors", segments.includes(s) ? "border-crm-brand bg-crm-tint/50" : "border-crm-line")}>
                    <Checkbox checked={segments.includes(s)} onChange={(on) => setSegments((x) => (on ? [...x, s] : x.filter((y) => y !== s)))} label={<span className="text-[13px]">{OFFER_SEGMENT_LABELS[s]}</span>} />
                    <Badge tone="neutral">{counts[s]}</Badge>
                  </label>
                ))}
              </div>
              <p className="text-[12.5px] text-crm-muted">{chosen.length} of {contacts.length} contacts selected (duplicates removed). Untick anyone you don&apos;t want to message.</p>
              <ul className="crm-scroll max-h-[46vh] divide-y divide-crm-line overflow-y-auto rounded-[var(--radius-card-lg)] border border-crm-line">
                {contacts.map((c) => (
                  <li key={c.key} className="px-3 py-2">
                    <Checkbox checked={!excluded.has(c.key)} onChange={(on) => setExcluded((x) => { const n = new Set(x); if (on) n.delete(c.key); else n.add(c.key); return n; })} label={<span className="text-[13px]">{c.name} <span className="text-crm-muted">· {c.mobile || "no phone"}</span></span>} description={`${OFFER_SEGMENT_LABELS[c.segment]} · ${c.detail}`} />
                  </li>
                ))}
                {!contacts.length && <li className="px-3 py-4 text-[13px] text-crm-muted">Pick at least one segment.</li>}
              </ul>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-[12.5px] text-crm-muted">Placeholders: <code>{"{name} {hall} {dates} {discount} {code} {repPhone}"}</code></p>
              <Field label="Message (English)"><Textarea value={v.messageEn} onChange={(e) => set("messageEn", e.target.value)} className="min-h-[90px]" /></Field>
              <Field label="Message (বাংলা)"><Textarea value={v.messageBn} onChange={(e) => set("messageBn", e.target.value)} className="min-h-[90px]" /></Field>
              <div className="rounded-[var(--radius-card-lg)] border border-crm-line bg-crm-surface-2 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="meta-label text-[11px]">Live preview</p>
                  <Segmented size="sm" value={lang} onChange={setLang} options={[{ value: "en", label: "EN" }, { value: "bn", label: "বাংলা" }]} />
                </div>
                <div className="max-w-sm rounded-[10px] rounded-ss-[2px] bg-[#DCF8C6] px-3 py-2 text-[13px] text-[#111] shadow-sm">{preview}</div>
              </div>
              <p className="text-[12.5px] text-crm-muted">After activation you send it one by one on WhatsApp, copy the list, or email it.</p>
            </div>
          )}
        </m.div>
      </AnimatePresence>
    </Drawer>
  );
}

/* ─── Send (WhatsApp one by one / copy list / email) ─────────────────────── */

function SendDrawer({ offer, onClose }: { offer: Offer; onClose: () => void }) {
  const recipients = useOfferRecipients();
  const list = useMemo(() => (recipients.data ?? []).filter((r) => r.offerId === offer.id), [recipients.data, offer.id]);
  const [lang, setLang] = useState<"en" | "bn">("en");
  const queue = list.filter((r) => !r.sentAt && r.mobile);
  const current = queue[0];
  const msg = (name: string) => offerMessage(offer, lang, name);
  const wa = (mobile: string, name: string) => `https://wa.me/${mobile.replace(/\D/g, "").replace(/^0/, "880")}?text=${encodeURIComponent(msg(name))}`;
  return (
    <Drawer open onOpenChange={(o) => !o && onClose()} title={`Send ${offer.code}`} description={`${list.length} recipients · ${list.filter((r) => r.sentAt).length} sent`} width={560}>
      <div className="space-y-5">
        <Segmented size="sm" value={lang} onChange={setLang} options={[{ value: "en", label: "English" }, { value: "bn", label: "বাংলা" }]} />
        <Card className="p-5">
          <p className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-crm-ink"><WhatsappLogo size={18} className="text-[#25D366]" /> WhatsApp, one by one</p>
          {current ? (
            <>
              <p className="text-[13px] text-crm-ink-2">Next: <span className="font-semibold text-crm-ink">{current.contactName}</span> · {current.mobile}</p>
              <p className="mt-2 rounded-[var(--radius-btn)] bg-crm-surface-2 px-3 py-2 text-[12.5px] text-crm-ink-2">{msg(current.contactName)}</p>
              <div className="mt-3 flex gap-2">
                <a href={wa(current.mobile, current.contactName)} target="_blank" rel="noreferrer" onClick={() => markSentNow(current.id)}>
                  <Button variant="primary" icon={WhatsappLogo}>Open WhatsApp & mark sent</Button>
                </a>
                <Button icon={ArrowRight} onClick={() => markSentNow(current.id)}>Skip (mark sent)</Button>
              </div>
              <p className="mt-2 text-[12px] text-crm-muted">{queue.length} left in the queue.</p>
            </>
          ) : (
            <p className="text-[13px] text-[#067647]">Everyone with a phone number has been sent this offer.</p>
          )}
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button icon={Copy} onClick={() => void copyText(list.map((r) => `${r.contactName}\t${r.mobile}`).join("\n"))}>Copy list</Button>
          <a href={`mailto:?subject=${encodeURIComponent(`ICCB offer ${offer.code}`)}&body=${encodeURIComponent(msg("there"))}`}>
            <Button icon={EnvelopeSimple}>Email</Button>
          </a>
        </div>
        <Card>
          <CardHeader title="Recipients" />
          <ul className="divide-y divide-crm-line">
            {list.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 px-5 py-2 text-[12.5px]">
                <span className="min-w-0 truncate">
                  <span className="text-crm-ink">{r.contactName}</span> <span className="text-crm-muted">· {r.mobile || "no phone"} · {OFFER_SEGMENT_LABELS[r.source]}</span>
                </span>
                <span className="flex shrink-0 gap-1">
                  {r.bookingId ? <Link href={`/dashboard/sales/bookings/${r.bookingId}`}><Badge tone="green">Booked</Badge></Link> : r.respondedAt ? <Badge tone="blue">Responded</Badge> : r.sentAt ? <Badge tone="neutral">Sent</Badge> : <Badge tone="grey">Queued</Badge>}
                  {r.sentAt && !r.respondedAt && !r.bookingId && (
                    <button aria-label="Mark responded" className="text-crm-muted hover:text-crm-brand" onClick={() => db.offerRecipients.update(r.id, { respondedAt: new Date().toISOString() }, { silent: true })}>
                      <Check size={14} />
                    </button>
                  )}
                  {!r.sentAt && (
                    <button aria-label="Remove recipient" className="text-crm-muted hover:text-[#D92D20]" onClick={() => db.offerRecipients.remove(r.id, { silent: true })}>
                      <X size={14} />
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Drawer>
  );
}

export type { AudienceContact };
