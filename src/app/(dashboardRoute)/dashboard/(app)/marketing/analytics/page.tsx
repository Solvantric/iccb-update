import type { Metadata } from "next";
import { Suspense } from "react";
import { AnalyticsPage } from "@/components/dashboard/marketing/AnalyticsPage";

export const metadata: Metadata = { title: "Analytics" };
export default function Page() {
  return (
    <Suspense>
      <AnalyticsPage />
    </Suspense>
  );
}
