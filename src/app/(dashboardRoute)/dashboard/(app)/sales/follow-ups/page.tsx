import type { Metadata } from "next";
import { Suspense } from "react";
import { FollowUpsPage } from "@/components/dashboard/followups/FollowUpsPage";

export const metadata: Metadata = { title: "Follow-ups" };
export default function Page() {
  return (
    <Suspense>
      <FollowUpsPage />
    </Suspense>
  );
}
