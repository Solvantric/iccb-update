"use client";
import { useState } from "react";
import { ClockCounterClockwise, DownloadSimple, Eye, FilePlus, Printer, Signature } from "@phosphor-icons/react";
import type { Booking, DocKind } from "@/types/crm";
import { DOC_KIND_LABELS } from "@/types/crm";
import { ago, taka } from "@/lib/crm/format";
import { acknowledge, generateDocument, updateBooking } from "@/services/crm/bookings.service";
import { useCrmAction } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { Badge, Button, Card, CardHeader, Checkbox, NumberInput } from "../../ui/core";
import { AnimatedMoney } from "../../ui/kpi";
import { SignaturePad } from "../../ui/misc";
import { useDocs } from "../../documents/useDocs";
import { useWs } from "../context";

const GROUP_LABEL = { venue: "Venue", service: "Service", food: "Food", decoration: "Decoration", addon: "Add-on", extra: "Extra", damage: "Damage" } as const;

function EditableCell({ value, onCommit, money, disabled }: { value: number; onCommit: (n: number) => void; money?: boolean; disabled?: boolean }) {
  const [v, setV] = useState(value);
  if (disabled) return <span className="tabular">{money ? taka(value) : value.toLocaleString("en-US")}</span>;
  return (
    <span onBlur={() => v !== value && onCommit(v)} className="block w-28 ms-auto">
      <NumberInput value={v} onChange={setV} money={money} />
    </span>
  );
}

export function EstimateTab() {
  const { b, est, docs, canEdit, payments } = useWs();
  const docsApi = useDocs();
  const [sig, setSig] = useState<string | undefined>(b.acknowledgement?.signature);
  const gen = useCrmAction((k: DocKind) => generateDocument(b.id, k), { success: (d) => `${DOC_KIND_LABELS[d.kind]} ${d.number} v${d.version} generated`, onSuccess: (d) => docsApi.preview(d) });
  const ack = useCrmAction(() => acknowledge(b.id, sig), { success: "Acknowledgement saved" });
  const save = useCrmAction((patch: Partial<Booking>) => updateBooking(b.id, patch, "Estimate line edited"));
  const readonly = !canEdit || !!b.closed;

  const commitLine = (lineId: string, field: "qty" | "rate", n: number) => {
    if (lineId.startsWith("addon-")) {
      const id = lineId.slice(6);
      save.mutate({ addons: b.addons.map((a) => (a.id === id ? { ...a, [field]: n } : a)) });
    } else if (lineId.startsWith("food-")) {
      const id = lineId.slice(5);
      save.mutate({ menus: b.menus.map((m) => (m.id === id ? { ...m, [field === "qty" ? "guests" : "perHead"]: n } : m)) });
    }
  };

  const history = [...docs].filter((d) => !d.deletedAt).sort((a, c) => c.createdAt.localeCompare(a.createdAt));
  const canInvoice = b.status !== "requested";

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Line items"
          description="Computed by the pricing engine from tariffs effective on the booking's price date. Add-on and food lines can be edited inline."
          action={
            <div className="flex flex-wrap gap-2">
              <Button size="sm" icon={Eye} onClick={() => docsApi.previewLive(b.id, "estimate", "DRAFT")}>
                Preview
              </Button>
              {!readonly && (
                <Button size="sm" variant="primary" icon={FilePlus} loading={gen.isPending && gen.variables === "estimate"} onClick={() => gen.mutate("estimate")}>
                  Generate estimate
                </Button>
              )}
            </div>
          }
        />
        <div className="overflow-x-auto px-5 pb-2">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="border-b border-crm-line text-[12px] text-crm-muted">
                <th className="py-2 text-start font-medium">Particular</th>
                <th className="py-2 text-start font-medium">Date</th>
                <th className="py-2 text-end font-medium">Qty</th>
                <th className="py-2 text-end font-medium">Rate</th>
                <th className="py-2 text-end font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {est.lines.map((l) => {
                const editable = !readonly && (l.id.startsWith("addon-") || l.id.startsWith("food-"));
                return (
                  <tr key={`${l.id}-${l.qty}-${l.rate}`} className="border-b border-crm-line last:border-0">
                    <td className="py-2 pe-3">
                      <span className="text-crm-ink">{l.particular}</span>
                      <span className="ms-2 align-middle">
                        <Badge tone={l.group === "venue" ? "brand" : l.group === "food" ? "amber" : l.group === "extra" || l.group === "damage" ? "red" : "neutral"}>{GROUP_LABEL[l.group]}</Badge>
                      </span>
                    </td>
                    <td className="py-2 whitespace-nowrap text-crm-muted tabular">{l.date ?? "—"}</td>
                    <td className="py-2 text-end">
                      <EditableCell value={l.qty} disabled={!editable} onCommit={(n) => commitLine(l.id, "qty", n)} />
                    </td>
                    <td className="py-2 text-end">
                      <EditableCell value={l.rate} money disabled={!editable} onCommit={(n) => commitLine(l.id, "rate", n)} />
                    </td>
                    <td className="py-2 text-end font-semibold text-crm-ink tabular whitespace-nowrap">{taka(l.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="grid gap-6 border-t border-crm-line px-5 py-4 md:grid-cols-2">
          <div className="space-y-1.5 text-[13px]">
            <Row k="Subtotal" v={est.subtotal} />
            <Row k={`Food VAT ${est.vatPct}% (on ${taka(est.food)})`} v={est.vat} />
            {est.ait > 0 && <Row k={`AIT ${est.aitPct}%`} v={est.ait} />}
            <Row k="Total" v={est.total} strong />
            <Row k="+ Security money" v={est.security} />
            <Row k={`− Discount${est.discountPending ? " (pending approval)" : ""}`} v={est.discount} />
          </div>
          <div className="space-y-1.5 text-[13px]">
            <Row k="Grand total" v={est.grandTotal} strong brand />
            <Row k={`Received (${payments.length} MR)`} v={est.received} />
            <Row k="Balance" v={est.balance} strong />
            <Row k="Venue rent" v={est.venueRent} muted />
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader icon={Signature} title="Booking Form & acknowledgement" description="Generate the Booking Form in ICCB layout; the client acknowledges with a tick and optional signature." />
          <div className="space-y-4 px-5 pb-5">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" icon={Eye} onClick={() => docsApi.previewLive(b.id, "booking_form", b.bfNo)}>
                Preview Booking Form
              </Button>
              {!readonly && (
                <Button size="sm" variant="primary" icon={FilePlus} loading={gen.isPending && gen.variables === "booking_form"} onClick={() => gen.mutate("booking_form")}>
                  Generate Booking Form
                </Button>
              )}
            </div>
            {!readonly && (
              <>
                <SignaturePad value={sig} onChange={setSig} />
                <Checkbox checked={!!b.acknowledgement?.accepted} onChange={(v) => v && ack.mutate(undefined)} disabled={!!b.acknowledgement?.accepted} label="Client has read and acknowledged the Booking Form & Provisional Estimate" description={b.acknowledgement?.at ? `Acknowledged ${ago(b.acknowledgement.at)}` : undefined} />
                {b.acknowledgement?.accepted && sig !== b.acknowledgement.signature && (
                  <Button size="sm" onClick={() => ack.mutate(undefined)}>
                    Save signature
                  </Button>
                )}
              </>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Invoice & refund note" description="Final invoice includes actual extras (fact sheet) and damages." />
          <div className="flex flex-wrap gap-2 px-5 pb-5">
            <Button size="sm" icon={Eye} onClick={() => docsApi.previewLive(b.id, "invoice", "DRAFT")}>
              Preview invoice
            </Button>
            {!readonly && canInvoice && (
              <Button size="sm" variant="primary" icon={FilePlus} loading={gen.isPending && gen.variables === "invoice"} onClick={() => gen.mutate("invoice")}>
                Generate invoice
              </Button>
            )}
            {!readonly && b.damage?.done && (
              <Button size="sm" icon={FilePlus} onClick={() => gen.mutate("refund_note")}>
                Generate refund note
              </Button>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader icon={ClockCounterClockwise} title="Document history" description="Every generated version is kept." />
        <div className="px-5 pb-4">
          {history.length === 0 ? (
            <p className="py-3 text-[13px] text-crm-muted">Nothing generated yet.</p>
          ) : (
            <ul className="divide-y divide-crm-line">
              {history.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium text-crm-ink">
                      {DOC_KIND_LABELS[d.kind]} <span className="font-mono text-[12px] text-crm-muted">{d.number}</span> <Badge tone="grey">v{d.version}</Badge>
                    </p>
                    <p className="text-[12px] text-crm-muted">
                      {d.createdBy} · {ago(d.createdAt)} · {taka(d.total)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon-sm" variant="ghost" aria-label="Preview" onClick={() => docsApi.preview(d)}>
                      <Eye size={15} />
                    </Button>
                    <Button size="icon-sm" variant="ghost" aria-label="Download PDF" onClick={() => docsApi.download(d)}>
                      <DownloadSimple size={15} />
                    </Button>
                    <Button size="icon-sm" variant="ghost" aria-label="Print" onClick={() => docsApi.print(d)}>
                      <Printer size={15} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
      {docsApi.viewer}
    </div>
  );
}

function Row({ k, v, strong, brand, muted }: { k: string; v: number; strong?: boolean; brand?: boolean; muted?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-3", strong && "border-t border-crm-line pt-1.5")}>
      <span className={cn(muted ? "text-crm-muted" : "text-crm-ink-2", strong && "font-semibold text-crm-ink")}>{k}</span>
      <AnimatedMoney value={v} className={cn("tabular", strong ? "font-bold" : "", brand ? "text-crm-brand text-[15px]" : "text-crm-ink")} />
    </div>
  );
}
