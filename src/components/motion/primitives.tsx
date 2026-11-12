"use client";
/**
 * Motion primitives — all scroll-triggered animations.
 * - Trigger once per element (viewport: { once: true, margin: "-12% 0px" })
 * - Animate only transform, opacity, clip-path (no layout)
 * - prefers-reduced-motion: opacity only, no movement
 * - LazyMotion + domAnimation kept in parent (MotionProvider)
 */
import React, { useRef, useEffect, useState } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  animate,
  type Variants,
  type HTMLMotionProps,
} from "framer-motion";
import { cn } from "@/lib/utils/cn";

/* ─── Shared easing ───────────────────────────────────────────────────────── */
const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EASE_PREMIUM: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ─── Reduced motion check ────────────────────────────────────────────────── */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

/* ─── Mobile detection ────────────────────────────────────────────────────── */
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

/* =========================================================================
   FadeUp — paragraphs, buttons, small elements
   ========================================================================= */
interface FadeUpProps extends HTMLMotionProps<"div"> {
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
}

export function FadeUp({ delay = 0, duration = 0.8, y = 24, className, children, ...rest }: FadeUpProps) {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const actualY = mobile ? Math.min(y, 16) : y;
  const actualDuration = mobile ? Math.min(duration, 0.5) : duration;

  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : actualY }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: actualDuration, delay, ease: EASE_PREMIUM }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* =========================================================================
   TextReveal — splits text into lines, each slides up from a mask
   Props:
     as         — "h1" | "h2" | "h3" | "p" etc.
     highlight  — word(s) to colour brand-red (last by default)
     highlightLast — shorthand: highlight the last word
   ========================================================================= */
interface TextRevealProps {
  children: string;
  as?: React.ElementType;
  className?: string;
  delay?: number;
  highlight?: string | string[];
  highlightLast?: boolean;
}

export function TextReveal({
  children,
  as: Tag = "h2",
  className,
  delay = 0,
  highlight,
  highlightLast,
}: TextRevealProps) {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });

  const lines = String(children).split("\n").filter(Boolean);
  const highlights = new Set<string>(
    highlight
      ? Array.isArray(highlight) ? highlight : [highlight]
      : []
  );

  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, li) => {
        const words = line.split(" ");
        return (
          <span key={li} style={{ display: "block", overflow: "hidden" }}>
            {words.map((word, wi) => {
              const isLast = highlightLast && li === lines.length - 1 && wi === words.length - 1;
              const isHighlight = isLast || highlights.has(word.replace(/[.,!]$/, ""));
              const wordEl = (
                <span
                  key={wi}
                  style={{
                    display: "inline-block",
                    color: isHighlight ? "var(--accent)" : "inherit",
                  }}
                >
                  {word}
                  {wi < words.length - 1 ? " " : ""}
                </span>
              );

              if (reduced || mobile) {
                return wordEl;
              }

              const wordDelay = delay + li * 0.08 + wi * 0.04;
              return (
                <motion.span
                  key={wi}
                  style={{ display: "inline-block", overflow: "hidden" }}
                  initial={{ clipPath: "inset(0 0 100% 0)" }}
                  animate={inView ? { clipPath: "inset(0 0 0% 0)" } : {}}
                  transition={{ duration: 0.8, delay: wordDelay, ease: EASE_OUT_EXPO }}
                >
                  <motion.span
                    style={{
                      display: "inline-block",
                      color: isHighlight ? "var(--accent)" : "inherit",
                    }}
                    initial={{ y: "100%" }}
                    animate={inView ? { y: 0 } : {}}
                    transition={{ duration: 0.8, delay: wordDelay, ease: EASE_OUT_EXPO }}
                  >
                    {word}
                    {wi < words.length - 1 ? " " : ""}
                  </motion.span>
                </motion.span>
              );
            })}
          </span>
        );
      })}
    </Tag>
  );
}

/* =========================================================================
   Stagger — wraps grids/lists, children enter one after another
   ========================================================================= */
interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
}

const staggerContainer: Variants = {
  hidden: {},
  show: (stagger: number) => ({
    transition: { staggerChildren: stagger },
  }),
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_PREMIUM },
  },
};

export function Stagger({ children, className, stagger = 0.08, delayChildren = 0 }: StaggerProps) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      variants={staggerContainer}
      custom={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ delayChildren }}
      className={className}
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={staggerItem}>{child}</motion.div>
      ))}
    </motion.div>
  );
}

/* =========================================================================
   ImageReveal — clip-path wipe + inner scale
   direction: "up" | "left" | "right" | "diagonal"
   ========================================================================= */
interface ImageRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "diagonal";
}

export function ImageReveal({ children, className, delay = 0, direction = "up" }: ImageRevealProps) {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();

  const clipStart = {
    up:        "inset(100% 0 0 0)",
    left:      "inset(0 100% 0 0)",
    right:     "inset(0 0 0 100%)",
    diagonal:  "inset(100% 0 0 0)",
  }[direction];

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={cn("overflow-hidden", className)}
      initial={{ clipPath: clipStart }}
      whileInView={{ clipPath: "inset(0 0 0 0)" }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: mobile ? 0.5 : 1.1, delay, ease: EASE_PREMIUM }}
    >
      <motion.div
        initial={{ scale: 1.15 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: "-12% 0px" }}
        transition={{ duration: mobile ? 0.5 : 1.3, delay, ease: EASE_PREMIUM }}
        style={{ width: "100%", height: "100%" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* =========================================================================
   SlideIn — x ±60 for two-column layouts (desktop only)
   ========================================================================= */
interface SlideInProps {
  children: React.ReactNode;
  from?: "left" | "right";
  delay?: number;
  className?: string;
}

export function SlideIn({ children, from = "left", delay = 0, className }: SlideInProps) {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();

  const x = mobile ? 0 : from === "left" ? -60 : 60;
  const y = mobile ? 24 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: reduced ? 0 : x, y: reduced ? 0 : y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: mobile ? 0.5 : 0.85, delay, ease: EASE_PREMIUM }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* =========================================================================
   LineGrow — red accent bars / underlines (scaleX, transform-origin left)
   ========================================================================= */
interface LineGrowProps {
  className?: string;
  delay?: number;
  height?: number;
  width?: number | string;
}

export function LineGrow({ className, delay = 0, height = 3, width = 48 }: LineGrowProps) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      style={{
        display: "block",
        height,
        width,
        background: "var(--accent)",
        borderRadius: 2,
        transformOrigin: "left center",
        marginTop: 14,
      }}
      initial={{ scaleX: reduced ? 1 : 0, opacity: reduced ? 1 : 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT_EXPO }}
      className={className}
    />
  );
}

/* =========================================================================
   Counter — counts up when in view
   ========================================================================= */
interface CounterProps {
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function Counter({ to, suffix = "", prefix = "", duration = 1.6, className }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });
  const reduced = useReducedMotion();
  const count = useMotionValue(0);
  const rounded = useSpring(count, { stiffness: 80, damping: 20 });

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      if (ref.current) ref.current.textContent = `${prefix}${to.toLocaleString()}${suffix}`;
      return;
    }
    const controls = animate(count, to, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = `${prefix}${Math.round(v).toLocaleString()}${suffix}`;
      },
    });
    return controls.stop;
  }, [inView, to, duration, reduced, prefix, suffix, count]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}

/* =========================================================================
   IconPop — scale 0.6 → 1, slight overshoot
   ========================================================================= */
interface IconPopProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function IconPop({ children, delay = 0, className }: IconPopProps) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      initial={{ opacity: 0, scale: reduced ? 1 : 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ type: "spring", stiffness: 260, damping: 18, delay }}
      style={{ display: "inline-flex" }}
      className={className}
    >
      {children}
    </motion.span>
  );
}

/* =========================================================================
   Parallax — background images move against scroll (desktop only)
   ========================================================================= */
interface ParallaxProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export function Parallax({ children, speed = 40, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const mobile = useIsMobile();

  if (reduced || mobile) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      style={{ willChange: "transform" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
