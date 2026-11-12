import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { services } from "@/data/services";
import { RevealBlock, RevealGroup, RevealItem } from "@/components/motion/RevealBlock";
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
      {/* Page header */}
      <section className="bg-[var(--bg-soft)] py-12 border-b border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock>
            <span className="meta-label block mb-2">(SERVICES)</span>
            <h1 className="display-lg text-[var(--ink)]">WHAT WE OFFER</h1>
            <p className="text-[var(--ink-muted)] text-[16px] mt-3 max-w-xl">
              A complete ecosystem of event services — from world-class venues to catering, decoration, and beyond.
            </p>
          </RevealBlock>
        </div>
      </section>

      {/* Services grid */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <RevealItem key={service.id}>
                <article className="group bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] overflow-hidden hover:shadow-lg transition-all duration-500">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={service.image}
                      alt={service.name.en}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                  <div className="p-6">
                    <p className="text-[var(--accent)] text-[11px] tracking-[0.14em] uppercase font-medium mb-2">
                      {service.tagline.en}
                    </p>
                    <h2 className="font-display text-2xl text-[var(--ink)] font-light uppercase group-hover:text-[var(--accent)] transition-colors mb-3">
                      {service.name.en}
                    </h2>
                    <p className="text-[var(--ink-muted)] text-[14px] leading-relaxed mb-5 line-clamp-3">
                      {service.description.en}
                    </p>
                    <ul className="space-y-1.5 mb-5">
                      {service.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-[var(--ink-muted)] text-[13px]">
                          <span className="w-1 h-1 rounded-full bg-[var(--accent)] mt-1.5 flex-shrink-0" />
                          {f.en}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/services/${service.slug}`}
                      locale={locale}
                      className="flex items-center gap-2 text-[var(--accent-text)] text-[12px] font-medium tracking-[0.12em] uppercase hover:gap-3 transition-all"
                    >
                      Learn More
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Process overview */}
      <section className="py-14 bg-[var(--bg-soft)] border-y border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock className="mb-10 text-center">
            <span className="meta-label block mb-2">(HOW IT WORKS)</span>
            <h2 className="display-md text-[var(--ink)]">BOOKING IN 4 STEPS</h2>
          </RevealBlock>
          <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Check Availability", desc: "Browse the calendar and find your ideal date and hall." },
              { step: "02", title: "Get an Estimate", desc: "Use the budget calculator for an instant ballpark figure." },
              { step: "03", title: "Reserve Your Date", desc: "Submit a hold request — our team confirms within 2 hours." },
              { step: "04", title: "Plan & Execute", desc: "Work with our coordinators to bring your vision to life." },
            ].map((p) => (
              <RevealItem key={p.step}>
                <div className="text-center">
                  <span className="font-display text-5xl text-[var(--accent)]/20 font-light">{p.step}</span>
                  <h3 className="font-display text-lg text-[var(--ink)] font-light uppercase mt-2 mb-2">{p.title}</h3>
                  <p className="text-[var(--ink-muted)] text-[14px]">{p.desc}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock>
            <h2 className="display-md text-[var(--ink)] mb-6">READY TO PLAN YOUR EVENT?</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/booking"
                locale={locale}
                className="inline-flex items-center gap-2 bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] shadow-[0_8px_22px_-10px_var(--accent-glow)] hover:-translate-y-px text-white rounded-[var(--radius-btn)] px-8 py-4 text-[12px] font-bold tracking-[0.12em] uppercase hover:brightness-110 transition-colors"
              >
                Check Availability
                <ArrowRight size={14} weight="bold" />
              </Link>
              <Link
                href="/enquiry"
                locale={locale}
                className="inline-flex items-center gap-2 border-2 border-[var(--accent)] text-[var(--ink)] rounded-[var(--radius-btn)] px-8 py-4 text-[12px] font-bold tracking-[0.12em] uppercase hover:bg-[var(--accent)] hover:text-white transition-colors"
              >
                Send Enquiry
              </Link>
            </div>
          </RevealBlock>
        </div>
      </section>
    </div>
  );
}
