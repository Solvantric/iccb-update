"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Phone, WhatsappLogo } from "@phosphor-icons/react";
import type { Booking, BookingRequestInput } from "@/types/crm";
import { createBookingFromRequest } from "@/services/crm/bookings.service";
import { useCrmReady } from "@/components/providers/CrmProvider";
import { BookingRequestForm } from "@/components/dashboard/forms/BookingRequestForm";
import { MotionProvider, m } from "@/components/dashboard/ui/motion";
import { Skeleton } from "@/components/dashboard/ui/core";
import { useToast } from "@/components/ui/Toast";

/** Website booking form → creates Client + Booking (Requested) + estimate + notification in the CRM. */
export function PublicBookingForm() {
  const ready = useCrmReady();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Booking | null>(null);

  const submit = async (input: BookingRequestInput) => {
    setBusy(true);
    try {
      const b = await createBookingFromRequest({ ...input, source: "website" });
      setDone(b);
      document.getElementById("booking-form-section")?.scrollIntoView({ behavior: "smooth" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please call +88-01991-197719.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <MotionProvider>
      <div className="crm rounded-2xl !bg-transparent">
        {!ready ? (
          <Skeleton className="h-[520px] w-full rounded-2xl" />
        ) : done ? (
          <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="crm-card mx-auto max-w-2xl p-8 text-center">
            <m.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 18 }} className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#ECFDF3] text-[#12B76A]">
              <CheckCircle size={40} weight="fill" />
            </m.div>
            <h3 className="text-[22px] font-bold text-crm-ink">Booking request received</h3>
            <p className="mt-2 text-[14px] text-crm-ink-2">Thank you, {done.contact.name}. Please keep your reference number.</p>
            <div className="mx-auto mt-5 inline-flex flex-col rounded-xl border border-crm-line bg-crm-surface-2 px-6 py-3">
              <span className="text-[12px] uppercase tracking-[0.12em] text-crm-muted">Reference</span>
              <span className="font-mono text-[20px] font-bold text-crm-brand">{done.bfNo}</span>
              <span className="text-[12px] text-crm-muted">{done.refNo}</span>
            </div>
            <ol className="mx-auto mt-6 max-w-md space-y-2 text-start text-[13.5px] text-crm-ink-2">
              <li>1. A booking manager calls you (usually within 2 hours in business time).</li>
              <li>2. Visit ICCB for a meeting / site visit — bring your NID or Passport (and Trade License for organizations).</li>
              <li>3. Finalise hall, menu and services; 60% of venue rent as advance confirms your date.</li>
            </ol>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href="tel:+8801991197719" className="btn btn-secondary btn-sm">
                <Phone size={15} /> +88-01991-197719
              </a>
              <a href="https://wa.me/8801991197719" target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                <WhatsappLogo size={15} /> WhatsApp us
              </a>
            </div>
            <button onClick={() => setDone(null)} className="mt-5 text-[13px] text-crm-brand hover:underline">
              Send another request
            </button>
            <p className="mt-4 text-[11.5px] text-crm-muted">
              See our <Link href="/terms" className="underline">booking policies</Link>.
            </p>
          </m.div>
        ) : (
          <BookingRequestForm mode="public" onSubmit={submit} submitting={busy} />
        )}
      </div>
    </MotionProvider>
  );
}
