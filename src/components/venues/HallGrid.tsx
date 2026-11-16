"use client";
/**
 * "A Hall for Every Story" — all six halls in one grid.
 * Hovering a card wipes in a second photo of that hall (circle reveal from the cursor)
 * and slides up its key details.
 */
import { useState, type MouseEvent } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Users, Ruler } from "@phosphor-icons/react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import type { Hall } from "@/types";
import { hallDetail, hallTitle } from "@/data/hallDetails";

const ease = [0.22, 1, 0.36, 1] as const;

function HallCard({ hall, locale }: { hall: Hall; locale: Locale }) {
  const d = hallDetail(hall.slug);
  const alt = d.gallery[0] ?? hall.images[1] ?? hall.image;
  const [hover, setHover] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  const onEnter = (e: MouseEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
    setHover(true);
  };

  return (
    <Link
      href={`/venues/${hall.slug}`}
      locale={locale}
      onMouseEnter={onEnter}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-black shadow-[0_30px_60px_-40px_rgba(0,0,0,0.5)]"
    >
      {/* main photo */}
      <Image src={hall.image} alt={hallTitle(hall.name.en)} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover object-top transition-transform duration-[1.2s] group-hover:scale-105" />
      {/* second photo — circle wipe from the cursor */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ clipPath: hover ? `circle(150% at ${origin.x}% ${origin.y}%)` : `circle(0% at ${origin.x}% ${origin.y}%)` }}
        transition={{ duration: hover ? 0.9 : 0.5, ease }}
      >
        <motion.div className="absolute inset-0" animate={{ scale: hover ? 1 : 1.15 }} transition={{ duration: 1.2, ease }}>
          <Image src={alt} alt="" fill quality={90} sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
        </motion.div>
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/5" />
      {d.credit && (
        <span className="absolute end-3 top-3 max-w-[60%] text-end text-[9.5px] leading-tight text-white/70 opacity-0 transition-opacity duration-500 group-hover:opacity-100">{d.credit}</span>
      )}

      {/* numeral badge */}
      <span className="absolute start-4 top-4 grid h-11 min-w-11 place-items-center rounded-full border border-white/40 bg-black/25 px-2 font-display text-[14px] tracking-[0.1em] text-white backdrop-blur-sm transition-colors duration-500 group-hover:border-[var(--accent)] group-hover:bg-[var(--accent)]">
        {d.numeral}
      </span>

      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="font-serif text-[15px] italic text-white/75">{d.tagline}</p>
        <h3 className="mt-1 font-display text-[clamp(1.6rem,2.4vw,2.1rem)] uppercase leading-tight text-white">{hall.name.en}</h3>
        {/* details slide up on hover */}
        <div className="grid grid-rows-[0fr] transition-all duration-500 group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-3 text-[13px] text-white/85">
              <span className="flex items-center gap-1.5"><Users size={14} className="text-[var(--accent)]" /> Up to {hall.capacity.theatre.toLocaleString()}</span>
              <span className="flex items-center gap-1.5"><Ruler size={14} className="text-[var(--accent)]" /> {hall.area.toLocaleString()} sq ft</span>
            </div>
            <span className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-white">
              Explore hall <ArrowRight size={13} weight="bold" className="transition-transform group-hover:translate-x-1 rtl:-scale-x-100" />
            </span>
          </div>
        </div>
        <span className="mt-4 block h-[2px] w-10 bg-[var(--accent)] transition-all duration-500 group-hover:w-full" />
      </div>
    </Link>
  );
}

export function HallGrid({ halls, locale }: { halls: Hall[]; locale: Locale }) {
  return (
    <section className="pb-20 pt-12 md:pb-24">
      <motion.div
        className="container-site grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, margin: "-10% 0px" }}
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
      >
        {halls.map((h) => (
          <motion.div key={h.id} variants={{ hidden: { opacity: 0, y: 40, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease } } }}>
            <HallCard hall={h} locale={locale} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
