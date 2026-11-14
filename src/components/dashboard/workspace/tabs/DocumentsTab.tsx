"use client";
import { useState } from "react";
import { Check, Eye, Globe, IdentificationCard, Warning, X } from "@phosphor-icons/react";
import { reviewDocument } from "@/services/crm/features.service";
import { useConfirm } from "../../ui/overlay";
import type { BookingDocument, DocState } from "@/types/crm";
import { isDocOverdue } from "@/lib/crm/rules";
import { fmtDate, todayYmd, ago } from "@/lib/crm/format";
import { updateBooking } from "@/services/crm/bookings.service";
import { useCrmAction } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { Badge, Button, Card, CardHeader, Segmented } from "../../ui/core";
import { FileUpload } from "../../ui/misc";
import { useDocs } from "../../documents/useDocs";
import { useWs } from "../context";

export function DocumentsTab() {
  const { b, canEdit, me } = useWs();
  const docsApi = useDocs();
  const [idFile, setIdFile] = useState<{ data?: string; name?: string }>({ data: b.idVerified?.fileData, name: b.idVerified?.fileName });
  const save = useCrmAction((a: { documents?: BookingDocument[]; note?: string; idVerified?: typeof b.idVerified }) => updateBooking(b.id, { ...(a.documents ? { documents: a.documents } : {}), ...(a.idVerified !== undefined ? { idVerified: a.idVerified } : {}) }, a.note), { success: "Saved" });
  const today = todayYmd();
  const readonly = !canEdit && me.role !== "operations";
  const confirm = useConfirm();
  const review = useCrmAction((a: { key: string; accept: boolean; note?: string }) => reviewDocument(b.id, a.key, a.accept, a.note), { success: (r) => (r.activity[r.activity.length - 1]?.text.includes("accepted") ? "Document accepted" : "Rejected — the client will see your note") });

  const setDoc = (id: string, patch: Partial<BookingDocument>, note?: string) => save.mutate({ documents: b.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)), note });
  const counts = { yes: b.documents.filter((d) => d.state === "yes").length, pending: b.documents.filter((d) => d.state === "pending").length, overdue: b.documents.filter((d) => isDocOverdue(d, today)).length };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader icon={IdentificationCard} title="Client identity" description="NID or Passport (and Trade License for organizations) — verified at the ICCB meeting, not online." />
        <div className="grid gap-4 px-5 pb-5 md:grid-cols-[1fr_auto] md:items-center">
          {b.idVerified ? (
            <div className="flex items-center gap-3">
              <Badge tone="green">Verified</Badge>
              <span className="text-[13px] text-crm-ink-2">
                {b.idVerified.mode === "seen" ? "Original seen" : `Uploaded: ${b.idVerified.fileName}`} by {b.idVerified.by} · {ago(b.idVerified.at)}
              </span>
              {b.idVerified.fileData && (
                <a href={b.idVerified.fileData} target="_blank" rel="noreferrer" className="text-[12.5px] text-crm-brand hover:underline">
                  View
                </a>
              )}
            </div>
          ) : (
            <FileUpload value={idFile.data} fileName={idFile.name} onChange={(data, name) => setIdFile({ data, name })} label="Upload NID / Passport copy" />
          )}
          {!readonly && (
            <div className="flex flex-wrap gap-2">
              {b.idVerified ? (
                <Button size="sm" onClick={() => save.mutate({ idVerified: undefined, note: "ID verification cleared" })}>
                  Clear
                </Button>
              ) : (
                <>
                  <Button size="sm" disabled={!idFile.data} onClick={() => save.mutate({ idVerified: { mode: "upload", fileName: idFile.name, fileData: idFile.data, at: new Date().toISOString(), by: me.name }, documents: b.documents.map((d) => (d.key === "nid" ? { ...d, state: "yes" } : d)), note: "Client ID uploaded & verified" })}>
                    Save upload
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => save.mutate({ idVerified: { mode: "seen", at: new Date().toISOString(), by: me.name }, documents: b.documents.map((d) => (d.key === "nid" ? { ...d, state: "yes" } : d)), note: "Client ID seen & verified" })}>
                    Mark original seen
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Document checklist"
          description="Due dates follow ICCB rules (5 days before; VAT challan 7 days; PPM copy 15 days). Overdue items turn red."
          action={
            <div className="flex gap-1.5">
              <Badge tone="green">{counts.yes} done</Badge>
              <Badge tone="amber">{counts.pending} pending</Badge>
              {counts.overdue > 0 && <Badge tone="red">{counts.overdue} overdue</Badge>}
            </div>
          }
        />
        <ul className="divide-y divide-crm-line">
          {b.documents.map((d) => {
            const overdue = isDocOverdue(d, today);
            return (
              <li key={d.id} className={cn("grid gap-3 px-5 py-3.5 md:grid-cols-[1fr_auto]", overdue && "bg-[#FEF3F2]/60 dark:bg-[#2D1414]/50")}>
                <div className="min-w-0">
                  <p className={cn("flex items-center gap-1.5 text-[13.5px] font-medium", overdue ? "text-[#B42318]" : d.state === "na" ? "text-crm-muted" : "text-crm-ink")}>
                    {overdue && <Warning size={15} weight="fill" />}
                    {d.label}
                  </p>
                  <p className={cn("text-[12px]", overdue ? "text-[#B42318]" : "text-crm-muted")}>{d.dueDate ? `Due ${fmtDate(d.dueDate)}${overdue ? " — overdue" : ""}` : "At booking"}</p>
                  {d.uploadedVia === "portal" && (
                    <div className={cn("mt-2 flex flex-wrap items-center gap-2 rounded-[var(--radius-btn)] px-3 py-2 text-[12.5px]", d.review === "pending" ? "bg-crm-tint" : "bg-crm-surface-2")}>
                      <Globe size={14} className="text-crm-brand" />
                      <span className="text-crm-ink-2">
                        Client uploaded <span className="font-medium text-crm-ink">{d.fileName}</span> {d.uploadedAt ? ago(d.uploadedAt) : ""}
                      </span>
                      <Badge tone={d.review === "accepted" ? "green" : d.review === "rejected" ? "red" : "amber"}>{d.review === "accepted" ? "Accepted" : d.review === "rejected" ? "Rejected" : "Pending review"}</Badge>
                      {d.fileData && (
                        <a href={d.fileData} target="_blank" rel="noreferrer" className="text-crm-brand hover:underline">
                          View
                        </a>
                      )}
                      {!readonly && d.review === "pending" && (
                        <span className="ms-auto flex gap-1.5">
                          <Button size="sm" variant="primary" icon={Check} loading={review.isPending && review.variables?.key === d.key && review.variables.accept} onClick={() => review.mutate({ key: d.key, accept: true })}>
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={X}
                            onClick={async () => {
                              const r = await confirm({ title: `Reject "${d.label}"?`, description: "The client sees your note in the portal and can upload again.", tone: "danger", confirmLabel: "Reject", reason: { label: "Note for the client", required: true, placeholder: "e.g. The back side of the NID is missing" } });
                              if (r.ok && r.reason) review.mutate({ key: d.key, accept: false, note: r.reason });
                            }}
                          >
                            Reject
                          </Button>
                        </span>
                      )}
                      {d.review === "rejected" && d.reviewNote && <span className="w-full text-[12px] text-[#B42318]">Note: {d.reviewNote}</span>}
                    </div>
                  )}
                  {!readonly && d.state !== "na" && (
                    <div className="mt-2 max-w-md">
                      <FileUpload value={d.fileData} fileName={d.fileName} onChange={(data, name) => setDoc(d.id, { fileData: data, fileName: name, state: data ? "yes" : d.state }, data ? `Uploaded ${d.label}` : undefined)} label="Attach file" />
                    </div>
                  )}
                  {readonly && d.fileData && (
                    <a href={d.fileData} target="_blank" rel="noreferrer" className="text-[12px] text-crm-brand hover:underline">
                      View file
                    </a>
                  )}
                </div>
                <div className="md:pt-0.5">
                  <Segmented<DocState>
                    size="sm"
                    value={d.state}
                    onChange={(v) => !readonly && setDoc(d.id, { state: v }, `${d.label}: ${v === "yes" ? "received" : v === "na" ? "not applicable" : "pending"}`)}
                    options={[{ value: "yes", label: "Yes" }, { value: "pending", label: "Pending" }, { value: "na", label: "N/A" }]}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Booking Form PDF" description="Generated in ICCB's layout with all booking fields." />
        <div className="px-5 pb-5">
          <Button icon={Eye} onClick={() => docsApi.previewLive(b.id, "booking_form", b.bfNo)}>
            Preview Booking Form
          </Button>
        </div>
      </Card>
      {docsApi.viewer}
    </div>
  );
}
