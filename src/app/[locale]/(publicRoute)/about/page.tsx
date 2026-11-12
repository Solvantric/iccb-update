import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { RevealBlock, RevealGroup, RevealItem } from "@/components/motion/RevealBlock";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "About ICCB — International Convention City Bashundhara",
  description: "Learn about ICCB — Bangladesh's largest convention centre, located on the Purbachal Express Highway, Dhaka. Established to bring world-class event infrastructure to South Asia.",
};

const MILESTONES = [
  { year: "2010", event: "ICCB inaugurated — South Asia's largest convention complex opens" },
  { year: "2013", event: "Expo Village Phase 1 completed — 500+ modular booths" },
  { year: "2015", event: "Rajdarshan and Noboratri halls added, expanding capacity to 10,000+" },
  { year: "2018", event: "Smart AV infrastructure upgrade — fiber, 4K projection, LED walls" },
  { year: "2021", event: "Heritage Restaurant opens — Mughal-themed fine dining within the complex" },
  { year: "2023", event: "International Buyer Matchmaking Program launched for Expo Village" },
  { year: "2025", event: "Digital booking platform launch — real-time availability, instant estimates" },
];

const LEADERSHIP = [
  { name: "Sample Executive", title: "Chief Executive Officer", note: "Replace with actual profile" },
  { name: "Sample Director", title: "Director of Operations", note: "Replace with actual profile" },
  { name: "Sample Manager", title: "Head of Sales & Marketing", note: "Replace with actual profile" },
];

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as Locale) ? rawLocale : "en") as Locale;

  return (
    <div className="pt-[88px] sm:pt-[112px]">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[320px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=3840&q=95"
          alt="ICCB Convention Centre"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40" />
        <div className="absolute bottom-0 inset-x-0 px-[clamp(1rem,4vw,3rem)] pb-10">
          <div className="max-w-[1440px] mx-auto">
            <span className="text-white/60 text-[11px] tracking-[0.18em] uppercase">ABOUT ICCB</span>
            <h1 className="display-lg text-white mt-2">INTERNATIONAL CONVENTION<br />CITY BASHUNDHARA</h1>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <RevealBlock>
              <span className="meta-label block mb-3">(OUR STORY)</span>
              <h2 className="display-md text-[var(--ink)] mb-6">
                SOUTH ASIA'S PREMIER<br />EVENT DESTINATION
              </h2>
              <p className="text-[var(--ink-muted)] text-[16px] leading-relaxed mb-5">
                International Convention City Bashundhara (ICCB) is Bangladesh's largest and most sophisticated convention complex, located on the 300 ft. Purbachal Express Highway in Dhaka. Since its inauguration, ICCB has been the preferred venue for state-level conferences, international trade fairs, mega weddings, and world-class expos.
              </p>
              <p className="text-[var(--ink-muted)] text-[16px] leading-relaxed">
                With six convention halls totaling over 10,000 guest capacity, an 80,000 sq ft Expo Village, and a heritage restaurant, ICCB offers an unmatched ecosystem for every event at any scale.
              </p>
            </RevealBlock>
            <RevealBlock>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "6", label: "Convention halls" },
                  { value: "10,000+", label: "Guest capacity" },
                  { value: "80,000+", label: "sq ft expo space" },
                  { value: "2,000+", label: "Parking spaces" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-[var(--bg-soft)] border border-[var(--line)] rounded-[var(--radius-card)] p-6 text-center">
                    <p className="font-display text-4xl text-[var(--accent)] font-light">{stat.value}</p>
                    <p className="text-[var(--ink-muted)] text-[13px] uppercase tracking-wider mt-2">{stat.label}</p>
                  </div>
                ))}
              </div>
            </RevealBlock>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-14 bg-[var(--bg-deep)] border-y border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealGroup className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <RevealItem>
              <div className="bg-white/5 border border-white/10 rounded-[var(--radius-card)] p-8">
                <span className="text-white/40 text-[11px] tracking-[0.18em] uppercase">Our Mission</span>
                <h3 className="font-display text-2xl text-white font-light uppercase mt-3 mb-4">
                  To be the catalyst for Bangladesh's global connectivity
                </h3>
                <p className="text-white/60 text-[15px] leading-relaxed">
                  By providing world-class infrastructure, seamless event services, and a commitment to excellence, we empower organizers to bring global events to Bangladesh — and Bangladesh to the world.
                </p>
              </div>
            </RevealItem>
            <RevealItem>
              <div className="bg-white/5 border border-white/10 rounded-[var(--radius-card)] p-8">
                <span className="text-white/40 text-[11px] tracking-[0.18em] uppercase">Our Vision</span>
                <h3 className="font-display text-2xl text-white font-light uppercase mt-3 mb-4">
                  South Asia's #1 international convention destination
                </h3>
                <p className="text-white/60 text-[15px] leading-relaxed">
                  We envision ICCB as a recognized global landmark — where the most important conferences, trade fairs, and cultural events choose Dhaka as their home.
                </p>
              </div>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock className="mb-10">
            <span className="meta-label block mb-2">(MILESTONES)</span>
            <h2 className="display-md text-[var(--ink)]">OUR JOURNEY</h2>
            <p className="text-[11px] text-[var(--ink-muted)] mt-2">Sample milestones — replace with actual history</p>
          </RevealBlock>

          <div className="relative">
            <div className="absolute start-[7px] top-0 bottom-0 w-px bg-[var(--line)] hidden md:block" />
            <div className="space-y-6">
              {MILESTONES.map((m, i) => (
                <RevealBlock key={m.year} delay={i * 0.05}>
                  <div className="flex gap-6 items-start">
                    <div className="flex-shrink-0 w-16 text-end">
                      <span className="font-display text-[var(--accent)] font-light text-lg">{m.year}</span>
                    </div>
                    <div className="hidden md:flex flex-shrink-0 w-4 h-4 rounded-full border-2 border-[var(--accent)] bg-[var(--bg)] mt-1" />
                    <p className="text-[var(--ink)] text-[15px] flex-1 pt-0.5">{m.event}</p>
                  </div>
                </RevealBlock>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-14 bg-[var(--bg-soft)] border-y border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock className="mb-10">
            <span className="meta-label block mb-2">(LEADERSHIP)</span>
            <h2 className="display-md text-[var(--ink)]">OUR TEAM</h2>
            <p className="text-[11px] text-[var(--ink-muted)] mt-2">Sample profiles — replace with actual leadership</p>
          </RevealBlock>
          <RevealGroup className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {LEADERSHIP.map((leader) => (
              <RevealItem key={leader.name}>
                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-[var(--bg-soft)] border border-[var(--line)] mx-auto mb-4 flex items-center justify-center">
                    <span className="font-display text-2xl text-[var(--ink-muted)] font-light">
                      {leader.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-display text-lg text-[var(--ink)] font-light uppercase">{leader.name}</h3>
                  <p className="text-[var(--accent)] text-[12px] tracking-wider uppercase mt-1">{leader.title}</p>
                  <p className="text-[var(--ink-muted)] text-[11px] mt-2">{leader.note}</p>
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
            <h2 className="display-md text-[var(--ink)] mb-6">PLAN YOUR EVENT WITH US</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/venues"
                locale={locale}
                className="inline-flex items-center gap-2 bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] shadow-[0_8px_22px_-10px_var(--accent-glow)] hover:-translate-y-px text-white rounded-[var(--radius-btn)] px-8 py-4 text-[12px] font-bold tracking-[0.12em] uppercase hover:brightness-110 transition-colors"
              >
                Explore Halls
                <ArrowRight size={14} weight="bold" />
              </Link>
              <Link
                href="/contact"
                locale={locale}
                className="inline-flex items-center gap-2 border-2 border-[var(--accent)] text-[var(--ink)] rounded-[var(--radius-btn)] px-8 py-4 text-[12px] font-bold tracking-[0.12em] uppercase hover:bg-[var(--accent)] hover:text-white transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </RevealBlock>
        </div>
      </section>
    </div>
  );
}
