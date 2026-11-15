"use client";
import { CrmProvider } from "@/components/providers/CrmProvider";
import { MotionProvider } from "./ui/motion";
import { ConfirmProvider } from "./ui/overlay";
import { NewBookingProvider } from "./bookings/NewBookingModal";
import { PdfViewer } from "./ui/PdfViewer";

/** Providers + `.crm` token scope for every /dashboard route. */
export function CrmRoot({ children }: { children: React.ReactNode }) {
  return (
    <div className="crm min-h-screen w-full">
      <CrmProvider>
        <MotionProvider>
          <ConfirmProvider>
            <NewBookingProvider>
              {children}
              <PdfViewer />
            </NewBookingProvider>
          </ConfirmProvider>
        </MotionProvider>
      </CrmProvider>
    </div>
  );
}
