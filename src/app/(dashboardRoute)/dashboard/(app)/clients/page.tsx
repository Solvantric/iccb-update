import type { Metadata } from "next";
import { ClientsPage } from "@/components/dashboard/pages/ClientsPage";

export const metadata: Metadata = { title: "Clients" };

export default function Page() {
  return <ClientsPage />;
}
