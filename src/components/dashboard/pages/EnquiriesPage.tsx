"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChatsCircle, Phone, Question, Ticket, WhatsappLogo } from "@phosphor-icons/react";
import type { Enquiry } from "@/types/crm";
import { useEnquiries } from "@/lib/crm/hooks";
import { fmtDate, telHref, timeAgo, waHref } from "@/lib/crm/format";
import { markEnquirySeen } from "@/services/crm";
import { cn } from "@/lib/utils/cn";
import { Button, EmptyState, FilterRow, KeyValue, LinkButton, PageHeader, SearchInput, Segmented } from "../ui/core";
import { FilterSelect, FilterSummary, SortSelect, useFilters } from "../ui/filters";
import { ENQUIRY_SOURCES } from "@/types/crm";
import { Drawer } from "../ui/overlay";
import { m } from "../ui/motion";

type Filter = "all" | Enquiry["type"];

export function EnquiriesPage() {
  const enquiries = useEnquiries();
  const [filter, setFilter] = useState<Filter>("all");
  const { f, set, reset, active } = useFilters({ q: "", source: "", read: "", sort: "newest" });
  const q = f.q;
  const [openId, setOpenId] = useState<string | null>(null);
  const open = enquiries.find((e) => e.id === openId);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return enquiries
      .filter(
        (e) =>
          (filter === "all" || e.type === filter) &&
          (!f.source || e.source === f.source) &&
          (!f.read || (f.read === "unread" ? !e.seen : e.seen)) &&
          (!n || [e.name, e.mobile, e.email, e.message].join(" ").toLowerCase().includes(n))
      )
      .sort((a, b) => (f.sort === "oldest" ? a.createdAt.localeCompare(b.createdAt) : f.sort === "unread" ? Number(a.seen) - Number(b.seen) || b.createdAt.localeCompare(a.createdAt) : b.createdAt.localeCompare(a.createdAt)));
  }, [enquiries, filter, q, f]);
  const unread = enquiries.filter((e) => !e.seen).length;

  const show = (e: Enquiry) => {
    setOpenId(e.id);
    markEnquirySeen(e.id);
  };

  return (
    <>
      <PageHeader title="Enquiries" description="Every form submitted on the website, newest first." />
      <FilterRow>
        <Segmented
          id="enq"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "booking", label: "Booking" },
            { value: "question", label: "Question" },
          ]}
        />
        <SearchInput value={q} onChange={(v) => set("q", v)} placeholder="Name, mobile, message…" />
        <FilterSelect label="Sources" value={f.source} onChange={(v) => set("source", v)} options={ENQUIRY_SOURCES} />
        <FilterSelect label="Read" all="Read & unread" value={f.read} onChange={(v) => set("read", v)} options={[{ value: "unread", label: `Unread (${unread})` }, { value: "read", label: "Read" }]} />
        <SortSelect value={f.sort} onChange={(v) => set("sort", v)} options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "unread", label: "Unread first" }]} className="sm:ms-auto" />
      </FilterRow>
      <FilterSummary active={active + (filter !== "all" ? 1 : 0)} onClear={() => { reset(); setFilter("all"); }} count={rows.length} noun="enquiry" plural="enquiries" />

      {rows.length === 0 ? (
        <div className="crm-card">
          <EmptyState icon={ChatsCircle} text="No enquiries match these filters." action={<Button onClick={() => { setFilter("all"); reset(); }}>Clear filters</Button>} />
        </div>
      ) : (
        <ul className="crm-card divide-y divide-crm-line overflow-hidden">
          {rows.map((e, i) => {
            const I = e.type === "booking" ? Ticket : Question;
            return (
              <m.li key={e.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.03 } }}>
                <button type="button" onClick={() => show(e)} className="flex w-full items-center gap-4 px-5 py-4 text-start transition-colors hover:bg-crm-surface-2/60">
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", e.type === "booking" ? "bg-crm-info-bg text-crm-info-ink" : "bg-crm-surface-2 text-crm-muted")}>
                    <I size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={cn("truncate text-[14px] text-crm-ink", !e.seen && "font-semibold")}>{e.name}</span>
                      <span className="hidden text-[12.5px] text-crm-muted sm:inline">{e.mobile}</span>
                    </span>
                    <span className="block truncate text-[13px] text-crm-muted">
                      <span className="text-crm-ink-2">{e.source}</span> · {e.message.split("\n")[0]}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-[12.5px] text-crm-muted">
                    {timeAgo(e.createdAt)}
                    <span className={cn("h-2 w-2 rounded-full transition-opacity duration-300", e.seen ? "opacity-0" : "bg-crm-info")} aria-label={e.seen ? undefined : "New"} />
                  </span>
                </button>
              </m.li>
            );
          })}
        </ul>
      )}

      <Drawer open={!!open} onOpenChange={(v) => !v && setOpenId(null)} title={open?.name} description={open ? `${open.source} · ${fmtDate(open.createdAt, "d MMM yyyy, h:mm a")}` : undefined}>
        {open && (
          <div className="space-y-6">
            <KeyValue
              items={[
                ["Mobile", open.mobile],
                ["Email", open.email],
              ]}
            />
            <div>
              <p className="mb-1 text-[12px] text-crm-muted">{open.type === "booking" ? "Request" : "Message"}</p>
              <p className="whitespace-pre-wrap rounded-[10px] bg-crm-surface-2 p-4 text-[14px] leading-relaxed text-crm-ink">{open.message}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {open.mobile !== "—" && (
                <>
                  <LinkButton href={telHref(open.mobile)} icon={Phone}>
                    Call
                  </LinkButton>
                  <LinkButton href={waHref(open.mobile)} icon={WhatsappLogo} external>
                    WhatsApp
                  </LinkButton>
                </>
              )}
              {open.bookingId && (
                <Link href={`/dashboard/bookings/${open.bookingId}`}>
                  <Button size="sm" variant="primary">
                    Open booking <ArrowRight size={14} className="rtl:rotate-180" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
