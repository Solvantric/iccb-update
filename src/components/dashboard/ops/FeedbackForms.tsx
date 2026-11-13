"use client";
import { useState } from "react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { CheckCircle, Copy, Eye, HandCoins, Plus, LinkSimple, ShieldWarning, Star, Trash } from "@phosphor-icons/react";
import type { Booking, DamageClaim, DamageRow, Evaluation, Rating } from "@/types/crm";
import { DAMAGE_DEPARTMENTS } from "@/types/crm";
import { EVALUATION_CRITERIA, RATING_LABELS, evaluationScore } from "@/lib/crm/rules";
import { fmtDate, taka } from "@/lib/crm/format";
import { markRefunded, refundCalc, saveDamage, saveEvaluation } from "@/services/crm/bookings.service";
import { useCrmAction } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { Badge, Button, Card, CardHeader, Checkbox, Field, Input, NumberInput, Select, Textarea } from "../ui/core";
import { ProgressRing } from "../ui/kpi";
import { copyText } from "../ui/misc";
import { useDocs } from "../documents/useDocs";

/* ─── Evaluation of Service ──────────────────────────────────────────────── */

export function RatingGrid({ ratings, onChange, disabled }: { ratings: Evaluation["ratings"]; onChange: (k: number, r: Rating) => void; disabled?: boolean }) {
  return (
    <ol className="divide-y divide-crm-line">
      {EVALUATION_CRITERIA.map((c, i) => (
        <li key={c} className="grid gap-2 py-2.5 sm:grid-cols-[1fr_auto] sm:items-center">
          <span className="text-[13px] text-crm-ink">
            <span className="me-2 text-crm-muted tabular">{i + 1}.</span>
            {c}
          </span>
          <div className="flex gap-1">
            {([0, 1, 2, 3] as Rating[]).map((r) => (
              <button
                key={r}
                type="button"
                disabled={disabled}
                onClick={() => onChange(i + 1, r)}
                className={cn("rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors", ratings[i + 1] === r ? (r === 0 ? "bg-[#D92D20] text-white" : r === 1 ? "bg-[#F59E0B] text-white" : r === 2 ? "bg-[#2E90FA] text-white" : "bg-[#12B76A] text-white") : "bg-crm-surface-2 text-crm-ink-2 hover:bg-crm-tint")}
              >
                {RATING_LABELS[r]}
              </button>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function EvaluationForm({ b, readonly }: { b: Booking; readonly?: boolean }) {
  const [ratings, setRatings] = useState<Evaluation["ratings"]>(b.evaluation?.ratings ?? {});
  const [suggestion, setSuggestion] = useState(b.evaluation?.suggestion ?? "");
  const save = useCrmAction(() => saveEvaluation(b.id, ratings, suggestion), { success: "Evaluation saved" });
  const docs = useDocs();
  const score = evaluationScore(ratings);
  const complete = Object.keys(ratings).length === EVALUATION_CRITERIA.length;
  const link = typeof window !== "undefined" ? `${window.location.origin}/en/evaluation?b=${b.id}` : `/en/evaluation?b=${b.id}`;
  return (
    <Card>
      <CardHeader
        icon={Star}
        title="Evaluation of Service"
        description="14 criteria rated by the client. Share the public link or fill in with the client."
        action={
          <div className="flex items-center gap-2">
            {b.evaluation && <Badge tone={b.evaluation.submittedVia === "public" ? "blue" : "grey"}>{b.evaluation.submittedVia === "public" ? "Client form" : "Staff"}</Badge>}
            <ProgressRing value={score} size={44} color={score >= 75 ? "#12B76A" : score >= 50 ? "#F59E0B" : "#D92D20"} label={String(score)} />
          </div>
        }
      />
      <div className="px-5 pb-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-crm-surface-2 p-2.5">
          <LinkSimple size={18} className="text-crm-muted" />
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-crm-ink-2">{link}</span>
          <Button size="sm" icon={Copy} onClick={async () => (await copyText(link)) && toast.success("Link copied")}>
            Copy link
          </Button>
        </div>
        <RatingGrid ratings={ratings} disabled={readonly} onChange={(k, r) => setRatings((s) => ({ ...s, [k]: r }))} />
        <Field label="Suggestion" className="mt-3">
          <Textarea value={suggestion} disabled={readonly} onChange={(e) => setSuggestion(e.target.value)} />
        </Field>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button icon={Eye} onClick={() => docs.previewLive(b.id, "evaluation", "EVAL")}>
            Preview
          </Button>
          {!readonly && (
            <Button variant="primary" icon={CheckCircle} disabled={!complete} loading={save.isPending} onClick={() => save.mutate(undefined)}>
              {complete ? "Save evaluation" : `Rate all ${EVALUATION_CRITERIA.length} criteria`}
            </Button>
          )}
        </div>
      </div>
      {docs.viewer}
    </Card>
  );
}

/* ─── Damage claim ───────────────────────────────────────────────────────── */

export function DamageForm({ b, readonly }: { b: Booking; readonly?: boolean }) {
  const [d, setD] = useState<DamageClaim>(() => b.damage ?? { rows: [], certifiedBy: "", noDamage: false, done: false });
  const save = useCrmAction((done: boolean) => saveDamage(b.id, { ...d, done }), { success: "Damage claim saved — refund recalculated" });
  const docs = useDocs();
  const total = d.rows.reduce((s, r) => s + r.qty * r.rate, 0);
  const setRow = (id: string, patch: Partial<DamageRow>) => setD((s) => ({ ...s, rows: s.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  return (
    <Card>
      <CardHeader icon={ShieldWarning} title="Damage claim" description="Four departments. The total is deducted from security money." action={b.damage?.done && <Badge tone="green">Recorded</Badge>} />
      <div className="px-5 pb-5">
        <Checkbox checked={d.noDamage} disabled={readonly} onChange={(v) => setD((s) => ({ ...s, noDamage: v, rows: v ? [] : s.rows }))} label="No damage — nothing to claim" />
        {!d.noDamage && (
          <div className="mt-3 space-y-2 overflow-x-auto">
            {d.rows.map((r) => (
              <div key={r.id} className="grid min-w-[720px] grid-cols-[1.3fr_1.6fr_0.7fr_0.6fr_0.6fr_0.9fr_0.9fr_auto] items-center gap-2">
                <Select value={r.department} onChange={(v) => setRow(r.id, { department: v as DamageRow["department"] })} options={DAMAGE_DEPARTMENTS.map((x) => ({ value: x, label: x }))} disabled={readonly} />
                <Input value={r.item} disabled={readonly} onChange={(e) => setRow(r.id, { item: e.target.value })} placeholder="Item" />
                <Input type="time" value={r.time} disabled={readonly} onChange={(e) => setRow(r.id, { time: e.target.value })} />
                <Input value={r.uom} disabled={readonly} onChange={(e) => setRow(r.id, { uom: e.target.value })} placeholder="UOM" />
                <NumberInput value={r.qty} onChange={(n) => setRow(r.id, { qty: n })} />
                <NumberInput value={r.rate} onChange={(n) => setRow(r.id, { rate: n })} money />
                <span className="text-end text-[13px] font-semibold text-crm-ink tabular">{taka(r.qty * r.rate)}</span>
                <Button size="icon" variant="ghost" disabled={readonly} onClick={() => setD((s) => ({ ...s, rows: s.rows.filter((x) => x.id !== r.id) }))} aria-label="Remove">
                  <Trash size={15} />
                </Button>
              </div>
            ))}
            {!readonly && (
              <Button size="sm" icon={Plus} onClick={() => setD((s) => ({ ...s, rows: [...s.rows, { id: nanoid(5), department: "Maintenance / Civil", item: "", time: "", uom: "piece", qty: 1, rate: 0 }] }))}>
                Add item
              </Button>
            )}
            <p className="pt-2 text-end text-[14px] font-semibold text-crm-ink">Total {taka(total)}</p>
          </div>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="Certified by">
            <Input value={d.certifiedBy} disabled={readonly} onChange={(e) => setD((s) => ({ ...s, certifiedBy: e.target.value }))} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button icon={Eye} onClick={() => docs.previewLive(b.id, "damage_claim", "DMG")}>
              Preview
            </Button>
            {!readonly && (
              <Button variant="primary" loading={save.isPending} disabled={!d.noDamage && !d.rows.length} onClick={() => save.mutate(true)}>
                Save claim
              </Button>
            )}
          </div>
        </div>
      </div>
      {docs.viewer}
    </Card>
  );
}

/* ─── Refund ─────────────────────────────────────────────────────────────── */

export function RefundCard({ b, canRefund }: { b: Booking; canRefund: boolean }) {
  const [cheque, setCheque] = useState(b.refund?.chequeNo ?? "");
  const calc = refundCalc(b);
  const done = !!b.refund?.refundedAt;
  const refund = useCrmAction(() => markRefunded(b.id, cheque), { success: "Security money refunded" });
  const docs = useDocs();
  return (
    <Card>
      <CardHeader icon={HandCoins} title="Security money refund" description={`Account holder: ${b.refundAccountName ?? b.contact.name} · due ${fmtDate(b.refund?.dueDate)} (event + 15 working days, skipping Fri/Sat & holidays)`} action={done ? <Badge tone="green">Refunded</Badge> : <Badge tone="amber">Pending</Badge>} />
      <div className="px-5 pb-5">
        <dl className="space-y-1.5 text-[13px]">
          {[
            ["Security money held", calc.securityHeld],
            ["− Damages", calc.damages],
            ["− Outstanding dues", calc.dues],
          ].map(([k, v]) => (
            <div key={k as string} className="flex justify-between">
              <dt className="text-crm-ink-2">{k}</dt>
              <dd className="tabular text-crm-ink">{taka(v as number)}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-crm-line pt-1.5 text-[15px]">
            <dt className="font-semibold text-crm-ink">Refund amount</dt>
            <dd className="font-bold text-crm-brand tabular">{taka(done ? b.refund!.amount : calc.amount)}</dd>
          </div>
        </dl>
        {done ? (
          <p className="mt-3 text-[12.5px] text-[#067647]">
            Refunded {fmtDate(b.refund!.refundedAt)} · cheque {b.refund!.chequeNo}
          </p>
        ) : (
          canRefund && (
            <div className="mt-4 flex flex-wrap items-end gap-2">
              <Field label="Cheque no" className="flex-1">
                <Input value={cheque} onChange={(e) => setCheque(e.target.value)} />
              </Field>
              <Button variant="primary" disabled={!cheque.trim() || !b.damage?.done} loading={refund.isPending} onClick={() => refund.mutate(undefined)}>
                Mark refunded
              </Button>
            </div>
          )
        )}
        {!b.damage?.done && !done && <p className="mt-2 text-[12px] text-crm-muted">Record the damage claim (or “no damage”) first.</p>}
        <Button size="sm" className="mt-3" icon={Eye} onClick={() => docs.previewLive(b.id, "refund_note", "SRN")}>
          Preview refund note
        </Button>
      </div>
      {docs.viewer}
    </Card>
  );
}
