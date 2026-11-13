import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicEvaluation } from "@/components/booking/PublicEvaluation";

export const metadata: Metadata = { title: "Evaluation of Service", robots: { index: false } };

export default function EvaluationPage() {
  return (
    <div className="bg-[var(--bg-soft)] pt-[112px] pb-20 min-h-[80vh]">
      <div className="container-site max-w-3xl">
        <Suspense>
          <PublicEvaluation />
        </Suspense>
      </div>
    </div>
  );
}
