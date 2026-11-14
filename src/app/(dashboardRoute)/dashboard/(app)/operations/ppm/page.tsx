import type { Metadata } from "next";
import { MeetingsPage } from "@/components/dashboard/pages/MeetingsPage";

export const metadata: Metadata = { title: "PPM" };

export default function Page() {
  return <MeetingsPage />;
}
