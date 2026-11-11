"use client";
import { useEffect } from "react";

export function MockAdapterProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
      import("@/lib/api/mockAdapter").then(({ installMockAdapter }) => {
        installMockAdapter();
      });
    }
  }, []);

  return <>{children}</>;
}
