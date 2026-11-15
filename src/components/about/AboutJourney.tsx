"use client";
/**
 * About page — "Our Journey": a vertical timeline whose centre line fills red as you scroll.
 * Milestones alternate left/right, each sliding in from its side with a photo; the year dot
 * lights up as it is reached. Same sourced milestones as the home page timeline.
 */
import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { MILESTONES } from "@/components/sections/HistoryTimeline";
import { SectionLabel } from "@/components/ui/SectionLabel";

const ease = [0.22, 1, 0.36, 1] as const;

export function AboutJourney() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <section className="section-y relative overflow-hidden bg-[#0f1012] text-white">
      {/* faint giant year range */}
      <p aria-hidden className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-display text-[clamp(6rem,18vw,16rem)] leading-none text-white/[0.03]">
        2015 — 2026
      </p>

      <div className="relative container-site">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel light>Our Journey</SectionLabel>
          <h2 className="mt-4 font-display uppercase text-[clamp(2rem,4vw,3.2rem)] leading-[1.05]">
            A Decade of <span className="text-[var(--accent)]">Milestones</span>
          </h2>
          <p className="mt-5 text-[15.5px] leading-relaxed text-white/65">
            From opening our doors in 2015 to welcoming the world today — the moments that shaped ICCB.
          </p>
        </div>

        <div ref={ref} className="relative mx-auto mt-16 max-w-5xl">
          {/* centre line + scroll fill */}
          <div className="absolute top-0 bottom-0 start-5 md:start-1/2 w-[2px] -translate-x-1/2 rtl:translate-x-1/2 bg-white/10" />
          <motion.div
            className="absolute top-0 bottom-0 start-5 md:start-1/2 w-[2px] -translate-x-1/2 rtl:translate-x-1/2 origin-top bg-gradient-to-b from-[#ff5a5f] to-[var(--accent)] shadow-[0_0_12px_rgba(235,33,39,0.6)]"
            style={{ scaleY: reduced ? 1 : fill }}
          />

          <ol className="space-y-14 md:space-y-20">
            {MILESTONES.map((m, i) => {
              const left = i % 2 === 0;
              const words = m.title.split(" ");
              return (
                <li key={m.year} className="relative grid md:grid-cols-2 md:gap-16 ps-14 md:ps-0">
                  {/* dot */}
                  <motion.span
                    className="absolute top-3 start-5 md:start-1/2 z-10 grid h-5 w-5 -translate-x-1/2 rtl:translate-x-1/2 place-items-center rounded-full border-2 border-[var(--accent)] bg-[#0f1012]"
                    initial={{ scale: 0.4, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: false, margin: "-30% 0px -40% 0px" }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  >
                    <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                    <span className="absolute inset-0 rounded-full bg-[var(--accent)]/40 animate-ping" />
                  </motion.span>

                  <motion.div
                    className={`${left ? "md:col-start-1 md:text-end" : "md:col-start-2"}`}
                    initial={{ opacity: 0, x: reduced ? 0 : left ? -60 : 60, filter: "blur(6px)" }}
                    whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    viewport={{ once: false, margin: "-15% 0px" }}
                    transition={{ duration: 0.8, ease }}
                  >
                    <p className="font-display text-[clamp(3rem,6vw,4.5rem)] leading-none text-transparent [-webkit-text-stroke:1.2px_rgba(255,255,255,0.55)]">
                      {m.year}
                    </p>
                    <h3 className="mt-3 font-display uppercase text-[22px] leading-tight">
                      {words.map((w, k) => (
                        <span key={k} className={w === m.highlight ? "text-[var(--accent)]" : ""}>
                          {w}
                          {k < words.length - 1 ? " " : ""}
                        </span>
                      ))}
                    </h3>
                    <p className={`mt-3 max-w-md text-[14.5px] leading-relaxed text-white/65 ${left ? "md:ms-auto" : ""}`}>{m.desc}</p>
                  </motion.div>

                  <motion.div
                    className={`mt-5 md:mt-0 ${left ? "md:col-start-2 md:row-start-1" : "md:col-start-1 md:row-start-1"}`}
                    initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
                    whileInView={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
                    viewport={{ once: false, margin: "-15% 0px" }}
                    transition={{ duration: 1, ease, delay: 0.1 }}
                  >
                    <div className="group relative aspect-[16/10] overflow-hidden rounded-xl">
                      <Image src={m.image} alt={m.title} fill sizes="(max-width: 768px) 90vw, 460px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                  </motion.div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
