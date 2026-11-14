import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientPortal } from "@/components/portal/ClientPortal";

export const metadata: Metadata = {
  title: "Your booking",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

/** Client self-service portal (secure link, no login). Data lives in the browser store for now. */
export default function PortalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-soft)]" />}>
      <ClientPortal />
    </Suspense>
  );
}
