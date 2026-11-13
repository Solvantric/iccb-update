"use client";
import { LazyMotion, domAnimation, m, MotionConfig, useReducedMotion, type Variants } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;
export const DUR = { fast: 0.15, base: 0.25, slow: 0.35 } as const;

/** Wrap the dashboard once: lazy-loaded features + reduced-motion awareness. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user" transition={{ duration: DUR.base, ease: EASE }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } },
};

export const stagger = (gap = 0.04): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap } },
});

/** Page content: header → filters → cards stagger in. */
export function Stagger({ children, className, gap = 0.04 }: { children: React.ReactNode; className?: string; gap?: number }) {
  return (
    <m.div className={className} variants={stagger(gap)} initial="hidden" animate="show">
      {children}
    </m.div>
  );
}

export function Item({ children, className, as = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "section" | "li" }) {
  const C = as === "section" ? m.section : as === "li" ? m.li : m.div;
  return (
    <C className={className} variants={fadeRise}>
      {children}
    </C>
  );
}

export { m, useReducedMotion };
