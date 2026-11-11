import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { HeroSlider } from "@/components/sections/HeroSlider";
import { StatsStrip } from "@/components/sections/StatsStrip";
import { VenuesHighlight } from "@/components/sections/VenuesHighlight";
import { HallSlider } from "@/components/sections/HallSlider";
import { ExpoZone } from "@/components/sections/ExpoZone";
import { ServicesHighlight } from "@/components/sections/ServicesHighlight";
import { WhyICCB } from "@/components/sections/WhyICCB";
import { VideoBlock } from "@/components/sections/VideoBlock";
import { GallerySlider } from "@/components/sections/GallerySlider";
import { Testimonials } from "@/components/sections/Testimonials";
import { GettingHere } from "@/components/sections/GettingHere";
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
      <HeroSlider locale={locale} />
      <StatsStrip />
      <VenuesHighlight locale={locale} />
      <HallSlider locale={locale} />
      <ExpoZone locale={locale} />
      <ServicesHighlight locale={locale} />
      <WhyICCB />
      <VideoBlock />
      <GallerySlider locale={locale} />
      <Testimonials />
      <GettingHere />
      <FinalCTA locale={locale} />
    </>
  );
}
