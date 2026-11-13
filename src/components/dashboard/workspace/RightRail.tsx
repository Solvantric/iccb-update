"use client";
import { useState } from "react";
import { CheckCircle, Circle, EnvelopeSimple, Phone, WhatsappLogo } from "@phosphor-icons/react";
import { CLIENT_TYPE_LABELS } from "@/types/crm";
import { addNote } from "@/services/crm/bookings.service";
import { completeTask } from "@/services/crm/sales.service";
import { useCrmAction } from "@/services/crm/hooks";
import { ago, fmtDateTime } from "@/lib/crm/format";
import { cn } from "@/lib/utils/cn";
import { Avatar, Badge, Button, Textarea } from "../ui/core";
import { useWs } from "./context";

const wa = (mobile: string) => `https://wa.me/${mobile.replace(/\D/g, "").replace(/^0/, "880")}`;

export function RightRail() {
  const { b, client, tasks } = useWs();
  const [note, setNote] = useState("");
  const add = useCrmAction((t: string) => addNote(b.id, t), { success: "Note added", onSuccess: () => setNote("") });
  const done = useCrmAction((id: string) => completeTask(id, true), { success: "Task done" });
  const open = tasks.filter((t) => t.status === "open").sort((a, c) => a.dueAt.localeCompare(c.dueAt));
  const now = new Date().toISOString();

  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-1">
      <div className="crm-card p-4">
        <div className="flex items-center gap-3">
          <Avatar name={b.contact.name} size={40} color="#55525A" />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-crm-ink">{b.contact.name}</p>
            <p className="truncate text-[12px] text-crm-muted">
              {client?.clientNo ?? "—"} · {CLIENT_TYPE_LABELS[b.clientType]}
            </p>
          </div>
        </div>
        {client?.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {client.tags.map((t) => (
              <Badge key={t} tone={t === "VIP" ? "brand" : "neutral"}>
                {t}
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="mt-3 space-y-1 text-[12.5px] text-crm-ink-2">
          <p className="tabular">{b.contact.mobile}</p>
          {b.contact.email && <p className="truncate">{b.contact.email}</p>}
          {b.contact.address && <p className="text-crm-muted">{b.contact.address}</p>}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <a href={`tel:${b.contact.mobile}`}>
            <Button size="sm" className="w-full" icon={Phone}>
              Call
            </Button>
          </a>
          <a href={wa(b.contact.mobile)} target="_blank" rel="noreferrer">
            <Button size="sm" className="w-full" icon={WhatsappLogo}>
              Chat
            </Button>
          </a>
          <a href={b.contact.email ? `mailto:${b.contact.email}` : undefined} aria-disabled={!b.contact.email}>
            <Button size="sm" className="w-full" icon={EnvelopeSimple} disabled={!b.contact.email}>
              Email
            </Button>
          </a>
        </div>
      </div>

      <div className="crm-card p-4">
        <p className="mb-2 text-[13px] font-semibold text-crm-ink">Upcoming tasks</p>
        {open.length === 0 ? (
          <p className="text-[12.5px] text-crm-muted">No open tasks.</p>
        ) : (
          <ul className="space-y-1.5">
            {open.slice(0, 6).map((t) => (
              <li key={t.id} className="group flex items-start gap-2">
                <button onClick={() => done.mutate(t.id)} className="mt-0.5 text-crm-muted hover:text-[#12B76A]" aria-label="Mark done">
                  <Circle size={16} className="group-hover:hidden" />
                  <CheckCircle size={16} className="hidden group-hover:block" />
                </button>
                <span className="min-w-0">
                  <span className="block text-[12.5px] leading-snug text-crm-ink">{t.title}</span>
                  <span className={cn("block text-[11.5px]", t.dueAt < now ? "font-semibold text-[#D92D20]" : "text-crm-muted")} title={fmtDateTime(t.dueAt)}>
                    {t.dueAt < now ? "Overdue · " : ""}
                    {ago(t.dueAt)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="crm-card p-4 sm:col-span-2 2xl:col-span-1">
        <p className="mb-2 text-[13px] font-semibold text-crm-ink">Quick note</p>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note… use @Name to mention a colleague" className="min-h-[70px]" />
        <Button size="sm" variant="primary" className="mt-2" disabled={!note.trim()} loading={add.isPending} onClick={() => add.mutate(note.trim())}>
          Add note
        </Button>
      </div>
    </div>
  );
}
