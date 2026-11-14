"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { CaretUp, CaretDown } from "@phosphor-icons/react";
import { RevealBlock } from "@/components/motion/RevealBlock";
import { SectionLabel } from "@/components/ui/SectionLabel";

const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=90&w=3840`;

/** ICCB milestones — sourced from public news coverage; edit freely as the team confirms details. */
const MILESTONES = [
  {
    year: "2015",
    title: "The Doors Open",
    highlight: "Open",
    desc: "Bashundhara Group opens International Convention City Bashundhara on 1 January 2015, introducing the largest event space Bangladesh had ever seen.",
    image: u("1780542900375-0cf459e38fbb"),
  },
  {
    year: "2019",
    title: "A Home for First-Ever Expos",
    highlight: "First-Ever",
    desc: "ICCB hosts the Food & Hospitality Bangladesh Expo, the country's first exposition of its kind, and becomes the go-to venue for national trade fairs and dealer conferences.",
    image: u("1555244162-803834f70033"),
  },
  {
    year: "2020",
    title: "Standing with the Nation",
    highlight: "Nation",
    desc: "During the pandemic ICCB is transformed into a 2,000-bed COVID-19 hospital, inaugurated on 17 May 2020 — one of the largest of its kind in the world.",
    image: u("1538108149393-fbbd81895907"),
  },
  {
    year: "2021",
    title: "Heritage Restaurant Opens",
    highlight: "Heritage",
    desc: "In June 2021 ICCB launches Heritage Restaurant, bringing royal Mughal-inspired dining, traditional recipes and impeccable service into the complex.",
    image: u("1414235077428-338989a2e8c0"),
  },
  {
    year: "2022",
    title: "Showcasing Bangladesh",
    highlight: "Bangladesh",
    desc: "The first-ever Bangladesh Jewellery Expo begins at ICCB — one of many landmark exhibitions that put local industries in the spotlight.",
    image: u("1611591437281-460bfbe1220a"),
  },
  {
    year: "2025",
    title: "Expo Village Is Born",
    highlight: "Expo",
    desc: "ICCB unveils Expo Village, the country's largest single-roof exhibition space, opening with the 8th Bangladesh Buildcon International Expo.",
    image: u("1587825140708-dfaf72ae4b04"),
  },
  {
    year: "2026",
    title: "A Global Stage",
    highlight: "Global",
    desc: "Today ICCB welcomes international fairs such as the Asian Tourism Fair alongside weddings, summits and celebrations for more than 20,000 guests at a time.",
    image: u("1505373877841-8d25f7d46678"),
  },
];

const AUTOPLAY_MS = 5500;
const EASE = [0.22, 1, 0.36, 1] as const;

export function HistoryTimeline() {
  const reduced = useReducedMotion();
  const N = MILESTONES.length;
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (next: number) => {
      const i = ((next % N) + N) % N;
      setDir(next > active ? 1 : -1);
      setActive(i);
    },
    [active, N],
  );

  useEffect(() => {
    if (reduced || paused) return;
    const id = setTimeout(() => go(active + 1), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [active, paused, reduced, go]);

  const m = MILESTONES[active];

  // Subtle mouse parallax on the photo
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 18 });
  const sy = useSpring(py, { stiffness: 60, damping: 18 });
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width - 0.5) * -24);
    py.set(((e.clientY - r.top) / r.height - 0.5) * -16);
  };

  return (
    <section className="relative bg-[var(--bg)] py-[clamp(4rem,9vw,8rem)] overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10 lg:mb-14">
          <RevealBlock>
            <SectionLabel>(OUR HISTORY)</SectionLabel>
          </RevealBlock>
          <RevealBlock delay={0.08}>
            <h2 className="display-lg text-[var(--ink)] mt-3 mb-5">
              OUR JOURNEY <span className="text-[var(--accent)]">SINCE 2015</span>
            </h2>
          </RevealBlock>
          <RevealBlock delay={0.12}>
            <span aria-hidden className="block h-[3px] w-14 bg-[var(--accent)] mx-auto mb-5" />
            <p className="text-[var(--ink-body)] text-[16px] leading-relaxed">
              Over a decade of milestones, firsts and unforgettable moments — the story of Bangladesh&apos;s
              premier convention destination.
            </p>
          </RevealBlock>
        </div>

      </div>

      {/* Stage */}
        <RevealBlock delay={0.1}>
          <div
            className="relative overflow-hidden bg-[#0b0b0c] h-[560px] md:h-[620px] lg:h-[680px] w-full"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => {
              setPaused(false);
              px.set(0);
              py.set(0);
            }}
            onPointerMove={onPointerMove}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowRight") go(active + 1);
              if (e.key === "ArrowUp" || e.key === "ArrowLeft") go(active - 1);
            }}
            tabIndex={0}
            aria-roledescription="carousel"
            aria-label="ICCB history timeline"
          >
            {/* Photo — reveals as an expanding circle from the year rail, with Ken Burns zoom + parallax */}
            <motion.div className="absolute -inset-4" style={{ x: sx, y: sy }}>
              <AnimatePresence initial={false} custom={dir}>
                <motion.div
                  key={m.year}
                  custom={dir}
                  className="absolute inset-0"
                  variants={{
                    enter: (d: number) => ({
                      clipPath: `circle(0% at 88% ${d > 0 ? 62 : 38}%)`,
                      zIndex: 2,
                    }),
                    center: { clipPath: "circle(150% at 88% 50%)", zIndex: 2, filter: "brightness(1)" },
                    exit: { zIndex: 1, filter: "brightness(0.55)", transition: { duration: 1.2 } },
                  }}
                  initial={reduced ? false : "enter"}
                  animate="center"
                  exit="exit"
                  transition={{ duration: 1.25, ease: [0.65, 0, 0.35, 1] }}
                >
                  <motion.div
                    className="absolute inset-0"
                    initial={{ scale: reduced ? 1 : 1.22, rotate: reduced ? 0 : -1.2 }}
                    animate={{ scale: reduced ? 1 : 1.05, rotate: 0 }}
                    transition={{ duration: AUTOPLAY_MS / 1000 + 1.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Image src={m.image} alt={m.title} fill sizes="100vw" className="object-cover" priority={active === 0} />
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Shading only behind the text side, so light photos stay bright */}
            <div className="absolute inset-0 z-[3] bg-gradient-to-l rtl:bg-gradient-to-r from-black/80 via-black/35 to-transparent pointer-events-none" />

            {/* Light sweep on every change */}
            <AnimatePresence>
              <motion.span
                key={`sweep-${m.year}`}
                aria-hidden
                className="absolute z-[4] inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"
                initial={{ left: "-40%", opacity: 0 }}
                animate={{ left: "120%", opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: "easeInOut", delay: 0.35 }}
              />
            </AnimatePresence>

            {/* Outlined year watermark — sits fully inside the frame */}
            <div className="absolute z-[4] bottom-[70px] md:bottom-[84px] start-6 md:start-10 pointer-events-none select-none">
              <AnimatePresence mode="wait">
                <motion.span
                  key={m.year}
                  initial={{ opacity: 0, x: -40, filter: "blur(8px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: 30, filter: "blur(8px)" }}
                  transition={{ duration: 0.9, ease: EASE }}
                  className="block font-display leading-[1.1] pe-4 text-[clamp(5rem,13vw,11rem)] text-transparent [-webkit-text-stroke:1.2px_rgba(255,255,255,0.45)]"
                >
                  {m.year}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Content */}
            <div className="absolute z-[5] inset-y-0 end-0 flex items-center pe-[92px] md:pe-[160px] ps-6 w-full md:w-[64%] lg:w-[54%] justify-end">
              <AnimatePresence mode="wait">
                <motion.div
                  key={m.year}
                  className="text-end max-w-[500px]"
                  initial="hidden"
                  animate="show"
                  exit="out"
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.07, delayChildren: 0.3 } },
                    out: { transition: { staggerChildren: 0.025, staggerDirection: -1 } },
                  }}
                >
                  {/* Year — digits flip in one by one */}
                  <p
                    className="font-display text-white text-[clamp(3.5rem,6.5vw,5.5rem)] leading-[1.1] [perspective:600px]"
                    aria-label={m.year}
                  >
                    {m.year.split("").map((d, i) => (
                      <motion.span
                        key={i}
                        aria-hidden
                        className="inline-block origin-bottom"
                        variants={{
                          hidden: { opacity: 0, rotateX: -90, y: 20 },
                          show: { opacity: 1, rotateX: 0, y: 0, transition: { duration: 0.7, ease: EASE } },
                          out: { opacity: 0, rotateX: 90, y: -14, transition: { duration: 0.3 } },
                        }}
                      >
                        {d}
                      </motion.span>
                    ))}
                  </p>

                  <motion.span
                    variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.8, ease: EASE } }, out: { scaleX: 0, transition: { duration: 0.25 } } }}
                    className="block h-[2px] w-20 bg-gradient-to-l from-[var(--accent)] to-[#ff7a7e] ms-auto my-5 origin-right rtl:origin-left"
                  />

                  <h3 className="font-display uppercase text-white text-[clamp(1.7rem,3vw,2.6rem)] leading-[1.15] mb-4 pb-1">
                    {m.title.split(" ").map((w, i) => (
                      <motion.span
                        key={i}
                        className={`inline-block me-[0.28em] last:me-0 ${w === m.highlight ? "text-[var(--accent)]" : ""}`}
                        variants={{
                          hidden: { opacity: 0, y: 26, filter: "blur(10px)" },
                          show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.75, ease: EASE } },
                          out: { opacity: 0, y: -12, filter: "blur(6px)", transition: { duration: 0.25 } },
                        }}
                      >
                        {w}
                      </motion.span>
                    ))}
                  </h3>

                  <motion.p
                    variants={{ hidden: { opacity: 0, y: 18, filter: "blur(6px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE } }, out: { opacity: 0, y: -8, transition: { duration: 0.25 } } }}
                    className="text-white/85 text-[14px] md:text-[16px] leading-[1.75] tracking-[0.01em]"
                  >
                    {m.desc}
                  </motion.p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Year rail */}
            <div className="absolute z-[6] inset-y-0 end-0 w-[72px] md:w-[120px] flex flex-col items-center justify-center gap-3 border-s border-white/15 bg-black/20 backdrop-blur-[6px]">
              <button
                type="button"
                onClick={() => go(active - 1)}
                aria-label="Previous year"
                className="grid place-items-center h-9 w-9 rounded-full border border-white/25 text-white/80 hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-white transition-colors"
              >
                <CaretUp size={16} weight="bold" />
              </button>

              <ul className="relative flex flex-col items-center gap-1 py-2">
                {MILESTONES.map((x, i) => {
                  const on = i === active;
                  return (
                    <li key={x.year} className="relative">
                      {on && (
                        <motion.span
                          layoutId="year-pill"
                          className="absolute inset-0 rounded-full bg-[var(--accent)] shadow-[0_6px_18px_-6px_rgba(235,33,39,0.9)]"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => go(i)}
                        aria-current={on ? "step" : undefined}
                        className={`relative block px-3 md:px-4 py-1.5 font-display tabular-nums tracking-wide transition-all duration-300 ${
                          on ? "text-white text-[15px] md:text-[17px]" : "text-white/55 text-[12px] md:text-[14px] hover:text-white"
                        }`}
                      >
                        {x.year}
                      </button>
                      {/* autoplay progress under the active year */}
                      {on && !reduced && (
                        <span className="absolute -bottom-0.5 inset-x-3 h-[2px] rounded-full bg-white/20 overflow-hidden">
                          <motion.span
                            key={`${x.year}-${paused}`}
                            className="block h-full bg-white origin-left"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: paused ? 0 : 1 }}
                            transition={{ duration: paused ? 0.2 : AUTOPLAY_MS / 1000, ease: "linear" }}
                          />
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>

              <button
                type="button"
                onClick={() => go(active + 1)}
                aria-label="Next year"
                className="grid place-items-center h-9 w-9 rounded-full border border-white/25 text-white/80 hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-white transition-colors"
              >
                <CaretDown size={16} weight="bold" />
              </button>
            </div>

            {/* Curved bottom edge, like a flowing wave */}
            <svg
              aria-hidden
              className="absolute z-[7] bottom-[-1px] inset-x-0 w-full h-[46px] md:h-[64px] text-[var(--bg)]"
              viewBox="0 0 1440 64"
              preserveAspectRatio="none"
            >
              <path fill="currentColor" d="M0 64V40C240 8 520 0 760 22s520 40 680 6V64z" />
            </svg>
          </div>
        </RevealBlock>
    </section>
  );
}
