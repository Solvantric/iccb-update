import type { Metadata } from "next";
import { Suspense } from "react";
import { DemandPage } from "@/components/dashboard/marketing/DemandPage";

export const metadata: Metadata = { title: "Demand & pricing" };
export default function Page() {
  return (
    <Suspense>
      <DemandPage />
    </Suspense>
  );
}
