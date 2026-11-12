"use client";
import { useState } from "react";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Users, Ruler } from "@phosphor-icons/react";
import { halls } from "@/data/halls";
import { RevealBlock } from "@/components/motion/RevealBlock";

interface HallSliderProps {
  locale: Locale;
}

export function HallSlider({ locale }: HallSliderProps) {
  const [current, setCurrent] = useState(0);
  const hall = halls[current];

  const prev = () => setCurrent((c) => (c - 1 + halls.length) % halls.length);
  const next = () => setCurrent((c) => (c + 1) % halls.length);

  return (
    <section className="bg-[var(--bg)] py-[clamp(4rem,10vw,9rem)] overflow-hidden border-t border-[var(--line)]">
      <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
        {/* Section meta */}
        <RevealBlock className="mb-12">
          <span className="meta-label">(HALLS) — OUR CONVENTION SPACES</span>
        </RevealBlock>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: image */}
          <div className="relative aspect-[4/3] lg:aspect-auto lg:h-[500px] overflow-hidden rounded-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={hall.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={hall.image}
                  alt={hall.name.en}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>

            {/* Capacity pill */}
            <div className="absolute top-4 start-4 bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] text-white rounded-[var(--radius-btn)] px-4 py-2 text-[11px] font-bold tracking-[0.12em] uppercase flex items-center gap-2">
              <Users size={14} weight="light" />
              Up to {hall.capacity.theatre.toLocaleString()} guests
            </div>
          </div>

          {/* Right: content */}
          <div>
            {/* Counter */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-[var(--ink-muted)] text-[11px] tracking-[0.18em] uppercase">
                0{current + 1} / 0{halls.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={prev}
                  aria-label="Previous hall"
                  className="w-10 h-10 rounded-full border border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--ink)] hover:text-[var(--ink)] transition-colors flex items-center justify-center"
                >
                  <ArrowLeft size={16} weight="light" />
                </button>
                <button
                  onClick={next}
                  aria-label="Next hall"
                  className="w-10 h-10 rounded-full border border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--ink)] hover:text-[var(--ink)] transition-colors flex items-center justify-center"
                >
                  <ArrowRight size={16} weight="light" />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={hall.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <h2 className="display-md text-[var(--ink)] mb-4">{hall.name.en.toUpperCase()}</h2>

                {/* Specs */}
                <div className="flex gap-6 mb-6">
                  <div className="flex items-center gap-2 text-[var(--ink-muted)] text-[13px]">
                    <Ruler size={14} weight="light" />
                    {hall.area.toLocaleString()} sq ft
                  </div>
                  {hall.ceilingHeight && (
                    <div className="text-[var(--ink-muted)] text-[13px]">
                      {hall.ceilingHeight} ft ceiling
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-8">
                  {hall.features.slice(0, 4).map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-[var(--ink-muted)] text-[14px]">
                      <span className="w-1 h-1 rounded-full bg-[var(--accent)] mt-2 flex-shrink-0" />
                      {feat.en}
                    </li>
                  ))}
                </ul>

                {/* Capacity table */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[
                    { label: "Theatre", val: hall.capacity.theatre },
                    { label: "Banquet", val: hall.capacity.banquet },
                    ...(hall.capacity.classroom ? [{ label: "Classroom", val: hall.capacity.classroom }] : []),
                  ].map((cap) => (
                    <div key={cap.label} className="bg-[var(--bg-soft)] border border-[var(--line)] rounded-lg p-3 text-center">
                      <p className="font-display text-2xl text-[var(--ink)] font-normal">{cap.val.toLocaleString()}</p>
                      <p className="text-[10px] text-[var(--ink-muted)] tracking-[0.14em] uppercase mt-0.5">{cap.label}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 flex-wrap">
                  <Link
                    href="/enquiry"
                    locale={locale}
                    className="flex items-center gap-2 bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] shadow-[0_8px_22px_-10px_var(--accent-glow)] hover:-translate-y-px text-white rounded-[var(--radius-btn)] px-6 py-3 text-[11px] font-bold tracking-[0.12em] uppercase hover:brightness-110 transition-colors"
                  >
                    Request a Quote
                    <ArrowRight size={13} weight="bold" />
                  </Link>
                  <Link
                    href={`/venues/${hall.slug}`}
                    locale={locale}
                    className="flex items-center gap-2 border-2 border-[var(--accent)] text-[var(--ink)] rounded-[var(--radius-btn)] px-6 py-3 text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-[var(--accent)] hover:text-white transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Circular NEXT button */}
        <div className="flex justify-end mt-10">
          <button
            onClick={next}
            aria-label="Next hall"
            className="relative w-24 h-24 rounded-full border border-[var(--line)] hover:border-[var(--ink)] transition-colors group overflow-hidden"
          >
            <motion.span
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <svg viewBox="0 0 96 96" className="w-full h-full">
                <path id="circle-text" d="M 48,8 A 40,40 0 1,1 47.9,8" fill="none" />
                <text style={{ fontSize: "8px", letterSpacing: "0.3em", textTransform: "uppercase", fill: "var(--ink-muted)" }}>
                  <textPath href="#circle-text">NEXT HALL · NEXT HALL · </textPath>
                </text>
              </svg>
            </motion.span>
            <ArrowRight size={20} className="text-[var(--ink)] absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:translate-x-[-40%] transition-transform" weight="light" />
          </button>
        </div>
      </div>
    </section>
  );
}
