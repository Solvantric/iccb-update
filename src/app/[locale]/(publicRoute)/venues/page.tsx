import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { halls } from "@/data/halls";
import { RevealBlock, RevealGroup, RevealItem } from "@/components/motion/RevealBlock";
import { Users, Ruler, ArrowRight } from "@phosphor-icons/react/dist/ssr";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("venuesTitle"), description: t("venuesDescription") };
}

export default async function VenuesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as Locale) ? rawLocale : "en") as Locale;

  return (
    <div className="pt-20 md:pt-24">
      <section className="bg-[var(--bg-soft)] py-12 border-b border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock>
            <span className="meta-label block mb-2">(VENUES)</span>
            <h1 className="display-lg text-[var(--ink)]">OUR CONVENTION HALLS</h1>
            <p className="text-[var(--ink-muted)] text-[16px] mt-3 max-w-xl">
              Six world-class spaces designed for every scale of event — from intimate seminars to mega expos with 10,000+ attendees.
            </p>
          </RevealBlock>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {halls.map((hall, i) => (
              <RevealItem key={hall.id}>
                <article className="group bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] overflow-hidden hover:shadow-lg transition-all duration-500">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={hall.image}
                      alt={hall.name.en}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 start-3 bg-[var(--accent)] text-white rounded-full px-3 py-1.5 text-[10px] font-medium tracking-wider uppercase">
                      0{i + 1}
                    </div>
                  </div>
                  <div className="p-5">
                    <h2 className="font-display text-2xl text-[var(--ink)] font-light uppercase group-hover:text-[var(--accent)] transition-colors mb-3">
                      {hall.name.en}
                    </h2>
                    <div className="flex gap-4 mb-4 text-[var(--ink-muted)] text-[13px]">
                      <div className="flex items-center gap-1.5">
                        <Users size={14} weight="light" />
                        Up to {hall.capacity.theatre.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Ruler size={14} weight="light" />
                        {hall.area.toLocaleString()} sq ft
                      </div>
                    </div>
                    <ul className="space-y-1.5 mb-5">
                      {hall.features.slice(0, 3).map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2 text-[var(--ink-muted)] text-[13px]">
                          <span className="w-1 h-1 rounded-full bg-[var(--accent)] mt-1.5 flex-shrink-0" />
                          {f.en}
                        </li>
                      ))}
                    </ul>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { l: "Theatre", v: hall.capacity.theatre },
                        { l: "Banquet", v: hall.capacity.banquet },
                        { l: "Classroom", v: hall.capacity.classroom || 0 },
                      ].filter((c) => c.v > 0).map((cap) => (
                        <div key={cap.l} className="text-center bg-[var(--bg-soft)] rounded-lg p-2">
                          <p className="font-display text-lg text-[var(--ink)] font-light">{cap.v.toLocaleString()}</p>
                          <p className="text-[9px] text-[var(--ink-muted)] tracking-wider uppercase">{cap.l}</p>
                        </div>
                      ))}
                    </div>
                    <Link
                      href={`/venues/${hall.slug}`}
                      locale={locale}
                      className="flex items-center gap-2 text-[var(--accent-text)] text-[12px] font-medium tracking-[0.12em] uppercase hover:gap-3 transition-all"
                    >
                      View Details
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>

          {/* CTA */}
          <RevealBlock delay={0.1} className="mt-14 text-center">
            <Link
              href="/booking"
              locale={locale}
              className="inline-flex items-center gap-2 bg-[var(--accent)] text-white rounded-full px-8 py-4 text-[12px] font-medium tracking-[0.12em] uppercase hover:bg-[var(--accent-hover)] transition-colors"
            >
              Check Availability
              <ArrowRight size={14} weight="bold" />
            </Link>
          </RevealBlock>
        </div>
      </section>
    </div>
  );
}
