import type { Metadata } from "next";
import { EnquiriesPage } from "@/components/dashboard/pages/EnquiriesPage";

export const metadata: Metadata = { title: "Enquiries" };

export default function Page() {
  return <EnquiriesPage />;
}
