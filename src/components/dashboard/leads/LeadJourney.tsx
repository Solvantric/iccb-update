"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Buildings, ChatCircleText, CurrencyCircleDollar, Lock, MapPin, Plus, Trash, UsersThree } from "@phosphor-icons/react";
import type { Lead, LeadStage, LeadStepLog, LeadStepMode, LeadStepOutcome } from "@/types/crm";
import { IN_PERSON_MODES, LEAD_STAGE_HINTS, LEAD_STAGE_LABELS, LEAD_STAGES, LEAD_STEP_ACTIONS, LEAD_STEP_MODES, LEAD_STEP_OUTCOMES } from "@/types/crm";
import { useCurrentUser } from "@/lib/crm/db";
import { useHallMap, useHalls, useUsers } from "@/lib/crm/hooks";
import { fmtDate, money, timeAgo } from "@/lib/crm/format";
import { addLeadStep, deleteLeadStep } from "@/services/crm";
import { cn } from "@/lib/utils/cn";
import { Button, Field, Input, Select, Textarea } from "../ui/core";
import { Face, STAGE_ICON, stageColor } from "./shared";

/** What each step's update form asks for, beyond the basics. */
const STEP_FORM: Record<LeadStage, { prompt: string; amount?: string; halls?: boolean }> = {
  discover: { prompt: "First contact: who you spoke to and what the event is." },
  interested: { prompt: "What the client wants: date, guests, budget, questions." },
  appraisal: { prompt: "Site visit or quotation: halls shown and the price quoted.", amount: "Quotation (৳)", halls: true },
  confirmed: { prompt: "Date held: contract, advance asked or received.", amount: "Advance (৳)" },
  customer: { prompt: "After booking: hand-over and event follow-up." },
};

export const OUTCOME_STYLE: Record<LeadStepOutcome, string> = {
  positive: "bg-crm-success-bg text-crm-success",
  neutral: "bg-crm-reserved-bg text-crm-reserved-ink",
  negative: "bg-crm-danger/10 text-crm-danger",
};

export function OutcomePill({ outcome }: { outcome: LeadStepOutcome }) {
  return <span className={cn("inline-flex h-5 items-center whitespace-nowrap rounded-full px-2 text-[11.5px] font-medium", OUTCOME_STYLE[outcome])}>{LEAD_STEP_OUTCOMES[outcome]}</span>;
}

/**
 * The lead's 5-step journey: for each step, what the team did, where, with whom
 * and how it went. Employees add updates here; admins see every update.
 */
export function LeadJourney({ lead, openAdd = 0, onSaved, prefillAction }: { lead: Lead; /** Bump to open "Add update" on the current step (e.g. from the follow-up box). */ openAdd?: number; /** Called after an update is saved from an `openAdd` request. */ onSaved?: () => void; prefillAction?: string }) {
  const at = LEAD_STAGES.indexOf(lead.stage);
  const [step, setStep] = useState<LeadStage>(lead.stage);
  const [adding, setAdding] = useState(false);
  const [fromFollowUp, setFromFollowUp] = useState(false);
  const box = useRef<HTMLElement>(null);
  // A new request from the follow-up box opens the form on the current step.
  const [seen, setSeen] = useState(openAdd);
  if (openAdd !== seen) {
    setSeen(openAdd);
    setStep(lead.stage);
    setAdding(true);
    setFromFollowUp(true);
  }
  useEffect(() => {
    if (openAdd) box.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [openAdd]);
  const journey = lead.journey ?? [];
  const i = LEAD_STAGES.indexOf(step);
  const list = journey.filter((j) => j.stage === step);
  const reachedStep = i <= at;

  return (
    <section ref={box} className="scroll-mt-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-medium text-crm-muted">Journey · what the team did at each step</h3>
        <span className="text-[12px] text-crm-muted">{journey.length} update{journey.length === 1 ? "" : "s"}</span>
      </div>

      {/* Step picker */}
      <div role="tablist" aria-label="Funnel step" className="grid grid-cols-5 gap-1">
        {LEAD_STAGES.map((s, k) => {
          const n = journey.filter((j) => j.stage === s).length;
          const on = s === step;
          const I = STAGE_ICON[s];
          const c = stageColor(k);
          return (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                setStep(s);
                setAdding(false);
              }}
              className={cn("flex flex-col items-center gap-1 rounded-[8px] border px-1 py-2 text-[11px] transition-colors", on ? "border-transparent font-semibold" : "border-crm-line text-crm-muted hover:bg-crm-surface-2", k > at && "opacity-60")}
              style={on ? { background: c.tint, color: c.ink } : undefined}
            >
              <I size={16} weight={on ? "fill" : "regular"} />
              <span className="leading-tight">{LEAD_STAGE_LABELS[s]}</span>
              <span className={cn("tabular rounded-full px-1.5 text-[10.5px]", n ? "bg-crm-surface text-crm-ink-2" : "text-crm-muted")}>{k > at ? <Lock size={10} className="inline" /> : n}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-[10px] border border-crm-line p-3.5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-crm-ink">
              {i + 1}. {LEAD_STAGE_LABELS[step]}
              <span className="ms-2 text-[12px] font-normal text-crm-muted">{LEAD_STAGE_HINTS[step]}</span>
            </p>
            <p className="mt-0.5 text-[12px] text-crm-muted">{lead.stageAt[step] ? `Reached ${fmtDate(lead.stageAt[step]!.slice(0, 10), "d MMM yyyy")}` : "Not reached yet"}</p>
          </div>
          {reachedStep && !adding && (
            <Button size="sm" icon={Plus} onClick={() => setAdding(true)}>
              Add update
            </Button>
          )}
        </div>

        {adding && (
          <StepForm
            key={fromFollowUp ? `fu-${openAdd}` : step}
            lead={lead}
            stage={step}
            initialAction={fromFollowUp ? prefillAction : undefined}
            onDone={(saved) => {
              setAdding(false);
              if (saved && fromFollowUp) onSaved?.();
              setFromFollowUp(false);
            }}
          />
        )}

        {!reachedStep ? (
          <p className="text-[13px] text-crm-muted">Updates open when the lead reaches this step.</p>
        ) : list.length === 0 ? (
          !adding && <p className="text-[13px] text-crm-muted">No updates for this step yet. {STEP_FORM[step].prompt}</p>
        ) : (
          <ol className="relative space-y-3 border-s border-crm-line ps-4">
            {list.map((j) => (
              <StepEntry key={j.id} lead={lead} entry={j} />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function StepEntry({ lead, entry: j }: { lead: Lead; entry: LeadStepLog }) {
  const users = useUsers();
  const hallMap = useHallMap();
  const me = useCurrentUser();
  const user = (j.byId && users.find((u) => u.id === j.byId)) || { id: j.byId ?? j.by, name: j.by };
  const canDelete = me.role === "admin" || me.id === j.byId;
  return (
    <li className="group relative">
      <span className="absolute -start-[21px] top-2 h-2.5 w-2.5 rounded-full ring-4 ring-crm-surface" style={{ background: stageColor(j.stage).fill }} />
      <div className="flex items-start gap-2.5">
        <Face user={user} size={28} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[13.5px] font-medium text-crm-ink">{j.action}</span>
            <OutcomePill outcome={j.outcome} />
          </div>
          <p className="mt-0.5 text-[12px] text-crm-muted">
            {j.by} · {j.mode} · <span title={new Date(j.at).toLocaleString()}>{timeAgo(j.at)}</span>
          </p>
          <ul className="mt-1.5 space-y-1 text-[12.5px] text-crm-ink-2">
            {j.place && (
              <li className="flex gap-1.5">
                <MapPin size={14} className="mt-px shrink-0 text-crm-muted" />
                {j.place}
              </li>
            )}
            {j.metWith && (
              <li className="flex gap-1.5">
                <UsersThree size={14} className="mt-px shrink-0 text-crm-muted" />
                Met {j.metWith}
              </li>
            )}
            {j.hallIds?.length ? (
              <li className="flex gap-1.5">
                <Buildings size={14} className="mt-px shrink-0 text-crm-muted" />
                Showed {j.hallIds.map((h) => hallMap.get(h)?.name ?? h).join(", ")}
              </li>
            ) : null}
            {j.amount ? (
              <li className="flex gap-1.5">
                <CurrencyCircleDollar size={14} className="mt-px shrink-0 text-crm-muted" />
                {money(j.amount)}
              </li>
            ) : null}
          </ul>
          <p className="mt-1.5 text-[13px] text-crm-ink">{j.note}</p>
          {j.clientSaid && (
            <p className="mt-1.5 flex gap-1.5 rounded-[8px] bg-crm-surface-2 px-2.5 py-1.5 text-[12.5px] text-crm-ink-2">
              <ChatCircleText size={14} className="mt-px shrink-0 text-crm-muted" />
              <span>Client: “{j.clientSaid}”</span>
            </p>
          )}
        </div>
        {canDelete && (
          <button
            type="button"
            aria-label="Delete update"
            onClick={() => {
              deleteLeadStep(lead.id, j.id);
              toast("Update deleted");
            }}
            className="rounded-[6px] p-1 text-crm-muted opacity-0 transition-opacity hover:text-crm-danger focus:opacity-100 group-hover:opacity-100"
          >
            <Trash size={14} />
          </button>
        )}
      </div>
    </li>
  );
}

const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

function StepForm({ lead, stage, onDone, initialAction }: { lead: Lead; stage: LeadStage; onDone: (saved: boolean) => void; initialAction?: string }) {
  const halls = useHalls();
  const cfg = STEP_FORM[stage];
  // A follow-up task (e.g. "Send ICCB brochure") is offered as the first choice.
  const base = LEAD_STEP_ACTIONS[stage];
  const actions = initialAction && !base.includes(initialAction) ? [initialAction, ...base] : base;
  const at = LEAD_STAGES.indexOf(lead.stage);
  const next = LEAD_STAGES[at + 1];
  const canMove = stage === lead.stage && !lead.lost && next && next !== "customer";

  const [action, setAction] = useState<string>(initialAction || actions[0]);
  const [mode, setMode] = useState<LeadStepMode>(stage === "appraisal" ? "Met at ICCB" : "Phone call");
  const [when, setWhen] = useState(nowLocal);
  const [place, setPlace] = useState(stage === "appraisal" ? "ICCB, Kuril" : "");
  const [metWith, setMetWith] = useState(lead.name);
  const [hallIds, setHallIds] = useState<string[]>(cfg.halls && lead.hallId ? [lead.hallId] : []);
  const [amount, setAmount] = useState(0);
  const [outcome, setOutcome] = useState<LeadStepOutcome>("positive");
  const [note, setNote] = useState("");
  const [clientSaid, setClientSaid] = useState("");
  const [move, setMove] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inPerson = IN_PERSON_MODES.includes(mode);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      addLeadStep(lead.id, { stage, action, mode, at: new Date(when).toISOString(), place: inPerson ? place : undefined, metWith, hallIds: cfg.halls ? hallIds : undefined, amount: cfg.amount ? amount : undefined, outcome, note, clientSaid }, move && canMove ? next : undefined);
      toast.success(move && canMove ? `Update saved · moved to ${LEAD_STAGE_LABELS[next]}` : "Update saved");
      onDone(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={submit} className="mb-4 grid gap-3 rounded-[10px] bg-crm-surface-2/60 p-3 ring-1 ring-inset ring-crm-line sm:grid-cols-2">
      <p className="text-[12.5px] text-crm-muted sm:col-span-2">{cfg.prompt}</p>
      <div className="sm:col-span-2">
        <span className="mb-1.5 block text-[13px] font-medium text-crm-ink-2">What did you do?</span>
        <div className="flex flex-wrap gap-1.5">
          {actions.map((a) => (
            <button key={a} type="button" aria-pressed={action === a} onClick={() => setAction(a)} className={cn("h-7 rounded-full border px-2.5 text-[12.5px] transition-colors", action === a ? "border-crm-brand bg-crm-tint font-medium text-crm-brand-text" : "border-crm-line bg-crm-surface text-crm-ink-2 hover:border-crm-muted/50")}>
              {a}
            </button>
          ))}
        </div>
      </div>
      <Field label="How">
        <Select aria-label="How" value={mode} onChange={(v) => setMode(v as LeadStepMode)} options={LEAD_STEP_MODES.map((m) => ({ value: m, label: m }))} />
      </Field>
      <Field label="When">
        <Input type="datetime-local" aria-label="When" value={when} max={nowLocal()} onChange={(e) => setWhen(e.target.value)} />
      </Field>
      {inPerson && (
        <Field label="Where (place / address)" className="sm:col-span-2">
          <Input value={place} onChange={(e) => setPlace(e.target.value)} placeholder={mode === "Visited client" ? "e.g. Walton office, Gulshan 2" : "e.g. ICCB, Kuril · Noboratri hall"} />
        </Field>
      )}
      <Field label="Met / spoke to">
        <Input value={metWith} onChange={(e) => setMetWith(e.target.value)} placeholder="Name and role" />
      </Field>
      {cfg.amount && (
        <Field label={cfg.amount}>
          <Input type="number" min={0} step={10000} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} placeholder={String(lead.value || "")} />
        </Field>
      )}
      {cfg.halls && (
        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-[13px] font-medium text-crm-ink-2">Halls shown</span>
          <div className="flex flex-wrap gap-1.5">
            {halls
              .filter((h) => h.active)
              .map((h) => {
                const on = hallIds.includes(h.id);
                return (
                  <button key={h.id} type="button" aria-pressed={on} onClick={() => setHallIds(on ? hallIds.filter((x) => x !== h.id) : [...hallIds, h.id])} className={cn("h-7 rounded-full border px-2.5 text-[12.5px] transition-colors", on ? "border-crm-brand bg-crm-tint font-medium text-crm-brand-text" : "border-crm-line bg-crm-surface text-crm-ink-2")}>
                    {h.name}
                  </button>
                );
              })}
          </div>
        </div>
      )}
      <Field label="What happened" required className="sm:col-span-2">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What you did and agreed" className="min-h-[64px]" />
      </Field>
      <Field label="What the client said" className="sm:col-span-2">
        <Textarea value={clientSaid} onChange={(e) => setClientSaid(e.target.value)} placeholder="Their needs, questions or concerns" className="min-h-[48px]" />
      </Field>
      <div className="sm:col-span-2">
        <span className="mb-1.5 block text-[13px] font-medium text-crm-ink-2">How did it go?</span>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(LEAD_STEP_OUTCOMES) as LeadStepOutcome[]).map((o) => (
            <button key={o} type="button" aria-pressed={outcome === o} onClick={() => setOutcome(o)} className={cn("h-7 rounded-full px-3 text-[12.5px] font-medium ring-1 ring-inset transition-colors", outcome === o ? cn(OUTCOME_STYLE[o], "ring-current") : "bg-crm-surface text-crm-ink-2 ring-crm-line")}>
              {LEAD_STEP_OUTCOMES[o]}
            </button>
          ))}
        </div>
      </div>
      {canMove && (
        <label className="flex items-center gap-2 text-[13px] text-crm-ink-2 sm:col-span-2">
          <input type="checkbox" checked={move} onChange={(e) => setMove(e.target.checked)} className="h-4 w-4 accent-[var(--crm-brand)]" />
          Also move the lead to {LEAD_STAGE_LABELS[next]}
        </label>
      )}
      {error && <p className="text-[13px] text-crm-danger sm:col-span-2">{error}</p>}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" size="sm" variant="ghost" onClick={() => onDone(false)}>
          Cancel
        </Button>
        <Button type="submit" size="sm" variant="primary">
          Save update
        </Button>
      </div>
    </form>
  );
}
