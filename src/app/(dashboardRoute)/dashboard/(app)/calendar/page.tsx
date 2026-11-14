import type { Metadata } from "next";
import { CalendarPage } from "@/components/dashboard/pages/CalendarPage";

export const metadata: Metadata = { title: "Calendar" };

export default function Page() {
  return <CalendarPage />;
}
