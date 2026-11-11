"use client";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { motion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import { FadeUp, LineGrow } from "@/components/motion/primitives";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const BENTO_ITEMS = [
  {
    id: "mughal",
    label: "Mughal Classic",
    tag: "Most Popular",
    desc: "Rich gravies, slow-cooked meats, aromatic biryanis.",
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=95&w=1600",
    span: "col-span-2 row-span-2",
    textSize: "text-[clamp(1.2rem,2vw,1.6rem)]",
  },
  {
    id: "continental",
    label: "Continental",
    tag: "International",
    desc: "Refined European dishes with fresh seasonal produce.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=95&w=1200",
    span: "col-span-1 row-span-1",
    textSize: "text-[15px]",
  },
  {
    id: "multi",
    label: "Multi-Cuisine Grand",
    tag: "Premium",
    desc: "Live cooking stations across 3 cuisines.",
    image: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&q=95&w=1200",
    span: "col-span-1 row-span-1",
    textSize: "text-[15px]",
  },
  {
    id: "dessert",
    label: "Dessert Buffet",
    tag: "Sweet Finish",
    desc: "8-item dessert buffet, premium mocktail bar.",
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=95&w=1200",
    span: "col-span-1 row-span-1",
    textSize: "text-[15px]",
  },
  {
    id: "breakfast",
    label: "Breakfast Setup",
    tag: "Morning Events",
    desc: "Fresh-brewed coffee, pastries, and hot buffet.",
    image: "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&q=95&w=1200",
    span: "col-span-1 row-span-1",
    textSize: "text-[15px]",
  },
];

interface MenuBentoProps { locale: Locale }

export function MenuBento({ locale }: MenuBentoProps) {
  return (
    <section className="section-y bg-[var(--bg-soft)]">
      <div className="container-site">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <FadeUp>
              <span className="text-eyebrow">ICCB Catering</span>
            </FadeUp>
            <FadeUp delay={0.08}>
              <h2 className="text-h2 mt-2">
                Menus Crafted{" "}
                <span className="text-[var(--accent)]">to Perfection</span>
              </h2>
              <LineGrow delay={0.15} />
            </FadeUp>
          </div>
          <FadeUp delay={0.12}>
            <Link
              href="/menu"
              locale={locale}
              className="btn btn-secondary btn-sm whitespace-nowrap"
            >
              View all menus <ArrowRight size={14} weight="bold" />
            </Link>
          </FadeUp>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] md:auto-rows-[220px] gap-3">
          {BENTO_ITEMS.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ duration: 0.65, delay: i * 0.07, ease: EASE }}
              className={`group relative overflow-hidden rounded-[var(--radius-card-lg)] cursor-pointer ${item.span}`}
            >
              {/* Background image */}
              <Image
                src={item.image}
                alt={item.label}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 start-0 end-0 p-4 md:p-5">
                <span className="inline-block text-[10px] font-semibold uppercase tracking-widest text-[var(--accent)] bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded mb-2">
                  {item.tag}
                </span>
                <h3 className={`font-bold text-white leading-tight mb-1 ${item.textSize}`}>
                  {item.label}
                </h3>
                <p className="text-white/70 text-[12px] leading-snug line-clamp-2">
                  {item.desc}
                </p>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-[var(--accent)]/0 group-hover:bg-[var(--accent)]/10 transition-colors duration-300" />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <FadeUp delay={0.3} className="mt-10 text-center">
          <p className="text-[var(--ink-muted)] text-[14px] mb-4">
            Custom menus available for all event sizes — 50 to 10,000 guests.
          </p>
          <Link href="/contact" locale={locale} className="btn btn-primary">
            Request a Menu Quote <ArrowRight size={14} weight="bold" />
          </Link>
        </FadeUp>
      </div>
    </section>
  );
}
