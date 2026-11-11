import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { services, getServiceBySlug } from "@/data/services";
import { RevealBlock, RevealGroup, RevealItem } from "@/components/motion/RevealBlock";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react/dist/ssr";

export async function generateStaticParams() {
  return services.flatMap((s) =>
    routing.locales.map((locale) => ({ locale, slug: s.slug }))
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};
  return {
    title: `${service.name.en} — ICCB Services`,
    description: service.description.en,
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as Locale) ? rawLocale : "en") as Locale;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const otherServices = services.filter((s) => s.id !== service.id);

  return (
    <div className="pt-20 md:pt-24">
      {/* Hero */}
      <div className="relative h-[45vh] min-h-[280px] overflow-hidden">
        <Image
          src={service.image}
          alt={service.name.en}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        <div className="absolute bottom-0 inset-x-0 px-[clamp(1rem,4vw,3rem)] pb-8">
          <div className="max-w-[1440px] mx-auto">
            <span className="text-white/60 text-[11px] tracking-[0.18em] uppercase">ICCB SERVICES</span>
            <h1 className="display-lg text-white mt-2">{service.name.en.toUpperCase()}</h1>
            <p className="text-white/70 mt-2 text-[15px]">{service.tagline.en}</p>
          </div>
        </div>
      </div>

      <section className="py-14 md:py-20">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-10">
              <RevealBlock>
                <p className="text-[var(--ink)] text-[16px] leading-relaxed max-w-2xl">
                  {service.description.en}
                </p>
              </RevealBlock>

              {/* Features */}
              <RevealBlock>
                <h2 className="font-display text-2xl text-[var(--ink)] font-light uppercase mb-5">
                  What's Included
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {service.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 bg-[var(--surface)] border border-[var(--line)] rounded-lg p-4">
                      <CheckCircle size={18} className="text-[var(--accent)] flex-shrink-0 mt-0.5" weight="light" />
                      <span className="text-[var(--ink)] text-[14px]">{f.en}</span>
                    </div>
                  ))}
                </div>
              </RevealBlock>

              {/* Service-specific detail for catering */}
              {service.slug === "catering" && (
                <RevealBlock>
                  <h2 className="font-display text-2xl text-[var(--ink)] font-light uppercase mb-5">
                    Catering Packages
                  </h2>
                  <p className="text-[var(--ink-muted)] text-[14px] mb-5">
                    Choose from three curated packages or request a custom menu.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { name: "Mughal Classic", price: "৳850/head", tag: "Popular" },
                      { name: "Continental", price: "৳1,200/head", tag: "Premium" },
                      { name: "Multi-Cuisine Grand", price: "৳1,800/head", tag: "Luxury" },
                    ].map((pkg) => (
                      <div key={pkg.name} className="bg-[var(--bg-soft)] border border-[var(--line)] rounded-lg p-4 text-center">
                        <span className="text-[10px] uppercase tracking-wider text-[var(--accent)] font-medium">{pkg.tag}</span>
                        <p className="font-display text-lg text-[var(--ink)] font-light uppercase mt-1">{pkg.name}</p>
                        <p className="text-[var(--ink-muted)] text-[13px] mt-1">{pkg.price}</p>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/menu"
                    locale={locale}
                    className="inline-flex items-center gap-2 mt-5 text-[var(--accent-text)] text-[12px] font-medium tracking-[0.12em] uppercase hover:gap-3 transition-all"
                  >
                    View Full Menu
                    <ArrowRight size={12} />
                  </Link>
                </RevealBlock>
              )}

              {/* Service-specific detail for decoration */}
              {service.slug === "decoration" && (
                <RevealBlock>
                  <h2 className="font-display text-2xl text-[var(--ink)] font-light uppercase mb-5">
                    Decoration Tiers
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { name: "Classic", price: "৳50,000", desc: "Elegant and understated — fresh florals, standard draping, table arrangements." },
                      { name: "Premium", price: "৳1,20,000", desc: "Enhanced floral installations, LED uplighting, custom backdrop, centerpieces." },
                      { name: "Royal", price: "৳2,50,000", desc: "Full hall transformation — chandelier arrangements, custom stage, floral arches." },
                    ].map((tier) => (
                      <div key={tier.name} className="bg-[var(--surface)] border border-[var(--line)] rounded-lg p-5">
                        <p className="text-[var(--accent)] text-[11px] uppercase tracking-wider font-medium mb-1">{tier.name}</p>
                        <p className="font-display text-2xl text-[var(--ink)] font-light">{tier.price}</p>
                        <p className="text-[var(--ink-muted)] text-[13px] mt-2 leading-relaxed">{tier.desc}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-[var(--ink-muted)] mt-3">
                    Sample pricing. Final quote confirmed by ICCB decoration team.
                  </p>
                </RevealBlock>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:sticky lg:top-24 lg:self-start space-y-5">
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] p-5">
                <h3 className="font-display text-xl text-[var(--ink)] font-light uppercase mb-4">Interested?</h3>
                <p className="text-[var(--ink-muted)] text-[14px] mb-5">
                  Contact us for a custom quote or to discuss your event requirements.
                </p>
                <Link
                  href="/enquiry"
                  locale={locale}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] text-white rounded-full py-3.5 text-[12px] font-medium tracking-[0.12em] uppercase hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Request a Quote
                  <ArrowRight size={14} weight="bold" />
                </Link>
                <Link
                  href="/booking"
                  locale={locale}
                  className="w-full mt-3 flex items-center justify-center gap-2 border border-[var(--ink)] text-[var(--ink)] rounded-full py-3.5 text-[12px] font-medium tracking-[0.12em] uppercase hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors"
                >
                  Check Availability
                </Link>
              </div>

              {/* Other services */}
              <div>
                <p className="meta-label mb-3">Other Services</p>
                <div className="space-y-2">
                  {otherServices.slice(0, 4).map((s) => (
                    <Link
                      key={s.id}
                      href={`/services/${s.slug}`}
                      locale={locale}
                      className="flex items-center gap-3 text-[var(--ink)] hover:text-[var(--accent)] transition-colors group"
                    >
                      <div className="w-12 h-9 relative overflow-hidden rounded flex-shrink-0 bg-[var(--bg-soft)]">
                        <Image src={s.image} alt={s.name.en} fill className="object-cover" sizes="48px" />
                      </div>
                      <p className="text-[14px] font-medium group-hover:text-[var(--accent)] transition-colors">{s.name.en}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related services strip */}
      <section className="py-14 bg-[var(--bg-soft)] border-t border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock className="mb-8">
            <h2 className="font-display text-2xl text-[var(--ink)] font-light uppercase">More Services</h2>
          </RevealBlock>
          <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {otherServices.slice(0, 3).map((s) => (
              <RevealItem key={s.id}>
                <Link
                  href={`/services/${s.slug}`}
                  locale={locale}
                  className="flex items-center gap-4 bg-[var(--surface)] border border-[var(--line)] rounded-lg p-4 hover:border-[var(--accent)] transition-colors group"
                >
                  <div className="w-16 h-12 relative overflow-hidden rounded flex-shrink-0">
                    <Image src={s.image} alt={s.name.en} fill className="object-cover" sizes="64px" />
                  </div>
                  <div>
                    <p className="font-display text-[15px] text-[var(--ink)] font-light uppercase group-hover:text-[var(--accent)] transition-colors">
                      {s.name.en}
                    </p>
                    <p className="text-[12px] text-[var(--ink-muted)] mt-0.5">{s.tagline.en}</p>
                  </div>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
    </div>
  );
}
