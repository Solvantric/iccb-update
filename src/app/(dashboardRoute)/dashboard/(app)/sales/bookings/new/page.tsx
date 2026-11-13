import type { Metadata } from "next";
import { Suspense } from "react";
import { NewBookingPage } from "@/components/dashboard/bookings/NewBookingPage";

export const metadata: Metadata = { title: "New booking" };
export default function Page() {
  return (
    <Suspense>
      <NewBookingPage />
    </Suspense>
  );
}
