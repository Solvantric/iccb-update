import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { PartnersCarousel } from "@/components/sections/PartnersCarousel";
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

      {/* Partner logos — same single-row, step-and-pause carousel as the home page */}
      <section className="overflow-hidden bg-[var(--bg)] pb-[clamp(4rem,9vw,7rem)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <PartnersCarousel />
        </div>
      </section>

      <ExpoCTA locale={locale} />
    </div>
  );
}
