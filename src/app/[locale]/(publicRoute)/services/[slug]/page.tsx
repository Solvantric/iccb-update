import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { services, getServiceBySlug } from "@/data/services";
import {
  ServiceHero, ServiceOverview, ServiceHighlights, ServicePackages, ServiceSteps, ServiceGallery, ServiceCTA, OtherServices,
} from "@/components/services/ServiceDetail";

export async function generateStaticParams() {
  return services.flatMap((s) => routing.locales.map((locale) => ({ locale, slug: s.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};
  return { title: `${service.name.en} — ICCB Services`, description: service.description.en };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as Locale) ? rawLocale : "en") as Locale;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  return (
    <div className="pt-[88px] sm:pt-[112px]">
      <ServiceHero service={service} locale={locale} />
      <ServiceOverview service={service} />
      <ServiceHighlights service={service} />
      <ServicePackages service={service} locale={locale} />
      <ServiceSteps service={service} />
      <ServiceGallery service={service} />
      <ServiceCTA service={service} locale={locale} />
      <OtherServices service={service} services={services} locale={locale} />
    </div>
  );
}
