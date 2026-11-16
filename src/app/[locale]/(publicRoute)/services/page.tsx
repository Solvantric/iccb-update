import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { services } from "@/data/services";
import { ServicesHero, ServiceGrid, ServiceProcess } from "@/components/services/ServicesShowcase";
import { Ornament } from "@/components/venues/Ornament";
import { RevealBlock } from "@/components/motion/RevealBlock";
import { Link } from "@/lib/i18n/navigation";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Services — ICCB",
  description: "ICCB offers a full range of event services — venue rental, catering, decoration, event management, heritage dining, and expo support.",
};

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as Locale) ? rawLocale : "en") as Locale;

  return (
    <div className="pt-[88px] sm:pt-[112px]">
      <ServicesHero services={services} locale={locale} />
      <ServiceGrid services={services} locale={locale} />
      <ServiceProcess />

      <section className="section-y bg-[var(--bg)]">
        <RevealBlock className="container-site mx-auto max-w-3xl text-center">
          <h2 className="font-display uppercase text-[clamp(1.9rem,3.8vw,3rem)] leading-[1.05] text-[var(--ink)]">
            Ready to Plan <span className="text-[var(--accent)]">Your Event?</span>
          </h2>
          <Ornament className="mt-5" />
          <p className="mt-5 text-[15.5px] text-[var(--ink-muted)]">Check live hall availability or tell us what you need — our team replies quickly.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/booking" locale={locale} className="btn btn-primary">
              Check Availability <ArrowRight size={14} weight="bold" />
            </Link>
            <Link href="/enquiry" locale={locale} className="btn btn-secondary">
              Request a Quote
            </Link>
          </div>
        </RevealBlock>
      </section>
    </div>
  );
}
