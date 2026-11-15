"use client";
import { useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { CheckCircle, LinkBreak } from "@phosphor-icons/react";
import { REVIEW_QUESTIONS, REVIEW_RATINGS } from "@/types/crm";
import { db } from "@/lib/crm/db";
import { useCrmReady } from "@/components/providers/CrmProvider";
import { submitReview } from "@/services/crm";
import { cn } from "@/lib/utils/cn";
import { Button, Field, Input, Skeleton, Textarea } from "../ui/core";
import { m } from "../ui/motion";
import { LOGO } from "../shell/Sidebar";

const TONE = ["border-crm-brand bg-crm-booked-bg text-crm-brand-text", "border-crm-reserved bg-crm-reserved-bg text-crm-reserved-ink", "border-crm-ink-2 bg-crm-surface-2 text-crm-ink", "border-crm-success bg-crm-success-bg text-crm-success"];

/** Public review form opened from a shared link (no sign-in). */
export function ReviewFormPage() {
  const { token } = useParams<{ token: string }>();
  const ready = useCrmReady();
  const review = db.reviews.store((s) => s.items.find((r) => r.token === token));
  const [answers, setAnswers] = useState<number[]>(() => Array(REVIEW_QUESTIONS.length).fill(0));
  const [comment, setComment] = useState("");
  const [name, setName] = useState<string | null>(null);
  const [mobile, setMobile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-crm-bg px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="relative h-10 w-10">
            <Image src={LOGO} alt="ICCB" fill sizes="40px" className="object-contain" />
          </span>
          <span>
            <span className="block text-[15px] font-semibold text-crm-ink">International Convention City Bashundhara</span>
            <span className="block text-[12.5px] text-crm-muted">Client review</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );

  if (!ready) return shell(<Skeleton className="h-[480px]" />);
  if (!review)
    return shell(
      <div className="crm-card p-8 text-center">
        <LinkBreak size={32} className="mx-auto mb-3 text-crm-muted" />
        <p className="text-[16px] font-semibold text-crm-ink">This review link is not valid</p>
        <p className="mt-1 text-[14px] text-crm-muted">Please ask ICCB for a new link.</p>
      </div>
    );
  if (review.status === "submitted")
    return shell(
      <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="crm-card p-8 text-center">
        <CheckCircle size={40} weight="fill" className="mx-auto mb-3 text-crm-success" />
        <p className="text-[18px] font-semibold text-crm-ink">Thank you, {review.reviewerName}!</p>
        <p className="mt-1 text-[14px] text-crm-muted">Your review has been received. We appreciate your time.</p>
      </m.div>
    );

  const done = answers.filter(Boolean).length;
  const reviewer = name ?? (review.clientName === "Any client" ? "" : review.clientName);
  const phone = mobile ?? review.mobile ?? "";

  const submit = async () => {
    setError(null);
    setBusy(true);
    await new Promise((r) => setTimeout(r, 300));
    try {
      submitReview(review.token, { answers, comment, reviewerName: reviewer, reviewerMobile: phone });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send your review.");
    } finally {
      setBusy(false);
    }
  };

  return shell(
    <div className="space-y-5">
      <div className="crm-card p-5 sm:p-6">
        <h1 className="text-[20px] font-semibold text-crm-ink">How was your event at ICCB?</h1>
        <p className="mt-1 text-[14px] text-crm-muted">
          {review.eventName ? `${review.eventName} · ` : ""}10 quick questions — tap one answer for each.
        </p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-crm-surface-2">
          <m.div className="h-full origin-left rounded-full bg-crm-brand" animate={{ scaleX: done / REVIEW_QUESTIONS.length }} transition={{ duration: 0.3 }} />
        </div>
        <p className="mt-1.5 text-[12px] text-crm-muted tabular">
          {done} / {REVIEW_QUESTIONS.length} answered
        </p>
      </div>

      <ol className="space-y-3">
        {REVIEW_QUESTIONS.map((q, i) => (
          <li key={q} className="crm-card p-4 sm:p-5">
            <p className="mb-3 text-[14.5px] font-medium text-crm-ink">
              <span className="me-2 text-crm-muted tabular">{i + 1}.</span>
              {q}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={q}>
              {REVIEW_RATINGS.map((label, j) => {
                const on = answers[i] === j + 1;
                return (
                  <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setAnswers((a) => a.map((v, k) => (k === i ? j + 1 : v)))}
                    className={cn("h-10 rounded-[8px] border text-[13.5px] font-medium transition-colors", on ? TONE[j] : "border-crm-line text-crm-ink-2 hover:bg-crm-surface-2")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <div className="crm-card space-y-4 p-5 sm:p-6">
        <Field label="Your review">
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={600} placeholder="Tell us what you liked and what we can do better." />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Your name" required>
            <Input value={reviewer} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Mobile">
            <Input type="tel" value={phone} onChange={(e) => setMobile(e.target.value)} />
          </Field>
        </div>
        {error && <p className="rounded-[8px] bg-crm-reserved-bg px-3 py-2 text-[13.5px] text-crm-reserved-ink">{error}</p>}
        <Button variant="primary" className="w-full" loading={busy} disabled={done < REVIEW_QUESTIONS.length} onClick={submit}>
          {done < REVIEW_QUESTIONS.length ? `Answer all questions (${REVIEW_QUESTIONS.length - done} left)` : "Send review"}
        </Button>
      </div>
    </div>
  );
}
