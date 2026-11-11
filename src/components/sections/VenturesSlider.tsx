"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Link, useRouter } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { motion, useInView, useReducedMotion, type PanInfo } from "framer-motion";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { ventures, type Venture } from "@/data/ventures";
import { FadeUp } from "@/components/motion/primitives";
import { cn } from "@/lib/utils/cn";

const EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];
const WIPE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const AUTOPLAY_MS = 5000;
const SHIFT_DURATION = 0.9;
const RTL_LOCALES: string[] = ["ar"];

interface VenturesSliderProps {
  locale: Locale;
}

function getVisibleCount(width: number): 1 | 2 | 3 {
  if (width < 768) return 1;
  if (width < 1024) return 2;
  return 3;
}

function getSlantPx(visibleCount: 1 | 2 | 3): number {
  if (visibleCount === 1) return 44;
  if (visibleCount === 2) return 48;
  return 56;
}

function buildPolygon(
  hasStartSlant: boolean,
  hasEndSlant: boolean,
  slant: number,
  isRTL: boolean
): string {
  const sLeft = isRTL ? (hasEndSlant ? slant : 0) : hasStartSlant ? slant : 0;
  const sRightTop = isRTL ? (hasStartSlant ? slant : 0) : 0;
  const sRightBottom = isRTL ? 0 : hasEndSlant ? slant : 0;

  // In LTR: start=left, end=right. Top-left slanted inward by sLeft, bottom-right slanted inward by sRightBottom.
  // In RTL: start=right, end=left. Top-right slanted inward by sRightTop, bottom-left slanted inward by sLeft.
  if (!isRTL) {
    const tl = `${sLeft}px 0%`;
    const tr = `100% 0%`;
    const br = `calc(100% - ${sRightBottom}px) 100%`;
    const bl = `0px 100%`;
    return `polygon(${tl}, ${tr}, ${br}, ${bl})`;
  }

  const tl = `0px 0%`;
  const tr = `calc(100% - ${sRightTop}px) 0%`;
  const br = `100% 100%`;
  const bl = `${sLeft}px 100%`;
  return `polygon(${tl}, ${tr}, ${br}, ${bl})`;
}

interface DiagonalLineProps {
  side: "start" | "end";
  slant: number;
  isRTL: boolean;
  opacity?: number;
}

function DiagonalLine({ side, slant, isRTL, opacity = 1 }: DiagonalLineProps) {
  // Position an SVG along the start or end edge of the panel to draw a crisp 2px white cut line.
  // In LTR: "start" is left edge (slant -> 0), "end" is right edge (slant -> 0).
  // In RTL: "start" is right edge (0 -> slant), "end" is left edge (0 -> slant).
  const isLeftEdge = (!isRTL && side === "start") || (isRTL && side === "end");
  const x1 = isRTL ? 0 : slant;
  const x2 = isRTL ? slant : 0;

  return (
    <motion.svg
      aria-hidden="true"
      animate={{ opacity }}
      transition={{ duration: SHIFT_DURATION, ease: EASE }}
      className={cn(
        "absolute top-0 bottom-0 h-full pointer-events-none z-20",
        isLeftEdge ? "left-0" : "right-0"
      )}
      style={{ width: `${slant}px` }}
      viewBox={`0 0 ${slant} 100`}
      preserveAspectRatio="none"
    >
      <line
        x1={x1}
        y1="0"
        x2={x2}
        y2="100"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="3.5"
        vectorEffect="non-scaling-stroke"
      />
    </motion.svg>
  );
}

interface PanelItemProps {
  venture: Venture;
  locale: Locale;
  slotIndex: number;
  visibleCount: 1 | 2 | 3;
  slant: number;
  isRTL: boolean;
  isHovered: boolean;
  inView: boolean;
  reduced: boolean;
  isShifting: boolean;
  shiftDir: 1 | -1;
  hasAnimatedEntrance: boolean;
  clipPath: string;
  initialClipPath?: string;
  showStartLine: boolean;
  startLineOpacity?: number;
  showEndLine: boolean;
  flexGrow?: number;
  panelWidthPx?: number;
  marginInlineStartPx: number;
  zIndex: number;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  didSwipeRef: React.MutableRefObject<boolean>;
}

function VenturePanel({
  venture,
  locale,
  slotIndex,
  visibleCount,
  slant,
  isRTL,
  isHovered,
  inView,
  reduced,
  isShifting,
  shiftDir,
  hasAnimatedEntrance,
  clipPath,
  initialClipPath,
  showStartLine,
  startLineOpacity = 1,
  showEndLine,
  flexGrow = 1,
  panelWidthPx,
  marginInlineStartPx,
  zIndex,
  onHoverStart,
  onHoverEnd,
  didSwipeRef,
}: PanelItemProps) {
  const router = useRouter();
  const isMobile = visibleCount === 1;
  const words = venture.name.split(" ");

  // Scroll-into-view diagonal wipe (pure % polygon so Framer Motion interpolates smoothly)
  const wipeInitial = reduced
    ? { opacity: 0 }
    : isRTL
      ? { clipPath: "polygon(100% 0%, 100% 0%, 120% 100%, 120% 100%)" }
      : { clipPath: "polygon(0% 0%, 0% 0%, -20% 100%, -20% 100%)" };

  const wipeFinal = reduced
    ? { opacity: 1 }
    : isRTL
      ? { clipPath: "polygon(-20% 0%, 100% 0%, 100% 100%, 0% 100%)" }
      : { clipPath: "polygon(0% 0%, 120% 0%, 100% 100%, 0% 100%)" };

  const wipeDelay = hasAnimatedEntrance ? 0 : slotIndex * 0.14;
  const wordBaseDelay = hasAnimatedEntrance ? 0.1 : 0.42 + slotIndex * 0.14;

  // Slight horizontal parallax offset during the 0.9s sideways shift
  const parallaxTravel = isRTL ? -24 * shiftDir : 24 * shiftDir;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (didSwipeRef.current) {
      e.preventDefault();
      didSwipeRef.current = false;
      return;
    }
    e.preventDefault();
    router.push(`/ventures/${venture.slug}`, { locale });
  };

  return (
    <motion.div
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      initial={initialClipPath ? { clipPath: initialClipPath } : false}
      animate={{ clipPath }}
      transition={{ duration: SHIFT_DURATION, ease: EASE }}
      className="relative h-full overflow-hidden select-none"
      style={{
        zIndex,
        marginInlineStart: `${marginInlineStartPx}px`,
        ...(panelWidthPx !== undefined
          ? { width: `${panelWidthPx}px`, flexShrink: 0 }
          : {
              flexGrow,
              flexShrink: 1,
              flexBasis: 0,
              minWidth: 0,
              transition: "flex-grow 0.65s cubic-bezier(0.65, 0, 0.35, 1)",
            }),
      }}
    >
      {/* Diagonal scroll-into-view clip-path wipe */}
      <motion.div
        className="relative w-full h-full"
        initial={hasAnimatedEntrance ? wipeFinal : wipeInitial}
        animate={inView ? wipeFinal : wipeInitial}
        transition={{
          duration: reduced ? 0.35 : 0.78,
          delay: wipeDelay,
          ease: WIPE_EASE,
        }}
      >
        <Link
          href={`/ventures/${venture.slug}`}
          locale={locale}
          onClick={handleClick}
          draggable={false}
          className="block relative w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
        >
          {/* Parallax wrapper (oversized horizontally so image shift never reveals edges) */}
          <motion.div
            className="absolute inset-y-0 -left-[6%] -right-[6%]"
            initial={false}
            animate={{
              x: isShifting && !reduced ? parallaxTravel : 0,
            }}
            transition={{ duration: SHIFT_DURATION, ease: EASE }}
          >
            {/* Hover zoom wrapper */}
            <motion.div
              className="relative w-full h-full"
              animate={{ scale: isHovered && !isMobile && !reduced ? 1.05 : 1 }}
              transition={{ duration: 0.65, ease: EASE }}
            >
              <Image
                src={venture.image}
                alt={venture.name}
                fill
                draggable={false}
                className="object-cover"
                sizes={
                  visibleCount === 1
                    ? "100vw"
                    : visibleCount === 2
                      ? "50vw"
                      : "38vw"
                }
                priority={slotIndex === 0}
              />
            </motion.div>
          </motion.div>

          {/* Subtle top vignette + rich bottom gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, rgba(16,14,18,0.88) 0%, rgba(16,14,18,0.42) 45%, rgba(16,14,18,0.08) 100%)",
            }}
          />

          {/* Bottom-left (bottom-start in RTL) venture name + Explore link */}
          <div
            className={cn(
              "absolute bottom-14 md:bottom-16 inset-x-0 z-10 text-start",
              slotIndex > 0 ? "ps-10 pe-6 md:ps-12 md:pe-8" : "px-6 md:px-9"
            )}
          >
            <h3 className="font-bold text-white text-[clamp(1.35rem,2.35vw,2rem)] leading-[1.12] tracking-tight drop-shadow-sm">
              {words.map((word, wi) => (
                <span
                  key={`${venture.id}-w-${wi}`}
                  className="inline-block overflow-hidden align-bottom me-[0.26em]"
                >
                  <motion.span
                    className="inline-block"
                    initial={
                      hasAnimatedEntrance
                        ? { y: "0%", opacity: 1 }
                        : { y: reduced ? "0%" : "110%", opacity: 0 }
                    }
                    animate={
                      inView
                        ? { y: "0%", opacity: 1 }
                        : { y: reduced ? "0%" : "110%", opacity: 0 }
                    }
                    transition={{
                      duration: reduced ? 0.25 : 0.62,
                      delay: wordBaseDelay + wi * 0.065,
                      ease: WIPE_EASE,
                    }}
                  >
                    {word}
                  </motion.span>
                </span>
              ))}
            </h3>

            {/* "Explore →": always visible on mobile; slides in under name on desktop/tablet hover */}
            <div className="overflow-hidden">
              <motion.div
                initial={false}
                animate={
                  isMobile || isHovered
                    ? { opacity: 1, y: 0, height: "auto" }
                    : { opacity: 0, y: 12, height: 0 }
                }
                transition={{ duration: 0.38, ease: EASE }}
              >
                <span className="inline-flex items-center gap-2 pt-2.5 text-[13px] font-semibold tracking-wide text-white/95">
                  <span>Explore</span>
                  <ArrowRight
                    size={14}
                    weight="bold"
                    className={cn("transition-transform", isRTL && "rotate-180")}
                  />
                </span>
              </motion.div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Thin 2px white line on each diagonal cut */}
      {showStartLine && (
        <DiagonalLine
          side="start"
          slant={slant}
          isRTL={isRTL}
          opacity={startLineOpacity}
        />
      )}
      {showEndLine && (
        <DiagonalLine side="end" slant={slant} isRTL={isRTL} opacity={1} />
      )}
    </motion.div>
  );
}

export function VenturesSlider({ locale }: VenturesSliderProps) {
  const isRTL = RTL_LOCALES.includes(locale);
  const reduced = !!useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-10% 0px" });

  const [active, setActive] = useState(0);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState<1 | 2 | 3>(3);
  const [stripW, setStripW] = useState(0);
  const [hasAnimatedEntrance, setHasAnimatedEntrance] = useState(false);

  // Sideways shift animation state: 0 = idle, +1 = shifting next, -1 = shifting prev
  const [pendingStep, setPendingStep] = useState<0 | 1 | -1>(0);
  const didSwipeRef = useRef(false);
  const N = ventures.length;

  useEffect(() => {
    if (inView && !hasAnimatedEntrance) {
      const t = setTimeout(() => setHasAnimatedEntrance(true), 1200);
      return () => clearTimeout(t);
    }
  }, [inView, hasAnimatedEntrance]);

  useEffect(() => {
    const updateSize = () => {
      setVisibleCount(getVisibleCount(window.innerWidth));
      if (stripRef.current) {
        setStripW(stripRef.current.offsetWidth);
      }
    };
    updateSize();
    const ro = new ResizeObserver(() => {
      if (stripRef.current) {
        setStripW(stripRef.current.offsetWidth);
      }
    });
    if (stripRef.current) ro.observe(stripRef.current);
    window.addEventListener("resize", updateSize, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  const stepBy = useCallback(
    (dir: 1 | -1) => {
      if (pendingStep !== 0 || N <= 1) return;
      if (reduced || stripW === 0) {
        setActive((c) => (c + dir + N) % N);
        return;
      }
      setHoveredSlot(null);
      setPendingStep(dir);
    },
    [pendingStep, N, reduced, stripW]
  );

  const goTo = useCallback(
    (target: number) => {
      const normalized = ((target % N) + N) % N;
      if (normalized === active || pendingStep !== 0) return;
      const forwardDist = (normalized - active + N) % N;
      const backwardDist = (active - normalized + N) % N;
      if (forwardDist === 1) {
        stepBy(1);
      } else if (backwardDist === 1) {
        stepBy(-1);
      } else {
        setHoveredSlot(null);
        setActive(normalized);
      }
    },
    [active, N, pendingStep, stepBy]
  );

  // Autoplay every 5s
  useEffect(() => {
    if (paused || !inView || pendingStep !== 0) return;
    const timer = setInterval(() => {
      stepBy(1);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, inView, pendingStep, stepBy]);

  const handleShiftComplete = useCallback(() => {
    if (pendingStep === 0) return;
    setActive((c) => (c + pendingStep + N) % N);
    setPendingStep(0);
  }, [pendingStep, N]);

  // Mobile swipe gesture handler
  const handlePanEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (Math.abs(info.offset.x) > 36 || Math.abs(info.velocity.x) > 280) {
      didSwipeRef.current = true;
      const swipedLeft = info.offset.x < 0;
      const forward = isRTL ? !swipedLeft : swipedLeft;
      stepBy(forward ? 1 : -1);
      setTimeout(() => {
        didSwipeRef.current = false;
      }, 150);
    }
  };

  const slant = getSlantPx(visibleCount);
  const isMobile = visibleCount === 1;

  // Pixel geometry for seamless 0.9s sideways shift
  const panelWidthPx =
    stripW > 0
      ? isMobile
        ? stripW
        : (stripW + (visibleCount - 1) * slant) / visibleCount
      : undefined;
  const slotStepPx =
    panelWidthPx !== undefined
      ? isMobile
        ? stripW
        : panelWidthPx - slant
      : 0;

  // Build visible or shifting panels
  const renderRestPanels = () =>
    Array.from({ length: visibleCount }, (_, slot) => {
      const venture = ventures[(active + slot) % N];
      const hasStartSlant = !isMobile && slot > 0;
      const hasEndSlant = isMobile; // Mobile: 1 panel with one diagonal edge
      const clipPath = buildPolygon(hasStartSlant, hasEndSlant, slant, isRTL);

      return (
        <VenturePanel
          key={`rest-${slot}-${venture.id}`}
          venture={venture}
          locale={locale}
          slotIndex={slot}
          visibleCount={visibleCount}
          slant={slant}
          isRTL={isRTL}
          isHovered={hoveredSlot === slot}
          inView={inView}
          reduced={reduced}
          isShifting={false}
          shiftDir={1}
          hasAnimatedEntrance={hasAnimatedEntrance}
          clipPath={clipPath}
          showStartLine={hasStartSlant}
          showEndLine={hasEndSlant}
          flexGrow={!isMobile && hoveredSlot === slot ? 1.6 : 1}
          marginInlineStartPx={!isMobile && slot > 0 ? -slant : 0}
          zIndex={slot + 1}
          onHoverStart={() => !isMobile && setHoveredSlot(slot)}
          onHoverEnd={() => !isMobile && setHoveredSlot(null)}
          didSwipeRef={didSwipeRef}
        />
      );
    });

  const renderShiftingTrack = () => {
    const dir = pendingStep as 1 | -1;
    const count = visibleCount + 1;
    const startOffset = dir === 1 ? 0 : -1;
    const trackStartX =
      dir === 1 ? 0 : isRTL ? slotStepPx : -slotStepPx;
    const trackEndX =
      dir === 1 ? (isRTL ? slotStepPx : -slotStepPx) : 0;

    return (
      <motion.div
        key={`shift-${active}-${dir}`}
        className="flex h-full w-full"
        initial={{ x: trackStartX }}
        animate={{ x: trackEndX }}
        transition={{ duration: SHIFT_DURATION, ease: EASE }}
        onAnimationComplete={handleShiftComplete}
      >
        {Array.from({ length: count }, (_, idx) => {
          const venture = ventures[(active + startOffset + idx + N) % N];
          const isIncomingLeft = dir === -1 && idx === 0;
          const isBecomingFirst = dir === 1 && idx === 1;
          const isLeavingFirst = dir === -1 && idx === 1;

          // Determine target clipPath & initial clipPath so edges stay parallel & gap-free
          let initialClip: string;
          let targetClip: string;
          let showStartLine = false;
          let startLineOpacity = 1;

          if (isMobile) {
            initialClip = buildPolygon(false, true, slant, isRTL);
            targetClip = initialClip;
          } else if (isBecomingFirst) {
            // Slides from slot 1 -> slot 0: left slant flattens from slant -> 0
            initialClip = buildPolygon(true, false, slant, isRTL);
            targetClip = buildPolygon(false, false, slant, isRTL);
            showStartLine = true;
            startLineOpacity = 0;
          } else if (isLeavingFirst) {
            // Slides from slot 0 -> slot 1: left edge slants from 0 -> slant
            initialClip = buildPolygon(false, false, slant, isRTL);
            targetClip = buildPolygon(true, false, slant, isRTL);
            showStartLine = true;
            startLineOpacity = 1;
          } else if (idx === 0) {
            initialClip = buildPolygon(false, false, slant, isRTL);
            targetClip = initialClip;
          } else {
            initialClip = buildPolygon(true, false, slant, isRTL);
            targetClip = initialClip;
            showStartLine = true;
          }

          return (
            <VenturePanel
              key={`shift-item-${idx}-${venture.id}`}
              venture={venture}
              locale={locale}
              slotIndex={Math.min(idx, visibleCount - 1)}
              visibleCount={visibleCount}
              slant={slant}
              isRTL={isRTL}
              isHovered={false}
              inView={inView}
              reduced={reduced}
              isShifting={true}
              shiftDir={dir}
              hasAnimatedEntrance={true}
              clipPath={targetClip}
              initialClipPath={initialClip}
              showStartLine={showStartLine}
              startLineOpacity={startLineOpacity}
              showEndLine={isMobile}
              panelWidthPx={panelWidthPx}
              marginInlineStartPx={!isMobile && idx > 0 ? -slant : 0}
              zIndex={isIncomingLeft ? 1 : idx + 2}
              onHoverStart={() => {}}
              onHoverEnd={() => {}}
              didSwipeRef={didSwipeRef}
            />
          );
        })}
      </motion.div>
    );
  };

  return (
    <section
      ref={sectionRef}
      className="section-y bg-[var(--bg-soft)] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        setHoveredSlot(null);
      }}
    >
      {/* Centred heading in normal case with ICCB VENTURES eyebrow underneath */}
      <div className="container-site mb-10 text-center">
        <FadeUp>
          <h2 className="text-h2 normal-case">
            One Destination,{" "}
            <span className="text-[var(--accent)]">Endless Experiences</span>
          </h2>
        </FadeUp>
        <FadeUp delay={0.08}>
          <span className="text-eyebrow block mt-3">ICCB VENTURES</span>
        </FadeUp>
      </div>

      {/* Full-width diagonal panel strip */}
      <motion.div
        ref={stripRef}
        onPanEnd={isMobile ? handlePanEnd : undefined}
        className={cn(
          "relative w-full overflow-hidden bg-[var(--bg-soft)]",
          isMobile && "touch-pan-y"
        )}
        style={{ height: "clamp(420px, 60vh, 640px)" }}
      >
        {pendingStep === 0 ? (
          <div className="flex w-full h-full">{renderRestPanels()}</div>
        ) : (
          renderShiftingTrack()
        )}

        {/* Soft curved wave SVG mask at the bottom edge blending into next section's background */}
        <div className="absolute bottom-0 inset-x-0 h-14 md:h-16 pointer-events-none z-30 -mb-px">
          <svg
            viewBox="0 0 1440 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full block"
            preserveAspectRatio="none"
          >
            <path
              d="M0 34C240 64 480 4 720 34C960 64 1200 4 1440 34V64H0V34Z"
              fill="var(--bg-soft)"
            />
          </svg>
        </div>
      </motion.div>

      {/* Controls below the wave: prev/next arrows + red dots */}
      <div className="container-site mt-7 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => stepBy(-1)}
          aria-label="Previous venture"
          className="w-10 h-10 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] flex items-center justify-center hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-pointer"
        >
          {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
        </button>

        <div className="flex items-center gap-2" role="tablist" aria-label="Venture slides">
          {ventures.map((v, i) => {
            const isCurrent = i === active;
            return (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                aria-label={`Go to ${v.name}`}
                onClick={() => goTo(i)}
                className={cn(
                  "h-2.5 rounded-full transition-all duration-500 cursor-pointer",
                  isCurrent
                    ? "w-8 bg-[var(--accent)]"
                    : "w-2.5 bg-[var(--accent)]/30 hover:bg-[var(--accent)]/60"
                )}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => stepBy(1)}
          aria-label="Next venture"
          className="w-10 h-10 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] flex items-center justify-center hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-pointer"
        >
          {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
        </button>
      </div>
    </section>
  );
}
