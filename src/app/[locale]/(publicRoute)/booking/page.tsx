"use client";
import { useState, Suspense } from "react";
import Image from "next/image";
import { AvailabilityCalendar } from "@/components/booking/AvailabilityCalendar";
import { BudgetCalculator } from "@/components/booking/BudgetCalculator";
import { BookingForm } from "@/components/booking/BookingForm";
import { FadeUp, SlideIn, LineGrow } from "@/components/motion/primitives";
import { CalendarCheck, CurrencyDollar, CheckCircle, ArrowRight } from "@phosphor-icons/react";
import type { Shift, EstimateInput } from "@/types";

const TRUST_POINTS = [
  "No deposit required to hold a date",
  "Dedicated event coordinator assigned",
  "Flexible payment terms available",
  "Full refund policy within 14 days",
];

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
    <div>
      {/* ── Premium Hero ─────────────────────────────────── */}
      <section className="relative min-h-[52vh] flex items-end overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&q=95&w=3840"
          alt="ICCB — Book your event"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

        <div className="relative container-site pb-14 pt-40 w-full">
          <FadeUp>
            <span className="text-eyebrow text-white/60 block mb-3">Book Your Event</span>
          </FadeUp>
          <FadeUp delay={0.08}>
            <h1 className="text-h2 text-white leading-tight mb-4">
              Reserve Your Date at{" "}
              <span className="text-[var(--accent)]">ICCB</span>
            </h1>
          </FadeUp>
          <FadeUp delay={0.14}>
            <p className="text-white/75 text-[16px] max-w-xl leading-relaxed mb-8">
              Check real-time availability, get an instant budget estimate, and secure
              South Asia's most prestigious event venue.
            </p>
          </FadeUp>

          {/* Trust points */}
          <FadeUp delay={0.2}>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {TRUST_POINTS.map((p) => (
                <span key={p} className="flex items-center gap-2 text-white/70 text-[13px]">
                  <CheckCircle size={14} weight="fill" className="text-[var(--accent)] flex-shrink-0" />
                  {p}
                </span>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Step indicators ──────────────────────────────── */}
      <section className="bg-[var(--accent)] text-white">
        <div className="container-site grid grid-cols-3 divide-x divide-white/20">
          {[
            { n: "01", icon: CalendarCheck, label: "Check Availability", desc: "Browse hall availability by date" },
            { n: "02", icon: CurrencyDollar, label: "Get Your Estimate",  desc: "Instant budget breakdown"         },
            { n: "03", icon: CheckCircle,    label: "Submit Request",     desc: "Our team confirms within 24h"     },
          ].map(({ n, icon: Icon, label, desc }) => (
            <div key={n} className="flex items-start gap-4 py-6 px-6 md:px-8">
              <div className="text-[32px] font-bold text-white/20 leading-none flex-shrink-0 hidden md:block">
                {n}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={16} weight="duotone" className="text-white/80" />
                  <span className="font-semibold text-[14px]">{label}</span>
                </div>
                <p className="text-white/60 text-[12px]">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Availability Calendar ────────────────────────── */}
      <section className="section-y bg-[var(--bg-soft)]">
        <div className="container-site">
          <div className="mb-8">
            <FadeUp>
              <span className="text-eyebrow block mb-2">Step 1</span>
            </FadeUp>
            <FadeUp delay={0.06}>
              <h2 className="text-h2">
                Hall <span className="text-[var(--accent)]">Availability</span>
              </h2>
              <LineGrow delay={0.12} />
            </FadeUp>
            <FadeUp delay={0.14}>
              <p className="text-[var(--ink-muted)] text-[15px] mt-4 max-w-xl">
                Select a hall and date to check real-time availability.
              </p>
            </FadeUp>
          </div>
          <FadeUp delay={0.1}>
            <Suspense fallback={
              <div className="h-96 bg-[var(--bg)] rounded-[var(--radius-card-lg)] animate-pulse border border-[var(--line)]" />
            }>
              <AvailabilityCalendar
                onSelect={handleCalendarSelect}
                initialHallId={selectedHallId}
                initialDate={selectedDate}
              />
            </Suspense>
          </FadeUp>
        </div>
      </section>

      {/* ── Form + Calculator ────────────────────────────── */}
      <section id="booking-form-section" className="section-y bg-[var(--bg)]">
        <div className="container-site">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left — Form */}
            <SlideIn from="left">
              <span className="text-eyebrow block mb-3">Step 2</span>
              <h2 className="text-h2 mb-2">
                Your <span className="text-[var(--accent)]">Details</span>
              </h2>
              <LineGrow delay={0.08} />
              <p className="text-[var(--ink-muted)] text-[15px] mt-4 mb-8">
                Fill in your event details to submit your booking request.
              </p>
              <Suspense fallback={
                <div className="h-96 bg-[var(--bg-soft)] rounded-[var(--radius-card-lg)] animate-pulse" />
              }>
                <BookingForm estimateInput={estimateInput} onSuccess={() => {}} />
              </Suspense>
            </SlideIn>

            {/* Right — Budget Calculator */}
            <SlideIn from="right" delay={0.1}>
              <div className="lg:sticky lg:top-28">
                <span className="text-eyebrow block mb-3">Step 3</span>
                <h2 className="text-h2 mb-2">
                  Budget <span className="text-[var(--accent)]">Estimate</span>
                </h2>
                <LineGrow delay={0.08} />
                <p className="text-[var(--ink-muted)] text-[15px] mt-4 mb-8">
                  Get an instant breakdown of costs for your event.
                </p>
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
            </SlideIn>
          </div>
        </div>
      </section>

      {/* ── Reassurance band ─────────────────────────────── */}
      <section className="bg-[var(--bg-tint)] border-y border-[var(--accent)]/20 py-10">
        <div className="container-site text-center">
          <FadeUp>
            <p className="text-[var(--ink)] font-semibold text-[15px] mb-2">
              Need help choosing the right hall or package?
            </p>
            <p className="text-[var(--ink-muted)] text-[14px] mb-5">
              Our event experts are available 7 days a week.
            </p>
            <a
              href="tel:+8802-55028600"
              className="btn btn-primary inline-flex"
            >
              Call Us Now <ArrowRight size={14} weight="bold" />
            </a>
          </FadeUp>
        </div>
      </section>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--bg)] border-t border-[var(--line)] px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[12px] text-[var(--ink-muted)]">
            {selectedDate ? selectedDate : "No date selected"}
          </p>
          <p className="text-[var(--ink)] font-medium text-[13px] capitalize">{selectedHallId.replace(/-/g, " ")}</p>
        </div>
        <button
          onClick={() => document.getElementById("booking-form-section")?.scrollIntoView({ behavior: "smooth" })}
          className="btn btn-primary btn-sm"
        >
          Fill Details <ArrowRight size={13} weight="bold" />
        </button>
      </div>
    </div>
  );
}
