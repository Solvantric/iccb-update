"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Star } from "@phosphor-icons/react";
import type { Evaluation } from "@/types/crm";
import { db } from "@/lib/crm/db";
import { EVALUATION_CRITERIA, evaluationScore } from "@/lib/crm/rules";
import { fmtDate } from "@/lib/crm/format";
import { firstEventDate } from "@/lib/crm/pricing";
import { submitPublicEvaluation } from "@/services/crm/bookings.service";
import { useCrmReady } from "@/components/providers/CrmProvider";
import { RatingGrid } from "@/components/dashboard/ops/FeedbackForms";
import { MotionProvider, m } from "@/components/dashboard/ui/motion";
import { Button, Skeleton, Textarea } from "@/components/dashboard/ui/core";

/** Client-facing "Evaluation of Service" form (shared link / QR) → writes into the booking. */
export function PublicEvaluation() {
  const ready = useCrmReady();
  const params = useSearchParams();
  const id = params.get("b") ?? "";
  const bookings = db.bookings.store((s) => s.items);
  const b = bookings.find((x) => x.id === id && !x.deletedAt);
  const [ratings, setRatings] = useState<Evaluation["ratings"]>({});
  const [suggestion, setSuggestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const complete = Object.keys(ratings).length === EVALUATION_CRITERIA.length;

  return (
    <MotionProvider>
      <div className="crm rounded-2xl !bg-transparent">
        {!ready ? (
          <Skeleton className="h-[560px] w-full rounded-2xl" />
        ) : !b ? (
          <div className="crm-card p-8 text-center">
            <p className="text-[18px] font-semibold text-crm-ink">Link not recognised</p>
            <p className="mt-1 text-[14px] text-crm-muted">Please use the evaluation link shared by your ICCB representative.</p>
          </div>
        ) : done || (b.evaluation && b.evaluation.submittedVia === "public") ? (
          <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="crm-card p-10 text-center">
            <CheckCircle size={56} weight="fill" className="mx-auto text-[#12B76A]" />
            <p className="mt-4 text-[22px] font-bold text-crm-ink">Thank you for your feedback!</p>
            <p className="mt-1 text-[14px] text-crm-muted">It helps ICCB serve every event better.</p>
          </m.div>
        ) : (
          <div className="crm-card p-6 sm:p-8">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-crm-brand">Evaluation of Service</p>
            <h1 className="mt-1 text-[24px] font-bold text-crm-ink">{b.eventTitle}</h1>
            <p className="text-[14px] text-crm-muted">
              {fmtDate(firstEventDate(b))} · {b.bfNo}
            </p>
            <p className="mt-4 text-[14px] text-crm-ink-2">Please rate each item. Your answers go straight to the ICCB team.</p>
            <div className="mt-4">
              <RatingGrid ratings={ratings} onChange={(k, r) => setRatings((s) => ({ ...s, [k]: r }))} />
            </div>
            <label className="mt-5 block">
              <span className="mb-1.5 block text-[13px] font-medium text-crm-ink-2">Any suggestion?</span>
              <Textarea value={suggestion} onChange={(e) => setSuggestion(e.target.value)} />
            </label>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-[13px] text-crm-muted">
                <Star size={16} weight="fill" className="text-crm-brand" /> Score {evaluationScore(ratings)}/100 · {Object.keys(ratings).length}/{EVALUATION_CRITERIA.length} rated
              </span>
              <Button
                variant="primary"
                size="lg"
                disabled={!complete}
                loading={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await submitPublicEvaluation(b.id, ratings, suggestion);
                    setDone(true);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Submit evaluation
              </Button>
            </div>
          </div>
        )}
      </div>
    </MotionProvider>
  );
}
