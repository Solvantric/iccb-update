"use client";
import { useRef } from "react";
import { motion, useReducedMotion, type TargetAndTransition } from "framer-motion";
import type { Icon } from "@phosphor-icons/react";

export type FacilityAnim = "drive" | "flicker" | "spin" | "wobble" | "shield" | "roll" | "bounce" | "signal";

/** Icon-specific micro-animation played when the card is hovered */
const HOVER: Record<FacilityAnim, TargetAndTransition> = {
  drive:   { x: [0, 7, -5, 0], transition: { duration: 0.9, ease: "easeInOut" } },
  flicker: { opacity: [1, 0.25, 1, 0.5, 1], scale: [1, 1.15, 1], transition: { duration: 0.7 } },
  spin:    { rotate: [0, 120], transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } }, // 6-fold symmetric — ends upright
  wobble:  { y: [0, -6, 0, -3, 0], scale: [1, 1.08, 1], transition: { duration: 0.8 } },
  shield:  { scale: [1, 1.18, 0.96, 1], transition: { duration: 0.7 } },
  roll:    { x: [0, 6, -2, 0], transition: { duration: 0.8, ease: "easeInOut" } },
  bounce:  { y: [0, -9, 0, -4, 0], transition: { duration: 0.8 } },
  signal:  { opacity: [1, 0.35, 1, 0.35, 1], transition: { duration: 0.9 } },
};

interface FacilityCardProps {
  icon: Icon;
  anim: FacilityAnim;
  title: string;
  desc: string;
  index: number;
}

export function FacilityCard({ icon: IconCmp, anim, title, desc, index }: FacilityCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      initial="rest"
      animate="rest"
      whileHover="hover"
      className="group relative h-full rounded-2xl p-px overflow-hidden isolate transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-16px_rgba(16,24,40,0.12)] hover:shadow-[0_28px_50px_-26px_rgba(16,24,40,0.28)]"
    >
      {/* Hairline border — darkens slightly on hover (no red) */}
      <span aria-hidden className="absolute inset-0 -z-20 bg-[var(--line)] transition-colors duration-500 group-hover:bg-[color-mix(in_srgb,var(--ink)_16%,transparent)]" />

      <div className="relative h-full rounded-[15px] bg-[var(--surface)]/95 backdrop-blur-sm px-5 pt-9 pb-7 md:px-6 text-center overflow-hidden">
        {/* Cursor spotlight */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(240px circle at var(--mx, 50%) var(--my, 0%), rgba(16,24,40,0.035), transparent 70%)",
          }}
        />

        {/* Watermark number */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-2 end-3 font-display text-[56px] leading-none text-[var(--ink)]/[0.045] transition-colors duration-500"
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Icon tile — stays upright, neutral white */}
        <div className="relative mx-auto mb-6 h-[72px] w-[72px]">
          {/* idle float wrapper */}
          <span className="fac-float relative block h-full w-full" style={{ animationDelay: `${index * 0.3}s` }}>
            <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-[var(--surface)] ring-1 ring-[var(--line)] shadow-[0_8px_20px_-14px_rgba(16,24,40,0.25)] transition-shadow duration-500 group-hover:shadow-[0_14px_28px_-14px_rgba(16,24,40,0.32)]">
              <motion.span
                className="relative grid place-items-center"
                variants={reduced ? undefined : { rest: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }, hover: HOVER[anim] }}
              >
                {/* thin line icon at rest → solid icon on hover */}
                <IconCmp
                  size={34}
                  weight="light"
                  className="col-start-1 row-start-1 text-[var(--accent)] transition-all duration-500 group-hover:opacity-0 group-hover:scale-75"
                />
                <IconCmp
                  size={34}
                  weight="fill"
                  className="col-start-1 row-start-1 text-[var(--accent)] opacity-0 scale-125 transition-all duration-500 delay-75 group-hover:opacity-100 group-hover:scale-100"
                />
              </motion.span>
            </span>
          </span>
        </div>

        <h3 className="relative text-[var(--ink)] font-bold uppercase tracking-[0.05em] text-[13px] md:text-[14px] leading-snug mb-3">
          {title}
        </h3>
        <span
          aria-hidden
          className="relative block h-[2px] w-8 mx-auto mb-3 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] transition-all duration-500 group-hover:w-16"
        />
        <p className="relative text-[var(--ink-muted)] text-[12px] md:text-[13px] leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}
