import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { halls, getHallBySlug } from "@/data/halls";
import { RevealBlock, RevealGroup, RevealItem } from "@/components/motion/RevealBlock";
import { Users, Ruler, ArrowRight } from "@phosphor-icons/react/dist/ssr";

export async function generateStaticParams() {
  return halls.flatMap((hall) =>
    routing.locales.map((locale) => ({ locale, slug: hall.slug }))
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const hall = getHallBySlug(slug);
  if (!hall) return {};
  return {
    title: `${hall.name.en} Convention Hall`,
    description: `${hall.name.en} at ICCB — capacity up to ${hall.capacity.theatre.toLocaleString()} guests (theatre). ${hall.area.toLocaleString()} sq ft of world-class event space in Dhaka.`,
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
    name: hall.name.en,
    maximumAttendeeCapacity: hall.capacity.theatre,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dhaka",
      addressCountry: "BD",
    },
  };

  return (
    <div className="pt-20 md:pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Hero image */}
      <div className="relative h-[50vh] min-h-[300px] overflow-hidden">
        <Image
          src={hall.image}
          alt={hall.name.en}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20" />
        <div className="absolute bottom-0 inset-x-0 px-[clamp(1rem,4vw,3rem)] pb-8">
          <div className="max-w-[1440px] mx-auto">
            <span className="text-white/60 text-[11px] tracking-[0.18em] uppercase">
              ICCB — CONVENTION HALLS
            </span>
            <h1 className="display-lg text-white mt-2">{hall.name.en.toUpperCase()}</h1>
          </div>
        </div>
      </div>

      <section className="py-14 md:py-20">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main content */}
            <div className="lg:col-span-2">
              <RevealGroup className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                  { label: "Area", value: `${hall.area.toLocaleString()} sq ft` },
                  { label: "Ceiling", value: hall.ceilingHeight ? `${hall.ceilingHeight} ft` : "—" },
                  { label: "Theatre", value: hall.capacity.theatre.toLocaleString() },
                  { label: "Banquet", value: hall.capacity.banquet.toLocaleString() },
                ].map((stat) => (
                  <RevealItem key={stat.label}>
                    <div className="bg-[var(--bg-soft)] border border-[var(--line)] rounded-lg p-4 text-center">
                      <p className="font-display text-2xl text-[var(--ink)] font-light">{stat.value}</p>
                      <p className="meta-label mt-1">{stat.label}</p>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>

              {/* Capacity table */}
              <RevealBlock className="mb-10">
                <h2 className="font-display text-2xl text-[var(--ink)] font-light uppercase mb-5">Capacity by Layout</h2>
                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-lg overflow-hidden">
                  {Object.entries(hall.capacity).map(([layout, count]) => (
                    <div key={layout} className="flex justify-between items-center px-5 py-3 border-b border-[var(--line)] last:border-0">
                      <span className="text-[var(--ink)] capitalize text-[14px]">{layout.replace("_", " ")} style</span>
                      <span className="font-medium text-[var(--ink)]">{count.toLocaleString()} guests</span>
                    </div>
                  ))}
                </div>
              </RevealBlock>

              {/* Features */}
              <RevealBlock className="mb-10">
                <h2 className="font-display text-2xl text-[var(--ink)] font-light uppercase mb-5">Features & Facilities</h2>
                <ul className="space-y-3">
                  {hall.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-[var(--ink)] text-[15px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 flex-shrink-0" />
                      {f.en}
                    </li>
                  ))}
                </ul>
              </RevealBlock>

              {/* Gallery */}
              {hall.images.length > 1 && (
                <RevealBlock>
                  <h2 className="font-display text-2xl text-[var(--ink)] font-light uppercase mb-5">Gallery</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {hall.images.map((img, i) => (
                      <div key={i} className="aspect-[4/3] relative overflow-hidden rounded-lg">
                        <Image src={img} alt={`${hall.name.en} — view ${i + 1}`} fill className="object-cover hover:scale-105 transition-transform duration-500" sizes="300px" />
                      </div>
                    ))}
                  </div>
                </RevealBlock>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:sticky lg:top-24 lg:self-start space-y-5">
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] p-5">
                <h3 className="font-display text-xl text-[var(--ink)] font-light uppercase mb-4">Book This Hall</h3>
                <p className="text-[var(--ink-muted)] text-[14px] mb-5">
                  Check availability and get an instant budget estimate for your event.
                </p>
                <Link
                  href={`/booking?hallId=${hall.id}`}
                  locale={locale}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] text-white rounded-full py-3.5 text-[12px] font-medium tracking-[0.12em] uppercase hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Check Availability
                  <ArrowRight size={14} weight="bold" />
                </Link>
                <Link
                  href="/enquiry"
                  locale={locale}
                  className="w-full mt-3 flex items-center justify-center gap-2 border border-[var(--ink)] text-[var(--ink)] rounded-full py-3.5 text-[12px] font-medium tracking-[0.12em] uppercase hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors"
                >
                  Request a Quote
                </Link>
              </div>

              {/* Related halls */}
              <div>
                <p className="meta-label mb-3">Other Halls</p>
                <div className="space-y-2">
                  {halls.filter((h) => h.id !== hall.id).slice(0, 3).map((h) => (
                    <Link
                      key={h.id}
                      href={`/venues/${h.slug}`}
                      locale={locale}
                      className="flex items-center gap-3 text-[var(--ink)] hover:text-[var(--accent)] transition-colors group"
                    >
                      <div className="w-12 h-9 relative overflow-hidden rounded flex-shrink-0">
                        <Image src={h.image} alt={h.name.en} fill className="object-cover" sizes="48px" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium group-hover:text-[var(--accent)] transition-colors">{h.name.en}</p>
                        <p className="text-[12px] text-[var(--ink-muted)]">Up to {h.capacity.theatre.toLocaleString()}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
