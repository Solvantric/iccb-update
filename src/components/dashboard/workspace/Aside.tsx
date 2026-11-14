"use client";
import Link from "next/link";
import { CaretRight, CheckCircle, EnvelopeSimple, Phone, WhatsappLogo } from "@phosphor-icons/react";
import { STATUS_LABELS } from "@/types/crm";
import { checklistFor, NEXT_STATUS } from "@/lib/crm/workflow";
import { toggleChecklist } from "@/services/crm/bookings.service";
import { useCrmAction } from "@/services/crm/hooks";
import { Avatar, Button } from "../ui/core";
import { ProgressBar } from "../ui/kpi";
import { DrawnCheck, StatusTrack } from "../ui/status";
import { useWs } from "./context";

const wa = (mobile: string) => `https://wa.me/${mobile.replace(/\D/g, "").replace(/^0/, "880")}`;

/** Sidebar: what's left to do + who to call. Everything else lives in the tabs. */
export function Aside() {
  return (
    <div className="space-y-4 lg:sticky lg:top-4">
      <NextSteps />
      <ClientCard />
    </div>
  );
}

function NextSteps() {
  const { b, flow, goTab, canEdit, tasks } = useWs();
  const toggle = useCrmAction((a: { key: string; done: boolean }) => toggleChecklist(b.id, a.key, a.done));
  // Before approval, the requested stage also works on the confirmation items.
  const stages = b.status === "requested" ? (["requested", "confirmed"] as const) : [b.status];
  const items = stages.flatMap((s) => checklistFor(s, b, flow)).filter((i) => i.required && i.key !== "approved");
  const left = items.filter((i) => !i.done);
  const pct = items.length ? Math.round(((items.length - left.length) / items.length) * 100) : 100;
  const next = NEXT_STATUS[b.status];
  const openTasks = tasks.filter((t) => t.status === "open").length;

  return (
    <div className="crm-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13.5px] font-semibold text-crm-ink">Next steps</p>
        <StatusTrack status={b.status} closed={!!b.closed} />
      </div>
      {next ? (
        <>
          <ProgressBar value={pct} color={pct === 100 ? "#12B76A" : "var(--crm-brand)"} />
          <p className="mt-1.5 text-[12px] text-crm-muted">
            {left.length ? `${left.length} left before ${STATUS_LABELS[next]}` : `Ready to move to ${STATUS_LABELS[next]}`}
          </p>
          {left.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {left.map((it) => (
                <li key={it.key} className="flex items-start gap-2 rounded-[var(--radius-btn)] px-1.5 py-1.5 hover:bg-crm-surface-2">
                  <button type="button" disabled={it.mode !== "manual" || !canEdit} onClick={() => toggle.mutate({ key: it.key, done: true })} className="mt-px shrink-0 disabled:cursor-default" title={it.mode === "manual" ? "Mark done" : "Completes automatically"}>
                    <DrawnCheck done={false} size={17} />
                  </button>
                  <button type="button" onClick={() => it.tab && goTab(it.tab)} className="flex min-w-0 flex-1 items-start justify-between gap-2 text-start">
                    <span className="text-[12.5px] leading-snug text-crm-ink">{it.label}</span>
                    {it.tab && <CaretRight size={12} className="mt-1 shrink-0 text-crm-muted rtl:rotate-180" />}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-medium text-[#067647]">
              <CheckCircle size={16} weight="fill" /> All required items are done
            </p>
          )}
        </>
      ) : (
        <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#067647]">
          <CheckCircle size={16} weight="fill" /> Booking completed
        </p>
      )}
      {openTasks > 0 && (
        <Link href="/dashboard/sales/follow-ups" className="mt-3 block border-t border-crm-line pt-2.5 text-[12px] font-medium text-crm-brand hover:underline">
          {openTasks} open reminder{openTasks > 1 ? "s" : ""} →
        </Link>
      )}
    </div>
  );
}

function ClientCard() {
  const { b, client, users } = useWs();
  const rep = users.find((u) => u.id === b.assignedTo);
  return (
    <div className="crm-card p-4">
      <div className="flex items-center gap-3">
        <Avatar name={b.contact.name} size={38} color="#30333F" />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-crm-ink">{b.contact.name}</p>
          <p className="truncate text-[12px] text-crm-muted">{b.contact.organization ?? client?.clientNo ?? ""}</p>
        </div>
      </div>
      <div className="mt-3 space-y-0.5 text-[12.5px] text-crm-ink-2">
        <p className="tabular">{b.contact.mobile}</p>
        {b.contact.email && <p className="truncate">{b.contact.email}</p>}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <a href={`tel:${b.contact.mobile}`}>
          <Button size="sm" className="w-full" icon={Phone} aria-label="Call" />
        </a>
        <a href={wa(b.contact.mobile)} target="_blank" rel="noreferrer">
          <Button size="sm" className="w-full" icon={WhatsappLogo} aria-label="WhatsApp" />
        </a>
        <a href={b.contact.email ? `mailto:${b.contact.email}` : undefined}>
          <Button size="sm" className="w-full" icon={EnvelopeSimple} aria-label="Email" disabled={!b.contact.email} />
        </a>
      </div>
      <p className="mt-3 border-t border-crm-line pt-2.5 text-[12px] text-crm-muted">
        Representative: <span className="font-medium text-crm-ink">{rep?.name ?? "Unassigned"}</span>
      </p>
    </div>
  );
}
