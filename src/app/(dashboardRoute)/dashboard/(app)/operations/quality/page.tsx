import type { Metadata } from "next";
import { QualityPage } from "@/components/dashboard/pages/QualityPage";

export const metadata: Metadata = { title: "Quality" };

export default function Page() {
  return <QualityPage />;
}
