import type { Metadata } from "next";
import { DemandPage } from "@/components/dashboard/pages/DemandPage";

export const metadata: Metadata = { title: "Demand & Pricing" };

export default function Page() {
  return <DemandPage />;
}
