"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MagicWand } from "@phosphor-icons/react";
import type { ClientType } from "@/types/crm";
import { createBookingFromRequest } from "@/services/crm/bookings.service";
import { db, useCurrentUser } from "@/lib/crm/db";
import { can } from "@/lib/crm/permissions";
import { useCrmAction } from "@/services/crm/hooks";
import { Button, PageHeader } from "../ui/core";
import { BookingRequestForm } from "../forms/BookingRequestForm";
import { Matchmaker, type MatchPrefill } from "../features/Matchmaker";

export function NewBookingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const me = useCurrentUser();
  const fromUrl = !!(params.get("hall") || params.get("date") || params.get("enquiry"));
  const [prefill, setPrefill] = useState<MatchPrefill | null>(null);
  const [step, setStep] = useState<"find" | "form">(fromUrl || !can(me.role, "create", "matchmaker") ? "form" : "find");
  const create = useCrmAction((input: Parameters<typeof createBookingFromRequest>[0]) => createBookingFromRequest(input, { staff: true }), {
    success: (b) => `Booking ${b.bfNo} created`,
    onSuccess: (b) => {
      const enquiryId = params.get("enquiry");
      if (enquiryId && db.enquiries.get(enquiryId)) db.enquiries.update(enquiryId, { status: "converted", bookingId: b.id });
      router.push(`/dashboard/sales/bookings/${b.id}`);
    },
  });
  const num = (k: string) => (params.get(k) ? Number(params.get(k)) : undefined);
  const initial = prefill
    ? { hallId: prefill.hallId, date: prefill.date, guests: prefill.guests, eventNature: prefill.eventNature, clientType: prefill.clientType, layout: prefill.layout, food: prefill.food, decorationProvider: prefill.decorationProvider }
    : {
        hallId: params.get("hall") ?? undefined,
        date: params.get("date") ?? undefined,
        name: params.get("name") ?? undefined,
        mobile: params.get("mobile") ?? undefined,
        eventNature: params.get("nature") ?? undefined,
        guests: num("guests"),
        clientType: (params.get("type") as ClientType) ?? undefined,
        layout: params.get("layout") ?? undefined,
        food: params.get("food") ? params.get("food") === "1" : undefined,
        decorationProvider: (params.get("deco") as "iccb" | "outside" | "none") ?? undefined,
      };
  return (
    <>
      <PageHeader
        eyebrow={step === "find" ? "Sales · Step 1 of 2" : "Sales · Step 2 of 2"}
        title="New booking"
        description={step === "find" ? "Answer \"which hall, how much?\" in 2 minutes: options update live from capacity, availability and the pricing engine." : "For walk-in and phone clients. Same steps as the website form, plus source and representative."}
        actions={
          step === "find" ? (
            <Button onClick={() => setStep("form")}>Skip — I know the hall</Button>
          ) : (
            can(me.role, "create", "matchmaker") && (
              <Button icon={step === "form" && prefill ? ArrowLeft : MagicWand} onClick={() => setStep("find")}>
                {prefill ? "Back to options" : "Find the right hall"}
              </Button>
            )
          )
        }
      />
      {step === "find" ? (
        <Matchmaker
          onUse={(p) => {
            setPrefill(p);
            setStep("form");
          }}
        />
      ) : (
        <BookingRequestForm key={prefill ? `${prefill.hallId}-${prefill.date}` : "url"} mode="staff" submitting={create.isPending} onSubmit={(input) => create.mutate(input)} initial={initial} />
      )}
    </>
  );
}
