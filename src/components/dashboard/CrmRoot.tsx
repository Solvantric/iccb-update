"use client";
import { CrmProvider } from "@/components/providers/CrmProvider";
import { MotionProvider } from "./ui/motion";
import { ConfirmProvider } from "./ui/overlay";

/** Providers + `.crm` token scope for every /dashboard route. */
export function CrmRoot({ children }: { children: React.ReactNode }) {
  return (
    <div className="crm min-h-screen w-full">
      <CrmProvider>
        <MotionProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </MotionProvider>
      </CrmProvider>
    </div>
  );
}
