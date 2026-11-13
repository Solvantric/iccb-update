"use client";
import { DamageForm, EvaluationForm, RefundCard } from "../../ops/FeedbackForms";
import { useWs } from "../context";

export function FeedbackTab() {
  const { b, canEdit, canOps, canPay, me } = useWs();
  if (b.status === "requested")
    return <div className="crm-card p-6 text-[13.5px] text-crm-muted">Feedback, damage claims and the security-money refund come after the event.</div>;
  const readonly = !(canEdit || canOps) || !!b.closed;
  return (
    <div className="space-y-5">
      <EvaluationForm key={`ev-${b.evaluation?.submittedAt ?? "new"}`} b={b} readonly={readonly} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <DamageForm key={`dm-${b.damage?.done ? "done" : "new"}`} b={b} readonly={readonly} />
        <RefundCard b={b} canRefund={canPay || me.role === "accounts" || me.role === "admin"} />
      </div>
    </div>
  );
}
