"use client";
import { useEffect, useState } from "react";
import { CheckCircle, WhatsappLogo } from "@phosphor-icons/react";
import type { Booking } from "@/types/crm";
import { createBooking } from "@/services/crm";
import { useCrmReady } from "@/components/providers/CrmProvider";
import { BookingForm } from "@/components/dashboard/bookings/BookingForm";
import { MotionProvider, m } from "@/components/dashboard/ui/motion";
import { Skeleton } from "@/components/dashboard/ui/core";
import { trackCrm } from "@/lib/crm/track";
import { useHallMap } from "@/lib/crm/hooks";
import { fmtDate, waHref } from "@/lib/crm/format";
import { useToast } from "@/components/ui/Toast";

const ICCB_WHATSAPP = "01991197719";

/** Website booking form → a Reserved booking (+ enquiry, + meeting if asked) in the CRM. */
export function PublicBookingForm() {
  const ready = useCrmReady();
  const toast = useToast();
  const halls = useHallMap();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Booking | null>(null);

  useEffect(() => {
    if (ready) trackCrm("form_open", "/booking");
  }, [ready]);

  return (
    <MotionProvider>
      <div className="crm !bg-transparent">
        {!ready ? (
          <Skeleton className="h-[560px] w-full" />
        ) : done ? (
          <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="crm-card mx-auto max-w-xl p-8 text-center sm:p-10">
            <m.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }} className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-crm-success-bg text-crm-success">
              <CheckCircle size={32} weight="fill" />
            </m.div>
            <h3 className="text-[22px] font-semibold text-crm-ink">Your date is reserved.</h3>
            <p className="mt-2 text-[15px] text-crm-ink-2">Our representative will call you soon.</p>
            <div className="mx-auto mt-6 inline-flex flex-col rounded-[12px] border border-crm-line bg-crm-surface-2 px-6 py-3">
              <span className="text-[12px] text-crm-muted">Reference no.</span>
              <span className="text-[20px] font-semibold tracking-wide text-crm-ink tabular">{done.ref}</span>
              <span className="text-[12.5px] text-crm-muted">
                {halls.get(done.hallId)?.name} · {fmtDate(done.date, "EEE, d MMM yyyy")}
              </span>
            </div>
            <div className="mt-7 flex justify-center">
              <a href={waHref(ICCB_WHATSAPP, `Hello ICCB, my booking reference is ${done.ref}.`)} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-crm-whatsapp px-5 text-[14px] font-medium text-white transition-opacity hover:opacity-90">
                <WhatsappLogo size={18} weight="fill" /> Message us on WhatsApp
              </a>
            </div>
          </m.div>
        ) : (
          <div className="crm-card mx-auto max-w-4xl p-5 sm:p-8">
            <BookingForm
              submitLabel="Reserve my date"
              busy={busy}
              onSubmit={async (input) => {
                setBusy(true);
                try {
                  await new Promise((r) => setTimeout(r, 400));
                  setDone(createBooking(input, "website"));
                  document.getElementById("booking-form-section")?.scrollIntoView({ behavior: "smooth" });
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Something went wrong. Please call +88-01991-197719.");
                } finally {
                  setBusy(false);
                }
              }}
            />
          </div>
        )}
      </div>
    </MotionProvider>
  );
}
