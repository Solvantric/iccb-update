"use client";
/**
 * All Venues hero — auto-plays through the six halls (photo, name, details), with a hall strip
 * along the bottom. Hovering (or focusing) a hall jumps to it and pauses the autoplay.
 */
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Users } from "@phosphor-icons/react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import type { Hall } from "@/types";
import { hallTitle } from "@/data/hallDetails";
import { HallSlideBg, HallSlideText } from "./HallSlide";

const ease = [0.22, 1, 0.36, 1] as const;
const AUTOPLAY = 5500;

export function VenuesHero({ halls, locale }: { halls: Hall[]; locale: Locale }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    if (reduced || hover !== null) return;
    const t = setTimeout(() => setI((v) => (v + 1) % halls.length), AUTOPLAY);
    return () => clearTimeout(t);
  }, [i, reduced, hover, halls.length]);

  // Auto-plays through the halls; hovering a hall shows it right away and pauses.
  const active = hover ?? i;
  const hall = halls[active];

  return (
    <section className="relative h-[86vh] min-h-[600px] max-h-[900px] overflow-hidden bg-black">
      <HallSlideBg photo={hall.image} alt={hallTitle(hall.name.en)} priority={active === 0} />

      <div className="relative flex h-full items-center container-site pb-40">
        <HallSlideText
          hall={hall}
          footer={
            <p className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-white">
              Click to explore <ArrowRight size={13} weight="bold" className="text-[var(--accent)] rtl:-scale-x-100" />
            </p>
          }
        />
      </div>

      {/* hall strip */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="container-site pb-6">
          <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.2em] text-white/60">Hover a hall to preview · auto-playing</p>
          <motion.div
            className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } } }}
            onMouseLeave={() => {
              if (hover !== null) setI(hover);
              setHover(null);
            }}
          >
            {halls.map((h, k) => {
              const on = active === k;
              return (
                <motion.div key={h.id} variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }}>
                  <Link
                    href={`/venues/${h.slug}`}
                    locale={locale}
                    onMouseEnter={() => setHover(k)}
                    onFocus={() => setHover(k)}
                    onBlur={() => {
                      setI(k);
                      setHover(null);
                    }}
                    className={`group relative flex items-center gap-2.5 overflow-hidden rounded-xl border p-1.5 pe-3 backdrop-blur-md transition-all duration-300 ${on ? "-translate-y-1 border-white/70 bg-white text-[var(--ink)]" : "border-white/20 bg-white/10 text-white hover:bg-white/20"}`}
                  >
                    <span className="relative h-10 w-12 flex-shrink-0 overflow-hidden rounded-lg md:h-11 md:w-14">
                      <Image src={h.image} alt="" fill sizes="56px" className="object-cover object-top" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12.5px] font-semibold md:text-[13.5px]">{hallTitle(h.name.en)}</span>
                      <span className={`flex items-center gap-1 text-[11px] ${on ? "text-[var(--ink-muted)]" : "text-white/65"}`}>
                        <Users size={11} /> {h.capacity.theatre.toLocaleString()}
                      </span>
                    </span>
                    {on && hover === null && !reduced && (
                      <motion.span
                        key={i}
                        className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-[var(--accent)] rtl:origin-right"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: AUTOPLAY / 1000, ease: "linear" }}
                      />
                    )}
                    <ArrowRight size={13} className={`ms-auto hidden flex-shrink-0 transition-all md:block ${on ? "translate-x-0 text-[var(--accent)] opacity-100" : "-translate-x-1 opacity-0"} rtl:-scale-x-100`} />
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
