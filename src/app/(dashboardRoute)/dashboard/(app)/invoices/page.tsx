import type { Metadata } from "next";
import { InvoicesPage } from "@/components/dashboard/pages/InvoicesPage";

export const metadata: Metadata = { title: "Invoices" };

export default function Page() {
  return <InvoicesPage />;
}
