"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { ArrowUp } from "@phosphor-icons/react";

const R = 24;

/** Back-to-top button with a red scroll-progress ring. */
export function ScrollTopButton() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.4 });
  const [visible, setVisible] = useState(false);

  useEffect(() => scrollYProgress.on("change", (v) => setVisible(v > 0.08)), [scrollYProgress]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="group fixed bottom-[92px] end-6 md:bottom-[216px] md:end-[22px] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--accent)] shadow-lg border border-[var(--line)] no-print hover:bg-[var(--accent)] hover:text-white transition-colors duration-300"
        >
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56" aria-hidden>
            <circle cx="28" cy="28" r={R} fill="none" stroke="var(--line)" strokeWidth="2" />
            <motion.circle
              cx="28"
              cy="28"
              r={R}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ pathLength: progress }}
            />
          </svg>
          <ArrowUp size={20} weight="bold" className="relative transition-transform duration-300 group-hover:-translate-y-0.5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
