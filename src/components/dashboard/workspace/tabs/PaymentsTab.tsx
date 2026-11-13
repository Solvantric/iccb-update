"use client";
import { useState } from "react";
import { format } from "date-fns";
import { DownloadSimple, Eye, PencilSimple, Plus, Receipt, ShieldCheck, Trash } from "@phosphor-icons/react";
import type { Payment, PaymentInput } from "@/types/crm";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from "@/types/crm";
import { getSettings } from "@/lib/crm/db";
import { firstEventDate, lastEventDate } from "@/lib/crm/pricing";
import { balanceDueDate, refundDueDate } from "@/lib/crm/rules";
import { fmtDate, taka, todayYmd } from "@/lib/crm/format";
import { recordPayment, updatePayment } from "@/services/crm/bookings.service";
import { useCrmAction, useCrmRemove } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { Badge, Button, Card, CardHeader, Field, Input, NumberInput, Select, Textarea } from "../../ui/core";
import { Modal, useConfirm } from "../../ui/overlay";
import { AnimatedMoney, ProgressBar } from "../../ui/kpi";
import { useDocs } from "../../documents/useDocs";
import { useWs } from "../context";

function PaymentModal({ payment, onClose }: { payment?: Payment; onClose: () => void }) {
  const { b, est, me } = useWs();
  const advanceLeft = Math.max(0, est.advanceRequired - est.advancePaid);
  const [v, setV] = useState<PaymentInput>(() =>
    payment
      ? { bookingId: b.id, amount: payment.amount, method: payment.method, chequeNo: payment.chequeNo, bank: payment.bank, date: payment.date, receivedBy: payment.receivedBy, purpose: payment.purpose, note: payment.note }
      : { bookingId: b.id, amount: advanceLeft || Math.max(0, est.balance), method: "cheque", date: format(new Date(), "yyyy-MM-dd"), receivedBy: me.name, purpose: advanceLeft ? "advance" : est.balance - est.security > 0 ? "balance" : "security" }
  );
  const set = <K extends keyof PaymentInput>(k: K, val: PaymentInput[K]) => setV((s) => ({ ...s, [k]: val }));
  const save = useCrmAction(() => (payment ? updatePayment(payment.id, v) : recordPayment(v)), { success: (p) => (payment ? "Receipt updated" : `Money receipt ${p.mrNo} recorded`), onSuccess: onClose });
  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={payment ? `Edit ${payment.mrNo}` : "Record money receipt"}
      description="Cash, cheque or pay order only — recorded offline. MR number is generated automatically."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} disabled={!(v.amount > 0)} onClick={() => save.mutate(undefined)}>
            {payment ? "Save" : "Record receipt"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount" required>
          <NumberInput value={v.amount} onChange={(n) => set("amount", n)} money />
        </Field>
        <Field label="Date">
          <Input type="date" value={v.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
        <Field label="Method">
          <Select value={v.method} onChange={(x) => set("method", x as PaymentInput["method"])} options={PAYMENT_METHODS.map((m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] }))} />
        </Field>
        <Field label="Purpose">
          <Select value={v.purpose} onChange={(x) => set("purpose", x as PaymentInput["purpose"])} options={["advance", "balance", "security", "extra", "other"].map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) }))} />
        </Field>
        {v.method !== "cash" && (
          <>
            <Field label={v.method === "cheque" ? "Cheque no" : "Pay order no"}>
              <Input value={v.chequeNo ?? ""} onChange={(e) => set("chequeNo", e.target.value)} />
            </Field>
            <Field label="Bank">
              <Input value={v.bank ?? ""} onChange={(e) => set("bank", e.target.value)} />
            </Field>
          </>
        )}
        <Field label="Received by">
          <Input value={v.receivedBy} onChange={(e) => set("receivedBy", e.target.value)} />
        </Field>
        <Field label="Note" className="sm:col-span-2">
          <Textarea value={v.note ?? ""} onChange={(e) => set("note", e.target.value)} className="min-h-[60px]" />
        </Field>
      </div>
    </Modal>
  );
}

export function PaymentsTab() {
  const { b, est, payments, docs, canPay } = useWs();
  const [modal, setModal] = useState<{ payment?: Payment } | null>(null);
  const remove = useCrmRemove("payments", "Money receipt");
  const confirm = useConfirm();
  const docsApi = useDocs();
  const settings = getSettings();
  const event = firstEventDate(b);
  const due = event ? balanceDueDate(event, settings.balanceDueDays) : undefined;
  const overdue = due && due < todayYmd() && est.balance - est.security > 0 && b.status === "confirmed";
  const advancePct = est.advanceRequired ? Math.min(100, Math.round((est.advancePaid / est.venueRent) * 100)) : 0;
  const refundDue = b.refund?.dueDate ?? (event ? refundDueDate(lastEventDate(b), settings.holidays.map((h) => h.date)) : undefined);
  const sorted = [...payments].sort((a, c) => c.date.localeCompare(a.date));

  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="p-5 md:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-[13.5px] font-semibold text-crm-ink">Advance progress</p>
            <Badge tone={est.advancePaid >= est.advanceRequired ? "green" : "amber"}>{est.advancePaid >= est.advanceRequired ? "Advance met" : `${settings.advancePct}% required`}</Badge>
          </div>
          <div className="mt-4">
            <ProgressBar value={advancePct} marker={settings.advancePct} color={advancePct >= settings.advancePct ? "#12B76A" : "var(--crm-brand)"} className="h-3" />
            <div className="mt-2 flex justify-between text-[12.5px] text-crm-muted tabular">
              <span>
                Paid toward rent {taka(est.advancePaid)} ({advancePct}% of {taka(est.venueRent)})
              </span>
              <span>Required {taka(est.advanceRequired)}</span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Grand total", est.grandTotal],
              ["Received", est.received],
              ["Balance", est.balance],
              ["Security", est.security],
            ].map(([k, v]) => (
              <div key={k as string}>
                <p className="text-[12px] text-crm-muted">{k}</p>
                <AnimatedMoney value={v as number} className="text-[16px] font-bold text-crm-ink" />
              </div>
            ))}
          </div>
        </Card>
        <Card className={cn("p-5", overdue && "border-[#FECDCA]")}>
          <p className="text-[13.5px] font-semibold text-crm-ink">Full payment due</p>
          <p className={cn("mt-1 text-[22px] font-bold tabular", overdue ? "text-[#D92D20]" : "text-crm-ink")}>{fmtDate(due)}</p>
          <p className="text-[12px] text-crm-muted">{settings.balanceDueDays} days before the event. Reminders at 30, 20 and 16 days.</p>
          <div className="mt-4 border-t border-crm-line pt-3">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-crm-ink">
              <ShieldCheck size={16} /> Security money
            </p>
            <p className="text-[12.5px] text-crm-muted">
              {taka(est.security)} · refund due {fmtDate(refundDue)}
              {b.refund?.refundedAt ? ` · refunded ${fmtDate(b.refund.refundedAt)}` : ""}
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          icon={Receipt}
          title="Money receipts"
          action={
            canPay &&
            !b.closed && (
              <Button size="sm" variant="primary" icon={Plus} onClick={() => setModal({})}>
                Record receipt
              </Button>
            )
          }
        />
        <div className="overflow-x-auto px-5 pb-4">
          {sorted.length === 0 ? (
            <p className="py-4 text-[13px] text-crm-muted">No money receipts yet.</p>
          ) : (
            <table className="w-full min-w-[620px] text-[13px]">
              <thead>
                <tr className="border-b border-crm-line text-[12px] text-crm-muted">
                  <th className="py-2 text-start font-medium">MR No</th>
                  <th className="py-2 text-start font-medium">Date</th>
                  <th className="py-2 text-start font-medium">Method</th>
                  <th className="py-2 text-start font-medium">Purpose</th>
                  <th className="py-2 text-end font-medium">Amount</th>
                  <th className="w-28" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => {
                  const doc = docs.find((d) => d.kind === "money_receipt" && d.paymentId === p.id);
                  return (
                    <tr key={p.id} className="border-b border-crm-line last:border-0">
                      <td className="py-2.5 font-mono text-[12px] text-crm-ink">{p.mrNo}</td>
                      <td className="py-2.5 tabular">{fmtDate(p.date)}</td>
                      <td className="py-2.5">
                        {PAYMENT_METHOD_LABELS[p.method]}
                        {p.chequeNo && <span className="block text-[11.5px] text-crm-muted">#{p.chequeNo} · {p.bank}</span>}
                      </td>
                      <td className="py-2.5">
                        <Badge tone={p.purpose === "advance" ? "brand" : p.purpose === "security" ? "blue" : "neutral"}>{p.purpose}</Badge>
                      </td>
                      <td className="py-2.5 text-end font-semibold text-crm-ink tabular">{taka(p.amount)}</td>
                      <td className="py-2.5 text-end">
                        <div className="flex justify-end gap-1">
                          <Button size="icon-sm" variant="ghost" aria-label="View receipt" onClick={() => (doc ? docsApi.preview(doc) : docsApi.previewLive(b.id, "money_receipt", p.mrNo, p.id))}>
                            <Eye size={15} />
                          </Button>
                          {doc && (
                            <Button size="icon-sm" variant="ghost" aria-label="Download receipt" onClick={() => docsApi.download(doc)}>
                              <DownloadSimple size={15} />
                            </Button>
                          )}
                          {canPay && (
                            <>
                              <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setModal({ payment: p })}>
                                <PencilSimple size={15} />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                aria-label="Delete"
                                onClick={async () => {
                                  const r = await confirm({ title: `Delete ${p.mrNo}?`, tone: "danger", confirmLabel: "Delete", description: "The receipt moves to trash (undo available)." });
                                  if (r.ok) remove.mutate(p.id);
                                }}
                              >
                                <Trash size={15} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
      {modal && <PaymentModal payment={modal.payment} onClose={() => setModal(null)} />}
      {docsApi.viewer}
    </div>
  );
}
