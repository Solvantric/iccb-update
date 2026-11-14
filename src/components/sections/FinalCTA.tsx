"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { ArrowRight } from "@phosphor-icons/react";

const SLIDES = [
  { src: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=90&w=2400", alt: "Grand wedding banquet hall" },
  { src: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&q=90&w=2400", alt: "International expo hall" },
  { src: "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&q=90&w=2400", alt: "Premium restaurant interior" },
  { src: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=90&w=2400", alt: "Elegant event table setting" },
  { src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=90&w=2400", alt: "Fine dining venue" },
];

const INTERVAL_MS = 3000;

interface FinalCTAProps {
  locale: Locale;
}

export function FinalCTA({ locale }: FinalCTAProps) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <section className="relative overflow-hidden bg-[#111]">
      {/* Background photos — crossfade every 3s */}
      {SLIDES.map((s, i) => (
        <Image
          key={s.src}
          src={s.src}
          alt={s.alt}
          fill
          sizes="100vw"
          priority={i === 0}
          className={`object-cover transition-[opacity,transform] duration-[1200ms] ease-out ${
            i === active ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />

      <div className="relative container-site py-16 md:py-20 lg:py-24 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="max-w-3xl">
          <h2 className="font-display uppercase text-white text-[clamp(1.75rem,3.6vw,3rem)] leading-[1.05] tracking-[0.01em]">
            Planning an event? <span className="text-[var(--accent)]">Let&apos;s hold your date.</span>
          </h2>
          <span className="block w-16 h-[3px] bg-[var(--accent)] mt-5 mb-5" />
          <p className="text-white/85 text-[15px] md:text-[17px] leading-relaxed">
            Get in touch with our team for venue availability, catering menus or a customised event package.
          </p>
        </div>

        <Link
          href="/enquiry"
          locale={locale}
          className="group inline-flex items-center justify-center gap-4 self-start md:self-center flex-shrink-0 bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] text-white rounded-[var(--radius-btn)] px-9 py-5 text-[16px] md:text-[18px] font-medium shadow-[0_10px_30px_-10px_var(--accent-glow)] hover:brightness-110 transition"
        >
          Get in touch
          <ArrowRight size={20} className="transition-transform group-hover:translate-x-1 rtl:-scale-x-100" />
        </Link>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-4 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 flex gap-1.5">
        {SLIDES.map((s, i) => (
          <button
            key={s.src}
            type="button"
            aria-label={`Show image ${i + 1}`}
            onClick={() => setActive(i)}
            className={`h-1 rounded-full transition-all ${i === active ? "w-6 bg-white" : "w-2 bg-white/40"}`}
          />
        ))}
      </div>
    </section>
  );
}
