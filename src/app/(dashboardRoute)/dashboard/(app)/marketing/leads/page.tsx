import type { Metadata } from "next";
import { Suspense } from "react";
import { LeadsPage } from "@/components/dashboard/marketing/LeadsPage";

export const metadata: Metadata = { title: "Leads" };
export default function Page() {
  return (
    <Suspense>
      <LeadsPage />
    </Suspense>
  );
}
