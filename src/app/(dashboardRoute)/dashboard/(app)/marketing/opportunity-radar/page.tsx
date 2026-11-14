import type { Metadata } from "next";
import { RadarPage } from "@/components/dashboard/pages/RadarPage";

export const metadata: Metadata = { title: "Opportunity Radar" };

export default function Page() {
  return <RadarPage />;
}
