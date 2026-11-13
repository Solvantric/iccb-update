import type { Metadata } from "next";
import { ContentPage } from "@/components/dashboard/marketing/ContentPage";

export const metadata: Metadata = { title: "Website CMS" };
export default function Page() {
  return <ContentPage />;
}
