"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { differenceInCalendarDays } from "date-fns";
import { ArrowsClockwise, BookmarkSimple, Check, Copy, Crosshair, EnvelopeSimple, Lightning, NotePencil, PaperPlaneTilt, PencilSimple, Plus, Sparkle, Trash, UserPlus, WhatsappLogo, X } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { RadarEvent } from "@/types/crm";
import { useRole } from "@/lib/crm/db";
import { can } from "@/lib/crm/permissions";
import { fmtDate } from "@/lib/crm/format";
import { parseYmd } from "@/lib/crm/pricing";
import { convertRadarToLead, pitchText, refreshRadar } from "@/services/crm/sales.service";
import { useCrmAction, useCrmCreate, useCrmRemove, useCrmUpdate, useRadar } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { m, Item, Stagger } from "../ui/motion";
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, NumberInput, PageHeader, SearchInput, Segmented, Select, Skeleton, Textarea } from "../ui/core";
import { Drawer, Modal } from "../ui/overlay";
import { ProgressRing } from "../ui/kpi";
import { Bars, Donut } from "../ui/charts";
import { copyText } from "../ui/misc";

const CATEGORIES: RadarEvent["category"][] = ["Trade fair", "Exhibition", "Conference", "Concert", "Convocation", "Summit", "Wedding expo", "Education fair"];
const STATUS_TONE = { new: "brand", saved: "blue", contacted: "purple", converted: "green", dismissed: "grey" } as const;
const REGION: Record<string, string> = { Bangladesh: "Bangladesh", India: "South Asia", "Sri Lanka": "South Asia", Nepal: "South Asia", UAE: "Middle East", "Saudi Arabia": "Middle East", Qatar: "Middle East", Kuwait: "Middle East", Singapore: "SE Asia", Thailand: "SE Asia", Malaysia: "SE Asia", China: "East Asia", "Hong Kong": "East Asia" };

function RadarForm({ item, onClose }: { item?: RadarEvent; onClose: () => void }) {
  const [v, setV] = useState(() => ({
    title: item?.title ?? "",
    organizer: item?.organizer ?? "",
    industry: item?.industry ?? "",
    category: item?.category ?? ("Trade fair" as RadarEvent["category"]),
    scope: item?.scope ?? ("national" as RadarEvent["scope"]),
    country: item?.country ?? "Bangladesh",
    city: item?.city ?? "Dhaka",
    startDate: item?.startDate ?? "",
    endDate: item?.endDate ?? "",
    expectedAttendance: item?.expectedAttendance ?? 5000,
    score: item?.score ?? 70,
    summary: item?.summary ?? "",
    suggestedHall: item?.suggestedHall ?? "",
  }));
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((s) => ({ ...s, [k]: val }));
  const update = useCrmUpdate<RadarEvent>("radar", "Radar item updated");
  const create = useCrmCreate<RadarEvent>("radar", "Radar item added");
  const save = () => {
    if (!v.title.trim() || !v.organizer.trim()) return toast.error("Title and organizer are required");
    const patch = { ...v, endDate: v.endDate || v.startDate };
    if (item) update.mutate({ id: item.id, patch }, { onSuccess: onClose });
    else
      create.mutate(
        { ...patch, flag: v.scope === "national" ? "🇧🇩" : "🌐", sourceName: "Manual entry", sourceUrl: "", publishedAt: new Date().toISOString().slice(0, 10), whyFits: "Added manually by Marketing.", pitch: [`${v.suggestedHall || "ICCB halls"} fit ${v.expectedAttendance.toLocaleString("en-US")} attendees.`, "In-house catering, security and 3,500+ car parking.", "Early-bird date hold with a dedicated event manager."], recurrence: "annual", status: "new", isNew: true },
        { onSuccess: onClose }
      );
  };
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={item ? "Edit radar item" : "Add radar item"} size="lg" footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save} loading={create.isPending || update.isPending}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" required className="sm:col-span-2"><Input value={v.title} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="Organizer" required><Input value={v.organizer} onChange={(e) => set("organizer", e.target.value)} /></Field>
        <Field label="Industry"><Input value={v.industry} onChange={(e) => set("industry", e.target.value)} /></Field>
        <Field label="Category"><Select value={v.category} onChange={(x) => set("category", x as RadarEvent["category"])} options={CATEGORIES.map((c) => ({ value: c, label: c }))} /></Field>
        <Field label="Scope"><Select value={v.scope} onChange={(x) => set("scope", x as RadarEvent["scope"])} options={[{ value: "national", label: "National" }, { value: "international", label: "International" }]} /></Field>
        <Field label="Country"><Input value={v.country} onChange={(e) => set("country", e.target.value)} /></Field>
        <Field label="City"><Input value={v.city} onChange={(e) => set("city", e.target.value)} /></Field>
        <Field label="Start date"><Input type="date" value={v.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
        <Field label="End date"><Input type="date" value={v.endDate} onChange={(e) => set("endDate", e.target.value)} /></Field>
        <Field label="Expected attendance"><NumberInput value={v.expectedAttendance} onChange={(n) => set("expectedAttendance", n)} /></Field>
        <Field label="Relevance score (0–100)"><NumberInput value={v.score} onChange={(n) => set("score", Math.max(0, Math.min(100, n)))} /></Field>
        <Field label="Suggested hall / zone" className="sm:col-span-2"><Input value={v.suggestedHall} onChange={(e) => set("suggestedHall", e.target.value)} /></Field>
        <Field label="Summary" className="sm:col-span-2"><Textarea value={v.summary} onChange={(e) => set("summary", e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function PitchDrawer({ item, onClose }: { item: RadarEvent; onClose: () => void }) {
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [text, setText] = useState(() => pitchText(item, "email"));
  return (
    <Drawer open onOpenChange={(v) => !v && onClose()} title="Pitch generator" description={item.title} width={600} footer={<Button variant="primary" icon={Copy} onClick={async () => (await copyText(text)) && toast.success("Pitch copied")}>Copy pitch</Button>}>
      <Segmented
        value={channel}
        onChange={(c) => {
          setChannel(c);
          setText(pitchText(item, c));
        }}
        options={[{ value: "email", label: "Email", icon: EnvelopeSimple }, { value: "whatsapp", label: "WhatsApp", icon: WhatsappLogo }]}
      />
      <Textarea value={text} onChange={(e) => setText(e.target.value)} className="mt-4 min-h-[420px] font-mono text-[12.5px]" />
      <p className="mt-2 text-[12px] text-crm-muted">Template-based from the card&apos;s fields. Edit freely before copying.</p>
    </Drawer>
  );
}

function RadarCard({ r, onPitch, onEdit, onNote }: { r: RadarEvent; onPitch: () => void; onEdit: () => void; onNote: () => void }) {
  const role = useRole();
  const update = useCrmUpdate<RadarEvent>("radar");
  const remove = useCrmRemove("radar", "Radar item");
  const convert = useCrmAction(() => convertRadarToLead(r.id), { success: "Converted to lead + follow-up task" });
  const daysTo = differenceInCalendarDays(parseYmd(r.startDate), new Date());
  const canEdit = can(role, "update", "radar");
  const scoreColor = r.score >= 85 ? "#E24F5F" : r.score >= 70 ? "#EE8591" : "#8A8690";
  return (
    <m.div layout initial={{ opacity: 0, y: -16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ type: "spring", stiffness: 400, damping: 32 }} className={cn("crm-card relative flex flex-col p-4", r.isNew && "ring-2 ring-crm-brand/40 shadow-[0_0_0_6px_rgba(226,79,95,0.08)]", r.status === "dismissed" && "opacity-55")}>
      {r.isNew && (
        <m.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 end-3 rounded-full bg-crm-brand px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white shadow">
          New
        </m.span>
      )}
      <div className="flex items-start gap-3">
        <ProgressRing value={r.score} size={48} color={scoreColor} label={String(r.score)} />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-snug text-crm-ink">{r.title}</p>
          <p className="mt-0.5 truncate text-[12px] text-crm-muted">{r.organizer}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone="brand">{r.category}</Badge>
        <Badge tone="neutral">
          {r.flag} {r.city}, {r.country}
        </Badge>
        <Badge tone={daysTo < 60 ? "amber" : "neutral"}>{daysTo > 0 ? `in ${daysTo} days` : "started"}</Badge>
        <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-crm-ink-2 line-clamp-2">{r.summary}</p>
      <p className="mt-2 text-[12px] text-crm-muted">
        <Sparkle size={12} weight="fill" className="me-1 inline text-crm-brand" />
        {r.whyFits}
      </p>
      <div className="mt-3 rounded-lg bg-crm-surface-2 p-2.5">
        <p className="text-[11.5px] font-semibold text-crm-ink">Suggested: {r.suggestedHall}</p>
        <ul className="mt-1 list-disc space-y-0.5 ps-4 text-[11.5px] text-crm-ink-2">
          {r.pitch.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      <p className="mt-2 text-[11.5px] text-crm-muted">
        {fmtDate(r.startDate)} – {fmtDate(r.endDate)} · {r.expectedAttendance.toLocaleString("en-US")} expected · {r.recurrence}
        {r.lastHeldAt ? ` · last at ${r.lastHeldAt}` : ""}
      </p>
      {r.note && <p className="mt-2 rounded-md border border-crm-line px-2 py-1 text-[12px] text-crm-ink-2">📝 {r.note}</p>}
      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
        {r.status !== "converted" && canEdit ? (
          <Button size="sm" variant="primary" icon={UserPlus} loading={convert.isPending} onClick={() => convert.mutate(undefined)}>
            Convert to lead
          </Button>
        ) : r.leadId ? (
          <Link href={`/dashboard/marketing/leads?lead=${r.leadId}`}>
            <Button size="sm" variant="soft" icon={Check}>
              View lead
            </Button>
          </Link>
        ) : null}
        <Button size="sm" icon={PaperPlaneTilt} onClick={onPitch}>
          Pitch
        </Button>
        {canEdit && (
          <>
            <Button size="icon-sm" variant={r.status === "saved" ? "soft" : "ghost"} aria-label="Save" title="Save" onClick={() => update.mutate({ id: r.id, patch: { status: r.status === "saved" ? "new" : "saved", isNew: false } })}>
              <BookmarkSimple size={15} weight={r.status === "saved" ? "fill" : "regular"} />
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label="Mark contacted" title="Mark contacted" onClick={() => update.mutate({ id: r.id, patch: { status: "contacted", isNew: false } })}>
              <Check size={15} />
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label="Add note" title="Add note" onClick={onNote}>
              <NotePencil size={15} />
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label="Dismiss" title="Dismiss" onClick={() => update.mutate({ id: r.id, patch: { status: r.status === "dismissed" ? "new" : "dismissed", isNew: false } })}>
              <X size={15} />
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label="Edit" title="Edit" onClick={onEdit}>
              <PencilSimple size={15} />
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label="Delete" title="Delete" onClick={() => remove.mutate(r.id)}>
              <Trash size={15} />
            </Button>
          </>
        )}
      </div>
    </m.div>
  );
}

export function RadarPage() {
  const role = useRole();
  const radar = useRadar();
  const update = useCrmUpdate<RadarEvent>("radar", "Note saved");
  const [scope, setScope] = useState<"all" | "national" | "international">("all");
  const [industry, setIndustry] = useState("");
  const [status, setStatus] = useState("active");
  const [minScore, setMinScore] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<"score" | "date">("score");
  const [q, setQ] = useState("");
  const [pitch, setPitch] = useState<RadarEvent | null>(null);
  const [form, setForm] = useState<{ item?: RadarEvent; key: number } | null>(null);
  const [noteFor, setNoteFor] = useState<RadarEvent | null>(null);
  const [note, setNote] = useState("");
  const refresh = useCrmAction(() => refreshRadar(), { success: (items) => (items.length ? `${items.length} new opportunities found` : "No new opportunities right now") });

  const all = useMemo(() => radar.data ?? [], [radar.data]);
  const list = useMemo(() => {
    return all
      .filter((r) => scope === "all" || r.scope === scope)
      .filter((r) => !industry || r.industry === industry)
      .filter((r) => (status === "active" ? r.status !== "dismissed" && r.status !== "converted" : status === "all" ? true : r.status === status))
      .filter((r) => r.score >= minScore)
      .filter((r) => (!from || r.endDate >= from) && (!to || r.startDate <= to))
      .filter((r) => !q || `${r.title} ${r.organizer} ${r.industry} ${r.city}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (Number(!!b.isNew) - Number(!!a.isNew)) || (sort === "score" ? b.score - a.score : a.startDate.localeCompare(b.startDate)));
  }, [all, scope, industry, status, minScore, from, to, q, sort]);

  const [weekAgo] = useState(() => new Date(Date.now() - 7 * 86400000).toISOString());
  const strip = { fresh: all.filter((r) => r.createdAt >= weekAgo).length, high: all.filter((r) => r.score >= 85 && r.status !== "dismissed").length, converted: all.filter((r) => r.status === "converted").length };
  const regions = Object.entries(all.reduce<Record<string, number>>((acc, r) => ({ ...acc, [REGION[r.country] ?? "Other"]: (acc[REGION[r.country] ?? "Other"] ?? 0) + 1 }), {})).map(([region, n]) => ({ region, n })).sort((a, b) => b.n - a.n);
  const industries = Object.entries(all.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.industry]: (acc[r.industry] ?? 0) + 1 }), {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const donut = [...industries.slice(0, 6), ...(industries.length > 6 ? [{ name: "Other", value: industries.slice(6).reduce((s, x) => s + x.value, 0) }] : [])];

  return (
    <Stagger>
      <Item>
        <PageHeader
          eyebrow="Marketing"
          title={<span className="inline-flex items-center gap-2"><Crosshair size={26} weight="duotone" className="text-crm-brand" /> AI Opportunity Radar</span>}
          description="Upcoming national and international events ICCB can approach early. Scores, summaries and pitches are generated from sample data — live AI and news APIs connect later."
          actions={
            <>
              {can(role, "create", "radar") && (
                <Button icon={Plus} onClick={() => setForm({ key: Date.now() })}>
                  Add item
                </Button>
              )}
              <Button variant="primary" icon={ArrowsClockwise} loading={refresh.isPending} onClick={() => refresh.mutate(undefined)}>
                Refresh radar
              </Button>
            </>
          }
        />
      </Item>
      <Item>
        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-crm-tint-2 bg-crm-tint px-5 py-3 text-[13.5px] text-crm-ink">
          <Lightning size={18} weight="fill" className="text-crm-brand" />
          <span>
            This week: <strong>{strip.fresh}</strong> new opportunities
          </span>
          <span>·</span>
          <span>
            <strong>{strip.high}</strong> high-score
          </span>
          <span>·</span>
          <span>
            <strong>{strip.converted}</strong> converted
          </span>
        </div>
      </Item>
      <Item>
        <div className="mb-6 grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="By region" />
            <div className="px-3 pb-3">
              <Bars data={regions} x="region" series={[{ key: "n", label: "Opportunities" }]} horizontal height={190} />
            </div>
          </Card>
          <Card>
            <CardHeader title="By industry" />
            <div className="px-5 pb-5">
              <Donut data={donut} height={150} />
            </div>
          </Card>
        </div>
      </Item>
      <Item>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Segmented size="sm" value={scope} onChange={setScope} options={[{ value: "all", label: "All" }, { value: "national", label: "National" }, { value: "international", label: "International" }]} />
          <Select value={industry} onChange={setIndustry} placeholder="All industries" options={industries.map((i) => ({ value: i.name, label: i.name }))} className="w-auto min-w-[150px]" />
          <Select value={status} onChange={setStatus} options={[{ value: "active", label: "Active" }, { value: "new", label: "New" }, { value: "saved", label: "Saved" }, { value: "contacted", label: "Contacted" }, { value: "converted", label: "Converted" }, { value: "dismissed", label: "Dismissed" }, { value: "all", label: "All statuses" }]} className="w-auto" />
          <Select value={String(minScore)} onChange={(v) => setMinScore(Number(v))} options={[{ value: "0", label: "Any score" }, { value: "60", label: "Score 60+" }, { value: "75", label: "Score 75+" }, { value: "85", label: "Score 85+" }]} className="w-auto" />
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[150px]" aria-label="From" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[150px]" aria-label="To" />
          <Segmented size="sm" value={sort} onChange={setSort} options={[{ value: "score", label: "By score" }, { value: "date", label: "By date" }]} />
          <SearchInput value={q} onChange={setQ} className="w-full sm:ms-auto sm:w-56" />
        </div>
      </Item>
      <Item>
        {radar.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="relative">
            <AnimatePresence>
              {refresh.isPending && (
                <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-x-0 -top-2 z-10 h-1 overflow-hidden rounded-full bg-crm-tint">
                  <m.div className="h-full w-1/3 rounded-full bg-crm-brand" animate={{ x: ["-100%", "300%"] }} transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }} />
                </m.div>
              )}
            </AnimatePresence>
            {refresh.isPending && (
              <div className="mb-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-72 rounded-xl" />
                ))}
              </div>
            )}
            {list.length === 0 ? (
              <Card>
                <EmptyState icon={Crosshair} title="No opportunities match" description="Clear filters or refresh the radar." />
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                <AnimatePresence initial={false}>
                  {list.map((r) => (
                    <RadarCard key={r.id} r={r} onPitch={() => setPitch(r)} onEdit={() => setForm({ item: r, key: Date.now() })} onNote={() => { setNote(r.note ?? ""); setNoteFor(r); }} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </Item>
      {pitch && <PitchDrawer key={pitch.id} item={pitch} onClose={() => setPitch(null)} />}
      {form && <RadarForm key={form.key} item={form.item} onClose={() => setForm(null)} />}
      {noteFor && (
        <Modal open onOpenChange={(v) => !v && setNoteFor(null)} title="Add note" description={noteFor.title} footer={<Button variant="primary" onClick={() => update.mutate({ id: noteFor.id, patch: { note } }, { onSuccess: () => setNoteFor(null) })}>Save note</Button>}>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
        </Modal>
      )}
    </Stagger>
  );
}
