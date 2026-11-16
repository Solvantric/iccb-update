"use client";
/**
 * The hall "slide" shared by the All Venues hero and each hall's own hero:
 * blurred photo fill + the full, uncropped photo on the right, and white/red hall details on the left.
 */
import type { ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Hall } from "@/types";
import { hallDetail, hallTitle } from "@/data/hallDetails";

const ease = [0.22, 1, 0.36, 1] as const;

export function HallSlideBg({ photo, alt, priority = false }: { photo: string; alt: string; priority?: boolean }) {
  const reduced = useReducedMotion();
  return (
    <>
      <AnimatePresence initial={false}>
        <motion.div key={photo} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease: "easeInOut" }}>
          <Image src={photo} alt="" fill sizes="50vw" className="scale-110 object-cover blur-2xl brightness-[0.55]" />
          <motion.div
            className="absolute inset-y-[6%] end-[4%] w-[min(46vw,640px)] max-md:inset-x-[8%] max-md:w-auto max-md:opacity-40"
            initial={{ opacity: 0, scale: reduced ? 1 : 1.08, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, ease }}
          >
            <Image src={photo} alt={alt} fill priority={priority} quality={90} sizes="(max-width: 768px) 90vw, 640px" className="object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.5)]" />
          </motion.div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
    </>
  );
}

const v = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.65, ease } },
  out: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

/** Left-hand details. `top` sits above the eyebrow (e.g. breadcrumb), `footer` below the tags (e.g. buttons). */
export function HallSlideText({ hall, top, footer, as = "h1" }: { hall: Hall; top?: ReactNode; footer?: ReactNode; as?: "h1" | "h2" }) {
  const d = hallDetail(hall.slug);
  const Title = as === "h1" ? motion.h1 : motion.h2;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={hall.id}
        className="max-w-[min(38rem,48vw)] max-md:max-w-none"
        initial="hidden"
        animate="show"
        exit="out"
        variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } }, out: { transition: { staggerChildren: 0.03 } } }}
      >
        {top && <motion.div variants={v}>{top}</motion.div>}
        <motion.p variants={v} className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-white/80">
          <span className="h-px w-8 bg-[var(--accent)]" /> Hall {d.numeral} of VI
        </motion.p>
        <Title variants={v} className="mt-3 font-display uppercase text-white text-[clamp(2.4rem,5vw,4.2rem)] leading-[1]">
          {hallTitle(hall.name.en).replace(/ Hall$/i, "")} <span className="text-[var(--accent)]">Hall</span>
        </Title>
        <motion.p variants={v} className="mt-2 font-serif text-[clamp(1.05rem,1.6vw,1.3rem)] italic text-[var(--accent)]">{d.tagline}</motion.p>
        <motion.p variants={v} className="mt-4 text-[14.5px] leading-relaxed text-white/85 max-md:hidden">{d.description}</motion.p>

        <motion.div variants={v} className="mt-5 grid max-w-md grid-cols-4 overflow-hidden rounded-xl border border-white/15 bg-white/[0.06] backdrop-blur-sm">
          {[
            { l: "Sq ft", n: hall.area },
            { l: "Theatre", n: hall.capacity.theatre },
            { l: "Banquet", n: hall.capacity.banquet },
            { l: "Classroom", n: hall.capacity.classroom ?? 0 },
          ].map((c, k) => (
            <div key={c.l} className={`px-2 py-2.5 text-center ${k ? "border-s border-white/15" : ""}`}>
              <p className="font-display text-[18px] leading-none text-white md:text-[20px]">{c.n ? c.n.toLocaleString() : "—"}</p>
              <p className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">{c.l}</p>
            </div>
          ))}
        </motion.div>

        <motion.div variants={v} className="mt-4 flex flex-wrap gap-1.5 max-md:hidden">
          {d.idealFor.slice(0, 4).map((t) => (
            <span key={t} className="rounded-full border border-white/25 px-3 py-1 text-[12px] font-medium text-white">
              <span className="me-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)] align-middle" />
              {t}
            </span>
          ))}
        </motion.div>

        {footer && <motion.div variants={v}>{footer}</motion.div>}
      </motion.div>
    </AnimatePresence>
  );
}
