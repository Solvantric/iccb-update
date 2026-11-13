import type { Metadata } from "next";
import { Suspense } from "react";
import { PpmPage } from "@/components/dashboard/ops/OpsPages";

export const metadata: Metadata = { title: "PPM" };
export default function Page() {
  return (
    <Suspense>
      <PpmPage />
    </Suspense>
  );
}
