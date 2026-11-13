"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { createBookingFromRequest } from "@/services/crm/bookings.service";
import { db } from "@/lib/crm/db";
import { useCrmAction } from "@/services/crm/hooks";
import { PageHeader } from "../ui/core";
import { BookingRequestForm } from "../forms/BookingRequestForm";

export function NewBookingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const create = useCrmAction((input: Parameters<typeof createBookingFromRequest>[0]) => createBookingFromRequest(input, { staff: true }), {
    success: (b) => `Booking ${b.bfNo} created`,
    onSuccess: (b) => {
      const enquiryId = params.get("enquiry");
      if (enquiryId && db.enquiries.get(enquiryId)) db.enquiries.update(enquiryId, { status: "converted", bookingId: b.id });
      router.push(`/dashboard/sales/bookings/${b.id}`);
    },
  });
  return (
    <>
      <PageHeader eyebrow="Sales" title="New booking" description="For walk-in and phone clients. Same steps as the website form, plus source and representative." />
      <BookingRequestForm
        mode="staff"
        submitting={create.isPending}
        onSubmit={(input) => create.mutate(input)}
        initial={{
          hallId: params.get("hall") ?? undefined,
          date: params.get("date") ?? undefined,
          name: params.get("name") ?? undefined,
          mobile: params.get("mobile") ?? undefined,
          eventNature: params.get("nature") ?? undefined,
          guests: params.get("guests") ? Number(params.get("guests")) : undefined,
        }}
      />
    </>
  );
}
