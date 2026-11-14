"use client";
import { useEffect, useRef, useState } from "react";
import { LazyMotion, domMax, m, MotionConfig, animate, useReducedMotion, type Variants } from "framer-motion";

/** Dashboard motion: 150–300 ms, one curve, transform/opacity only. */
export const EASE = [0.22, 1, 0.36, 1] as const;

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domMax}>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.25, ease: EASE }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

const rise: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
};

/** Cards stagger in (0.04 s) on first paint. */
export function Stagger({ children, className, gap = 0.04 }: { children: React.ReactNode; className?: string; gap?: number }) {
  return (
    <m.div className={className} initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}>
      {children}
    </m.div>
  );
}

export function Item({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <m.div className={className} variants={rise}>
      {children}
    </m.div>
  );
}

/** Number that counts up once, then animates between values. */
export function AnimatedNumber({ value, format = (n: number) => Math.round(n).toLocaleString("en-IN"), className, duration = 0.6 }: { value: number; format?: (n: number) => string; className?: string; duration?: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  const from = useRef(reduce ? value : 0);
  useEffect(() => {
    if (reduce) {
      from.current = value;
      const id = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(id);
    }
    const ctl = animate(from.current, value, { duration, ease: EASE, onUpdate: (v) => setShown(v) });
    from.current = value;
    return () => ctl.stop();
  }, [value, duration, reduce]);
  return <span className={`tabular ${className ?? ""}`}>{format(shown)}</span>;
}

export { m, useReducedMotion };
