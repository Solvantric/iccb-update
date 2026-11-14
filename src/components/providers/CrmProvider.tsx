"use client";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { hydrateAll, listenCrossTab } from "@/lib/crm/db";

export { useCrmReady } from "@/lib/crm/cms";

/**
 * CRM data provider: rehydrates the persisted stores and keeps browser tabs in
 * sync. Components read the zustand stores directly, so every page updates instantly.
 */
export function CrmProvider({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 0, refetchOnWindowFocus: false } } }));
  useEffect(() => {
    void hydrateAll();
    return listenCrossTab();
  }, []);
  return (
    <QueryClientProvider client={qc}>
      {children}
      <Toaster position="bottom-right" closeButton toastOptions={{ style: { fontFamily: "var(--font-sans), system-ui, sans-serif", borderRadius: 10 } }} />
    </QueryClientProvider>
  );
}
