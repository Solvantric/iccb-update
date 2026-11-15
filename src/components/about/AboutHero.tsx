"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=90&w=3840`;

/** Copy taken from iccbbg.com (Overview / Mission & Values). */
export interface HeroSlide { lines: string[]; highlight: string; text: string; image: string }

const ABOUT_SLIDES: HeroSlide[] = [
  {
    lines: ["The Largest Event Venue"],
    highlight: "in South Asia",
    text: "International Convention City Bashundhara — 8.5 lac sq. ft. of world-class event space next to the 300 ft. Purbachal Express Highway, Dhaka.",
    image: u("1742724769470-4f921b700c71"),
  },
  {
    lines: ["Experiences to Be"],
    highlight: "Remembered for a Lifetime",
    text: "We aim to make any occasion truly memorable — whether it's a corporate event or a personal celebration.",
    image: u("1780542900375-0cf459e38fbb"),
  },
  {
    lines: ["Life Takes"],
    highlight: "a New Course",
    text: "A place filled with tranquility, where you can feel the breeze and look at the horizon through the greenery.",
    image: u("1540575467063-178a50c2df87"),
  },
  {
    lines: ["The Country's Largest"],
    highlight: "Expo Zone",
    text: "ICCB Expo Village hosts the nation's biggest fairs, exhibitions and product launches under one roof.",
    image: u("1587825140708-dfaf72ae4b04"),
  },
];

const AUTOPLAY = 5500;
const ease = [0.22, 1, 0.36, 1] as const;

export function AboutHero() {
  return <HeroSlides eyebrow="About Us" slides={ABOUT_SLIDES} />;
}

/** Full-width hero slider: Ken Burns photos, headline lines rising out of a blur, progress dots. */
export function HeroSlides({ eyebrow, slides, raiseDots = false }: { eyebrow: string; slides: HeroSlide[]; raiseDots?: boolean }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setI((v) => (v + 1) % slides.length), AUTOPLAY);
    return () => clearTimeout(t);
  }, [i, reduced, slides.length]);

  const s = slides[i];

  return (
    <section className="relative h-[78vh] min-h-[520px] max-h-[820px] overflow-hidden bg-black">
      <AnimatePresence initial={false}>
        <motion.div
          key={i}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ scale: reduced ? 1 : 1.14 }}
            animate={{ scale: 1.02 }}
            transition={{ duration: AUTOPLAY / 1000 + 1.5, ease: "easeOut" }}
          >
            <Image src={s.image} alt={`${s.lines.join(" ")} ${s.highlight}`} fill priority={i === 0} sizes="100vw" className="object-cover" />
          </motion.div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />

      <div className="relative h-full container-site flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            className="max-w-2xl pt-16"
            initial="hidden"
            animate="show"
            exit="out"
            variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } }, out: { transition: { staggerChildren: 0.04 } } }}
          >
            <motion.p
              variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } }, out: { opacity: 0, transition: { duration: 0.2 } } }}
              className="text-eyebrow !text-white/75 mb-5"
            >
              {eyebrow}
            </motion.p>
            <h1 className="font-display uppercase text-white text-[clamp(2.4rem,5.6vw,4.6rem)] leading-[1.02]">
              {s.lines.map((l) => (
                <motion.span
                  key={l}
                  className="block"
                  variants={{ hidden: { opacity: 0, y: 30, filter: "blur(8px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease } }, out: { opacity: 0, y: -12, transition: { duration: 0.25 } } }}
                >
                  {l}
                </motion.span>
              ))}
              <motion.span
                className="block text-[var(--accent)]"
                variants={{ hidden: { opacity: 0, y: 30, filter: "blur(8px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease } }, out: { opacity: 0, y: -12, transition: { duration: 0.25 } } }}
              >
                {s.highlight}
              </motion.span>
            </h1>
            <motion.span
              variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.7, ease } }, out: { scaleX: 0, transition: { duration: 0.2 } } }}
              className="mt-6 mb-5 block h-[3px] w-16 origin-left bg-[var(--accent)] rtl:origin-right"
            />
            <motion.p
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } }, out: { opacity: 0, transition: { duration: 0.2 } } }}
              className="max-w-xl text-white/85 text-[15px] md:text-[17px] leading-relaxed"
            >
              {s.text}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots with progress */}
      <div className={`absolute ${raiseDots ? "bottom-24 md:bottom-28" : "bottom-7"} left-1/2 -translate-x-1/2 flex items-center gap-2`}>
        {slides.map((_, k) => (
          <button
            key={k}
            type="button"
            onClick={() => setI(k)}
            aria-label={`Slide ${k + 1}`}
            className={`relative h-1.5 overflow-hidden rounded-full transition-all duration-500 ${k === i ? "w-10 bg-white/30" : "w-2 bg-white/50 hover:bg-white/80"}`}
          >
            {k === i && !reduced && (
              <motion.span key={i} className="absolute inset-y-0 left-0 bg-[var(--accent)]" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: AUTOPLAY / 1000, ease: "linear" }} />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
