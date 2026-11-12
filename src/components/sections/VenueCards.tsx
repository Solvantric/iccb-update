"use client";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { motion } from "framer-motion";
import { ArrowRight, Users, Ruler } from "@phosphor-icons/react";
import { halls } from "@/data/halls";
import { FadeUp } from "@/components/motion/primitives";
import { SectionHeading } from "@/components/ui/SectionHeading";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const HALL_TYPE: Record<string, string> = {
  "gulnaksha":      "CONVENTION HALL",
  "pushpoguchcho":  "CONVENTION HALL",
  "rajdarshan":     "CONVENTION HALL",
  "noboratri":      "CONVENTION HALL",
  "pushpanjali":    "CONVENTION HALL",
  "gulnaksha-seminar": "SEMINAR HALL",
};

interface VenueCardsProps { locale: Locale }

export function VenueCards({ locale }: VenueCardsProps) {
  return (
    <section className="section-y bg-[var(--bg)]">
      <div className="container-site">
        {/* Header */}
        <FadeUp>
          <SectionHeading eyebrow="Featured Venues" title="Featured venues at" highlight="ICCB" />
        </FadeUp>

        {/* Cards grid */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {halls.slice(0, 6).map((hall, i) => (
            <motion.article
              key={hall.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ duration: 0.65, delay: i * 0.08, ease: EASE }}
              className="group card card-hover overflow-hidden cursor-pointer"
            >
              <Link href={`/venues/${hall.slug}`} locale={locale} className="block">
                {/* Photo */}
                <div className="relative aspect-[16/9] overflow-hidden">
                  <motion.div
                    className="absolute inset-0"
                    initial={{ clipPath: "inset(100% 0 0 0)" }}
                    whileInView={{ clipPath: "inset(0 0 0 0)" }}
                    viewport={{ once: true, margin: "-8% 0px" }}
                    transition={{ duration: 1.1, delay: i * 0.08 + 0.1, ease: EASE }}
                  >
                    <Image
                      src={hall.image}
                      alt={hall.name.en}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                    />
                  </motion.div>
                </div>

                {/* Body */}
                <div className="p-5 text-center">
                  <span className="text-eyebrow block mb-2">
                    {HALL_TYPE[hall.slug] || "CONVENTION HALL"}
                  </span>
                  <h3
                    className="font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors mb-2 leading-tight"
                    style={{ fontSize: "clamp(1.1rem, 1.5vw, 1.3rem)" }}
                  >
                    {hall.name.en}
                  </h3>
                  <p className="font-semibold text-[var(--ink)] text-[14px] mb-3">
                    Up to {hall.capacity.theatre.toLocaleString()} guests
                  </p>
                  <div className="flex items-center justify-center gap-4 text-[12px] text-[var(--ink-muted)]">
                    <span className="flex items-center gap-1">
                      <Ruler size={14} weight="bold" className="text-[var(--accent)]" /> {hall.area.toLocaleString()} sq ft
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={14} weight="bold" className="text-[var(--accent)]" /> {hall.capacity.banquet.toLocaleString()} banquet
                    </span>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        <FadeUp delay={0.1} className="mt-10 flex justify-center">
          <Link href="/venues" locale={locale} className="btn btn-secondary btn-sm whitespace-nowrap">
            Explore all venues <ArrowRight size={14} weight="bold" />
          </Link>
        </FadeUp>
      </div>
    </section>
  );
}
