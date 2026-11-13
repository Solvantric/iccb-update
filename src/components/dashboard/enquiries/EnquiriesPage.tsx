"use client";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, ChatCircleDots, ChatsCircle, CheckCircle, Envelope, Phone, Plus, Robot, Storefront, Tray, UserSwitch, WhatsappLogo, XCircle } from "@phosphor-icons/react";
import type { Enquiry } from "@/types/crm";
import { SOURCE_LABELS } from "@/types/crm";
import { useRole } from "@/lib/crm/db";
import { can } from "@/lib/crm/permissions";
import { ago, fmtDate, fmtDateTime } from "@/lib/crm/format";
import { assignEnquiry, replyEnquiry } from "@/services/crm/sales.service";
import { useCrmAction, useCrmUpdate, useEnquiries, useUsers } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { m, Item, Stagger } from "../ui/motion";
import { Avatar, Badge, Button, EmptyState, KeyValue, PageHeader, SearchInput, Segmented, Select, Skeleton, Textarea, type Tone } from "../ui/core";
import { useQuickCreate } from "../shell/QuickCreate";

const TYPE_ICON = { enquiry: Envelope, ask: ChatCircleDots, chatbot: Robot, exhibitor: Storefront, contact: Phone, booking: ArrowRight } as const;
const STATUS_TONE: Record<Enquiry["status"], Tone> = { new: "brand", assigned: "amber", replied: "blue", converted: "green", closed: "grey" };

export function EnquiriesPage() {
  const router = useRouter();
  const params = useSearchParams();
  const role = useRole();
  const enquiries = useEnquiries();
  const users = useUsers();
  const showCreate = useQuickCreate((s) => s.show);
  const [filter, setFilter] = useState<"open" | "all" | Enquiry["status"]>("open");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(params.get("e"));
  const [reply, setReply] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const update = useCrmUpdate<Enquiry>("enquiries", "Updated");
  const assign = useCrmAction((a: { id: string; user: string }) => assignEnquiry(a.id, a.user), { success: "Assigned" });
  const sendReply = useCrmAction((a: { id: string; text: string }) => replyEnquiry(a.id, a.text), { success: "Reply note saved", onSuccess: () => setReply("") });
  const canEdit = can(role, "update", "enquiries");

  const list = useMemo(() => {
    return (enquiries.data ?? [])
      .filter((e) => (filter === "open" ? !["converted", "closed"].includes(e.status) : filter === "all" ? true : e.status === filter))
      .filter((e) => !type || e.type === type)
      .filter((e) => !q || `${e.name} ${e.mobile} ${e.message} ${e.eventType ?? ""}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [enquiries.data, filter, type, q]);

  const current = (enquiries.data ?? []).find((e) => e.id === selected) ?? null;
  const reps = (users.data ?? []).filter((u) => u.active && (u.role === "sales_executive" || u.role === "sales_manager"));
  const counts = (s: Enquiry["status"]) => (enquiries.data ?? []).filter((e) => e.status === s).length;

  const convert = (e: Enquiry) => {
    const qs = new URLSearchParams({ name: e.name, mobile: e.mobile, ...(e.eventType ? { nature: e.eventType } : {}), ...(e.guests ? { guests: String(e.guests) } : {}), ...(e.preferredDate ? { date: e.preferredDate } : {}), enquiry: e.id });
    update.mutate({ id: e.id, patch: { status: "converted" } });
    router.push(`/dashboard/sales/bookings/new?${qs.toString()}`);
  };

  return (
    <Stagger>
      <Item>
        <PageHeader
          eyebrow="Sales"
          title="Enquiries inbox"
          description="Website enquiries, Ask-a-question, chatbot leads and exhibitor enquiries. Reply, assign, convert to a booking or close."
          actions={
            <Button variant="primary" icon={Plus} onClick={() => showCreate("enquiry")}>
              Log enquiry
            </Button>
          }
        />
      </Item>
      <Item>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Segmented
            size="sm"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "open", label: "Open" },
              { value: "new", label: `New (${counts("new")})` },
              { value: "assigned", label: "Assigned" },
              { value: "replied", label: "Replied" },
              { value: "converted", label: "Converted" },
              { value: "closed", label: "Closed" },
              { value: "all", label: "All" },
            ]}
          />
          <Select value={type} onChange={setType} placeholder="All types" options={Object.keys(TYPE_ICON).map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))} className="w-auto min-w-[130px]" />
          <SearchInput value={q} onChange={setQ} className="w-full sm:w-64 sm:ms-auto" />
        </div>
      </Item>
      <Item>
        <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className="crm-card overflow-hidden">
            {enquiries.isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : list.length === 0 ? (
              <EmptyState icon={Tray} title="Inbox zero" description="No enquiries match this filter." />
            ) : (
              <ul className="crm-scroll max-h-[calc(100vh-280px)] divide-y divide-crm-line overflow-y-auto">
                <AnimatePresence initial={false}>
                  {list.map((e) => {
                    const I = TYPE_ICON[e.type];
                    return (
                      <m.li key={e.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}>
                        <button onClick={() => setSelected(e.id)} className={cn("flex w-full gap-3 px-4 py-3 text-start transition-colors hover:bg-crm-surface-2", selected === e.id && "bg-crm-tint/70")}>
                          <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg", e.status === "new" ? "bg-crm-brand text-white" : "bg-crm-surface-2 text-crm-ink-2")}>
                            <I size={16} weight="duotone" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className={cn("truncate text-[13.5px]", e.status === "new" ? "font-semibold text-crm-ink" : "text-crm-ink")}>{e.name}</span>
                              <span className="shrink-0 text-[11px] text-crm-muted">{ago(e.createdAt)}</span>
                            </span>
                            <span className="block truncate text-[12.5px] text-crm-muted">{e.message || e.eventType || "—"}</span>
                            <span className="mt-1 flex flex-wrap gap-1">
                              <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
                              <Badge tone="neutral">{SOURCE_LABELS[e.source]}</Badge>
                            </span>
                          </span>
                        </button>
                      </m.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>

          <div className="crm-card min-h-[400px]">
            {!current ? (
              <EmptyState icon={ChatsCircle} title="Select an enquiry" description="Pick one from the list to reply, assign or convert it to a booking." />
            ) : (
              <m.div key={current.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[18px] font-bold text-crm-ink">{current.name}</h2>
                    <p className="text-[12.5px] text-crm-muted">
                      {current.type} · {SOURCE_LABELS[current.source]} · {fmtDateTime(current.createdAt)}
                      {current.language && current.language !== "en" ? ` · ${current.language.toUpperCase()}` : ""}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[current.status]}>{current.status}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={`tel:${current.mobile}`}>
                    <Button size="sm" icon={Phone}>
                      {current.mobile}
                    </Button>
                  </a>
                  <a href={`https://wa.me/${current.mobile.replace(/\D/g, "").replace(/^0/, "880")}`} target="_blank" rel="noreferrer">
                    <Button size="sm" icon={WhatsappLogo}>
                      WhatsApp
                    </Button>
                  </a>
                  {current.email && (
                    <a href={`mailto:${current.email}`}>
                      <Button size="sm" icon={Envelope}>
                        Email
                      </Button>
                    </a>
                  )}
                </div>
                <p className="mt-5 whitespace-pre-wrap rounded-xl bg-crm-surface-2 p-4 text-[14px] text-crm-ink">{current.message || "No message."}</p>
                <div className="mt-5">
                  <KeyValue cols={3} items={[["Event type", current.eventType], ["Guests", current.guests?.toLocaleString("en-US")], ["Preferred date", fmtDate(current.preferredDate)], ["Hall preference", current.hallPreference], ["Assigned to", reps.find((u) => u.id === current.assignedTo)?.name], ["Booking", current.bookingId ? "Converted" : ""]]} />
                </div>
                {current.replyNote && (
                  <div className="mt-5 rounded-xl border border-crm-line p-3">
                    <p className="text-[12px] font-semibold text-crm-muted">Reply note</p>
                    <p className="text-[13.5px] text-crm-ink">{current.replyNote}</p>
                  </div>
                )}
                {canEdit && !["converted", "closed"].includes(current.status) && (
                  <div className="mt-6 space-y-4 border-t border-crm-line pt-5">
                    {role !== "sales_executive" && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Select value={assignTo || current.assignedTo || ""} onChange={setAssignTo} placeholder="Assign to…" options={reps.map((u) => ({ value: u.id, label: u.name }))} className="w-56" />
                        <Button icon={UserSwitch} disabled={!assignTo} loading={assign.isPending} onClick={() => assign.mutate({ id: current.id, user: assignTo })}>
                          Assign
                        </Button>
                        {current.assignedTo && (() => { const u = reps.find((x) => x.id === current.assignedTo); return u ? <Avatar name={u.name} color={u.color} size={26} /> : null; })()}
                      </div>
                    )}
                    <div>
                      <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply note — what you told the client…" />
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button disabled={!reply.trim()} loading={sendReply.isPending} onClick={() => sendReply.mutate({ id: current.id, text: reply.trim() })}>
                          Save reply note
                        </Button>
                        {can(role, "create", "bookings") && (
                          <Button variant="primary" iconRight={ArrowRight} onClick={() => convert(current)}>
                            Convert to booking
                          </Button>
                        )}
                        <Button variant="ghost" icon={XCircle} onClick={() => update.mutate({ id: current.id, patch: { status: "closed" } })}>
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {current.status === "closed" && canEdit && (
                  <Button className="mt-5" icon={CheckCircle} onClick={() => update.mutate({ id: current.id, patch: { status: "assigned" } })}>
                    Reopen
                  </Button>
                )}
              </m.div>
            )}
          </div>
        </div>
      </Item>
    </Stagger>
  );
}
