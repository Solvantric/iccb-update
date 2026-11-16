"use client";
import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

/** Number that counts up when scrolled into view. */
export function Count({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const reduced = useReducedMotion();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView || reduced) return;
    const c = animate(0, to, { duration: 1.4, ease, onUpdate: (n) => setV(Math.round(n)) });
    return () => c.stop();
  }, [inView, reduced, to]);
  return (
    <span ref={ref} className="tabular-nums">
      {(reduced ? to : v).toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}
