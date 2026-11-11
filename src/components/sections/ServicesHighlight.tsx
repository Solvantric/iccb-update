import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { RevealBlock, RevealGroup, RevealItem } from "@/components/motion/RevealBlock";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { services } from "@/data/services";
import type { Icon } from "@phosphor-icons/react";
import {
  Buildings, ForkKnife, Sparkle, CalendarCheck, Crown, Package,
} from "@phosphor-icons/react/dist/ssr";

const iconMap: Record<string, Icon> = {
  Buildings: Buildings as Icon,
  ForkKnife: ForkKnife as Icon,
  Sparkle: Sparkle as Icon,
  CalendarCheck: CalendarCheck as Icon,
  Crown: Crown as Icon,
  Package: Package as Icon,
};

interface ServicesHighlightProps {
  locale: Locale;
}

export function ServicesHighlight({ locale }: ServicesHighlightProps) {
  return (
    <section className="py-[clamp(4rem,10vw,9rem)] bg-[var(--bg)]">
      <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
        <div className="flex justify-between items-end mb-12 md:mb-16">
          <div>
            <RevealBlock>
              <SectionLabel>(SERVICES)</SectionLabel>
            </RevealBlock>
            <RevealBlock delay={0.08}>
              <h2 className="display-lg text-[var(--ink)] mt-3">OUR SERVICES</h2>
            </RevealBlock>
          </div>
          <RevealBlock delay={0.1} className="hidden md:block">
            <p className="text-[var(--ink-muted)] text-[14px] max-w-xs text-end">
              Complete event solutions under one roof — from venue to cuisine to management.
            </p>
          </RevealBlock>
        </div>

        <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => {
            const ServiceIcon = (iconMap[service.icon] || Buildings) as Icon;
            const isCatering = service.slug === "catering";

            return (
              <RevealItem key={service.id}>
                <div className="group bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] overflow-hidden hover:shadow-lg transition-all duration-500">
                  {/* Image */}
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={service.image}
                      alt={service.name.en}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 start-3">
                      <ServiceIcon size={20} weight="light" className="text-white/80" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-display text-xl text-[var(--ink)] font-light uppercase group-hover:text-[var(--accent)] transition-colors mb-1">
                      {service.name.en}
                    </h3>
                    <p className="text-[var(--ink-muted)] text-[13px] leading-relaxed mb-4 line-clamp-2">
                      {service.tagline.en}
                    </p>
                    {isCatering ? (
                      <Link
                        href="/menu"
                        locale={locale}
                        className="flex items-center gap-2 text-[var(--accent-text)] text-[12px] font-medium tracking-[0.12em] uppercase hover:gap-3 transition-all"
                      >
                        View Menu
                        <ArrowRight size={13} />
                      </Link>
                    ) : (
                      <Link
                        href={`/services/${service.slug}`}
                        locale={locale}
                        className="flex items-center gap-2 text-[var(--ink-muted)] text-[12px] font-medium tracking-[0.12em] uppercase hover:text-[var(--accent)] hover:gap-3 transition-all"
                      >
                        Learn More
                        <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
