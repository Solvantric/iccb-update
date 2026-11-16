import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { halls, getHallBySlug } from "@/data/halls";
import { hallTitle } from "@/data/hallDetails";
import { HallHero, HallOverview, LayoutVisualizer, HallFeatures, HallGallery, HallBookingBand, OtherHalls } from "@/components/venues/HallDetail";

export async function generateStaticParams() {
  return halls.flatMap((hall) => routing.locales.map((locale) => ({ locale, slug: hall.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const hall = getHallBySlug(slug);
  if (!hall) return {};
  return {
    title: hallTitle(hall.name.en),
    description: `${hallTitle(hall.name.en)} at ICCB — up to ${hall.capacity.theatre.toLocaleString()} guests (theatre), ${hall.area.toLocaleString()} sq ft of world-class event space in Dhaka.`,
  };
}

export default async function HallDetailPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as Locale) ? rawLocale : "en") as Locale;
  const hall = getHallBySlug(slug);
  if (!hall) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "EventVenue",
    name: hallTitle(hall.name.en),
    maximumAttendeeCapacity: hall.capacity.theatre,
    address: { "@type": "PostalAddress", addressLocality: "Dhaka", addressCountry: "BD" },
  };

  return (
    <div className="pt-[88px] sm:pt-[112px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <HallHero hall={hall} locale={locale} />
      <HallOverview hall={hall} />
      <LayoutVisualizer hall={hall} />
      <HallFeatures hall={hall} />
      <HallGallery hall={hall} />
      <HallBookingBand hall={hall} locale={locale} />
      <OtherHalls hall={hall} halls={halls} locale={locale} />
    </div>
  );
}
