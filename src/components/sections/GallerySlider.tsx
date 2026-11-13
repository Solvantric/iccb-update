"use client";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { ArrowRight } from "@phosphor-icons/react";
import { galleryImages } from "@/data/images";
import { FadeUp } from "@/components/motion/primitives";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface GallerySliderProps {
  locale: Locale;
}

/** Seconds for one full loop of the strip — lower is faster. */
const LOOP_SECONDS = 60;

export function GallerySlider({ locale }: GallerySliderProps) {
  // Two copies side by side; the track slides by half its width for a seamless loop.
  const strip = [...galleryImages, ...galleryImages];

  return (
    <section className="bg-[var(--bg-soft)] py-[clamp(4rem,10vw,9rem)] overflow-hidden">
      <div className="container-site">
        <FadeUp>
          <SectionHeading
            eyebrow="Gallery"
            title="Moments at"
            highlight="ICCB"
            description="From international expos and high-level summits to grand weddings and live concerts — step inside the halls where Bangladesh gathers, celebrates and does business."
          />
        </FadeUp>
      </div>

      {/* Continuous left → right strip; pauses on hover. Spacing uses margin (not gap) so the -50% loop is seamless. */}
      <FadeUp delay={0.1} className="mt-12">
        <div className="group/strip relative" aria-label="ICCB photo gallery">
          <div
            className="logo-marquee-reverse flex w-max group-hover/strip:[animation-play-state:paused]"
            style={{ animationDuration: `${LOOP_SECONDS}s` }}
          >
            {strip.map((img, i) => (
              <figure
                key={`${img.id}-${i}`}
                aria-hidden={i >= galleryImages.length}
                className="group/photo relative h-[260px] sm:h-[340px] lg:h-[420px] aspect-[4/3] me-4 flex-shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-[var(--bg-deep)]"
              >
                <Image
                  src={img.src}
                  alt={i < galleryImages.length ? img.alt.en : ""}
                  fill
                  sizes="(max-width: 640px) 350px, (max-width: 1024px) 460px, 560px"
                  className="object-cover transition-transform duration-700 ease-out group-hover/photo:scale-105"
                />
                {/* Caption on hover */}
                <figcaption className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/75 via-black/30 to-transparent translate-y-full opacity-0 transition-all duration-500 ease-out group-hover/photo:translate-y-0 group-hover/photo:opacity-100">
                  <span className="block h-[3px] w-8 bg-[var(--accent)] mb-2" />
                  <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
                    {img.category}
                  </span>
                  <span className="block text-[15px] font-semibold text-white leading-snug">
                    {img.alt.en}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={0.15} className="mt-12 flex justify-center">
        <Link href="/gallery" locale={locale} className="btn btn-secondary whitespace-nowrap">
          View Gallery <ArrowRight size={14} weight="bold" />
        </Link>
      </FadeUp>
    </section>
  );
}
