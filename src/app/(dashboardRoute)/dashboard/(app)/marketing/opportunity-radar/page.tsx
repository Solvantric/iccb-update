import type { Metadata } from "next";
import { Suspense } from "react";
import { RadarPage } from "@/components/dashboard/marketing/RadarPage";

export const metadata: Metadata = { title: "Opportunity Radar" };
export default function Page() {
  return (
    <Suspense>
      <RadarPage />
    </Suspense>
  );
}
