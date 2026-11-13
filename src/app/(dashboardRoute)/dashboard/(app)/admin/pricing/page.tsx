import type { Metadata } from "next";
import { PricingPage } from "@/components/dashboard/admin/PricingPage";

export const metadata: Metadata = { title: "Pricing" };
export default function Page() {
  return <PricingPage />;
}
