"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { DB_NAMES, hydrateAll, isHydrated, listenCrossTab, onHydrated, repo, useSession } from "@/lib/crm/db";

/** True once every persisted CRM store has loaded from localStorage. */
export function useCrmReady() {
  return useSyncExternalStore(onHydrated, isHydrated, () => false);
}

/**
 * CRM data provider: rehydrates the persisted stores, invalidates TanStack
 * queries whenever a store changes (so every page updates instantly), and keeps
 * browser tabs in sync.
 */
export function CrmProvider({ children, toaster = true }: { children: React.ReactNode; toaster?: boolean }) {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, retry: 0, refetchOnWindowFocus: false } },
      })
  );

  useEffect(() => {
    void hydrateAll();
    const unsubs = DB_NAMES.map((name) => repo(name).store.subscribe(() => qc.invalidateQueries({ queryKey: ["crm", name] })));
    unsubs.push(useSession.subscribe(() => qc.invalidateQueries({ queryKey: ["crm"] })));
    const offTab = listenCrossTab();
    return () => {
      unsubs.forEach((u) => u());
      offTab();
    };
  }, [qc]);

  return (
    <QueryClientProvider client={qc}>
      {children}
      {toaster && (
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{ style: { fontFamily: "var(--font-inter), var(--font-noto-bengali), system-ui, sans-serif", borderRadius: 6 } }}
        />
      )}
    </QueryClientProvider>
  );
}

/** Lightweight version for the public site: just hydrates the stores so forms can write. */
export function CrmHydrator() {
  useEffect(() => {
    void hydrateAll();
  }, []);
  return null;
}
