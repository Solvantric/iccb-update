"use client";
/**
 * "6 Reasons" — sticky stacking cards. Each reason pins near the top while the next one slides
 * over it, so they go by one at a time, in order. Earlier cards shrink slightly but stay fully bright.
 */
import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Check } from "@phosphor-icons/react";

export interface Reason {
  no: string;
  title: string;
  desc: string;
  /** phrases inside `desc` shown in red */
  highlight: string[];
  image: string;
  /** 4 small picture tiles under the description */
  points: { label: string; image: string }[];
}

/** Wrap the highlight phrases of `text` in red spans. */
function withHighlights(text: string, phrases: string[]) {
  if (!phrases.length) return text;
  const esc = phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${esc.join("|")})`, "g"));
  return parts.map((part, k) =>
    phrases.includes(part) ? <span key={k} className="font-semibold text-[var(--accent)]">{part}</span> : part,
  );
}

const ease = [0.22, 1, 0.36, 1] as const;

function Card({ r, i, total, progress }: { r: Reason; i: number; total: number; progress: MotionValue<number> }) {
  const reduced = useReducedMotion();
  const start = i / total;
  const scale = useTransform(progress, [start, 1], [1, reduced ? 1 : 1 - (total - i) * 0.035]);
  const words = r.title.split(" ");
  const item = { hidden: { opacity: 0, y: 18, filter: "blur(6px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.65, ease } } };
  const tile = { hidden: { opacity: 0, scale: 1.08, clipPath: "inset(0 0 100% 0)" }, show: { opacity: 1, scale: 1, clipPath: "inset(0 0 0% 0)", transition: { duration: 0.8, ease } } };

  return (
    <div className="sticky flex items-start pb-6 md:pb-0 md:h-[min(80vh,640px)]" style={{ top: `calc(100px + ${i * 18}px)` }}>
      <motion.article
        style={{ scale, transformOrigin: "top center" }}
        className="relative w-full md:h-full overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_40px_80px_-50px_rgba(0,0,0,0.5)]"
      >
        {/* giant number in the background */}
        <span aria-hidden className="pointer-events-none absolute -bottom-10 start-4 select-none font-display text-[220px] leading-none text-[var(--ink)]/[0.035]">{r.no}</span>

        <div className="relative grid md:h-full md:grid-cols-[1fr_1.08fr]">
          {/* ── Text ── */}
          <motion.div
            className="flex flex-col justify-center p-6 sm:p-9 lg:p-11"
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.4 }}
            variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
          >
            <motion.div variants={item} className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--accent)] font-display text-[17px] text-white shadow-[0_10px_22px_-10px_var(--accent)]">{r.no}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--ink-muted)]">Reason {r.no} of {String(total).padStart(2, "0")}</span>
            </motion.div>

            <motion.h3 variants={item} className="mt-5 font-display uppercase text-[clamp(1.7rem,3vw,2.6rem)] leading-[1.02] text-[var(--ink)]">
              {words.map((w, k) => (
                <span key={k} className={k >= Math.ceil(words.length / 2) ? "text-[var(--accent)]" : ""}>
                  {w}
                  {k < words.length - 1 ? " " : ""}
                </span>
              ))}
            </motion.h3>
            <motion.span variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.6, ease } } }} className="mt-4 block h-[3px] w-14 origin-left rounded-full bg-gradient-to-r from-[var(--accent)] to-[#ff7a7e] rtl:origin-right" />

            <motion.p variants={item} className="mt-5 text-[15px] leading-[1.75] text-[var(--ink-body)]">
              {withHighlights(r.desc, r.highlight)}
            </motion.p>

            {/* key facts — fills the card, 2 × 2 */}
            <ul className="mt-6 grid grid-cols-2 gap-2.5">
              {r.points.map((p) => (
                <motion.li key={p.label} variants={item}
                  className="flex items-center gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg-soft)]/70 px-3 py-2.5">
                  <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                    <Check size={13} weight="bold" />
                  </span>
                  <span className="text-[13px] font-semibold text-[var(--ink)]">{p.label}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* ── Picture grid (right): 1 large + 4 small, edge to edge ── */}
          <motion.div
            className="relative grid h-[320px] md:h-auto grid-cols-4 grid-rows-3 gap-1.5 p-1.5 md:p-2 md:ps-0"
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.35 }}
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={tile} className="group relative col-span-4 row-span-2 overflow-hidden rounded-2xl">
              <Image src={r.image} alt={r.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            </motion.div>
            {r.points.map((p) => (
              <motion.div key={p.label} variants={tile} className="group relative overflow-hidden rounded-xl">
                <Image src={p.image} alt={p.label} fill sizes="(max-width: 768px) 25vw, 160px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 px-2 pb-1.5 text-[10.5px] sm:text-[11.5px] font-semibold leading-tight text-white">{p.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.article>
    </div>
  );
}

export function ReasonsStack({ reasons }: { reasons: Reason[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return (
    <div ref={ref} className="relative">
      {reasons.map((r, i) => (
        <Card key={r.no} r={r} i={i} total={reasons.length} progress={scrollYProgress} />
      ))}
    </div>
  );
}
