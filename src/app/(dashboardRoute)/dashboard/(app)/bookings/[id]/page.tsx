import type { Metadata } from "next";
import { BookingDetailPage } from "@/components/dashboard/pages/BookingDetailPage";

export const metadata: Metadata = { title: "Booking" };

export default function Page() {
  return <BookingDetailPage />;
}
