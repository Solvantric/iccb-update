"use client";
import { CheckCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { Segmented } from "../../ui/core";
import { PpmForm } from "../../ppm/PpmForm";
import { FactSheetForm } from "../../ops/FactSheetForm";
import { DamageForm, EvaluationForm } from "../../ops/FeedbackForms";
import { useWs } from "../context";

export type EventSub = "ppm" | "fact" | "feedback";

/** Operations side of the booking: PPM before, fact sheet on the day, feedback & damage after. */
export function EventTab({ sub, onSub }: { sub: EventSub; onSub: (s: EventSub) => void }) {
  const { b, canEdit, canOps } = useWs();
  if (b.status === "requested")
    return <div className="crm-card p-6 text-[13.5px] text-crm-muted">PPM, the event-day fact sheet and feedback open after the booking is confirmed.</div>;
  const readonly = !(canEdit || canOps) || !!b.closed;
  const done = { ppm: !!b.ppm?.done, fact: !!b.factSheet?.done, feedback: !!b.evaluation && !!b.damage?.done };
  const label = (k: EventSub, text: string) => (
    <span className="inline-flex items-center gap-1.5">
      {text}
      {done[k] && <CheckCircle size={13} weight="fill" className={cn(sub === k ? "text-[#12B76A]" : "text-[#12B76A]/80")} />}
    </span>
  );
  return (
    <div className="space-y-5">
      <Segmented value={sub} onChange={onSub} options={[{ value: "ppm", label: label("ppm", "1. PPM") }, { value: "fact", label: label("fact", "2. Event day") }, { value: "feedback", label: label("feedback", "3. Feedback & damage") }]} />
      {sub === "ppm" && <PpmForm key={b.ppm?.done ? "done" : "draft"} b={b} readonly={readonly} />}
      {sub === "fact" && <FactSheetForm key={b.factSheet?.done ? "done" : "draft"} b={b} readonly={readonly} />}
      {sub === "feedback" && (
        <div className="grid gap-5 xl:grid-cols-2">
          <EvaluationForm key={`ev-${b.evaluation?.submittedAt ?? "new"}`} b={b} readonly={readonly} />
          <DamageForm key={`dm-${b.damage?.done ? "done" : "new"}`} b={b} readonly={readonly} />
        </div>
      )}
    </div>
  );
}
