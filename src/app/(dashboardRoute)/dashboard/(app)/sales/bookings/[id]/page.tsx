import type { Metadata } from "next";
import { BookingWorkspace } from "@/components/dashboard/workspace/BookingWorkspace";

export const metadata: Metadata = { title: "Booking" };
export default function Page() {
  return <BookingWorkspace />;
}
