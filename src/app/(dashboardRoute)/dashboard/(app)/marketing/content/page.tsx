import type { Metadata } from "next";
import { ContentPage } from "@/components/dashboard/pages/ContentPage";

export const metadata: Metadata = { title: "Website content" };

export default function Page() {
  return <ContentPage />;
}
