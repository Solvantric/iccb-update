"use client";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { RevealBlock, RevealGroup, RevealItem } from "@/components/motion/RevealBlock";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ArrowRight } from "@phosphor-icons/react";
import { clientLogos } from "@/data/expo";

// Animated marquee row for partner logos
function LogoMarquee({ speed = 30, reverse = false }: { speed?: number; reverse?: boolean }) {
  const logos = [...clientLogos, ...clientLogos]; // duplicate for seamless loop
  return (
    <div className="relative overflow-hidden">
      <div
        className={`flex gap-3 ${reverse ? "logo-marquee-reverse" : "logo-marquee"}`}
        style={{ animationDuration: `${speed}s`, width: "max-content" }}
      >
        {logos.map((logo, i) => (
          <div
            key={`${logo.id}-${i}`}
            title={logo.name}
            className="flex-shrink-0 h-14 px-4 rounded-lg border flex items-center justify-center gap-2 cursor-default"
            style={{ background: logo.bg, borderColor: `${logo.color}30`, minWidth: 120 }}
          >
            <span className="text-[12px] font-bold tracking-[0.04em]" style={{ color: logo.color }}>
              {logo.abbr}
            </span>
          </div>
        ))}
      </div>
      <div className="absolute inset-y-0 start-0 w-16 bg-gradient-to-r from-[var(--bg)] to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 end-0 w-16 bg-gradient-to-l from-[var(--bg)] to-transparent pointer-events-none z-10" />
    </div>
  );
}

interface ExpoZoneProps {
  locale: Locale;
}

export function ExpoZone({ locale }: ExpoZoneProps) {
  return (
    <section className="bg-[var(--bg)] py-[clamp(4rem,10vw,9rem)] overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* LEFT: Full photo */}
          <RevealBlock className="order-2 lg:order-1">
            <div className="relative">
              <div className="aspect-[4/5] relative overflow-hidden rounded-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&q=95&w=3840"
                  alt="ICCB Expo Village — international trade fair"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-6 start-6 end-6">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                    <p className="text-white/60 text-[10px] tracking-[0.16em] uppercase mb-1">Bangladesh&apos;s Largest</p>
                    <p className="font-display text-xl text-white font-normal">Exhibition Destination</p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-white/80 text-[12px]">30+ Annual Expos</span>
                      <span className="text-white/40">·</span>
                      <span className="text-white/80 text-[12px]">20K+ Visitors</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Upcoming expo badge */}
              <RevealBlock delay={0.3} className="absolute -top-4 -end-4 md:end-auto md:-start-6">
                <div className="bg-[var(--accent)] text-white rounded-xl p-4 shadow-xl max-w-[180px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-[9px] tracking-[0.14em] uppercase font-medium">Upcoming</span>
                  </div>
                  <p className="font-display text-base font-normal leading-tight">BUILDEX 2026</p>
                  <p className="text-white/80 text-[11px] mt-1">15–18 March 2026</p>
                </div>
              </RevealBlock>
            </div>
          </RevealBlock>

          {/* RIGHT: Content + marquee logos */}
          <div className="order-1 lg:order-2">
            <RevealBlock>
              <SectionLabel>(EXPO ZONE)</SectionLabel>
            </RevealBlock>
            <RevealBlock delay={0.08}>
              <h2 className="display-lg text-[var(--ink)] mt-3 mb-6">
                WHERE INDUSTRIES EXHIBIT
              </h2>
            </RevealBlock>
            <RevealBlock delay={0.12}>
              <p className="text-[var(--ink-muted)] text-[16px] leading-relaxed mb-8 max-w-md">
                ICCB Expo Village is Bangladesh&apos;s largest dedicated exhibition space, hosting international trade fairs, product launches, and industry showcases attended by global organisations.
              </p>
            </RevealBlock>

            {/* Mini stats */}
            <RevealGroup className="grid grid-cols-3 gap-4 mb-10">
              {[
                { n: "30+", label: "Annual expos" },
                { n: "350+", label: "Exhibitors" },
                { n: "20K+", label: "Visitors/show" },
              ].map((s) => (
                <RevealItem key={s.label}>
                  <div className="border border-[var(--line)] rounded-xl p-4 text-center bg-[var(--bg-soft)]">
                    <p className="font-display text-3xl text-[var(--ink)] font-normal">{s.n}</p>
                    <p className="text-[var(--ink-muted)] text-[11px] tracking-[0.1em] uppercase mt-1">{s.label}</p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>

            {/* Animated partner logo marquees */}
            <RevealBlock delay={0.14}>
              <p className="text-[11px] tracking-[0.14em] uppercase text-[var(--ink-muted)] mb-4">
                Our Global Partners &amp; Exhibitors
              </p>
              <div className="space-y-3 overflow-hidden">
                <LogoMarquee speed={28} />
                <LogoMarquee speed={22} reverse />
              </div>
            </RevealBlock>

            {/* CTA buttons */}
            <RevealBlock delay={0.2} className="mt-8 flex gap-3 flex-wrap">
              <Link
                href="/expo-zone"
                locale={locale}
                className="flex items-center gap-2 bg-[var(--accent)] text-white rounded-full px-6 py-3 text-[11px] font-medium tracking-[0.12em] uppercase hover:bg-[var(--accent-hover)] transition-colors"
              >
                Plan Your Expo
                <ArrowRight size={13} weight="bold" />
              </Link>
              <Link
                href="/enquiry"
                locale={locale}
                className="flex items-center gap-2 border border-[var(--ink)] text-[var(--ink)] rounded-full px-6 py-3 text-[11px] font-medium tracking-[0.12em] uppercase hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors"
              >
                Exhibitor Enquiry
              </Link>
            </RevealBlock>
          </div>
        </div>
      </div>
    </section>
  );
}
