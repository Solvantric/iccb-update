import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { halls } from "@/data/halls";
import { CountUpStats } from "@/components/why/CountUpStats";
import { VenuesHero } from "@/components/venues/VenuesHero";
import { HallGrid } from "@/components/venues/HallGrid";
import { CapacityExplorer } from "@/components/venues/CapacityExplorer";
import { Ornament } from "@/components/venues/Ornament";
import { RevealBlock } from "@/components/motion/RevealBlock";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("venuesTitle"), description: t("venuesDescription") };
}


export default async function VenuesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as Locale) ? rawLocale : "en") as Locale;
  const totalArea = halls.reduce((s, h) => s + h.area, 0);
  const largest = Math.max(...halls.map((h) => h.capacity.theatre));

  return (
    <div className="pt-[88px] sm:pt-[112px]">
      <VenuesHero halls={halls} locale={locale} />

      {/* Intro */}
      <section className="pt-16 md:pt-20">
        <RevealBlock className="container-site mx-auto max-w-3xl text-center">
          <p className="font-display text-[13px] tracking-[0.3em] text-[var(--accent)]">THE HALLS OF ICCB</p>
          <h2 className="mt-4 font-display uppercase text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.05] text-[var(--ink)]">
            A Hall for <span className="text-[var(--accent)]">Every Story</span>
          </h2>
          <Ornament className="mt-6" />
          <p className="mt-6 text-[16px] leading-relaxed text-[var(--ink-body)]">
            Each of our six halls carries its own character — named in the tradition of Bengal, built to international standards, and
            served by one in-house team for catering, décor and event management.
          </p>
        </RevealBlock>
      </section>

      <HallGrid halls={halls} locale={locale} />

      <CountUpStats
        items={[
          { value: 6, label: "Halls", plain: true },
          { value: totalArea, suffix: "+", label: "Sq ft of halls" },
          { value: largest, suffix: "", label: "Largest hall (theatre)" },
          { value: 20000, suffix: "+", label: "Guests at once" },
          { value: 3500, suffix: "+", label: "Car parking" },
          { value: 2015, label: "Serving since", plain: true },
        ]}
      />

      <CapacityExplorer halls={halls} locale={locale} />

      {/* CTA */}
      <section className="section-y bg-[var(--bg)]">
        <RevealBlock className="container-site mx-auto max-w-3xl text-center">
          <h2 className="font-display uppercase text-[clamp(1.9rem,3.8vw,3rem)] leading-[1.05] text-[var(--ink)]">
            Found the <span className="text-[var(--accent)]">Perfect Hall?</span>
          </h2>
          <Ornament className="mt-5" />
          <p className="mt-5 text-[15.5px] text-[var(--ink-muted)]">Check live availability and get an instant estimate — our team will reach you right away.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/booking" locale={locale} className="btn btn-primary">
              Check Availability <ArrowRight size={14} weight="bold" />
            </Link>
            <Link href="/booking#estimate" locale={locale} className="btn btn-secondary">
              Estimate My Budget
            </Link>
          </div>
        </RevealBlock>
      </section>
    </div>
  );
}
