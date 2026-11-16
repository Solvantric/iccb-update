"use client";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { RevealBlock, RevealGroup, RevealItem } from "@/components/motion/RevealBlock";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ArrowRight } from "@phosphor-icons/react";
import { PartnersCarousel } from "./PartnersCarousel";
import { useTranslations } from "next-intl";
import { UPCOMING_EXPOS } from "@/data/expoUpcoming";

/** First show in the upcoming list (data is ordered by date). */
const NEXT_EXPO = [...UPCOMING_EXPOS].sort((a, b) => a.start.localeCompare(b.start))[0];

interface ExpoZoneProps {
  locale: Locale;
}

export function ExpoZone({ locale }: ExpoZoneProps) {
  const t = useTranslations("home.expo");
  const loc = locale === "en" ? "en-GB" : locale;
  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleDateString(loc, { ...opts, timeZone: "UTC" });
  const nextDates = `${fmt(NEXT_EXPO.start, { day: "numeric" })}–${fmt(NEXT_EXPO.end, { day: "numeric", month: "long", year: "numeric" })}`;
  return (
    <section className="bg-[var(--bg)] py-[clamp(4rem,10vw,9rem)] overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* LEFT: Full photo */}
          <RevealBlock className="order-2 lg:order-1">
            <div className="relative">
              <div className="aspect-[4/3] lg:aspect-square relative overflow-hidden rounded-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&q=95&w=3840"
                  alt={t("photoAlt")}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-6 start-6 end-6">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                    <p className="text-white/60 text-[10px] tracking-[0.16em] uppercase mb-1">{t("largest")}</p>
                    <p className="font-display text-xl text-white font-normal">{t("destination")}</p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-white/80 text-[12px]">{t("annualExpos")}</span>
                      <span className="text-white/40">·</span>
                      <span className="text-white/80 text-[12px]">{t("visitors")}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Upcoming expo badge */}
              <RevealBlock delay={0.3} className="absolute -top-4 -end-4 md:end-auto md:-start-6">
                <div className="bg-[var(--accent)] text-white rounded-xl p-4 shadow-xl max-w-[180px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-[9px] tracking-[0.14em] uppercase font-medium">{t("upcoming")}</span>
                  </div>
                  <p className="font-display text-base font-normal leading-tight">{NEXT_EXPO.short}</p>
                  <p className="text-white/80 text-[11px] mt-1">{nextDates}</p>
                </div>
              </RevealBlock>
            </div>
          </RevealBlock>

          {/* RIGHT: Content + marquee logos */}
          <div className="order-1 lg:order-2">
            <RevealBlock>
              <SectionLabel>{t("label")}</SectionLabel>
            </RevealBlock>
            <RevealBlock delay={0.08}>
              <h2 className="display-lg text-[var(--ink)] mt-3 mb-6">
                {t("title")}
              </h2>
            </RevealBlock>
            <RevealBlock delay={0.12}>
              <p className="text-[var(--ink-muted)] text-[16px] leading-relaxed mb-8 max-w-md">
                {t("text")}
              </p>
            </RevealBlock>

            {/* Mini stats */}
            <RevealGroup className="grid grid-cols-3 gap-4 mb-10">
              {[
                { n: "30+", label: t("stats.annual") },
                { n: "350+", label: t("stats.exhibitors") },
                { n: "20K+", label: t("stats.perShow") },
              ].map((s) => (
                <RevealItem key={s.label}>
                  <div className="border border-[var(--line)] rounded-xl p-4 text-center bg-[var(--bg-soft)]">
                    <p className="font-display text-3xl text-[var(--ink)] font-normal">{s.n}</p>
                    <p className="text-[var(--ink-muted)] text-[11px] tracking-[0.1em] uppercase mt-1">{s.label}</p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>

            {/* CTA buttons */}
            <RevealBlock delay={0.2} className="mt-8 flex gap-3 flex-wrap">
              <Link
                href="/expo-zone"
                locale={locale}
                className="flex items-center gap-2 bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] shadow-[0_8px_22px_-10px_var(--accent-glow)] hover:-translate-y-px text-white rounded-[var(--radius-btn)] px-6 py-3 text-[11px] font-bold tracking-[0.12em] uppercase hover:brightness-110 transition-colors"
              >
                {t("plan")}
                <ArrowRight size={13} weight="bold" className="rtl:-scale-x-100" />
              </Link>
              <Link
                href="/enquiry"
                locale={locale}
                className="flex items-center gap-2 border-2 border-[var(--accent)] text-[var(--ink)] rounded-[var(--radius-btn)] px-6 py-3 text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-[var(--accent)] hover:text-white transition-colors"
              >
                {t("enquiry")}
              </Link>
            </RevealBlock>
          </div>
        </div>

        {/* Partner logos — single row, one logo at a time */}
        <PartnersCarousel />
      </div>
    </section>
  );
}
