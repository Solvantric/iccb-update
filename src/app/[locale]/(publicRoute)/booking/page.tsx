"use client";
import { useState, Suspense } from "react";
import { AvailabilityCalendar } from "@/components/booking/AvailabilityCalendar";
import { BudgetCalculator } from "@/components/booking/BudgetCalculator";
import { BookingForm } from "@/components/booking/BookingForm";
import { RevealBlock } from "@/components/motion/RevealBlock";
import type { Shift, EstimateInput } from "@/types";

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedHallId, setSelectedHallId] = useState("gulnaksha");
  const [estimateInput, setEstimateInput] = useState<Partial<EstimateInput>>({});

  const handleCalendarSelect = (date: string, shift: Shift, hallId: string) => {
    setSelectedDate(date);
    setSelectedHallId(hallId);
    setEstimateInput((e) => ({ ...e, date, shift, hallId }));
  };

  const handleReserve = (input: EstimateInput) => {
    setEstimateInput(input);
    document.getElementById("booking-form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="pt-20 md:pt-24">
      {/* Page header */}
      <section className="bg-[var(--bg-soft)] py-12 border-b border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock>
            <span className="meta-label block mb-2">(BOOKING)</span>
            <h1 className="display-lg text-[var(--ink)]">CHECK AVAILABILITY</h1>
            <p className="text-[var(--ink-muted)] text-[16px] mt-3 max-w-xl">
              View real-time hall availability, get an instant budget estimate, and request your date.
            </p>
          </RevealBlock>
        </div>
      </section>

      {/* TOP ROW — Form (left) + Budget Calculator (right) */}
      <section id="booking-form-section" className="py-10 md:py-16 border-b border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock className="mb-8">
            <h2 className="font-display text-2xl text-[var(--ink)] font-normal uppercase tracking-wide">
              Your Details &amp; Estimate
            </h2>
            <p className="text-[var(--ink-muted)] text-[14px] mt-1">
              Fill in your event details and see an instant budget estimate.
            </p>
          </RevealBlock>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left — Booking Form (always visible) */}
            <div>
              <Suspense fallback={<div className="h-96 bg-[var(--surface)] rounded-[var(--radius-card)] animate-pulse" />}>
                <BookingForm
                  estimateInput={estimateInput}
                  onSuccess={() => {}}
                />
              </Suspense>
            </div>

            {/* Right — Budget Calculator, sticky */}
            <div className="lg:sticky lg:top-24">
              <BudgetCalculator
                initialHallId={selectedHallId}
                initialDate={selectedDate}
                onReserve={handleReserve}
                onEnquiry={(input) => {
                  setEstimateInput(input);
                  document.getElementById("booking-form-section")?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM — Availability Calendar (full width) */}
      <section className="py-10 md:py-16">
        <div className="max-w-[1440px] mx-auto sm:px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock className="mb-6 px-[clamp(1rem,4vw,3rem)] sm:px-0">
            <h2 className="font-display text-2xl text-[var(--ink)] font-normal uppercase tracking-wide">
              Hall Availability
            </h2>
            <p className="text-[var(--ink-muted)] text-[14px] mt-1">
              Select a date and hall to see real-time availability.
            </p>
          </RevealBlock>
          <Suspense fallback={<div className="h-96 bg-[var(--surface)] rounded-[var(--radius-card)] animate-pulse" />}>
            <AvailabilityCalendar
              onSelect={handleCalendarSelect}
              initialHallId={selectedHallId}
              initialDate={selectedDate}
            />
          </Suspense>
        </div>
      </section>

      {/* Mobile sticky action */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--surface)] border-t border-[var(--line)] px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[12px] text-[var(--ink-muted)]">
            {selectedDate ? selectedDate : "No date selected"}
          </p>
          <p className="text-[var(--ink)] font-medium text-[14px]">{selectedHallId}</p>
        </div>
        <button
          onClick={() => {
            document.getElementById("booking-form-section")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="bg-[var(--accent)] text-white rounded-full px-5 py-2.5 text-[12px] font-medium tracking-wider uppercase hover:bg-[var(--accent-hover)] transition-colors"
        >
          Fill Details
        </button>
      </div>
    </div>
  );
}
