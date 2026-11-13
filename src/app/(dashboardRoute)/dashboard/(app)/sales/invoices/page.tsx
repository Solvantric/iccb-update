import type { Metadata } from "next";
import { Suspense } from "react";
import { InvoicesPage } from "@/components/dashboard/invoices/InvoicesPage";

export const metadata: Metadata = { title: "Invoices" };
export default function Page() {
  return (
    <Suspense>
      <InvoicesPage />
    </Suspense>
  );
}
