"use client";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { RevealBlock } from "@/components/motion/RevealBlock";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ArrowRight, ArrowLeft } from "@phosphor-icons/react";
import { halls } from "@/data/halls";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState } from "react";

interface VenuesHighlightProps {
  locale: Locale;
}

export function VenuesHighlight({ locale }: VenuesHighlightProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", slidesToScroll: 1, dragFree: false },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  return (
    <section className="bg-[var(--bg-soft)] py-[clamp(4rem,10vw,9rem)] overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
        {/* Header row */}
        <div className="flex justify-between items-end mb-10 md:mb-14">
          <div>
            <RevealBlock>
              <SectionLabel>(VENUES)</SectionLabel>
            </RevealBlock>
            <RevealBlock delay={0.08}>
              <h2 className="display-lg text-[var(--ink)] mt-3">OUR VENUES</h2>
            </RevealBlock>
          </div>
          <RevealBlock delay={0.1} className="flex items-center gap-3">
            {/* Prev / Next arrows */}
            <button
              onClick={scrollPrev}
              aria-label="Previous venue"
              className="w-10 h-10 rounded-full border border-[var(--line)] flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors"
            >
              <ArrowLeft size={16} weight="light" />
            </button>
            <button
              onClick={scrollNext}
              aria-label="Next venue"
              className="w-10 h-10 rounded-full border border-[var(--line)] flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors"
            >
              <ArrowRight size={16} weight="light" />
            </button>
            <Link
              href="/venues"
              locale={locale}
              className="hidden md:flex items-center gap-2 text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors ms-2"
            >
              Explore All
              <ArrowRight size={14} />
            </Link>
          </RevealBlock>
        </div>

        {/* Embla slider */}
        <div ref={emblaRef} className="overflow-hidden -mx-[clamp(1rem,4vw,3rem)] px-[clamp(1rem,4vw,3rem)]">
          <div className="flex gap-5 touch-pan-y">
            {halls.map((hall, i) => (
              <div
                key={hall.id}
                className="flex-shrink-0 w-[85vw] sm:w-[55vw] md:w-[40vw] lg:w-[30vw]"
              >
                <Link href={`/venues/${hall.slug}`} locale={locale} className="block group">
                  <div className="overflow-hidden aspect-[3/4] relative rounded-xl">
                    <Image
                      src={hall.image}
                      alt={hall.name.en}
                      fill
                      sizes="(max-width: 768px) 85vw, (max-width: 1024px) 40vw, 30vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 p-6">
                      <p className="text-white/60 text-[10px] tracking-[0.18em] uppercase mb-1">
                        (0{i + 1}) {hall.name.en}
                      </p>
                      <h3 className="font-display text-2xl text-white font-light uppercase">
                        {hall.name.en}
                      </h3>
                      <p className="text-white/60 text-[13px] mt-1">
                        Up to {hall.capacity.theatre.toLocaleString()} guests
                      </p>
                    </div>
                    {/* Hover CTA */}
                    <div className="absolute top-4 end-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] shadow-[0_8px_22px_-10px_var(--accent-glow)] hover:-translate-y-px text-white text-[10px] tracking-[0.14em] uppercase px-3 py-1.5 rounded-[var(--radius-btn)] font-bold">
                        View Details
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {halls.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === selectedIndex
                  ? "w-8 bg-[var(--accent)]"
                  : "w-1.5 bg-[var(--ink-muted)]/30 hover:bg-[var(--ink-muted)]/60"
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <RevealBlock delay={0.1} className="mt-10 md:mt-14 text-center">
          <Link
            href="/venues"
            locale={locale}
            className="inline-flex items-center gap-2 border-2 border-[var(--accent)] text-[var(--ink)] rounded-[var(--radius-btn)] px-8 py-3.5 text-[11px] font-bold tracking-[0.18em] uppercase hover:bg-[var(--accent)] hover:text-white transition-colors"
          >
            Explore All Venues
            <ArrowRight size={14} />
          </Link>
        </RevealBlock>
      </div>
    </section>
  );
}
