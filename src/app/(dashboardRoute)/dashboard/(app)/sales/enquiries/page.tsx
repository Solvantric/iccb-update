import type { Metadata } from "next";
import { Suspense } from "react";
import { EnquiriesPage } from "@/components/dashboard/enquiries/EnquiriesPage";

export const metadata: Metadata = { title: "Enquiries" };
export default function Page() {
  return (
    <Suspense>
      <EnquiriesPage />
    </Suspense>
  );
}
