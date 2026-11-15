"use client";
/** Calculator under the booking form — follows the Hall events / Expo Village switch. */
import { AnimatePresence, motion } from "framer-motion";
import { useCrmReady } from "@/components/providers/CrmProvider";
import { EstimateCalculator } from "./EstimateCalculator";
import { ExpoEstimateCalculator } from "./ExpoEstimateCalculator";
import { useBookingMode } from "./bookingMode";

export function EstimatorSection() {
  const ready = useCrmReady();
  const mode = useBookingMode((s) => s.mode);

  // Client-only (mode can come from the URL), so wait for the CRM store like the form does
  if (!ready) return <div className="mx-auto max-w-5xl h-[480px] rounded-2xl bg-[var(--surface)] animate-pulse" />;
  const expo = mode === "expo";

  return (
    <AnimatePresence mode="wait">
      <motion.div key={mode} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <span className="text-eyebrow block mb-2">Plan your budget</span>
          <h2 className="text-h2">
            Estimate your{" "}
            <span className="text-[var(--accent)]">{expo ? "expo cost" : "event cost"}</span>
          </h2>
          <p className="text-[var(--ink-muted)] text-[15px] mt-4">
            {expo
              ? "Choose show days, booths and services to see a rough Expo Village budget — no commitment."
              : "Choose a hall, guests, catering and extras to see a rough price range — no commitment."}
          </p>
        </div>
        {expo ? <ExpoEstimateCalculator /> : <EstimateCalculator />}
      </motion.div>
    </AnimatePresence>
  );
}
