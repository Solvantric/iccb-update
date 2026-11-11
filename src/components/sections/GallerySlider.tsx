"use client";
import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { galleryImages } from "@/data/images";
import { RevealBlock } from "@/components/motion/RevealBlock";

interface GallerySliderProps {
  locale: Locale;
}

export function GallerySlider({ locale }: GallerySliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", slidesToScroll: 1 },
    [Autoplay({ delay: 4000, stopOnMouseEnter: true })]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section className="bg-[var(--bg-soft)] py-[clamp(4rem,10vw,9rem)] overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
        <div className="flex justify-between items-center mb-10">
          <RevealBlock>
            <div>
              <span className="meta-label">(GALLERY)</span>
              <h2 className="display-md text-[var(--ink)] mt-2">MOMENTS AT ICCB</h2>
            </div>
          </RevealBlock>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={scrollPrev}
                aria-label="Previous"
                className="w-10 h-10 rounded-full border border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors flex items-center justify-center"
              >
                <ArrowLeft size={16} weight="light" />
              </button>
              <button
                onClick={scrollNext}
                aria-label="Next"
                className="w-10 h-10 rounded-full border border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors flex items-center justify-center"
              >
                <ArrowRight size={16} weight="light" />
              </button>
            </div>
            <Link
              href="/gallery"
              locale={locale}
              className="text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors hidden sm:block"
            >
              View Gallery →
            </Link>
          </div>
        </div>

        <div className="embla" ref={emblaRef}>
          <div className="embla__container gap-4">
            {galleryImages.map((img) => (
              <div
                key={img.id}
                className="embla__slide"
                style={{ flex: "0 0 calc(50% - 8px)" }}
              >
                <div className="relative overflow-hidden aspect-[4/3]">
                  <Image
                    src={img.src}
                    alt={img.alt.en}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
