import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { ventures } from "@/data/ventures";
import { FadeUp, LineGrow } from "@/components/motion/primitives";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "ICCB Ventures — Dining & More",
  description:
    "Discover ICCB's portfolio of dining and hospitality ventures: ICCB Catering, Heritage Restaurant, ICCB Restaurant, and ICCB Ice Cream.",
};

export default async function VenturesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (
    routing.locales.includes(rawLocale as Locale) ? rawLocale : "en"
  ) as Locale;

  return (
    <main>
      {/* Hero */}
      <section className="section-y bg-[var(--bg-soft)] pt-[calc(var(--header-h,96px)+3rem)]">
        <div className="container-site">
          <FadeUp>
            <span className="text-eyebrow">ICCB Ventures</span>
          </FadeUp>
          <FadeUp delay={0.08}>
            <h1 className="text-h2 mt-2 mb-4">
              One Destination,{" "}
              <span className="text-[var(--accent)]">Endless Experiences</span>
            </h1>
            <LineGrow delay={0.15} />
          </FadeUp>
          <FadeUp delay={0.18}>
            <p className="text-[var(--ink-body)] text-[16px] leading-relaxed max-w-2xl mt-6">
              From world-class catering to Mughal-inspired fine dining, ICCB&apos;s
              portfolio of hospitality ventures brings exceptional food and
              service experiences to every occasion.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* Venture grid */}
      <section className="section-y bg-[var(--bg)]">
        <div className="container-site">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {ventures.map((venture, i) => (
              <FadeUp key={venture.id} delay={i * 0.08}>
                <article className="group card card-hover overflow-hidden">
                  <Link
                    href={`/ventures/${venture.slug}`}
                    locale={locale}
                    className="block"
                  >
                    {/* Image */}
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={venture.image}
                        alt={venture.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                      />
                      {venture.isSample && (
                        <span className="absolute top-3 end-3 bg-[var(--bg-tint)] text-[var(--accent-text)] text-[11px] font-semibold px-2.5 py-1 rounded-full border border-[var(--accent)]/30">
                          Coming Soon
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <span className="text-eyebrow block mb-2">
                        {({ catering: "CATERING", icecream: "ICE CREAM", events: "EVENTS", sweets: "SWEETS", cafe: "CAFÉ" } as Record<string, string>)[venture.type] ?? "RESTAURANT"}
                      </span>
                      <h2
                        className="font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors mb-2 leading-tight"
                        style={{ fontSize: "clamp(1.2rem, 1.8vw, 1.5rem)" }}
                      >
                        {venture.name}
                      </h2>
                      <p className="text-[var(--ink-muted)] text-[14px] mb-4 leading-relaxed line-clamp-2">
                        {venture.tagline}
                      </p>

                      {/* Stats row */}
                      <div className="flex flex-wrap gap-4 mb-5">
                        {venture.stats.slice(0, 2).map((s) => (
                          <div key={s.label}>
                            <div className="font-bold text-[var(--accent)] text-[18px] leading-none">
                              {s.value}
                            </div>
                            <div className="text-[var(--ink-muted)] text-[11px] mt-0.5">
                              {s.label}
                            </div>
                          </div>
                        ))}
                      </div>

                      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--accent-text)] group-hover:gap-2.5 transition-all underline-grow">
                        Explore {venture.name}{" "}
                        <ArrowRight size={13} />
                      </span>
                    </div>
                  </Link>
                </article>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
