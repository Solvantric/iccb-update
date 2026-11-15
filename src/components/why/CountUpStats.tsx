"use client";
import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";

/** Stats band — numbers count up when scrolled into view, items rise in one by one. */
function Counter({ to, suffix = "", plain = false }: { to: number; suffix?: string; plain?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduced = useReducedMotion();
  const [v, setV] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    const c = animate(0, to, { duration: 1.8, ease: [0.22, 1, 0.36, 1], onUpdate: (n) => setV(Math.round(n)) });
    return () => c.stop();
  }, [inView, reduced, to]);

  return (
    <span ref={ref} className="tabular-nums">
      {(() => {
        const n = reduced ? to : v;
        return plain ? n : n.toLocaleString("en-IN");
      })()}
      {suffix}
    </span>
  );
}

export function CountUpStats({ items }: { items: { value: number; suffix?: string; label: string; plain?: boolean }[] }) {
  return (
    <section className="relative overflow-hidden bg-[var(--accent)]">
      <div aria-hidden className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]" />
      <motion.div
        className="relative container-site grid grid-cols-3 md:grid-cols-6"
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, margin: "-10% 0px" }}
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      >
        {items.map((s, i) => (
          <motion.div
            key={s.label}
            variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
            className={`py-8 text-center text-white ${i > 0 ? "md:border-s md:border-white/15" : ""}`}
          >
            <p className="font-display text-[clamp(1.6rem,3vw,2.4rem)] leading-none">
              <Counter to={s.value} suffix={s.suffix} plain={s.plain} />
            </p>
            <p className="mt-2 text-[10.5px] uppercase tracking-[0.16em] text-white/75">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
