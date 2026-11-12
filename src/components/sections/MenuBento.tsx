"use client";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { motion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import { FadeUp } from "@/components/motion/primitives";
import { SectionHeading } from "@/components/ui/SectionHeading";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const BENTO_ITEMS = [
  {
    id: "mughal",
    label: "Mughal Classic",
    tag: "Most Popular",
    desc: "Rich gravies, slow-cooked meats, aromatic biryanis.",
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=90&w=1600",
  },
  {
    id: "continental",
    label: "Continental",
    tag: "International",
    desc: "Refined European dishes with fresh seasonal produce.",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=90&w=900",
  },
  {
    id: "multi",
    label: "Multi-Cuisine Grand",
    tag: "Premium",
    desc: "Live cooking stations across 3 cuisines.",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=90&w=900",
  },
  {
    id: "dessert",
    label: "Dessert Buffet",
    tag: "Sweet Finish",
    desc: "8-item dessert buffet, premium mocktail bar.",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=90&w=900",
  },
  {
    id: "breakfast",
    label: "Breakfast Setup",
    tag: "Morning Events",
    desc: "Fresh-brewed coffee, pastries, and hot buffet.",
    image: "https://images.unsplash.com/photo-1495214783159-3503fd1b572d?auto=format&fit=crop&q=90&w=900",
  },
];

interface MenuBentoProps { locale: Locale }

export function MenuBento({ locale }: MenuBentoProps) {
  return (
    <section className="section-y bg-[var(--bg-soft)]">
      <div className="container-site">
        {/* Header */}
        <FadeUp className="mb-12">
          <SectionHeading eyebrow="ICCB Catering" title="Menus Crafted" highlight="to Perfection" description="From Mughal feasts to delicate desserts — every plate is prepared fresh in our own kitchen." />
        </FadeUp>

        {/* Editorial grid — large feature card + 2×2 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-4 lg:gap-5">
          {BENTO_ITEMS.map((item, i) => {
            const featured = i === 0;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8% 0px" }}
                transition={{ duration: 0.65, delay: i * 0.07, ease: EASE }}
                className={featured ? "sm:col-span-2 lg:row-span-2" : ""}
              >
                <Link
                  href="/menu"
                  locale={locale}
                  className={`group relative flex flex-col h-full overflow-hidden bg-[var(--surface)] border border-[var(--line)] transition-shadow duration-500 hover:shadow-[var(--shadow-card)] ${
                    featured ? "min-h-[460px] lg:min-h-[720px]" : "min-h-[400px] lg:min-h-0"
                  }`}
                >
                  {/* Text */}
                  <div
                    className={`relative z-10 ${
                      featured ? "px-8 pt-12 md:px-12 md:pt-16 text-start" : "px-6 pt-9 text-center"
                    }`}
                  >
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--ink-muted)] rtl:tracking-normal">
                      {item.tag}
                    </span>
                    <h3
                      className={`font-display text-[var(--ink)] leading-tight mt-4 ${
                        featured ? "text-[clamp(2.2rem,4vw,3.75rem)]" : "text-[clamp(1.4rem,1.8vw,1.85rem)]"
                      }`}
                    >
                      {item.label}
                    </h3>
                    <span
                      aria-hidden="true"
                      className={`block h-[3px] bg-[var(--accent)] mt-4 transition-all duration-500 ${
                        featured ? "w-16 group-hover:w-24" : "w-12 mx-auto group-hover:w-20"
                      }`}
                    />
                    <span className="inline-block mt-4 text-[14px] text-[var(--ink-muted)] group-hover:text-[var(--accent)] transition-colors">
                      {featured ? item.desc : "Learn more"}
                    </span>
                  </div>

                  {/* Image — sits at the bottom and fades up into the white card */}
                  <div className="relative flex-1 min-h-[200px] mt-6">
                    <Image
                      src={item.image}
                      alt={item.label}
                      fill
                      sizes={featured ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"}
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-[var(--surface)] to-transparent" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <FadeUp delay={0.3} className="mt-10 text-center">
          <p className="text-[var(--ink-muted)] text-[14px] mb-4">
            Custom menus available for all event sizes — 50 to 10,000 guests.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" locale={locale} className="btn btn-primary">
              Request a Menu Quote <ArrowRight size={14} weight="bold" />
            </Link>
            <Link href="/menu" locale={locale} className="btn btn-secondary whitespace-nowrap">
              View all menus <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
