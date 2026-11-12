"use client";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { ArrowRight, ForkKnife, Crown, Sparkle, Briefcase } from "@phosphor-icons/react";
import { ventures } from "@/data/ventures";

const N = ventures.length;

const TYPE_ICON = {
  catering: ForkKnife,
  restaurant: Crown,
  icecream: Sparkle,
  other: Briefcase,
} as const;

// ── Venture card (shared by desktop + mobile) ─────────────────────────────────
function VentureCard({
  venture,
  index,
  locale,
  className = "",
  hidden = false,
}: {
  venture: (typeof ventures)[number];
  index: number;
  locale: Locale;
  className?: string;
  hidden?: boolean;
}) {
  const TypeIcon = TYPE_ICON[venture.type as keyof typeof TYPE_ICON] ?? Briefcase;

  return (
    <article
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      className={`group/card relative overflow-hidden rounded-2xl flex-shrink-0 ${className}`}
    >
      <Image
        src={venture.heroImage}
        alt={venture.name}
        fill
        sizes="(min-width: 768px) 45vw, 85vw"
        className="object-cover transition-transform duration-700 group-hover/card:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 p-6 md:p-8">
        <div className="flex items-center gap-2 mb-3">
          <TypeIcon size={14} weight="duotone" className="text-[var(--accent)]" />
          <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/60">
            ICCB VENTURES · 0{index + 1} / 0{N}
          </span>
        </div>
        <h3
          className="text-white font-bold leading-tight mb-2"
          style={{ fontSize: "clamp(1.5rem, 2.6vw, 2.5rem)" }}
        >
          {venture.name}
        </h3>
        <p className="text-white/70 text-[14px] md:text-[15px] mb-4 leading-relaxed max-w-md">
          {venture.tagline}
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {venture.highlights.slice(0, 3).map((h) => (
            <span
              key={h.title}
              className="text-[11px] font-semibold tracking-wide text-white/80 bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-1 rounded-full"
            >
              {h.title}
            </span>
          ))}
          {venture.isSample && (
            <span className="text-[11px] font-semibold text-[var(--accent)] bg-[var(--accent)]/15 border border-[var(--accent)]/30 px-3 py-1 rounded-full">
              Coming Soon
            </span>
          )}
        </div>
        {!venture.isSample && (
          <Link
            href={`/ventures/${venture.slug}`}
            locale={locale}
            className="inline-flex items-center gap-2 text-[13px] font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent)]/90 px-5 py-2.5 rounded-lg transition-colors"
          >
            Explore <ArrowRight size={13} weight="bold" className="rtl:-scale-x-100" />
          </Link>
        )}
      </div>
    </article>
  );
}

function SectionHeading() {
  return (
    <div>
      <span className="text-eyebrow">ICCB Ventures</span>
      <h2 className="text-h2 mt-2">
        One Destination, <span className="text-[var(--accent)]">Endless Experiences</span>
      </h2>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
interface VenturesSectionProps {
  locale: Locale;
}

export function VenturesSection({ locale }: VenturesSectionProps) {
  // Two identical halves → translateX(-50%) loops seamlessly.
  // Each half repeats the list so it is always wider than the viewport.
  const half = [...ventures, ...ventures];
  const loop = [...half, ...half];

  return (
    <section className="bg-[var(--bg-soft)] section-y overflow-hidden">
      <div className="container-site mb-10">
        <SectionHeading />
      </div>

      <div
        className="group relative overflow-hidden motion-reduce:overflow-x-auto"
        style={{
          maskImage: "linear-gradient(to right, transparent, #000 4%, #000 96%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, #000 4%, #000 96%, transparent)",
        }}
      >
        <div
          className="marquee-track flex w-max gap-6 group-hover:[animation-play-state:paused]"
          style={{ animationDuration: "60s" }}
        >
          {loop.map((v, i) => (
            <VentureCard
              key={`${v.id}-${i}`}
              venture={v}
              index={i % N}
              locale={locale}
              hidden={i >= N}
              className="w-[80vw] sm:w-[420px] md:w-[460px] h-[480px] md:h-[540px]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
