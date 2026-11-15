import type { Metadata } from "next";
import { ReviewFormPage } from "@/components/dashboard/pages/ReviewFormPage";

export const metadata: Metadata = { title: "Share your review" };

/** Public, shareable client review form (outside the staff shell). */
export default function Page() {
  return <ReviewFormPage />;
}
