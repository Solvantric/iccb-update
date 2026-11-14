"use client";
import { useState } from "react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { Plus, Star, Trash } from "@phosphor-icons/react";
import type { Booking, DamageItem, FeedbackArea } from "@/types/crm";
import { FEEDBACK_AREAS } from "@/types/crm";
import { money } from "@/lib/crm/format";
import { saveDamages, saveFeedback } from "@/services/crm";
import { cn } from "@/lib/utils/cn";
import { Button, Field, Input, Textarea } from "../ui/core";
import { Modal } from "../ui/overlay";
import { m } from "../ui/motion";

export const feedbackScore = (b: Booking) => {
  const vals = Object.values(b.feedback?.ratings ?? {}).filter((v) => typeof v === "number" && v > 0);
  if (!vals.length) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
};
export const damageTotal = (b: Booking) => (b.damages ?? []).reduce((s, d) => s + d.qty * d.rate, 0);

export function Stars({ value, onChange, size = 18 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} className={cn("transition-transform", onChange && "hover:scale-110")}>
          <Star size={size} weight={n <= Math.round(value) ? "fill" : "regular"} className={n <= Math.round(value) ? "text-crm-reserved" : "text-crm-line"} />
        </button>
      ))}
    </span>
  );
}

export function FeedbackModal({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  return (
    <Modal open={!!booking} onOpenChange={(v) => !v && onClose()} title="Client feedback" description={booking ? `${booking.name} · ${booking.eventName}` : undefined}>
      {booking && <FeedbackForm key={booking.id} booking={booking} onDone={onClose} />}
    </Modal>
  );
}

function FeedbackForm({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  const [ratings, setRatings] = useState<Record<FeedbackArea, number>>(() => booking.feedback?.ratings ?? (Object.fromEntries(FEEDBACK_AREAS.map((a) => [a, 0])) as Record<FeedbackArea, number>));
  const [comment, setComment] = useState(booking.feedback?.comment ?? "");
  const [actual, setActual] = useState(booking.actualGuests ?? booking.guests);
  const save = () => {
    if (Object.values(ratings).some((v) => !v)) return toast.error("Please rate every area.");
    saveFeedback(booking.id, { ratings, comment: comment.trim() || undefined }, actual || undefined);
    toast.success("Feedback saved");
    onDone();
  };
  return (
    <div className="space-y-4">
      <ul className="divide-y divide-crm-line rounded-[10px] border border-crm-line">
        {FEEDBACK_AREAS.map((a) => (
          <li key={a} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="text-[14px] text-crm-ink">{a}</span>
            <Stars value={ratings[a]} onChange={(v) => setRatings((r) => ({ ...r, [a]: v }))} />
          </li>
        ))}
      </ul>
      <Field label="Actual guests">
        <Input type="number" min={0} value={actual || ""} onChange={(e) => setActual(Number(e.target.value))} />
      </Field>
      <Field label="Comment">
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What the client said" />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button variant="primary" onClick={save}>
          Save feedback
        </Button>
      </div>
    </div>
  );
}

export function DamageModal({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  return (
    <Modal open={!!booking} onOpenChange={(v) => !v && onClose()} title="Damage claim" description={booking ? `${booking.eventName} · deducted from security money` : undefined}>
      {booking && <DamageForm key={booking.id} booking={booking} onDone={onClose} />}
    </Modal>
  );
}

function DamageForm({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  const [rows, setRows] = useState<DamageItem[]>(() => (booking.damages?.length ? booking.damages : [{ id: nanoid(6), item: "", qty: 1, rate: 0 }]));
  const total = rows.reduce((s, r) => s + r.qty * r.rate, 0);
  const upd = (id: string, patch: Partial<DamageItem>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <m.div key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap items-center gap-2">
          <Input value={r.item} onChange={(e) => upd(r.id, { item: e.target.value })} placeholder="Item (e.g. broken chair)" aria-label="Item" className="h-9 min-w-[160px] flex-1" />
          <Input type="number" min={0} value={r.qty || ""} onChange={(e) => upd(r.id, { qty: Number(e.target.value) })} aria-label="Quantity" className="h-9 w-20 text-end" />
          <span className="text-crm-muted">×</span>
          <Input type="number" min={0} value={r.rate || ""} onChange={(e) => upd(r.id, { rate: Number(e.target.value) })} aria-label="Rate" placeholder="Rate" className="h-9 w-28 text-end" />
          <Button size="icon-sm" variant="ghost" aria-label="Remove" onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}>
            <Trash size={15} />
          </Button>
        </m.div>
      ))}
      <Button size="sm" icon={Plus} onClick={() => setRows((rs) => [...rs, { id: nanoid(6), item: "", qty: 1, rate: 0 }])}>
        Add item
      </Button>
      <div className="flex items-center justify-between border-t border-crm-line pt-3 text-[14px]">
        <span className="text-crm-muted">Total to deduct</span>
        <span className="font-semibold text-crm-ink tabular">{money(total)}</span>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            saveDamages(booking.id, rows);
            toast.success("Damage claim saved");
            onDone();
          }}
        >
          Save claim
        </Button>
      </div>
    </div>
  );
}
