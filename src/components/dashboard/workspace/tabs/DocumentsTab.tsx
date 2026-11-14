"use client";
import { useState } from "react";
import { Check, DownloadSimple, Eye, FilePdf, FilePlus, Globe, Paperclip, Printer, Signature, Warning, X } from "@phosphor-icons/react";
import type { BookingDocument, DocKind, DocState } from "@/types/crm";
import { DOC_KIND_LABELS } from "@/types/crm";
import { isDocOverdue } from "@/lib/crm/rules";
import { openAmount, openFindings } from "@/lib/crm/leakage";
import { ago, fmtDate, taka, todayYmd } from "@/lib/crm/format";
import { acknowledge, findingsFor, generateDocument, updateBooking } from "@/services/crm/bookings.service";
import { reviewDocument } from "@/services/crm/features.service";
import { useCrmAction } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { Badge, Button, Card, CardHeader, Checkbox, Segmented } from "../../ui/core";
import { FileUpload, SignaturePad } from "../../ui/misc";
import { useConfirm } from "../../ui/overlay";
import { useDocs } from "../../documents/useDocs";
import { useWs } from "../context";

/** Documents: the PDFs ICCB generates + client sign-off + the papers the client must give. */
export function DocumentsTab() {
  return (
    <div className="space-y-5">
      <PdfDocuments />
      <ClientDocuments />
    </div>
  );
}

/* ─── Generated PDFs ─────────────────────────────────────────────────────── */

function PdfDocuments() {
  const { b, docs, canEdit, goTab } = useWs();
  const api = useDocs();
  const [history, setHistory] = useState(false);
  const [sig, setSig] = useState<string | undefined>(b.acknowledgement?.signature);
  const gen = useCrmAction((k: DocKind) => generateDocument(b.id, k), { success: (d) => `${DOC_KIND_LABELS[d.kind]} ${d.number} v${d.version} generated`, onSuccess: (d) => api.preview(d) });
  const ack = useCrmAction(() => acknowledge(b.id, sig), { success: "Acknowledgement saved" });
  const readonly = !canEdit || !!b.closed;
  const leaks = b.status === "requested" ? [] : openFindings(findingsFor(b));
  const live = docs.filter((d) => !d.deletedAt);
  const latest = (k: DocKind) => live.filter((d) => d.kind === k).sort((a, c) => c.version - a.version)[0];

  const rows: { kind: DocKind; show: boolean; can: boolean; why?: string; number?: string }[] = [
    { kind: "estimate", show: true, can: true },
    { kind: "booking_form", show: true, can: true, number: b.bfNo },
    { kind: "invoice", show: b.status !== "requested", can: leaks.length === 0, why: leaks.length ? `Blocked: ${leaks.length} unbilled item${leaks.length > 1 ? "s" : ""} (${taka(openAmount(leaks))})` : undefined },
    { kind: "refund_note", show: !!b.damage?.done, can: true },
  ];

  return (
    <Card>
      <CardHeader icon={FilePdf} title="PDF documents" description="Preview, generate a new version, download or print." action={live.length > 0 && <Button size="sm" variant="ghost" onClick={() => setHistory((v) => !v)}>{history ? "Hide history" : `History (${live.length})`}</Button>} />
      <ul className="divide-y divide-crm-line border-t border-crm-line">
        {rows.filter((r) => r.show).map((r) => {
          const d = latest(r.kind);
          return (
            <li key={r.kind} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium text-crm-ink">{DOC_KIND_LABELS[r.kind]}</p>
                <p className="text-[12px] text-crm-muted">
                  {d ? `${d.number} · v${d.version} · ${ago(d.createdAt)}` : "Not generated yet"}
                  {r.why && (
                    <button className="ms-2 font-semibold text-crm-brand hover:underline" onClick={() => goTab("services")}>
                      {r.why} →
                    </button>
                  )}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="icon-sm" variant="ghost" aria-label="Preview" title="Preview" onClick={() => (d ? api.preview(d) : api.previewLive(b.id, r.kind, r.number ?? "DRAFT"))}>
                  <Eye size={15} />
                </Button>
                {d && (
                  <>
                    <Button size="icon-sm" variant="ghost" aria-label="Download PDF" title="Download PDF" onClick={() => api.download(d)}>
                      <DownloadSimple size={15} />
                    </Button>
                    <Button size="icon-sm" variant="ghost" aria-label="Print" title="Print" onClick={() => api.print(d)}>
                      <Printer size={15} />
                    </Button>
                  </>
                )}
                {!readonly && (
                  <Button size="sm" variant={d ? "secondary" : "primary"} icon={FilePlus} disabled={!r.can} loading={gen.isPending && gen.variables === r.kind} onClick={() => gen.mutate(r.kind)}>
                    {d ? "New version" : "Generate"}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {history && (
        <ul className="divide-y divide-crm-line border-t border-crm-line bg-crm-surface-2/60 text-[12.5px]">
          {[...live].sort((a, c) => c.createdAt.localeCompare(a.createdAt)).map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 px-5 py-2">
              <span className="min-w-0 truncate text-crm-ink-2">
                {DOC_KIND_LABELS[d.kind]} <span className="font-mono text-crm-muted">{d.number}</span> v{d.version} · {d.createdBy} · {ago(d.createdAt)}
              </span>
              <span className="flex shrink-0 gap-1">
                <Button size="icon-sm" variant="ghost" aria-label="Preview" onClick={() => api.preview(d)}>
                  <Eye size={14} />
                </Button>
                <Button size="icon-sm" variant="ghost" aria-label="Download" onClick={() => api.download(d)}>
                  <DownloadSimple size={14} />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Client acknowledgement of the Booking Form & estimate */}
      <div className="border-t border-crm-line px-5 py-4">
        <p className="mb-2 flex items-center gap-2 text-[13.5px] font-semibold text-crm-ink">
          <Signature size={16} className="text-crm-brand" /> Client acknowledgement
        </p>
        {b.acknowledgement?.accepted ? (
          <p className="text-[12.5px] text-[#067647]">
            ✓ Client acknowledged the Booking Form & estimate {b.acknowledgement.at ? ago(b.acknowledgement.at) : ""}
            {b.acknowledgement.signature ? " · signed" : ""}
          </p>
        ) : readonly ? (
          <p className="text-[12.5px] text-crm-muted">Not acknowledged yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <SignaturePad value={sig} onChange={setSig} height={110} />
            <div className="space-y-2">
              <Checkbox checked={false} onChange={(v) => v && ack.mutate(undefined)} label="Client has read and accepted" />
            </div>
          </div>
        )}
      </div>
      {api.viewer}
    </Card>
  );
}

/* ─── Papers from the client ─────────────────────────────────────────────── */

function ClientDocuments() {
  const { b, canEdit, me } = useWs();
  const confirm = useConfirm();
  const [attach, setAttach] = useState<string | null>(null);
  const save = useCrmAction((a: { documents?: BookingDocument[]; note?: string; idVerified?: typeof b.idVerified }) => updateBooking(b.id, { ...(a.documents ? { documents: a.documents } : {}), ...(a.idVerified !== undefined ? { idVerified: a.idVerified } : {}) }, a.note), { success: "Saved" });
  const review = useCrmAction((a: { key: string; accept: boolean; note?: string }) => reviewDocument(b.id, a.key, a.accept, a.note), { success: (r) => (r.activity[r.activity.length - 1]?.text.includes("accepted") ? "Document accepted" : "Rejected — the client will see the note") });
  const today = todayYmd();
  const readonly = !canEdit && me.role !== "operations";
  const list = b.documents.filter((d) => d.state !== "na");
  const done = list.filter((d) => d.state === "yes").length;
  const setDoc = (id: string, patch: Partial<BookingDocument>, note?: string) => save.mutate({ documents: b.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)), note });

  return (
    <Card>
      <CardHeader title="Required from the client" description={`${done} of ${list.length} received · originals are due 5 days before the event.`} />
      {/* ID check */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-crm-line px-5 py-3">
        <div>
          <p className="text-[13.5px] font-medium text-crm-ink">NID / Passport verified</p>
          <p className="text-[12px] text-crm-muted">{b.idVerified ? `${b.idVerified.mode === "seen" ? "Original seen" : "Copy uploaded"} by ${b.idVerified.by} · ${ago(b.idVerified.at)}` : "Check the original at the meeting."}</p>
        </div>
        {b.idVerified ? (
          <Badge tone="green">Verified</Badge>
        ) : (
          !readonly && (
            <Button size="sm" variant="primary" onClick={() => save.mutate({ idVerified: { mode: "seen", at: new Date().toISOString(), by: me.name }, documents: b.documents.map((d) => (d.key === "nid" ? { ...d, state: "yes" } : d)), note: "Client ID seen & verified" })}>
              Mark original seen
            </Button>
          )
        )}
      </div>
      <ul className="divide-y divide-crm-line border-t border-crm-line">
        {list.map((d) => {
          const overdue = isDocOverdue(d, today);
          return (
            <li key={d.id} className={cn("px-5 py-3", overdue && "bg-[#FEF3F2]/60 dark:bg-[#2D1414]/50")}>
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className={cn("flex items-center gap-1.5 text-[13.5px] font-medium", overdue ? "text-[#B42318]" : "text-crm-ink")}>
                    {overdue && <Warning size={14} weight="fill" />}
                    {d.label}
                  </p>
                  <p className={cn("text-[12px]", overdue ? "text-[#B42318]" : "text-crm-muted")}>
                    {d.dueDate ? `Due ${fmtDate(d.dueDate)}${overdue ? " — overdue" : ""}` : "At booking"}
                    {d.fileName && (
                      <a href={d.fileData} target="_blank" rel="noreferrer" className={cn("ms-2 inline-flex items-center gap-1", d.fileData ? "text-crm-brand hover:underline" : "pointer-events-none")}>
                        <Paperclip size={12} /> {d.fileName}
                      </a>
                    )}
                  </p>
                </div>
                {!readonly && (
                  <Button size="icon-sm" variant="ghost" aria-label="Attach file" title="Attach file" onClick={() => setAttach(attach === d.id ? null : d.id)}>
                    <Paperclip size={15} />
                  </Button>
                )}
                <Segmented<DocState> size="sm" value={d.state} onChange={(v) => !readonly && setDoc(d.id, { state: v }, `${d.label}: ${v === "yes" ? "received" : v === "na" ? "not applicable" : "pending"}`)} options={[{ value: "yes", label: "Received" }, { value: "pending", label: "Pending" }, { value: "na", label: "N/A" }]} />
              </div>
              {attach === d.id && (
                <div className="mt-2 max-w-md">
                  <FileUpload value={d.fileData} fileName={d.fileName} onChange={(data, name) => { setDoc(d.id, { fileData: data, fileName: name, state: data ? "yes" : d.state }, data ? `Uploaded ${d.label}` : undefined); setAttach(null); }} label="Attach file" />
                </div>
              )}
              {d.uploadedVia === "portal" && d.review === "pending" && (
                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-[var(--radius-btn)] bg-crm-tint px-3 py-2 text-[12.5px]">
                  <Globe size={14} className="text-crm-brand" />
                  <span className="text-crm-ink-2">Client uploaded this {d.uploadedAt ? ago(d.uploadedAt) : ""} — please review.</span>
                  {!readonly && (
                    <span className="ms-auto flex gap-1.5">
                      <Button size="sm" variant="primary" icon={Check} onClick={() => review.mutate({ key: d.key, accept: true })}>
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={X}
                        onClick={async () => {
                          const r = await confirm({ title: `Reject "${d.label}"?`, description: "The client sees your note in the portal and can upload again.", tone: "danger", confirmLabel: "Reject", reason: { label: "Note for the client", required: true } });
                          if (r.ok && r.reason) review.mutate({ key: d.key, accept: false, note: r.reason });
                        }}
                      >
                        Reject
                      </Button>
                    </span>
                  )}
                </div>
              )}
              {d.review === "rejected" && d.reviewNote && <p className="mt-1 text-[12px] text-[#B42318]">Rejected: {d.reviewNote}</p>}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
