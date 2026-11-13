import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarPage } from "@/components/dashboard/calendar/CalendarPage";

export const metadata: Metadata = { title: "Calendar" };
export default function Page() {
  return (
    <Suspense>
      <CalendarPage />
    </Suspense>
  );
}
