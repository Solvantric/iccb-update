"use client";
/** Booking page switch: Hall events (6 halls) ↔ Expo Village. ?mode=expo opens the expo flow. */
import { motion } from "framer-motion";
import { Buildings, Storefront } from "@phosphor-icons/react";
import { useCrmReady } from "@/components/providers/CrmProvider";
import { BookingJourney } from "./BookingJourney";
import { ExpoBooking } from "./ExpoBooking";
import { useBookingMode } from "./bookingMode";

export function BookingSwitcher() {
  const ready = useCrmReady();
  const mode = useBookingMode((s) => s.mode);
  const setMode = useBookingMode((s) => s.setMode);

  // Render only once the CRM store is ready (client-only), so the initial mode never mismatches SSR
  if (!ready) return <div className="mx-auto max-w-5xl h-[560px] rounded-2xl bg-[var(--surface)] animate-pulse" />;

  const OPTIONS = [
    { id: "halls" as const, label: "Hall events", sub: "Weddings, conferences & more · 6 halls", icon: Buildings },
    { id: "expo" as const, label: "Expo Village", sub: "Trade fairs & exhibitions", icon: Storefront },
  ];

  return (
    <div>
      <div className="mx-auto mb-5 grid max-w-xl grid-cols-2 gap-1 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1">
        {OPTIONS.map(({ id, label, sub, icon: Icon }) => {
          const on = mode === id;
          return (
            <button key={id} type="button" onClick={() => setMode(id)} className="relative rounded-xl px-3 py-2.5 text-start">
              {on && <motion.span layoutId="booking-mode" className="absolute inset-0 rounded-xl bg-[var(--ink)]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
              <span className={`relative flex items-center gap-2.5 ${on ? "text-white" : "text-[var(--ink)]"}`}>
                <Icon size={20} weight={on ? "fill" : "regular"} className={on ? "text-[var(--accent)]" : "text-[var(--ink-muted)]"} />
                <span>
                  <span className="block text-[14px] font-semibold leading-tight">{label}</span>
                  <span className={`block text-[11px] ${on ? "text-white/65" : "text-[var(--ink-muted)]"}`}>{sub}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <motion.div key={mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        {mode === "halls" ? (
          <BookingJourney
            onSwitchToExpo={() => {
              setMode("expo");
              document.getElementById("booking-form-section")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        ) : (
          <ExpoBooking />
        )}
      </motion.div>
    </div>
  );
}
