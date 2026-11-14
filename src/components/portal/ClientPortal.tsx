"use client";
/**
 * Client Self-Service Portal — /portal/[token]. No login: the token is checked
 * against the browser store for now (real validation moves to the backend later).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { AnimatePresence } from "framer-motion";
import { CalendarBlank, CheckCircle, Clock, DownloadSimple, FileArrowUp, FilePdf, Phone, ShieldCheck, Star, WarningCircle, WhatsappLogo } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Booking, Evaluation, PortalPpmAnswers } from "@/types/crm";
import { db, getSettings } from "@/lib/crm/db";
import { firstEventDate, lastEventDate } from "@/lib/crm/pricing";
import { balanceDueDate } from "@/lib/crm/rules";
import { EVALUATION_CRITERIA } from "@/lib/crm/rules";
import { fmtDate, fmtTime, taka, todayYmd } from "@/lib/crm/format";
import { PREMISES_GUIDELINES } from "@/data/crm/premises-guidelines";
import { CrmProvider, useCrmReady } from "@/components/providers/CrmProvider";
import { estimateFor } from "@/services/crm/bookings.service";
import { portalAcceptPolicies, portalFeedback, portalSubmitAnswers, portalUpload, resolvePortal, touchPortal } from "@/services/crm/features.service";
import { MotionProvider, m } from "@/components/dashboard/ui/motion";
import { Button, Checkbox, Field, Input, NumberInput, Segmented, Skeleton, Textarea } from "@/components/dashboard/ui/core";
import { RatingGrid } from "@/components/dashboard/ops/FeedbackForms";
import { liveModel } from "@/components/dashboard/documents/useDocs";
import { downloadPdf } from "@/components/dashboard/documents/DocumentViewer";
import { cn } from "@/lib/utils/cn";
import { PORTAL_STRINGS, type PortalDict, type PortalLang } from "./strings";

const LOGO = "https://res.cloudinary.com/sgufp9aq/image/upload/v1794418824/iccb-logo.png";
const LANGS: { code: PortalLang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "bn", label: "বাং" },
  { code: "ar", label: "عربي" },
  { code: "zh", label: "中文" },
];

export function ClientPortal() {
  return (
    <CrmProvider>
      <MotionProvider>
        <PortalInner />
      </MotionProvider>
    </CrmProvider>
  );
}

function PortalInner() {
  const { token } = useParams<{ token: string }>();
  const locale = useLocale() as PortalLang;
  const t = PORTAL_STRINGS[locale] ?? PORTAL_STRINGS.en;
  const ready = useCrmReady();
  // Subscribe to the stores the portal reads so it updates live.
  const bookings = db.bookings.store((s) => s.items);
  const links = db.portal.store((s) => s.items);
  const payments = db.payments.store((s) => s.items);
  const state = useMemo(() => (ready ? resolvePortal(token) : null), [ready, token, bookings, links, payments]); // eslint-disable-line react-hooks/exhaustive-deps
  const touched = useRef(false);
  useEffect(() => {
    if (state?.state === "ok" && !touched.current) {
      touched.current = true;
      touchPortal(token);
    }
  }, [state, token]);

  return (
    <div className="crm min-h-screen !bg-[var(--bg-soft)] text-[15px]">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Image src={LOGO} alt="ICCB — International Convention City Bashundhara" width={173} height={161} className="h-11 w-auto" priority />
          <nav className="flex gap-1" aria-label="Language">
            {LANGS.map((l) => (
              <a key={l.code} href={`${l.code === "en" ? "" : `/${l.code}`}/portal/${token}`} className={cn("rounded-[var(--radius-btn)] px-2 py-1 text-[12.5px] font-semibold", l.code === locale ? "bg-[var(--accent)] text-white" : "text-[var(--ink-muted)] hover:text-[var(--accent)]")}>
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 pb-20">
        {!state ? (
          <div className="space-y-4" aria-label={t.loading}>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : state.state !== "ok" ? (
          <BadLink t={t} kind={state.state} />
        ) : (
          <Portal b={state.booking} token={token} t={t} />
        )}
      </main>
    </div>
  );
}

function BadLink({ t, kind }: { t: PortalDict; kind: "expired" | "revoked" | "invalid" }) {
  const s = getSettings();
  return (
    <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="crm-card mt-10 p-8 text-center">
      <WarningCircle size={52} weight="duotone" className="mx-auto text-[var(--accent)]" />
      <h1 className="crm-display mt-4 text-[26px] font-semibold text-crm-ink">{kind === "expired" ? t.expired : kind === "revoked" ? t.revoked : t.invalid}</h1>
      <p className="mt-2 text-crm-muted">{t.badLinkText}</p>
      <p className="mt-5 text-[14px] text-crm-ink-2">
        {s?.orgPhone ?? "+88-01991-197719"}
        <br />
        {s?.orgEmail ?? "iccb@bga-bd.com"}
      </p>
    </m.div>
  );
}

/** Light scroll reveal for each section. */
function Section({ id, title, icon: I, children, done }: { id: string; title: string; icon: typeof Star; children: React.ReactNode; done?: boolean }) {
  return (
    <m.section id={id} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-8% 0px" }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="crm-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-crm-line px-5 py-3.5">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-crm-ink">
          <I size={19} className="text-[var(--accent)]" weight="duotone" /> {title}
        </h2>
        {done && <CheckCircle size={20} weight="fill" className="text-[#12B76A]" />}
      </div>
      <div className="px-5 py-4">{children}</div>
    </m.section>
  );
}

function Portal({ b, token, t }: { b: Booking; token: string; t: PortalDict }) {
  const est = useMemo(() => estimateFor(b), [b]);
  const today = todayYmd();
  const event = firstEventDate(b);
  const after = lastEventDate(b) < today;
  const rep = b.assignedTo ? db.users.get(b.assignedTo) : undefined;
  const hallNames = [...new Set(b.days.map((d) => db.halls.get(d.hallId)?.name).filter(Boolean))].join(", ");
  const balanceDue = balanceDueDate(event, getSettings()?.balanceDueDays ?? 15);
  const advance = est.advanceRequired;
  const advancePaid = Math.min(advance, est.received);
  const steps = [
    { label: t.s_requested, date: b.bookingDate, done: true },
    { label: t.s_confirmed, date: b.approvedAt, done: b.status !== "requested" },
    { label: t.s_completed, date: b.completedAt, done: b.status === "completed" },
  ];
  const doneSteps = steps.filter((s) => s.done).length;
  const services = [...b.menus.map((x) => `${x.name} × ${x.guests}`), ...b.addons.filter((a) => a.rate > 0).map((a) => a.name)];

  const pdf = async () => {
    const kind = db.invoices.active().some((d) => d.bookingId === b.id && d.kind === "invoice") ? "invoice" : "estimate";
    const id = toast.loading("PDF…");
    try {
      await downloadPdf(liveModel(b.id, kind, b.bfNo));
      toast.success("PDF", { id });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF failed", { id });
    }
  };

  return (
    <div className="space-y-5">
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
        <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] rtl:tracking-normal">{t.title} · {b.bfNo}</p>
        <h1 className="crm-display mt-1 text-[30px] font-semibold leading-tight text-crm-ink sm:text-[36px]">{b.eventTitle}</h1>
        <m.span aria-hidden className="mt-2 block h-[3px] w-12 origin-left bg-[var(--accent)] rtl:origin-right" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} />
        <p className="mt-3 text-crm-ink-2">
          {t.hello} {b.contact.name}! {t.intro}
        </p>
      </m.div>

      {/* 1. Status */}
      <Section id="status" title={t.status} icon={Clock}>
        <ol className="relative grid grid-cols-3 gap-2">
          <svg className="absolute start-[16.66%] top-[13px] h-1 w-[66.66%] overflow-visible" preserveAspectRatio="none" aria-hidden>
            <line x1="0" y1="1" x2="100%" y2="1" stroke="var(--line)" strokeWidth="3" />
            <m.line x1="0" y1="1" x2={`${((doneSteps - 1) / 2) * 100}%`} y2="1" stroke="var(--accent)" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} />
          </svg>
          {steps.map((s, i) => (
            <li key={s.label} className="relative flex flex-col items-center text-center">
              <m.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 + i * 0.25, type: "spring", stiffness: 400, damping: 22 }} className={cn("z-10 grid h-7 w-7 place-items-center rounded-full border-2", s.done ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)] bg-[var(--surface)] text-crm-muted")}>
                {s.done ? <CheckCircle size={16} weight="bold" /> : <span className="text-[12px] font-bold">{i + 1}</span>}
              </m.span>
              <span className={cn("mt-2 text-[13px] font-semibold", s.done ? "text-crm-ink" : "text-crm-muted")}>{s.label}</span>
              <span className="text-[12px] text-crm-muted">{s.done && s.date ? fmtDate(s.date) : t.pending}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* 2. My booking */}
      <Section id="booking" title={t.booking} icon={CalendarBlank}>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Row k={t.hall} v={hallNames} />
          <Row k={t.guests} v={`${b.guests.optimum}${b.guests.maximum > b.guests.optimum ? ` – ${b.guests.maximum}` : ""}`} />
          {b.days.map((d) => (
            <Row key={d.id} k={`${t.date}${b.days.length > 1 ? ` (${d.dayType === "program" ? "●" : "○"})` : ""}`} v={`${fmtDate(d.date, "EEE, dd MMM yyyy")} · ${fmtTime(d.start)}–${fmtTime(d.end)}`} />
          ))}
          <Row k={t.services} v={services.length ? services.join(", ") : t.none} wide />
        </dl>
      </Section>

      {/* 3. Bill & payments */}
      <Section id="bill" title={t.bill} icon={FilePdf}>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            [t.total, est.grandTotal],
            [t.received, est.received],
            [t.balance, Math.max(0, est.balance)],
          ].map(([k, v], i) => (
            <div key={k as string} className="rounded-[var(--radius-btn)] bg-crm-surface-2 px-2 py-3">
              <p className="text-[12px] text-crm-muted">{k}</p>
              <p className={cn("font-display text-[18px] font-semibold tabular sm:text-[22px]", i === 2 ? "text-[var(--accent)]" : "text-crm-ink")}>{taka(v as number)}</p>
            </div>
          ))}
        </div>
        <p className="mb-2 mt-5 text-[13px] font-semibold text-crm-ink">{t.schedule}</p>
        <ul className="divide-y divide-crm-line rounded-[var(--radius-btn)] border border-crm-line text-[13.5px]">
          <li className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="text-crm-ink-2">{t.advance}</span>
            <span className="text-end tabular">
              {taka(advance)} <Pill ok={advancePaid >= advance} t={t} />
            </span>
          </li>
          <li className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="text-crm-ink-2">
              {t.balanceDue} {fmtDate(balanceDue)}
            </span>
            <span className="text-end tabular">
              {taka(Math.max(0, est.grandTotal - advance))} <Pill ok={est.balance <= 0} t={t} />
            </span>
          </li>
        </ul>
        <p className="mt-4 rounded-[var(--radius-btn)] bg-[var(--bg-tint)] px-3 py-2.5 text-[13px] text-crm-ink-2">
          <span className="font-semibold text-crm-ink">{t.howToPay}: </span>
          {t.howToPayText}
        </p>
        <Button className="mt-4" icon={DownloadSimple} onClick={() => void pdf()}>
          {t.download}
        </Button>
      </Section>

      {/* 4. Documents */}
      <Section id="documents" title={t.documents} icon={FileArrowUp} done={b.documents.filter((d) => d.state !== "na" && d.key !== "ppm_copy").every((d) => d.state === "yes")}>
        <p className="mb-3 text-[13px] text-crm-muted">{t.docsIntro}</p>
        <ul className="space-y-2.5">
          {b.documents
            .filter((d) => d.state !== "na" && d.key !== "ppm_copy")
            .map((d) => (
              <DocRow key={d.key} token={token} b={b} docKey={d.key} t={t} />
            ))}
        </ul>
      </Section>

      {/* 5. PPM pre-questionnaire */}
      {b.status !== "completed" && (
        <Section id="ppm" title={t.ppm} icon={ShieldCheck} done={!!b.portalAnswers?.submittedAt}>
          {b.ppm?.done ? <p className="text-[14px] text-crm-ink-2">{t.ppmDone}</p> : <PpmQuestions b={b} token={token} t={t} />}
        </Section>
      )}

      {/* 6. Policies */}
      <Section id="policies" title={t.policies} icon={ShieldCheck} done={!!b.policyAccepted}>
        <Policies b={b} token={token} t={t} />
      </Section>

      {/* 7. Feedback */}
      <Section id="feedback" title={t.feedback} icon={Star} done={!!b.evaluation}>
        {!after ? <p className="text-[14px] text-crm-muted">{t.feedbackLater}</p> : b.evaluation ? <p className="flex items-center gap-2 text-[15px] font-semibold text-crm-ink"><CheckCircle size={22} weight="fill" className="text-[#12B76A]" /> {t.thanks}</p> : <Feedback token={token} t={t} />}
      </Section>

      {/* 8. Contact */}
      <Section id="contact" title={t.contact} icon={Phone}>
        <p className="text-[15px] font-semibold text-crm-ink">{rep?.name ?? "ICCB Sales"}</p>
        <p className="text-[13px] text-crm-muted">{rep?.designation ?? "Customer Representative"}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`tel:${rep?.phone ?? "+8801991197719"}`}>
            <Button icon={Phone}>{t.call}</Button>
          </a>
          <a href={`https://wa.me/${(rep?.phone ?? "01991197719").replace(/\D/g, "").replace(/^0/, "880")}`} target="_blank" rel="noreferrer">
            <Button variant="primary" icon={WhatsappLogo}>{t.whatsapp}</Button>
          </a>
        </div>
      </Section>
    </div>
  );
}

function Row({ k, v, wide }: { k: string; v: string; wide?: boolean }) {
  return (
    <div className={cn("min-w-0", wide && "sm:col-span-2")}>
      <dt className="text-[12px] text-crm-muted">{k}</dt>
      <dd className="text-[14px] text-crm-ink">{v}</dd>
    </div>
  );
}

function Pill({ ok, t }: { ok: boolean; t: PortalDict }) {
  return <span className={cn("ms-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold", ok ? "bg-[#ECFDF3] text-[#067647]" : "bg-[#FEF6E7] text-[#B54708]")}>{ok ? t.paid : t.due}</span>;
}

/* ─── Upload with an animated progress bar ───────────────────────────────── */

function DocRow({ token, b, docKey, t }: { token: string; b: Booking; docKey: string; t: PortalDict }) {
  const d = b.documents.find((x) => x.key === docKey)!;
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const status = d.state === "yes" && !d.uploadedVia ? "accepted" : d.review ?? (d.fileName ? "pending" : "missing");
  const label = { accepted: t.st_accepted, pending: t.st_pending, rejected: t.st_rejected, missing: t.st_missing }[status];
  const tone = { accepted: "bg-[#ECFDF3] text-[#067647]", pending: "bg-[#FEF6E7] text-[#B54708]", rejected: "bg-[#FEF3F2] text-[#B42318]", missing: "bg-crm-surface-2 text-crm-muted" }[status];

  const onFile = (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t.tooBig);
      return;
    }
    const reader = new FileReader();
    setProgress(0);
    reader.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 90));
    reader.onload = async () => {
      setProgress(95);
      try {
        await portalUpload(token, docKey, file.name, String(reader.result));
        setProgress(100);
        setTimeout(() => setProgress(null), 700);
      } catch (e) {
        setProgress(null);
        toast.error(e instanceof Error ? e.message : "Upload failed");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <li className="rounded-[var(--radius-btn)] border border-crm-line p-3">
      <div className="flex flex-wrap items-center gap-3">
        {d.fileData?.startsWith("data:image") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.fileData} alt="" className="h-11 w-11 rounded-[3px] object-cover" />
        ) : (
          <span className="grid h-11 w-11 place-items-center rounded-[3px] bg-crm-surface-2 text-crm-muted">
            <FilePdf size={20} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-crm-ink">{d.label}</p>
          <p className="truncate text-[12px] text-crm-muted">
            {d.fileName ?? (d.dueDate ? `${t.due} ${fmtDate(d.dueDate)}` : "")}
          </p>
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[11.5px] font-semibold", tone)}>{label}</span>
        {status !== "accepted" && (
          <>
            <input ref={input} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <Button size="sm" icon={FileArrowUp} onClick={() => input.current?.click()} disabled={progress !== null}>
              {d.fileName ? t.replace : t.upload}
            </Button>
          </>
        )}
      </div>
      {d.review === "rejected" && d.reviewNote && <p className="mt-2 text-[12.5px] text-[#B42318]">{d.reviewNote}</p>}
      <AnimatePresence>
        {progress !== null && (
          <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 6 }} exit={{ opacity: 0, height: 0 }} className="mt-2 overflow-hidden rounded-full bg-crm-line">
            <m.div className="h-full rounded-full bg-[var(--accent)]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} />
          </m.div>
        )}
      </AnimatePresence>
    </li>
  );
}

/* ─── PPM pre-questionnaire ──────────────────────────────────────────────── */

function PpmQuestions({ b, token, t }: { b: Booking; token: string; t: PortalDict }) {
  const [v, setV] = useState<PortalPpmAnswers>(() => b.portalAnswers ?? { guests: b.guests.optimum, management: "iccb", driverFood: "packet" });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof PortalPpmAnswers>(k: K, val: PortalPpmAnswers[K]) => setV((s) => ({ ...s, [k]: val }));
  const submit = async () => {
    setBusy(true);
    try {
      await portalSubmitAnswers(token, v);
      toast.success(t.sent);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-crm-muted">{t.ppmIntro}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.q_guests}><NumberInput value={v.guests} onChange={(n) => set("guests", n)} /></Field>
        <Field label={t.q_mgmt}><Segmented value={v.management ?? "iccb"} onChange={(x) => set("management", x)} options={[{ value: "iccb", label: t.q_mgmt_iccb }, { value: "own", label: t.q_mgmt_own }]} /></Field>
        <Field label={t.q_setup}><Input value={v.setup ?? ""} onChange={(e) => set("setup", e.target.value)} /></Field>
        <Field label={t.q_stage}><Input value={v.stageSize ?? ""} onChange={(e) => set("stageSize", e.target.value)} placeholder="29' × 19'" /></Field>
        <Field label={t.q_sound}><Input value={v.sound ?? ""} onChange={(e) => set("sound", e.target.value)} /></Field>
        <Field label={t.q_banners}><Input value={v.banners ?? ""} onChange={(e) => set("banners", e.target.value)} /></Field>
        <Field label={t.q_sofa}><NumberInput value={v.sofaRows} onChange={(n) => set("sofaRows", n)} /></Field>
        <Field label={t.q_head}><NumberInput value={v.headTable} onChange={(n) => set("headTable", n)} /></Field>
        <Field label={t.q_serving}><Input type="time" value={v.servingTime ?? ""} onChange={(e) => set("servingTime", e.target.value)} /></Field>
        <Field label={t.q_vehicles}><NumberInput value={v.vehicles} onChange={(n) => set("vehicles", n)} /></Field>
        <Field label={t.q_driver} className="sm:col-span-2"><Segmented value={v.driverFood ?? "packet"} onChange={(x) => set("driverFood", x)} options={[{ value: "inside", label: t.q_driver_inside }, { value: "packet", label: t.q_driver_packet }, { value: "none", label: t.q_driver_none }]} /></Field>
        <Field label={t.q_special} className="sm:col-span-2"><Textarea value={v.special ?? ""} onChange={(e) => set("special", e.target.value)} className="min-h-[70px]" /></Field>
      </div>
      <Button variant="primary" loading={busy} onClick={() => void submit()}>{t.submit}</Button>
      {b.portalAnswers?.submittedAt && <p className="text-[12.5px] text-[#067647]">✓ {t.sent} {fmtDate(b.portalAnswers.submittedAt)}</p>}
    </div>
  );
}

/* ─── Policies ───────────────────────────────────────────────────────────── */

function Policies({ b, token, t }: { b: Booking; token: string; t: PortalDict }) {
  const [agree, setAgree] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const rules = db.cancellation.active().sort((a, c) => c.minDays - a.minDays);
  return (
    <div className="space-y-4 text-[13.5px]">
      <p className="text-crm-muted">{t.policiesIntro}</p>
      <div>
        <p className="mb-1.5 font-semibold text-crm-ink">{t.prohibited}</p>
        <ul className="grid list-disc gap-x-6 gap-y-1 ps-5 text-crm-ink-2 sm:grid-cols-2">
          {PREMISES_GUIDELINES.slice(0, 12).map((g) => (
            <li key={g.id}>{g.title}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-1.5 font-semibold text-crm-ink">{t.cancellation}</p>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-crm-line text-crm-muted">
              <th className="py-1.5 text-start font-medium">{t.daysBefore}</th>
              <th className="py-1.5 text-end font-medium">{t.shift}</th>
              <th className="py-1.5 text-end font-medium">{t.cancel}</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className="border-b border-crm-line last:border-0">
                <td className="py-1.5">{r.maxDays == null ? `${r.minDays}+` : `${r.minDays}–${r.maxDays}`}</td>
                <td className="py-1.5 text-end tabular">{r.shiftPct}%</td>
                <td className="py-1.5 text-end tabular">{r.cancelPct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {b.policyAccepted ? (
        <p className="flex items-center gap-2 font-semibold text-[#067647]">
          <CheckCircle size={18} weight="fill" /> {t.accepted} “{b.policyAccepted.name}” · {fmtDate(b.policyAccepted.at)}
        </p>
      ) : (
        <div className="space-y-3 rounded-[var(--radius-btn)] bg-crm-surface-2 p-3">
          <Checkbox checked={agree} onChange={setAgree} label={t.agree} />
          <Field label={t.fullName}>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!agree} />
          </Field>
          <Button
            variant="primary"
            disabled={!agree || name.trim().length < 3}
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await portalAcceptPolicies(token, name);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Error");
              } finally {
                setBusy(false);
              }
            }}
          >
            {t.confirm}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Feedback (after the event) ─────────────────────────────────────────── */

function Feedback({ token, t }: { token: string; t: PortalDict }) {
  const [ratings, setRatings] = useState<Evaluation["ratings"]>({});
  const [suggestion, setSuggestion] = useState("");
  const [busy, setBusy] = useState(false);
  const complete = Object.keys(ratings).length === EVALUATION_CRITERIA.length;
  return (
    <div className="space-y-3">
      <p className="text-[13px] text-crm-muted">{t.feedbackIntro}</p>
      <RatingGrid ratings={ratings} onChange={(k, r) => setRatings((s) => ({ ...s, [k]: r }))} />
      <Field label={t.suggestion}>
        <Textarea value={suggestion} onChange={(e) => setSuggestion(e.target.value)} />
      </Field>
      <Button
        variant="primary"
        disabled={!complete}
        loading={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await portalFeedback(token, ratings, suggestion);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error");
          } finally {
            setBusy(false);
          }
        }}
      >
        {t.sendFeedback}
      </Button>
    </div>
  );
}
