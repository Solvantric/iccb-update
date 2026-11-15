"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { ArrowSquareOut, CaretDown, Copy, Link as LinkIcon, Trash, WhatsappLogo } from "@phosphor-icons/react";
import type { ReviewRequest } from "@/types/crm";
import { REVIEW_QUESTIONS, REVIEW_RATINGS, ratingLabel } from "@/types/crm";
import { db } from "@/lib/crm/db";
import { useBookings } from "@/lib/crm/hooks";
import { fmtDate, timeAgo, todayYmd, waHref } from "@/lib/crm/format";
import { createReviewLink, deleteReview } from "@/services/crm";
import { cn } from "@/lib/utils/cn";
import { Button, Select } from "../ui/core";
import { Drawer, useConfirm } from "../ui/overlay";
import { Tabs } from "../ui/data";
import { m } from "../ui/motion";

export const reviewUrl = (token: string) => `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/review/${token}`;
export const reviewAvg = (r: ReviewRequest) => (r.answers?.length ? r.answers.reduce((a, b) => a + b, 0) / r.answers.length : 0);

const TONE: Record<string, string> = {
  Excellent: "bg-crm-success-bg text-crm-success",
  Good: "bg-crm-surface-2 text-crm-ink-2 ring-1 ring-crm-line",
  Normal: "bg-crm-reserved-bg text-crm-reserved-ink",
  Bad: "bg-crm-booked-bg text-crm-brand-text",
};
export function RatingChip({ label }: { label: string }) {
  return <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium", TONE[label])}>{label}</span>;
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Link copied");
  } catch {
    toast.error("Couldn't copy — select the link and copy it manually.");
  }
}

function LinkRow({ r }: { r: ReviewRequest }) {
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const url = reviewUrl(r.token);
  const avg = reviewAvg(r);
  const msg = `Dear ${r.clientName}, thank you for choosing ICCB. Please share your feedback (2 minutes): ${url}`;
  return (
    <li className="rounded-[10px] border border-crm-line">
      <div className="flex items-start justify-between gap-3 px-3.5 py-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium text-crm-ink">{r.status === "submitted" ? r.reviewerName : r.clientName}</p>
          <p className="truncate text-[12.5px] text-crm-muted">
            {r.eventName ?? "General review"} · sent by {r.sentBy} · {timeAgo(r.createdAt)}
          </p>
        </div>
        {r.status === "submitted" ? <RatingChip label={ratingLabel(avg)} /> : <span className="inline-flex h-6 items-center rounded-full bg-crm-reserved-bg px-2.5 text-[12px] font-medium text-crm-reserved-ink">Waiting</span>}
      </div>
      <div className="flex flex-wrap items-center gap-1 border-t border-crm-line px-2 py-1.5">
        {r.status === "pending" ? (
          <>
            <Button size="sm" variant="ghost" icon={Copy} onClick={() => copy(url)}>
              Copy link
            </Button>
            {r.mobile && (
              <a href={waHref(r.mobile, msg)} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium text-crm-ink-2 hover:bg-crm-surface-2">
                <WhatsappLogo size={15} /> WhatsApp
              </a>
            )}
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium text-crm-ink-2 hover:bg-crm-surface-2">
              <ArrowSquareOut size={15} /> Open
            </a>
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
            <CaretDown size={14} className={cn("transition-transform", open && "rotate-180")} /> {open ? "Hide answers" : "See answers"}
          </Button>
        )}
        <Button size="icon-sm" variant="ghost" aria-label="Delete" className="ms-auto" onClick={async () => (await confirm({ title: "Delete this review link?", confirmLabel: "Delete", danger: true })) && deleteReview(r.id)}>
          <Trash size={15} />
        </Button>
      </div>
      <AnimatePresence initial={false}>
        {open && r.answers && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-t border-crm-line px-3.5 py-3">
            <p className="mb-2 text-[12.5px] text-crm-muted">
              Answered {r.submittedAt ? fmtDate(r.submittedAt, "d MMM yyyy, h:mm a") : ""}
              {r.reviewerMobile ? ` · ${r.reviewerMobile}` : ""}
            </p>
            <ol className="space-y-1.5 text-[13px]">
              {REVIEW_QUESTIONS.map((q, i) => (
                <li key={q} className="flex items-start justify-between gap-3">
                  <span className="text-crm-ink-2">
                    {i + 1}. {q}
                  </span>
                  <RatingChip label={REVIEW_RATINGS[(r.answers![i] ?? 1) - 1]} />
                </li>
              ))}
            </ol>
            {r.comment && <p className="mt-3 rounded-[8px] bg-crm-surface-2 p-3 text-[13.5px] text-crm-ink">“{r.comment}”</p>}
          </m.div>
        )}
      </AnimatePresence>
    </li>
  );
}

/** Quality → Client reviews: the 10-question form, shareable links and answers. */
export function ReviewsDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const reviews = db.reviews.store((s) => s.items);
  const bookings = useBookings();
  const today = todayYmd();
  const [tab, setTab] = useState<"links" | "questions">("links");
  const [bookingId, setBookingId] = useState("");
  const [show, setShow] = useState<"all" | "submitted" | "pending">("all");

  const options = useMemo(
    () =>
      bookings
        .filter((b) => b.status === "closed" || b.status === "booked")
        .sort((a, b) => (a.date < today ? 0 : 1) - (b.date < today ? 0 : 1) || b.date.localeCompare(a.date))
        .map((b) => ({ value: b.id, label: `${b.name} · ${b.eventName} · ${fmtDate(b.date, "d MMM")}` })),
    [bookings, today]
  );
  const list = useMemo(() => [...reviews].filter((r) => show === "all" || r.status === show).sort((a, b) => (b.submittedAt ?? b.createdAt).localeCompare(a.submittedAt ?? a.createdAt)), [reviews, show]);
  const answered = reviews.filter((r) => r.status === "submitted");

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title="Client reviews" description={`${answered.length} answered · ${reviews.length - answered.length} waiting`}>
      <Tabs
        id="reviews"
        value={tab}
        onChange={setTab}
        className="-mt-2 mb-5"
        tabs={[
          { value: "links", label: "Share & answers" },
          { value: "questions", label: "The 10 questions" },
        ]}
      />
      {tab === "questions" ? (
        <div>
          <p className="mb-3 text-[13px] text-crm-muted">Clients rate each question as {REVIEW_RATINGS.join(" · ")}, then write a short review.</p>
          <ol className="space-y-2">
            {REVIEW_QUESTIONS.map((q, i) => (
              <li key={q} className="rounded-[10px] border border-crm-line px-3.5 py-2.5 text-[13.5px] text-crm-ink">
                <span className="me-2 text-crm-muted tabular">{i + 1}</span>
                {q}
              </li>
            ))}
            <li className="rounded-[10px] border border-dashed border-crm-line px-3.5 py-2.5 text-[13.5px] text-crm-muted">+ Written review (optional)</li>
          </ol>
        </div>
      ) : (
        <div className="space-y-5">
          <section className="rounded-[12px] bg-crm-surface-2 p-4">
            <p className="mb-1 text-[14px] font-semibold text-crm-ink">Create a share link</p>
            <p className="mb-3 text-[12.5px] text-crm-muted">Each link belongs to one booking, so you always know who answered. A link works once.</p>
            <Select value={bookingId} onChange={setBookingId} placeholder="General link (no booking)" options={options} />
            <Button
              variant="primary"
              icon={LinkIcon}
              className="mt-3 w-full"
              onClick={() => {
                const r = createReviewLink(bookingId || undefined);
                void copy(reviewUrl(r.token));
                setShow("all");
              }}
            >
              Create & copy link
            </Button>
          </section>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[14px] font-semibold text-crm-ink">Links</p>
            <select aria-label="Show" value={show} onChange={(e) => setShow(e.target.value as typeof show)} className="h-8 rounded-[8px] border border-crm-line bg-crm-surface px-2 text-[13px] text-crm-ink focus:outline-none">
              <option value="all">All</option>
              <option value="submitted">Answered</option>
              <option value="pending">Waiting</option>
            </select>
          </div>
          {list.length === 0 ? <p className="text-[13.5px] text-crm-muted">No review links yet.</p> : <ul className="space-y-3">{list.map((r) => <LinkRow key={r.id} r={r} />)}</ul>}
        </div>
      )}
    </Drawer>
  );
}
