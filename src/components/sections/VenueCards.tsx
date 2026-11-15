"use client";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { motion } from "framer-motion";
import { ArrowRight, Users, Ruler } from "@phosphor-icons/react";
import { halls as STATIC_HALLS } from "@/data/halls";
import { isAllowedImage, usePublishedContent } from "@/lib/crm/cms";
import { db } from "@/lib/crm/db";
import { FadeUp } from "@/components/motion/primitives";
import { SectionHeading } from "@/components/ui/SectionHeading";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const HALL_TYPE: Record<string, string> = {
  "gulnaksha":      "CONVENTION HALL",
  "pushpoguchcho":  "CONVENTION HALL",
  "rajdarshan":     "CONVENTION HALL",
  "noboratri":      "CONVENTION HALL",
  "pushpanjali":    "CONVENTION HALL",
  "seminar-hall":      "SEMINAR HALL",
};

interface VenueCardsProps { locale: Locale }

/** Website content (Marketing → Venues) controls which halls show, their order, name and photo. */
const matchHall = (title: string) =>
  STATIC_HALLS.find((h) => h.name.en.toLowerCase() === title.trim().toLowerCase()) ??
  STATIC_HALLS.find((h) => title.toLowerCase().includes(h.slug));

function useVenueCards() {
  const cms = usePublishedContent("venues");
  const allVenueItems = db.content.store((s) => s.items).filter((c) => c.section === "venues");
  if (!cms?.length) return STATIC_HALLS.slice(0, 6);
  const fromCms = cms.flatMap((c) => {
    const hall = matchHall(c.title);
    return hall ? [{ ...hall, name: { ...hall.name, en: c.title }, image: isAllowedImage(c.image) ? c.image : hall.image }] : [];
  });
  // Halls the CMS has never listed (e.g. Seminar Hall, added after older saved data) still show,
  // unless Marketing has an entry for them — published or hidden — which then decides.
  const known = new Set(allVenueItems.map((c) => matchHall(c.title)?.slug).filter(Boolean));
  const missing = STATIC_HALLS.slice(0, 6).filter((h) => !known.has(h.slug));
  return [...fromCms, ...missing];
}

export function VenueCards({ locale }: VenueCardsProps) {
  const halls = useVenueCards();
  return (
    <section className="section-y bg-[var(--bg)]">
      <div className="container-site">
        {/* Header */}
        <FadeUp>
          <SectionHeading eyebrow="Featured Venues" title="Featured venues at" highlight="ICCB" />
        </FadeUp>

        {/* Cards grid */}
        <motion.div
          className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, margin: "-8% 0px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.25, delayChildren: 0.1 } } }}
        >
          {halls.map((hall) => (
            <motion.article
              key={hall.id}
              variants={{
                hidden: { opacity: 0, y: 48, scale: 0.97 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: EASE } },
              }}
              className="group card card-hover overflow-hidden cursor-pointer"
            >
              <Link href={`/venues/${hall.slug}`} locale={locale} className="block">
                {/* Photo */}
                <div className="relative aspect-[16/9] overflow-hidden">
                  <motion.div
                    className="absolute inset-0"
                    variants={{
                      hidden: { clipPath: "inset(100% 0 0 0)" },
                      show: { clipPath: "inset(0% 0 0 0)", transition: { duration: 1.1, delay: 0.1, ease: EASE } },
                    }}
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
        </motion.div>

        <FadeUp delay={0.1} className="mt-10 flex justify-center">
          <Link href="/venues" locale={locale} className="btn btn-secondary btn-sm whitespace-nowrap">
            Explore all venues <ArrowRight size={14} weight="bold" />
          </Link>
        </FadeUp>
      </div>
    </section>
  );
}
