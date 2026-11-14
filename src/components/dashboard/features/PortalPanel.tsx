"use client";
import { useMemo } from "react";
import { ArrowClockwise, ChatCircleDots, Copy, Globe, Link as LinkIcon, Prohibit, WhatsappLogo } from "@phosphor-icons/react";
import type { Booking } from "@/types/crm";
import { useCurrentUser } from "@/lib/crm/db";
import { can } from "@/lib/crm/permissions";
import { ago, fmtDate, fmtDateTime } from "@/lib/crm/format";
import { createPortalLink, portalUrl, portalWhatsApp, revokePortalLink } from "@/services/crm/features.service";
import { useCrmAction, usePortalLinks } from "@/services/crm/hooks";
import { Badge, Button, Card, CardHeader, KeyValue } from "../ui/core";
import { Drawer, useConfirm } from "../ui/overlay";
import { copyText } from "../ui/misc";

export function PortalDrawer({ b, onClose }: { b: Booking; onClose: () => void }) {
  const me = useCurrentUser();
  const confirm = useConfirm();
  const links = usePortalLinks();
  const mine = useMemo(() => (links.data ?? []).filter((p) => p.bookingId === b.id).sort((a, c) => c.createdAt.localeCompare(a.createdAt)), [links.data, b.id]);
  const nowIso = new Date().toISOString();
  const active = mine.find((p) => !p.revoked && p.expiresAt > nowIso);
  const canManage = can(me.role, "create", "portal");
  const create = useCrmAction(() => createPortalLink(b.id), { success: active ? "New link issued — the old one no longer works" : "Portal link created", onSuccess: (p) => void copyText(portalUrl(p.token)) });
  const revoke = useCrmAction((id: string) => revokePortalLink(id), { success: "Link revoked" });
  const url = active ? portalUrl(active.token) : "";
  const uploads = b.documents.filter((d) => d.uploadedVia === "portal");

  return (
    <Drawer open onOpenChange={(o) => !o && onClose()} title="Client portal" description={`${b.bfNo} · ${b.contact.name}`} width={560}>
      <div className="space-y-5">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-[14px] font-semibold text-crm-ink">
              <Globe size={18} className="text-crm-brand" /> Secure link (no login)
            </p>
            {active ? <Badge tone="green" dot>Active</Badge> : <Badge tone="grey">No active link</Badge>}
          </div>
          {active ? (
            <>
              <div className="flex items-center gap-2 rounded-[var(--radius-input)] border border-crm-line bg-crm-surface-2 px-3 py-2">
                <LinkIcon size={15} className="shrink-0 text-crm-muted" />
                <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-crm-ink">{url}</span>
                <Button size="icon-sm" variant="ghost" aria-label="Copy link" onClick={() => void copyText(url)}>
                  <Copy size={15} />
                </Button>
              </div>
              <p className="mt-2 text-[12px] text-crm-muted">
                Expires {fmtDate(active.expiresAt)} · created by {active.createdBy} {ago(active.createdAt)}
                {active.lastOpenedAt ? ` · last opened ${ago(active.lastOpenedAt)}` : " · not opened yet"}
              </p>
              {canManage && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={portalWhatsApp(b, url, "en")} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="primary" icon={WhatsappLogo}>WhatsApp (EN)</Button>
                  </a>
                  <a href={portalWhatsApp(b, url, "bn")} target="_blank" rel="noreferrer">
                    <Button size="sm" icon={WhatsappLogo}>WhatsApp (বাংলা)</Button>
                  </a>
                  <a href={`/portal/${active.token}`} target="_blank" rel="noreferrer">
                    <Button size="sm" icon={Globe}>Open as client</Button>
                  </a>
                  <Button
                    size="sm"
                    icon={ArrowClockwise}
                    loading={create.isPending}
                    onClick={async () => {
                      const r = await confirm({ title: "Regenerate the link?", description: "The current link stops working immediately.", confirmLabel: "Regenerate" });
                      if (r.ok) create.mutate(undefined);
                    }}
                  >
                    Regenerate
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Prohibit}
                    onClick={async () => {
                      const r = await confirm({ title: "Revoke the client link?", tone: "danger", confirmLabel: "Revoke" });
                      if (r.ok) revoke.mutate(active.id);
                    }}
                  >
                    Revoke
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-[13px] text-crm-muted">The client sees their status, bill and payment schedule, uploads documents, answers the PPM questions, accepts ICCB policies and gives feedback after the event. The link expires 30 days after the event.</p>
              {canManage && (
                <Button className="mt-4" variant="primary" icon={LinkIcon} loading={create.isPending} onClick={() => create.mutate(undefined)}>
                  Create link
                </Button>
              )}
            </>
          )}
        </Card>

        <Card>
          <CardHeader icon={ChatCircleDots} title="Client activity" description="Uploads are reviewed in the Documents tab." />
          <div className="px-5 pb-5">
            <KeyValue
              items={[
                ["Uploads", uploads.length ? `${uploads.length} (${uploads.filter((d) => d.review === "pending").length} waiting for review)` : "None"],
                ["PPM questionnaire", b.portalAnswers?.submittedAt ? `Submitted ${fmtDateTime(b.portalAnswers.submittedAt)}` : "Not yet"],
                ["Policies accepted", b.policyAccepted ? `${b.policyAccepted.name} · ${fmtDateTime(b.policyAccepted.at)}` : "Not yet"],
                ["Feedback", b.evaluation?.submittedVia === "public" ? `${b.evaluation.score}/100` : "—"],
              ]}
            />
          </div>
        </Card>

        {mine.filter((p) => p !== active).length > 0 && (
          <Card>
            <CardHeader title="Older links" />
            <ul className="divide-y divide-crm-line px-5 pb-3 text-[12.5px]">
              {mine
                .filter((p) => p !== active)
                .map((p) => (
                  <li key={p.id} className="flex justify-between gap-2 py-2">
                    <span className="truncate font-mono text-crm-muted">…{p.token.slice(-8)}</span>
                    <span className="text-crm-muted">{p.revoked ? "Revoked" : "Expired"} · {fmtDate(p.createdAt)}</span>
                  </li>
                ))}
            </ul>
          </Card>
        )}
      </div>
    </Drawer>
  );
}
