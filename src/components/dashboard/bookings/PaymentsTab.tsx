"use client";
import { useState } from "react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { Eye, Money, Plus, Receipt, Trash } from "@phosphor-icons/react";
import type { Booking, PaymentKind, PaymentMethod } from "@/types/crm";
import { PAYMENT_KINDS, PAYMENT_METHODS } from "@/types/crm";
import { useBill, usePayments, useSecurityHeld } from "@/lib/crm/hooks";
import { fmtDate, money, todayYmd } from "@/lib/crm/format";
import { addPayment, deletePayment } from "@/services/crm";
import { invoiceModel, receiptModel } from "@/lib/pdf/actions";
import { viewPdf } from "../ui/PdfViewer";
import { Button, Card, EmptyState, Field, Input, ProgressBar, Select, Textarea } from "../ui/core";
import { Modal, useConfirm } from "../ui/overlay";
import { AnimatedNumber, m } from "../ui/motion";

export function PaymentsTab({ booking: b }: { booking: Booking }) {
  const payments = usePayments()
    .filter((p) => p.bookingId === b.id)
    .sort((x, y) => y.date.localeCompare(x.date) || y.createdAt.localeCompare(x.createdAt));
  const bill = useBill(b)!;
  const held = useSecurityHeld().get(b.id) ?? 0;
  const damages = (b.damages ?? []).reduce((t, d) => t + d.qty * d.rate, 0);
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const pct = bill.total ? (bill.paid / bill.total) * 100 : 0;

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13px] text-crm-muted">Paid</p>
            <p className="mt-1 text-[22px] font-semibold text-crm-ink">
              <AnimatedNumber value={bill.paid} format={money} /> <span className="text-[14px] font-normal text-crm-muted">of {money(bill.total)}</span>
            </p>
          </div>
          <div className="text-end">
            <p className="text-[13px] text-crm-muted">Due</p>
            <p className="mt-1 text-[16px] font-semibold text-crm-ink tabular">{money(bill.due)}</p>
          </div>
        </div>
        <ProgressBar value={pct} className="mt-4" />
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-crm-line pt-4 text-[13px] sm:grid-cols-4">
          <div>
            <p className="text-crm-muted">Advance (60%)</p>
            <p className="text-crm-ink tabular">{money(Math.round(bill.total * 0.6))}</p>
          </div>
          <div>
            <p className="text-crm-muted">Security required</p>
            <p className="text-crm-ink tabular">{money(bill.security)}</p>
          </div>
          <div>
            <p className="text-crm-muted">Security held</p>
            <p className="text-crm-ink tabular">{money(held)}</p>
          </div>
          <div>
            <p className="text-crm-muted">Damages to deduct</p>
            <p className={damages ? "text-crm-brand-text tabular" : "text-crm-ink tabular"}>{money(damages)}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
          <h2 className="text-[16px] font-semibold text-crm-ink">Payments</h2>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" icon={Eye} onClick={() => viewPdf(invoiceModel(b))}>
              View invoice
            </Button>
            {b.status !== "cancelled" && (
              <Button variant="primary" size="sm" icon={Plus} onClick={() => setOpen(true)}>
                Add payment
              </Button>
            )}
          </div>
        </div>
        {payments.length === 0 ? (
          <EmptyState icon={Money} text="No payment recorded yet." action={b.status !== "cancelled" && <Button onClick={() => setOpen(true)}>Add payment</Button>} />
        ) : (
          <ul className="divide-y divide-crm-line border-t border-crm-line">
            <AnimatePresence initial={false}>
              {payments.map((p) => (
                <m.li key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-crm-ink tabular">
                      {p.kind === "Security refund" ? `− ${money(p.amount)}` : money(p.amount)}
                      <span className="rounded-full bg-crm-surface-2 px-2 py-0.5 text-[11.5px] font-medium text-crm-ink-2 ring-1 ring-crm-line">{p.kind}</span>
                    </p>
                    <p className="text-[12.5px] text-crm-muted">
                      {fmtDate(p.date)} · {p.method}
                      {p.reference ? ` · ${p.reference}` : ""} · {p.receivedBy}
                      {p.note ? ` · ${p.note}` : ""}
                    </p>
                  </div>
                  <span className="text-[12px] text-crm-muted tabular">#{p.receiptNo}</span>
                  <Button size="sm" variant="ghost" icon={Receipt} onClick={() => viewPdf(receiptModel(p))}>
                    View receipt
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Delete payment"
                    onClick={async () => {
                      if (await confirm({ title: "Delete this payment?", description: `${money(p.amount)} on ${fmtDate(p.date)}`, confirmLabel: "Delete", danger: true })) {
                        deletePayment(p.id);
                        toast("Payment deleted");
                      }
                    }}
                  >
                    <Trash size={16} />
                  </Button>
                </m.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Card>
      <p className="text-[12.5px] text-crm-muted">Payments are recorded offline at ICCB — there is no online gateway.</p>
      <PaymentModal open={open} onOpenChange={setOpen} booking={b} due={bill.due} securityLeft={Math.max(0, bill.security - held)} refundable={Math.max(0, held - damages)} first={!payments.length} />
    </div>
  );
}

interface Amounts {
  due: number;
  securityLeft: number;
  refundable: number;
  first: boolean;
}

function PaymentModal({ open, onOpenChange, booking, ...amounts }: { open: boolean; onOpenChange: (v: boolean) => void; booking: Booking } & Amounts) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} size="sm" title="Add payment" description={`${booking.name} · due ${money(amounts.due)}`}>
      {open && <PaymentForm booking={booking} {...amounts} onDone={() => onOpenChange(false)} />}
    </Modal>
  );
}

function PaymentForm({ booking, due, securityLeft, refundable, first, onDone }: { booking: Booking; onDone: () => void } & Amounts) {
  const suggest = (k: PaymentKind) => (k === "Security deposit" ? securityLeft : k === "Security refund" ? refundable : due);
  const initialKind: PaymentKind = due > 0 ? (first ? "Advance" : "Installment") : securityLeft > 0 ? "Security deposit" : "Security refund";
  const [kind, setKind] = useState<PaymentKind>(initialKind);
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState(suggest(initialKind));
  const [date, setDate] = useState(todayYmd());
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [note, setNote] = useState("");
  const save = () => {
    try {
      const p = addPayment(booking.id, { amount, date, method, kind, reference, note });
      toast.success(`${money(p.amount)} recorded`, { action: { label: "View receipt", onClick: () => viewPdf(receiptModel(p)) } });
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    }
  };
  return (
    <div className="space-y-4">
      <Field label="Payment type" required>
        <Select
          value={kind}
          onChange={(v) => {
            setKind(v as PaymentKind);
            setAmount(suggest(v as PaymentKind));
          }}
          options={PAYMENT_KINDS.map((x) => ({ value: x, label: x }))}
        />
      </Field>
      <Field label="Amount (৳)" required hint={kind === "Security refund" ? `Held minus damages: ${money(refundable)}` : kind === "Security deposit" ? `Required for ${booking.eventType}: ${money(securityLeft)} left` : undefined}>
        <Input type="number" min={1} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} className="tabular" autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" required>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Method" required>
          <Select value={method} onChange={(v) => setMethod(v as PaymentMethod)} options={PAYMENT_METHODS.map((x) => ({ value: x, label: x }))} />
        </Field>
      </div>
      <Field label="Reference" hint="Cheque no. or transaction ID">
        <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional" />
      </Field>
      <Field label="Note">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" className="min-h-[64px]" />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button variant="primary" onClick={save}>
          Save payment
        </Button>
      </div>
    </div>
  );
}
