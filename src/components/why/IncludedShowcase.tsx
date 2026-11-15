"use client";
/**
 * "Included in Every Booking" — an interactive checklist.
 * Items tick themselves one by one (the check mark draws in) with a live "x / 8 included" counter.
 * The photo on the right follows the active item: it auto-plays through the list, and hovering an
 * item jumps straight to it.
 */
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { SectionLabel } from "@/components/ui/SectionLabel";

export interface IncludedItem {
  title: string;
  note: string;
  image: string;
}

const ease = [0.22, 1, 0.36, 1] as const;
const AUTOPLAY = 2600;

function DrawCheck({ on, delay }: { on: boolean; delay: number }) {
  return (
    <span className={`relative grid h-8 w-8 flex-shrink-0 place-items-center rounded-full border-2 transition-colors duration-500 ${on ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--line)] bg-[var(--surface)]"}`}>
      <svg viewBox="0 0 24 24" className="h-4 w-4">
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          fill="none"
          stroke="white"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: on ? 1 : 0 }}
          transition={{ duration: 0.45, ease, delay: on ? delay : 0 }}
        />
      </svg>
    </span>
  );
}

export function IncludedShowcase({ items, locale }: { items: IncludedItem[]; locale: Locale }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px" });
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const ticked = inView ? items.length : 0;

  // Auto-advance the highlighted item while the section is on screen
  useEffect(() => {
    if (!inView || hovering || reduced) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % items.length), AUTOPLAY);
    return () => clearTimeout(t);
  }, [active, inView, hovering, reduced, items.length]);

  const cur = items[active];

  return (
    <section className="section-y bg-[var(--bg)]">
      <div ref={ref} className="container-site">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ duration: 0.6, ease }}>
              <SectionLabel>Every Booking</SectionLabel>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: false }}
              transition={{ duration: 0.8, ease, delay: 0.1 }}
              className="mt-4 font-display uppercase text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] text-[var(--ink)]"
            >
              Included in <span className="text-[var(--accent)]">Every Booking</span>
            </motion.h2>
          </div>
          {/* live counter */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: false }} transition={{ duration: 0.6, ease, delay: 0.2 }}
            className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-3">
            <p className="font-display text-[40px] leading-none text-[var(--ink)] tabular-nums">
              <AnimatePresence mode="popLayout">
                <motion.span key={ticked} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="inline-block text-[var(--accent)]">
                  {ticked}
                </motion.span>
              </AnimatePresence>
              <span className="text-[var(--ink-muted)]">/{items.length}</span>
            </p>
            <p className="text-[12px] font-semibold uppercase leading-tight tracking-[0.14em] text-[var(--ink-muted)]">
              Included
              <br />
              at no extra cost
            </p>
          </motion.div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-stretch">
          {/* Checklist */}
          <ol className="relative" onMouseLeave={() => setHovering(false)}>
            <span aria-hidden className="absolute top-4 bottom-4 start-4 w-[2px] bg-[var(--line)]" />
            <motion.span
              aria-hidden
              className="absolute top-4 start-4 w-[2px] origin-top bg-[var(--accent)]"
              initial={{ height: 0 }}
              animate={{ height: inView ? "calc(100% - 2rem)" : 0 }}
              transition={{ duration: reduced ? 0 : items.length * 0.18, ease: "easeInOut" }}
            />
            {items.map((it, i) => {
              const on = i === active;
              return (
                <motion.li
                  key={it.title}
                  initial={{ opacity: 0, x: -24 }}
                  animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -24 }}
                  transition={{ duration: 0.5, ease, delay: inView ? i * 0.12 : 0 }}
                  onMouseEnter={() => {
                    setHovering(true);
                    setActive(i);
                  }}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className={`relative flex w-full items-center gap-4 rounded-xl py-3 pe-4 text-start transition-colors duration-300 ${on ? "bg-[var(--bg-soft)]" : "hover:bg-[var(--bg-soft)]/60"}`}
                  >
                    <DrawCheck on={inView} delay={0.2 + i * 0.12} />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[15px] font-semibold transition-colors ${on ? "text-[var(--accent)]" : "text-[var(--ink)]"}`}>{it.title}</span>
                      <AnimatePresence initial={false}>
                        {on && (
                          <motion.span
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="block overflow-hidden text-[13px] leading-relaxed text-[var(--ink-muted)]"
                          >
                            <span className="block pt-1">{it.note}</span>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                    <span className={`font-display text-[13px] tabular-nums transition-colors ${on ? "text-[var(--accent)]" : "text-[var(--ink-muted)]/50"}`}>{String(i + 1).padStart(2, "0")}</span>
                  </button>
                </motion.li>
              );
            })}
          </ol>

          {/* Photo that follows the active item */}
          <motion.div
            initial={{ opacity: 0, clipPath: "inset(0 0 0 100%)" }}
            whileInView={{ opacity: 1, clipPath: "inset(0 0 0 0%)" }}
            viewport={{ once: false, margin: "-10% 0px" }}
            transition={{ duration: 1, ease }}
            className="relative min-h-[420px] overflow-hidden rounded-3xl bg-black"
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={cur.image}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.12 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease }}
              >
                <Image src={cur.image} alt={cur.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            {/* progress segments */}
            <div className="absolute top-5 inset-x-5 flex gap-1.5">
              {items.map((_, i) => (
                <span key={i} className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                  {i < active && <span className="absolute inset-0 bg-white" />}
                  {i === active && (
                    <motion.span
                      key={`${active}-${hovering}`}
                      className="absolute inset-y-0 left-0 bg-white"
                      initial={{ width: hovering ? "100%" : "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: hovering || reduced ? 0 : AUTOPLAY / 1000, ease: "linear" }}
                    />
                  )}
                </span>
              ))}
            </div>

            <div className="absolute inset-x-0 bottom-0 p-7 md:p-9">
              <AnimatePresence mode="wait">
                <motion.div key={cur.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4, ease }}>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/60">Included · {String(active + 1).padStart(2, "0")}</span>
                  <h3 className="mt-1.5 font-display uppercase text-[clamp(1.5rem,2.6vw,2.1rem)] leading-tight text-white">{cur.title}</h3>
                </motion.div>
              </AnimatePresence>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/booking" locale={locale} className="btn btn-primary">
                  Check Availability <ArrowRight size={14} weight="bold" />
                </Link>
                <Link href="/enquiry" locale={locale} className="inline-flex items-center rounded-[var(--radius-btn)] border border-white/40 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-white hover:text-[var(--ink)]">
                  Request a Quote
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
