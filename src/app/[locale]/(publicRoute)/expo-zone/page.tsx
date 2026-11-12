import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { expoEvents, clientLogos } from "@/data/expo";
import { PartnerLogo } from "@/components/ui/PartnerLogo";
import { RevealBlock, RevealGroup, RevealItem } from "@/components/motion/RevealBlock";
import { ArrowRight, CalendarBlank, MapPin, Users } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Expo Village — ICCB",
  description: "Bangladesh's largest dedicated exhibition space. Modular booths, international buyer matchmaking, and full logistics support for trade fairs and expos.",
};

function formatExpoDate(start: string, end?: string) {
  const s = new Date(start);
  if (!end) return s.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()}–${e.getDate()} ${s.toLocaleString("en", { month: "long" })} ${s.getFullYear()}`;
  }
  return `${s.toLocaleDateString("en", opts)} – ${e.toLocaleDateString("en", opts)}`;
}

const INDUSTRIES = [
  "Construction & Real Estate",
  "Textile & Fashion",
  "Food & Agriculture",
  "Technology & IT",
  "Healthcare",
  "Energy & Infrastructure",
  "Consumer Goods",
  "Education",
];

export default async function ExpoZonePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as Locale) ? rawLocale : "en") as Locale;

  return (
    <div className="pt-[88px] sm:pt-[112px]">
      {/* Hero */}
      <section className="relative h-[55vh] min-h-[380px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=3840&q=95"
          alt="ICCB Expo Village"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        <div className="absolute inset-0 flex flex-col justify-end px-[clamp(1rem,4vw,3rem)] pb-12">
          <div className="max-w-[1440px] mx-auto w-full">
            <RevealBlock>
              <span className="text-white/60 text-[11px] tracking-[0.18em] uppercase">ICCB — EXPO VILLAGE</span>
              <h1 className="display-lg text-white mt-2">BANGLADESH'S PREMIER<br />EXHIBITION DESTINATION</h1>
              <p className="text-white/70 text-[16px] mt-4 max-w-xl">
                Modular booths, international buyer matchmaking, media support, and full logistics — all under one roof.
              </p>
            </RevealBlock>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-[var(--accent)] py-6">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {[
              { value: "80,000+", label: "sq ft exhibition area" },
              { value: "500+", label: "booths available" },
              { value: "40+", label: "expos hosted/year" },
              { value: "150+", label: "countries represented" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl font-light">{s.value}</p>
                <p className="text-white/70 text-[12px] tracking-wider uppercase mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Expos */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock className="mb-10">
            <span className="meta-label block mb-2">(UPCOMING EVENTS)</span>
            <h2 className="display-md text-[var(--ink)]">EXPO CALENDAR 2026</h2>
            <p className="text-[var(--ink-muted)] text-[16px] mt-3 max-w-xl">
              Plan your participation. All dates are sample data — confirm with ICCB for final schedule.
            </p>
          </RevealBlock>

          <RevealGroup className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {expoEvents.map((expo) => (
              <RevealItem key={expo.id}>
                <article className="group bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] overflow-hidden hover:shadow-lg transition-all duration-500">
                  {expo.image && (
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={expo.image}
                        alt={expo.name.en}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 start-4">
                        <span className="text-[10px] font-medium tracking-wider uppercase text-white/70 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full">
                          {expo.industry}
                        </span>
                      </div>
                      {expo.isSample && (
                        <div className="absolute top-3 end-3 bg-black/50 backdrop-blur-sm text-white/60 text-[10px] px-2 py-1 rounded-full tracking-wider">
                          SAMPLE DATA
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-display text-xl text-[var(--ink)] font-light uppercase mb-3 group-hover:text-[var(--accent)] transition-colors">
                      {expo.name.en}
                    </h3>
                    <div className="space-y-2 text-[13px] text-[var(--ink-muted)]">
                      <div className="flex items-center gap-2">
                        <CalendarBlank size={14} />
                        <span>{formatExpoDate(expo.date, expo.endDate ?? undefined)}</span>
                        {expo.recurrence && (
                          <span className="text-[10px] uppercase tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-full">
                            {expo.recurrence}
                          </span>
                        )}
                      </div>
                      {expo.hall && (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} />
                          <span className="capitalize">{expo.hall.replace("-", " ")} Hall</span>
                          {expo.country && <><span className="text-[var(--line)]">·</span><span>{expo.country}</span></>}
                        </div>
                      )}
                      {expo.attendees != null && (
                        <div className="flex items-center gap-2">
                          <Users size={14} />
                          <span>{expo.attendees.toLocaleString()} expected attendees</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Link
                        href="/enquiry"
                        locale={locale}
                        className="flex-1 text-center py-2.5 bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] shadow-[0_8px_22px_-10px_var(--accent-glow)] hover:-translate-y-px text-white rounded-[var(--radius-btn)] text-[11px] font-bold tracking-[0.12em] uppercase hover:brightness-110 transition-colors"
                      >
                        Exhibit Here
                      </Link>
                      <Link
                        href={`/booking`}
                        locale={locale}
                        className="flex-1 text-center py-2.5 border-2 border-[var(--accent)] text-[var(--ink)] rounded-[var(--radius-btn)] text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-[var(--accent)] hover:text-white transition-colors"
                      >
                        Check Dates
                      </Link>
                    </div>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Industries we serve */}
      <section className="py-14 bg-[var(--bg-soft)] border-y border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock className="mb-10 text-center">
            <span className="meta-label block mb-2">(INDUSTRIES)</span>
            <h2 className="display-md text-[var(--ink)]">SECTORS WE SERVE</h2>
          </RevealBlock>
          <RevealGroup className="flex flex-wrap justify-center gap-3">
            {INDUSTRIES.map((ind) => (
              <RevealItem key={ind}>
                <span className="inline-block px-5 py-2.5 border border-[var(--line)] rounded-full text-[13px] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-default">
                  {ind}
                </span>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Partner logos — real organisations, animated marquee */}
      <section className="py-16 md:py-20 overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)] mb-10">
          <RevealBlock className="text-center">
            <span className="meta-label block mb-2">(GLOBAL PARTNERS)</span>
            <h2 className="display-md text-[var(--ink)]">TRUSTED BY WORLD-CLASS ORGANISATIONS</h2>
            <p className="text-[var(--ink-muted)] text-[14px] mt-2 max-w-lg mx-auto">
              ICCB hosts events for leading international organisations, embassies, trade bodies, and development banks.
            </p>
          </RevealBlock>
        </div>
        {/* Marquee row 1 */}
        <div className="relative overflow-hidden mb-3">
          <div className="logo-marquee flex gap-3" style={{ animationDuration: "30s", width: "max-content" }}>
            {[...clientLogos, ...clientLogos].map((logo, i) => (
              <PartnerLogo key={`r1-${logo.id}-${i}`} logo={logo} />
            ))}
          </div>
          <div className="absolute inset-y-0 start-0 w-24 bg-gradient-to-r from-[var(--bg)] to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 end-0 w-24 bg-gradient-to-l from-[var(--bg)] to-transparent pointer-events-none z-10" />
        </div>
        {/* Marquee row 2 — reverse */}
        <div className="relative overflow-hidden">
          <div className="logo-marquee-reverse flex gap-3" style={{ animationDuration: "24s", width: "max-content" }}>
            {[...clientLogos.slice(6), ...clientLogos, ...clientLogos.slice(0, 6)].map((logo, i) => (
              <PartnerLogo key={`r2-${logo.id}-${i}`} logo={logo} />
            ))}
          </div>
          <div className="absolute inset-y-0 start-0 w-24 bg-gradient-to-r from-[var(--bg)] to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 end-0 w-24 bg-gradient-to-l from-[var(--bg)] to-transparent pointer-events-none z-10" />
        </div>
      </section>

      {/* Services for exhibitors */}
      <section className="py-14 bg-[var(--bg-soft)] border-y border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock className="mb-10">
            <span className="meta-label block mb-2">(EXHIBITOR SERVICES)</span>
            <h2 className="display-md text-[var(--ink)]">EVERYTHING YOU NEED</h2>
          </RevealBlock>
          <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Booth Design & Build", desc: "Modular and custom booth configurations. Shell scheme, raw space, double-decker options." },
              { title: "Freight & Logistics", desc: "On-site freight handling, customs clearance support, and warehousing for exhibitors." },
              { title: "AV & Technical", desc: "LED walls, PA systems, lighting rigs, and dedicated AV engineers for your booth." },
              { title: "Buyer Matchmaking", desc: "Pre-scheduled B2B meetings with vetted domestic and international buyers." },
              { title: "Media & PR", desc: "Press releases, media partnerships, and coverage coordination for high-impact launches." },
              { title: "Catering & Hospitality", desc: "Booth hospitality packages, hostess staff, and F&B setups for client entertainment." },
            ].map((s) => (
              <RevealItem key={s.title}>
                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] p-5 hover:border-[var(--accent)] transition-colors">
                  <h3 className="font-display text-lg text-[var(--ink)] font-normal uppercase mb-2">{s.title}</h3>
                  <p className="text-[var(--ink-muted)] text-[14px] leading-relaxed">{s.desc}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 text-center">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock>
            <h2 className="display-md text-[var(--ink)] mb-4">PLAN YOUR NEXT EXPO AT ICCB</h2>
            <p className="text-[var(--ink-muted)] text-[16px] max-w-lg mx-auto mb-8">
              Contact our expo team to discuss dates, booth layout, and sponsorship packages.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/enquiry"
                locale={locale}
                className="inline-flex items-center gap-2 bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] shadow-[0_8px_22px_-10px_var(--accent-glow)] hover:-translate-y-px text-white rounded-[var(--radius-btn)] px-8 py-4 text-[12px] font-bold tracking-[0.12em] uppercase hover:brightness-110 transition-colors"
              >
                Send Expo Enquiry
                <ArrowRight size={14} weight="bold" />
              </Link>
              <Link
                href="/contact"
                locale={locale}
                className="inline-flex items-center gap-2 border-2 border-[var(--accent)] text-[var(--ink)] rounded-[var(--radius-btn)] px-8 py-4 text-[12px] font-bold tracking-[0.12em] uppercase hover:bg-[var(--accent)] hover:text-white transition-colors"
              >
                Contact Expo Team
              </Link>
            </div>
          </RevealBlock>
        </div>
      </section>
    </div>
  );
}
