"use client";
import Image from "next/image";
import { BookingSwitcher } from "@/components/booking/BookingSwitcher";
import { EstimatorSection } from "@/components/booking/EstimatorSection";
import { FadeUp, LineGrow } from "@/components/motion/primitives";
import { CalendarCheck, CheckCircle, ArrowRight, Phone } from "@phosphor-icons/react";

const TRUST_POINTS = [
  "Live availability calendar",
  "Instant price estimate",
  "Our team contacts you very soon",
];

export default function BookingPage() {
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
              Pick a hall and a free date, and we hold it for you while our team
              calls to confirm.
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
            { n: "01", icon: CalendarCheck, label: "Check availability", desc: "Pick a venue and a free date"   },
            { n: "02", icon: CheckCircle,   label: "Choose & book",      desc: "Event type, packages, details"  },
            { n: "03", icon: Phone,         label: "We contact you",     desc: "Our team confirms your booking" },
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

      {/* ── Booking request (feeds the CRM) ──────────────── */}
      <section id="booking-form-section" className="section-y bg-[var(--bg-soft)]">
        <div className="container-site">
          <div className="mb-8">
            <FadeUp>
              <span className="text-eyebrow block mb-2">Book your event</span>
            </FadeUp>
            <FadeUp delay={0.06}>
              <h2 className="text-h2">
                Tell us about your <span className="text-[var(--accent)]">event</span>
              </h2>
              <LineGrow delay={0.12} />
            </FadeUp>
            <FadeUp delay={0.14}>
              <p className="text-[var(--ink-muted)] text-[15px] mt-4 max-w-2xl">
                Choose a venue and date, add your event details and packages, and see an instant estimate. Our team will contact you very soon.
              </p>
            </FadeUp>
          </div>
          <BookingSwitcher />
        </div>
      </section>

      {/* ── Budget estimator ─────────────────────────────── */}
      <section id="estimate" className="section-y bg-[var(--bg)]">
        <div className="container-site">
          <EstimatorSection />
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
        <p className="text-[13px] text-[var(--ink-muted)]">Ready to plan your event?</p>
        <button
          onClick={() => document.getElementById("booking-form-section")?.scrollIntoView({ behavior: "smooth" })}
          className="btn btn-primary btn-sm"
        >
          Start request <ArrowRight size={13} weight="bold" />
        </button>
      </div>
    </div>
  );
}
