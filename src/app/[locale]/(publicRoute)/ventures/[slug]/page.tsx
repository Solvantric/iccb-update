import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { ventures, getVentureBySlug } from "@/data/ventures";
import { FadeUp, LineGrow, SlideIn } from "@/components/motion/primitives";
import {
  ArrowRight, ArrowLeft, Clock, Phone, MapPin,
  CheckCircle, Crown, ForkKnife, Sparkle, Briefcase,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

export async function generateStaticParams() {
  return ventures.flatMap((v) =>
    routing.locales.map((locale) => ({ locale, slug: v.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const venture = getVentureBySlug(slug);
  if (!venture) return {};
  return {
    title: `${venture.name} — ICCB Ventures`,
    description: venture.description,
    openGraph: {
      images: [{ url: venture.heroImage, width: 3840, height: 2160 }],
    },
  };
}

const TYPE_ICON: Record<string, Icon> = {
  catering: ForkKnife,
  restaurant: Crown,
  icecream: Sparkle,
  other: Briefcase,
};

const TYPE_LABEL: Record<string, string> = {
  catering: "Catering",
  restaurant: "Restaurant",
  icecream: "Ice Cream",
  other: "Venture",
};

export default async function VentureDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale: rawLocale } = await params;
  const locale = (
    routing.locales.includes(rawLocale as Locale) ? rawLocale : "en"
  ) as Locale;
  const venture = getVentureBySlug(slug);
  if (!venture) notFound();

  const TypeIcon = TYPE_ICON[venture.type] || Briefcase;
  const others = ventures.filter((v) => v.slug !== slug).slice(0, 3);

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden">
        <Image
          src={venture.heroImage}
          alt={venture.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative container-site pb-14 pt-40">
          <FadeUp>
            <Link
              href="/ventures"
              locale={locale}
              className="inline-flex items-center gap-2 text-white/70 hover:text-white text-[13px] mb-6 transition-colors"
            >
              <ArrowLeft size={14} />
              All Ventures
            </Link>
          </FadeUp>
          <FadeUp delay={0.06}>
            <div className="flex items-center gap-2 mb-3">
              <TypeIcon size={16} weight="duotone" className="text-[var(--accent)]" />
              <span className="text-[var(--accent)] text-[13px] font-semibold uppercase tracking-wider">
                {TYPE_LABEL[venture.type]}
                {venture.isSample && " · Coming Soon"}
              </span>
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className="text-h2 text-white leading-tight mb-3">{venture.name}</h1>
          </FadeUp>
          <FadeUp delay={0.14}>
            <p className="text-white/80 text-[16px] max-w-xl leading-relaxed">{venture.tagline}</p>
          </FadeUp>
        </div>
      </section>

      {/* ── Stats band ───────────────────────────────────── */}
      <section className="bg-[var(--accent)] text-white py-8">
        <div className="container-site grid grid-cols-2 md:grid-cols-4 gap-6">
          {venture.stats.map((s, i) => (
            <FadeUp key={s.label} delay={i * 0.06}>
              <div className="text-center">
                <div className="font-bold text-[clamp(1.5rem,3vw,2.25rem)] leading-none mb-1">
                  {s.value}
                </div>
                <div className="text-white/80 text-[12px] uppercase tracking-wide">{s.label}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── About + details ──────────────────────────────── */}
      <section className="section-y bg-[var(--bg)]">
        <div className="container-site grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <SlideIn from="left">
            <span className="text-eyebrow block mb-3">About</span>
            <h2 className="text-h2 mb-4">
              About <span className="text-[var(--accent)]">{venture.name}</span>
            </h2>
            <LineGrow delay={0.1} />
            <p className="text-[var(--ink-body)] text-[15px] leading-relaxed mt-6 mb-8">
              {venture.description}
            </p>

            {/* Meta info */}
            <div className="space-y-3">
              {venture.hours && (
                <div className="flex items-start gap-3 text-[14px]">
                  <Clock size={16} className="text-[var(--accent)] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-[var(--ink)]">Hours: </span>
                    <span className="text-[var(--ink-muted)]">{venture.hours}</span>
                  </div>
                </div>
              )}
              {venture.phone && (
                <div className="flex items-start gap-3 text-[14px]">
                  <Phone size={16} className="text-[var(--accent)] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-[var(--ink)]">Phone: </span>
                    <a
                      href={`tel:${venture.phone}`}
                      className="text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors"
                    >
                      {venture.phone}
                    </a>
                  </div>
                </div>
              )}
              {venture.location && (
                <div className="flex items-start gap-3 text-[14px]">
                  <MapPin size={16} className="text-[var(--accent)] mt-0.5 flex-shrink-0" />
                  <span className="text-[var(--ink-muted)]">{venture.location}</span>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                locale={locale}
                className="btn btn-primary"
              >
                Make an Enquiry <ArrowRight size={14} weight="bold" />
              </Link>
              <Link
                href="/booking"
                locale={locale}
                className="btn btn-secondary"
              >
                Book Now
              </Link>
            </div>
          </SlideIn>

          {/* Highlights */}
          <SlideIn from="right" delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {venture.highlights.map((h, i) => (
                <FadeUp key={h.title} delay={i * 0.07}>
                  <div className="card p-5 h-full">
                    <CheckCircle
                      size={22}
                      weight="duotone"
                      className="text-[var(--accent)] mb-3"
                    />
                    <h3 className="font-bold text-[var(--ink)] text-[15px] mb-1.5">
                      {h.title}
                    </h3>
                    <p className="text-[var(--ink-muted)] text-[13px] leading-relaxed">
                      {h.body}
                    </p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </SlideIn>
        </div>
      </section>

      {/* ── Photo strip ──────────────────────────────────── */}
      <section className="bg-[var(--bg-soft)] py-12 overflow-hidden">
        <div className="container-site">
          <FadeUp>
            <span className="text-eyebrow block mb-6">Gallery</span>
          </FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[venture.heroImage, venture.image, venture.heroImage].map((src, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]">
                  <Image
                    src={src}
                    alt={`${venture.name} photo ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover hover:scale-[1.05] transition-transform duration-700"
                  />
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Other ventures ───────────────────────────────── */}
      <section className="section-y bg-[var(--bg)]">
        <div className="container-site">
          <FadeUp>
            <h2 className="text-h2 mb-2">
              Explore More <span className="text-[var(--accent)]">Ventures</span>
            </h2>
            <LineGrow delay={0.1} />
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {others.map((v, i) => (
              <FadeUp key={v.id} delay={i * 0.08}>
                <Link
                  href={`/ventures/${v.slug}`}
                  locale={locale}
                  className="group card card-hover overflow-hidden block"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={v.image}
                      alt={v.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                    />
                  </div>
                  <div className="p-5">
                    <span className="text-eyebrow block mb-1.5">
                      {TYPE_LABEL[v.type]}
                    </span>
                    <h3 className="font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors text-[15px] mb-1">
                      {v.name}
                    </h3>
                    <p className="text-[var(--ink-muted)] text-[13px] line-clamp-2">
                      {v.tagline}
                    </p>
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
