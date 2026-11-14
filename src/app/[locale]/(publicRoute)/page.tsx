import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { HeroSlider, BookingCard } from "@/components/sections/HeroSlider";
import { ServiceStrip } from "@/components/sections/ServiceStrip";
import { VenueCards } from "@/components/sections/VenueCards";
import { ExpoZone } from "@/components/sections/ExpoZone";
import { VenturesSlider } from "@/components/sections/VenturesSlider";
import { MenuBento } from "@/components/sections/MenuBento";
import { WhyICCB } from "@/components/sections/WhyICCB";
import { HistoryTimeline } from "@/components/sections/HistoryTimeline";
import { GallerySlider } from "@/components/sections/GallerySlider";
import { Testimonials } from "@/components/sections/Testimonials";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { HomeJsonLd } from "@/components/seo/HomeJsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://iccb.com.bd";

  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    openGraph: {
      title: t("homeTitle"),
      description: t("homeDescription"),
      url: `${siteUrl}/${locale}`,
      images: [
        {
          url: `${siteUrl}/images/og-home.jpg`,
          width: 1200,
          height: 630,
          alt: "ICCB — International Convention City Bashundhara",
        },
      ],
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <>
      <HomeJsonLd />
      {/* 1. Hero carousel */}
      <HeroSlider locale={locale} />
      {/* 2. Booking card overlap (desktop only) */}
      <BookingCard locale={locale} />
      {/* 3. Service strip */}
      <ServiceStrip locale={locale} />
      {/* 4. Venue cards */}
      <VenueCards locale={locale} />
      {/* 5. Expo zone */}
      <ExpoZone locale={locale} />
      {/* 6. Ventures diagonal panel slider */}
      <VenturesSlider locale={locale} />
      {/* 7. Menu bento */}
      <MenuBento locale={locale} />
      {/* 8. Our history timeline */}
      <HistoryTimeline />
      {/* 8b. Why ICCB */}
      <WhyICCB />
      {/* 9. Gallery */}
      <GallerySlider locale={locale} />
      {/* 10. Testimonials */}
      <Testimonials />
      {/* 12. Final CTA */}
      <FinalCTA locale={locale} />
    </>
  );
}
