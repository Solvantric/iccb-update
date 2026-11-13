import type { Metadata } from "next";
import { Suspense } from "react";
import { QualityPage } from "@/components/dashboard/ops/OpsPages";

export const metadata: Metadata = { title: "Quality" };
export default function Page() {
  return (
    <Suspense>
      <QualityPage />
    </Suspense>
  );
}
