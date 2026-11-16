import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { clientLogos } from "@/data/expo";
import { PartnerLogo } from "@/components/ui/PartnerLogo";
import { RevealBlock } from "@/components/motion/RevealBlock";
import { ExpoHero, UpcomingExpos, ExpoTimeline, ExpoMoments, ExpoCTA } from "@/components/expo/ExpoSections";

export const metadata: Metadata = {
  title: "Expo Village — ICCB",
  description: "Bangladesh's largest single-roof exhibition space. Upcoming trade shows, modular booths, buyer matchmaking and full exhibitor support at ICCB Expo Village.",
};

export default async function ExpoZonePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as Locale) ? rawLocale : "en") as Locale;

  return (
    <div className="pt-[88px] sm:pt-[112px]">
      <ExpoHero locale={locale} />
      <UpcomingExpos locale={locale} />
      <ExpoTimeline locale={locale} />
      <ExpoMoments />

      {/* Partner logos — real organisations, animated marquee */}
      <section className="py-16 md:py-20 overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)] mb-10">
          <RevealBlock className="text-center">
            <span className="meta-label block mb-2">(GLOBAL PARTNERS)</span>
            <h2 className="display-md text-[var(--ink)]">TRUSTED BY WORLD-CLASS ORGANISATIONS</h2>
            <p className="text-[var(--ink-muted)] text-[14px] mt-2 max-w-lg mx-auto">
              ICCB hosts events for leading international organisations, embassies, trade bodies, and development banks.
            </p>
          </RevealBlock>
        </div>
        {/* Marquee row 1 */}
        <div className="relative overflow-hidden mb-3">
          <div className="logo-marquee flex gap-3" style={{ animationDuration: "30s", width: "max-content" }}>
            {[...clientLogos, ...clientLogos].map((logo, i) => (
              <PartnerLogo key={`r1-${logo.id}-${i}`} logo={logo} />
            ))}
          </div>
          <div className="absolute inset-y-0 start-0 w-24 bg-gradient-to-r from-[var(--bg)] to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 end-0 w-24 bg-gradient-to-l from-[var(--bg)] to-transparent pointer-events-none z-10" />
        </div>
        {/* Marquee row 2 — reverse */}
        <div className="relative overflow-hidden">
          <div className="logo-marquee-reverse flex gap-3" style={{ animationDuration: "24s", width: "max-content" }}>
            {[...clientLogos.slice(6), ...clientLogos, ...clientLogos.slice(0, 6)].map((logo, i) => (
              <PartnerLogo key={`r2-${logo.id}-${i}`} logo={logo} />
            ))}
          </div>
          <div className="absolute inset-y-0 start-0 w-24 bg-gradient-to-r from-[var(--bg)] to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 end-0 w-24 bg-gradient-to-l from-[var(--bg)] to-transparent pointer-events-none z-10" />
        </div>
      </section>

      <ExpoCTA locale={locale} />
    </div>
  );
}
