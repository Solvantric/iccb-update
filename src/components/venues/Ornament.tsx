"use client";
import { motion } from "framer-motion";

/** Classical divider: line — diamond — line, drawn outward from the centre. */
export function Ornament({ className = "", light = false, align = "center" }: { className?: string; light?: boolean; align?: "center" | "start" }) {
  const c = light ? "bg-white/50" : "bg-[var(--accent)]/50";
  return (
    <motion.span
      aria-hidden
      className={`flex items-center gap-2 ${align === "center" ? "justify-center" : "justify-start"} ${className}`}
      initial="hidden"
      whileInView="show"
      viewport={{ once: false }}
    >
      {align === "center" && (
        <motion.span className={`h-px w-12 origin-right ${c}`} variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } } }} />
      )}
      <motion.span
        className={`h-2 w-2 rotate-45 border ${light ? "border-white/70" : "border-[var(--accent)]"}`}
        variants={{ hidden: { scale: 0, rotate: 0 }, show: { scale: 1, rotate: 45, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } }}
      />
      <motion.span className={`h-px w-12 origin-left ${c}`} variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } } }} />
    </motion.span>
  );
}
