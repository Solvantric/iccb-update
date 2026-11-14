"use client";
import { motion, type Variants } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface RevealBlockProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  margin?: string;
}

const variants: Variants = {
  hidden: (custom: { y: number; delay: number }) => ({
    opacity: 0,
    y: custom.y,
    filter: "blur(4px)",
  }),
  // delay lives inside the variant — a variant's own transition overrides the `transition` prop
  visible: (custom: { y: number; delay: number }) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.85,
      ease: [0.16, 1, 0.3, 1],
      delay: custom.delay,
    },
  }),
};

export function RevealBlock({
  children,
  className,
  delay = 0,
  y = 28,
  once = false,
}: RevealBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-8% 0px" });

  return (
    <motion.div
      ref={ref}
      custom={{ y, delay }}
      variants={variants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export function RevealGroup({
  children,
  className,
  stagger = 0.1,
  delayChildren = 0,
  once = false,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-8% 0px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        visible: { transition: { staggerChildren: stagger, delayChildren } },
        hidden: {},
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24, filter: "blur(3px)" },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          // NB: a child `delay` overrides the parent's staggerChildren, so only set it when given
          transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1], ...(delay ? { delay } : {}) },
        },
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
