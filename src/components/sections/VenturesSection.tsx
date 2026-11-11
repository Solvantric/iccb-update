"use client";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { ArrowRight, ForkKnife, Crown, Sparkle, Briefcase } from "@phosphor-icons/react";
import { ventures } from "@/data/ventures";

const N = ventures.length;
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const RTL_LOCALES: string[] = ["ar"];

const TYPE_ICON = {
  catering: ForkKnife,
  restaurant: Crown,
  icecream: Sparkle,
  other: Briefcase,
} as const;

const CLIP_LTR =
  "polygon(0 0, 100% 0, 100% calc(100% - 56px), calc(100% - 80px) 100%, 0 100%)";
const CLIP_RTL =
  "polygon(0 0, 100% 0, 100% 100%, 80px 100%, 0 calc(100% - 56px))";

// ── Mobile stacked card ──────────────────────────────────────────────────────
function MobileVentureCard({
  venture,
  index,
  locale,
}: {
  venture: (typeof ventures)[number];
  index: number;
  locale: Locale;
}) {
  const TypeIcon = TYPE_ICON[venture.type as keyof typeof TYPE_ICON] ?? Briefcase;
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.7, ease: EASE }}
      className="relative overflow-hidden rounded-2xl"
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: "4/5" }}>
        <Image
          src={venture.heroImage}
          alt={venture.name}
          fill
          sizes="100vw"
          className="object-cover"
          priority={index === 0}
          loading={index === 0 ? "eager" : "lazy"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-6">
          <div className="flex items-center gap-2 mb-3">
            <TypeIcon size={14} weight="duotone" className="text-[var(--accent)]" />
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/60">
              ICCB VENTURES · 0{index + 1} / 0{N}
            </span>
          </div>
          <h3
            className="text-white font-bold leading-tight mb-2"
            style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)" }}
          >
            {venture.name}
          </h3>
          <p className="text-white/70 text-[14px] mb-4 leading-relaxed">{venture.tagline}</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {venture.highlights.slice(0, 3).map((h) => (
              <span
                key={h.title}
                className="text-[11px] font-semibold tracking-wide text-white/80 bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-1 rounded-full"
              >
                {h.title}
              </span>
            ))}
            {venture.isSample && (
              <span className="text-[11px] font-semibold text-[var(--accent)] bg-[var(--accent)]/15 border border-[var(--accent)]/30 px-3 py-1 rounded-full">
                Coming Soon
              </span>
            )}
          </div>
          {!venture.isSample && (
            <Link
              href={`/ventures/${venture.slug}`}
              locale={locale}
              className="inline-flex items-center gap-2 text-[13px] font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent)]/90 px-5 py-2.5 rounded-lg transition-colors"
            >
              Explore <ArrowRight size={13} weight="bold" />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Progress dot ─────────────────────────────────────────────────────────────
function ProgressDot({
  venture,
  index,
  activeIndex,
  scrollYProgress,
  onNavigate,
  isRTL,
}: {
  venture: (typeof ventures)[number];
  index: number;
  activeIndex: number;
  scrollYProgress: MotionValue<number>;
  onNavigate: (i: number) => void;
  isRTL: boolean;
}) {
  const fillProgress = useTransform(scrollYProgress, [index / N, (index + 1) / N], [0, 1]);
  const fillH = useTransform(fillProgress, [0, 1], ["0%", "100%"]);
  const isActive = index === activeIndex;

  return (
    <button
      onClick={() => onNavigate(index)}
      aria-label={`View ${venture.name}`}
      className="group flex items-center gap-2.5 focus:outline-none"
      style={{ flexDirection: isRTL ? "row-reverse" : "row" }}
    >
      <div
        className={`relative w-2.5 h-2.5 rounded-full border-[1.5px] overflow-hidden flex-shrink-0 transition-colors duration-300 ${
          isActive
            ? "border-[var(--accent)]"
            : "border-white/30 group-hover:border-white/60"
        }`}
      >
        <motion.div
          className="absolute top-0 inset-x-0 bg-[var(--accent)] rounded-full"
          style={{ height: fillH }}
        />
      </div>
      <span
        className={`text-[11px] font-medium tracking-wide whitespace-nowrap select-none transition-all duration-300 ${
          isActive ? "text-white" : "text-transparent group-hover:text-white/50"
        }`}
      >
        {venture.name}
      </span>
    </button>
  );
}

// ── Progress rail ─────────────────────────────────────────────────────────────
function ProgressRail({
  activeIndex,
  scrollYProgress,
  onNavigate,
  isRTL,
}: {
  activeIndex: number;
  scrollYProgress: MotionValue<number>;
  onNavigate: (i: number) => void;
  isRTL: boolean;
}) {
  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 z-30 flex flex-col items-center ${
        isRTL ? "start-8" : "end-8"
      }`}
    >
      {ventures.map((v, i) => (
        <div key={v.id} className="flex flex-col items-center">
          <ProgressDot
            venture={v}
            index={i}
            activeIndex={activeIndex}
            scrollYProgress={scrollYProgress}
            onNavigate={onNavigate}
            isRTL={isRTL}
          />
          {i < N - 1 && <div className="w-px h-5 bg-white/15 my-1" />}
        </div>
      ))}
    </div>
  );
}

// ── Content overlay ───────────────────────────────────────────────────────────
function ContentBlock({
  venture,
  index,
  locale,
  reduced,
}: {
  venture: (typeof ventures)[number];
  index: number;
  locale: Locale;
  reduced: boolean;
}) {
  const TypeIcon = TYPE_ICON[venture.type as keyof typeof TYPE_ICON] ?? Briefcase;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <div className="flex items-center gap-2 mb-4">
        <TypeIcon size={14} weight="duotone" className="text-[var(--accent)]" />
        <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/60">
          ICCB VENTURES · 0{index + 1} / 0{N}
        </span>
      </div>

      <div className="overflow-hidden mb-2">
        <motion.h2
          initial={{ y: reduced ? 0 : "105%", opacity: reduced ? 0 : 1 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: reduced ? 0 : "-105%", opacity: 0 }}
          transition={{ duration: 0.65, ease: EASE, delay: 0.06 }}
          className="font-bold text-white leading-tight"
          style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
        >
          {venture.name}
        </motion.h2>
      </div>

      <motion.p
        initial={{ opacity: 0, y: reduced ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.55, ease: EASE, delay: 0.14 }}
        className="text-white/70 text-[15px] mb-5 leading-relaxed max-w-sm"
      >
        {venture.tagline}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.55, ease: EASE, delay: 0.2 }}
        className="flex flex-wrap gap-2 mb-6"
      >
        {venture.highlights.slice(0, 3).map((h) => (
          <span
            key={h.title}
            className="text-[11px] font-semibold tracking-wide text-white/80 bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-full"
          >
            {h.title}
          </span>
        ))}
        {venture.isSample && (
          <span className="text-[11px] font-semibold text-[var(--accent)] bg-[var(--accent)]/15 border border-[var(--accent)]/30 px-3 py-1.5 rounded-full">
            Coming Soon
          </span>
        )}
      </motion.div>

      {!venture.isSample && (
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.27 }}
        >
          <Link
            href={`/ventures/${venture.slug}`}
            locale={locale}
            className="inline-flex items-center gap-2 text-[13px] font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent)]/90 px-6 py-3 rounded-lg transition-colors shadow-lg"
          >
            Explore <ArrowRight size={13} weight="bold" />
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Desktop sticky scroll ─────────────────────────────────────────────────────
function DesktopStickyVentures({ locale, isRTL }: { locale: Locale; isRTL: boolean }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const reduced = !!useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      setActiveIndex(Math.min(N - 1, Math.floor(v * N)));
    });
  }, [scrollYProgress]);

  function scrollToVenture(i: number) {
    if (!outerRef.current) return;
    const top = window.scrollY + outerRef.current.getBoundingClientRect().top;
    window.scrollTo({ top: top + (i / N) * outerRef.current.offsetHeight, behavior: "smooth" });
  }

  return (
    <div ref={outerRef} className="relative" style={{ height: `${N * 100}vh` }}>
      {/* Sticky stage */}
      <div
        className="sticky overflow-hidden"
        style={{ top: "72px", height: "calc(100vh - 72px)" }}
      >
        {/* Full-bleed images with crossfade */}
        <div
          className="absolute inset-0"
          style={{ clipPath: isRTL ? CLIP_RTL : CLIP_LTR }}
        >
          <AnimatePresence initial={false}>
            {ventures.map((v, i) =>
              i === activeIndex ? (
                <motion.div
                  key={v.id}
                  className="absolute inset-0"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.08 }}
                  animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1.0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.85, ease: EASE }}
                >
                  <Image
                    src={v.heroImage}
                    alt={v.name}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority={i === 0}
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
                </motion.div>
              ) : null
            )}
          </AnimatePresence>
        </div>

        {/* White line along diagonal cut edge */}
        <div
          className={`absolute bottom-0 z-10 pointer-events-none w-[110px] h-[80px] ${
            isRTL ? "start-0" : "end-0"
          }`}
        >
          <svg width="110" height="80" viewBox="0 0 110 80" fill="none">
            {isRTL ? (
              <line x1="0" y1="24" x2="80" y2="80" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
            ) : (
              <line x1="30" y1="80" x2="110" y2="24" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
            )}
          </svg>
        </div>

        {/* Content block — logical start, bottom */}
        <div className="absolute bottom-14 start-14 z-20 max-w-[480px]">
          <AnimatePresence mode="wait">
            {ventures.map((v, i) =>
              i === activeIndex ? (
                <ContentBlock
                  key={v.id}
                  venture={v}
                  index={i}
                  locale={locale}
                  reduced={reduced}
                />
              ) : null
            )}
          </AnimatePresence>
        </div>

        {/* Progress rail — logical end */}
        <ProgressRail
          activeIndex={activeIndex}
          scrollYProgress={scrollYProgress}
          onNavigate={scrollToVenture}
          isRTL={isRTL}
        />

        {/* Subtle wave at bottom */}
        <div
          className="absolute bottom-0 inset-x-0 z-10 pointer-events-none"
          style={{ marginBottom: "-1px" }}
        >
          <svg
            viewBox="0 0 1440 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full block"
            preserveAspectRatio="none"
          >
            <path d="M0,24 C480,0 960,48 1440,16 L1440,48 L0,48 Z" fill="rgba(0,0,0,0.25)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
interface VenturesSectionProps {
  locale: Locale;
}

export function VenturesSection({ locale }: VenturesSectionProps) {
  const isRTL = RTL_LOCALES.includes(locale);

  return (
    <>
      {/* Mobile layout */}
      <section className="md:hidden bg-[var(--bg-soft)] section-y">
        <div className="container-site">
          <div className="mb-10">
            <span className="text-eyebrow">ICCB Ventures</span>
            <h2 className="text-h2 mt-2">
              One Destination,{" "}
              <span className="text-[var(--accent)]">Endless Experiences</span>
            </h2>
          </div>
          <div className="space-y-8">
            {ventures.map((v, i) => (
              <MobileVentureCard key={v.id} venture={v} index={i} locale={locale} />
            ))}
          </div>
        </div>
      </section>

      {/* Desktop sticky scroll */}
      <div className="hidden md:block">
        <DesktopStickyVentures locale={locale} isRTL={isRTL} />
      </div>
    </>
  );
}
