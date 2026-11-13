import type { Metadata } from "next";
import { Suspense } from "react";
import { EventsBoardPage } from "@/components/dashboard/ops/OpsPages";

export const metadata: Metadata = { title: "Events" };
export default function Page() {
  return (
    <Suspense>
      <EventsBoardPage />
    </Suspense>
  );
}
