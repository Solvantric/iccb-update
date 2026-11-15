"use client";
/**
 * Certifications & licences (Why ICCB page, above the footer).
 * ⚠️ TO VERIFY with ICCB before launch — keep only what ICCB actually holds (add certificate numbers if available).
 * Logos: FSCD, BFSA, RAJUK, DoE = the authorities' official emblems; ISO 9001 / HACCP = generic certification seals
 * (ISO's own logo may not be used by certified organisations — replace with the certifying body's mark when ICCB provides it).
 */
import { useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { SealCheck } from "@phosphor-icons/react";
import { SectionLabel } from "@/components/ui/SectionLabel";

const CERTIFICATIONS = [
  { title: "Fire Safety Certificate", issuer: "Bangladesh Fire Service & Civil Defence", logo: "/images/certifications/fscd.png", tag: "Safety" },
  { title: "Food Safety & Hygiene", issuer: "Bangladesh Food Safety Authority", logo: "/images/certifications/bfsa.png", tag: "Hygiene" },
  { title: "Building & Occupancy Approval", issuer: "Rajdhani Unnayan Kartripakkha (RAJUK)", logo: "/images/certifications/rajuk.png", tag: "Approval" },
  { title: "Environmental Clearance", issuer: "Department of Environment, Bangladesh", logo: "/images/certifications/doe.svg", tag: "Environment" },
  { title: "Quality Management System", issuer: "ISO 9001:2015", logo: "/images/certifications/iso9001.svg", tag: "Quality" },
  { title: "Food Safety Management", issuer: "HACCP", logo: "/images/certifications/haccp.svg", tag: "Food safety" },
];

const ease = [0.22, 1, 0.36, 1] as const;

function CertCard({ c, i }: { c: (typeof CERTIFICATIONS)[number]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 180, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 180, damping: 18 });
  const shine = useTransform(mx, [0, 1], ["-60%", "160%"]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: reduced ? 0 : -35 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: false, margin: "-10% 0px" }}
      transition={{ duration: 0.8, ease, delay: i * 0.1 }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        ref={ref}
        onMouseMove={(e) => {
          if (reduced || !ref.current) return;
          const r = ref.current.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width);
          my.set((e.clientY - r.top) / r.height);
        }}
        onMouseLeave={() => {
          mx.set(0.5);
          my.set(0.5);
        }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="group relative h-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center shadow-[0_24px_50px_-36px_rgba(0,0,0,0.45)] transition-shadow duration-500 hover:shadow-[0_34px_60px_-30px_rgba(0,0,0,0.45)]"
      >
        {/* certificate frame */}
        <span aria-hidden className="pointer-events-none absolute inset-2 rounded-xl border border-dashed border-[var(--accent)]/20" />
        {/* light sweep following the cursor */}
        <motion.span aria-hidden style={{ left: shine }} className="pointer-events-none absolute -top-1/2 h-[200%] w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:via-white/10" />

        <span className="relative inline-flex items-center gap-1 rounded-full bg-[var(--bg-soft)] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
          {c.tag}
        </span>

        <motion.div
          className="relative mx-auto mt-4 h-28 w-28"
          initial={{ scale: 0.6, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: false }}
          transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.25 + i * 0.1 }}
          style={{ transform: "translateZ(40px)" }}
        >
          <Image src={c.logo} alt={`${c.issuer} logo`} fill sizes="112px" unoptimized className="object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.15)]" />
        </motion.div>

        <h3 className="relative mt-5 text-[15.5px] font-semibold leading-snug text-[var(--ink)]">{c.title}</h3>
        <p className="relative mt-1 text-[12.5px] leading-relaxed text-[var(--ink-muted)]">{c.issuer}</p>

        <span className="relative mt-4 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-600">
          <SealCheck size={16} weight="fill" /> Licensed
        </span>
      </motion.div>
    </motion.div>
  );
}

export function CertificationsSection() {
  return (
    <section className="section-y relative overflow-hidden bg-[var(--bg-soft)]">
      <div className="relative container-site">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ duration: 0.6, ease }}>
            <SectionLabel>Certifications</SectionLabel>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: false }}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
            className="mt-4 font-display uppercase text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] text-[var(--ink)]"
          >
            Licensed &amp; <span className="text-[var(--accent)]">Certified</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.7, ease, delay: 0.2 }}
            className="mt-5 text-[15.5px] leading-relaxed text-[var(--ink-body)]"
          >
            Recognised by Bangladesh&apos;s regulatory authorities and international standards for{" "}
            <span className="font-semibold text-[var(--accent)]">safety</span>, <span className="font-semibold text-[var(--accent)]">hygiene</span> and{" "}
            <span className="font-semibold text-[var(--accent)]">quality</span>.
          </motion.p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CERTIFICATIONS.map((c, i) => (
            <CertCard key={c.title} c={c} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
