"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { clientLogos } from "@/data/expo";
import { RevealBlock } from "@/components/motion/RevealBlock";

const STEP_MS = 2200; // pause between moves
const MOVE_S = 0.7; // slide duration

/** How many logo cells are visible at a given row width */
function cellsFor(width: number) {
  if (width >= 1180) return 6;
  if (width >= 960) return 5;
  if (width >= 720) return 4;
  if (width >= 480) return 3;
  return 2;
}

/**
 * "Our Global Partners" — single row of full-colour logos in cells divided by thin lines,
 * round arrow buttons at both ends. Moves one logo at a time, pausing between steps.
 */
export function PartnersCarousel() {
  const reduced = useReducedMotion();
  const logos = clientLogos.filter((l) => l.logo);
  const L = logos.length;
  const track = [...logos, ...logos, ...logos];

  const viewRef = useRef<HTMLDivElement>(null);
  const [cellW, setCellW] = useState(0);
  const [pos, setPos] = useState(L); // start on the middle copy
  const [instant, setInstant] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const measure = () => setCellW(el.clientWidth / cellsFor(el.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const step = useCallback((d: number) => {
    setInstant(false);
    setPos((p) => p + d);
  }, []);

  useEffect(() => {
    if (reduced || paused) return;
    const id = setInterval(() => step(1), STEP_MS);
    return () => clearInterval(id);
  }, [reduced, paused, step]);

  return (
    <div className="mt-20 lg:mt-28">
      {/* Heading */}
      <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-14">
        <RevealBlock>
          <h2 className="display-lg text-[var(--ink)]">
            OUR GLOBAL
            <br />
            <span className="text-[var(--accent)]">PARTNERS</span>
          </h2>
        </RevealBlock>
        <RevealBlock delay={0.08}>
          <p className="text-[var(--ink-body)] text-[16px] leading-relaxed mt-6">
            We are proud to host leading international organisations and exhibitors across diverse sectors,
            bringing the world to Bangladesh.
          </p>
        </RevealBlock>
      </div>

      {/* Logo row */}
      <RevealBlock delay={0.12}>
        <div
          className="flex items-center gap-3 md:gap-5"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous partner"
            className="flex-shrink-0 grid place-items-center h-10 w-10 md:h-11 md:w-11 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            <CaretLeft size={16} weight="bold" className="rtl:-scale-x-100" />
          </button>

          <div ref={viewRef} dir="ltr" className="relative flex-1 overflow-hidden">
            <motion.div
              className="flex"
              animate={{ x: -pos * cellW }}
              initial={false}
              transition={instant ? { duration: 0 } : { duration: MOVE_S, ease: [0.65, 0, 0.35, 1] }}
              onAnimationComplete={() => {
                // keep the position inside the middle copy so the loop never ends
                if (pos >= 2 * L) {
                  setInstant(true);
                  setPos((p) => p - L);
                } else if (pos < L) {
                  setInstant(true);
                  setPos((p) => p + L);
                }
              }}
            >
              {track.map((logo, i) => (
                <div
                  key={`${logo.id}-${i}`}
                  title={logo.name}
                  className="flex-shrink-0 h-[96px] md:h-[110px] flex items-center justify-center border-s border-[var(--line)] px-5 md:px-7"
                  style={{ width: cellW || undefined }}
                >
                  <span className="relative block h-[48px] md:h-[56px] w-full">
                    <Image
                      src={logo.logo!}
                      alt={logo.name}
                      fill
                      sizes="200px"
                      unoptimized={logo.logo!.endsWith(".svg")}
                      className="object-contain"
                    />
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next partner"
            className="flex-shrink-0 grid place-items-center h-10 w-10 md:h-11 md:w-11 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            <CaretRight size={16} weight="bold" className="rtl:-scale-x-100" />
          </button>
        </div>
      </RevealBlock>
    </div>
  );
}
