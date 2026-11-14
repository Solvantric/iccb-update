import type { Metadata } from "next";
import { UsersPage } from "@/components/dashboard/pages/UsersPage";

export const metadata: Metadata = { title: "Users & settings" };

export default function Page() {
  return <UsersPage />;
}
