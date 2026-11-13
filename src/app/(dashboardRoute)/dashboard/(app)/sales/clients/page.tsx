import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientsPage } from "@/components/dashboard/clients/ClientsPage";

export const metadata: Metadata = { title: "Clients" };
export default function Page() {
  return (
    <Suspense>
      <ClientsPage />
    </Suspense>
  );
}
