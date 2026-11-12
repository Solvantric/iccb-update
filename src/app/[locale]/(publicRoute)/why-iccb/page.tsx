import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { RevealBlock, RevealGroup, RevealItem } from "@/components/motion/RevealBlock";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Why ICCB — International Convention City Bashundhara",
  description: "Discover why ICCB is South Asia's premier event destination — world-class facilities, 10,000+ capacity, 2,000+ parking, and a dedicated event team.",
};

const REASONS = [
  {
    no: "01",
    title: "South Asia's Largest Hall",
    desc: "Gulnaksha Hall alone seats 2,500 theatre-style. Across all six halls, ICCB can host over 10,000 guests simultaneously — an unmatched scale in Bangladesh.",
  },
  {
    no: "02",
    title: "One-Stop Event Ecosystem",
    desc: "Venue rental, catering, decoration, AV production, event management, and accommodation referrals — everything coordinated by a single dedicated team.",
  },
  {
    no: "03",
    title: "Strategic Location",
    desc: "Situated on the 300 ft. Purbachal Express Highway with 2,000+ parking spaces, 25 km from Hazrat Shahjalal International Airport.",
  },
  {
    no: "04",
    title: "International-Grade Infrastructure",
    desc: "Fiber optics, 4K projection, LED walls, simultaneous interpretation booths, dedicated power backup, and broadband Wi-Fi across all halls.",
  },
  {
    no: "05",
    title: "Expo Village",
    desc: "80,000+ sq ft of dedicated exhibition space with modular booth systems, international buyer matchmaking, and freight logistics support.",
  },
  {
    no: "06",
    title: "Multilingual Team",
    desc: "Staff fluent in Bengali, English, Arabic, and Mandarin — ready to support international delegations and bilateral trade events.",
  },
];

const STATS = [
  { value: "10,000+", label: "Guest capacity" },
  { value: "6", label: "Convention halls" },
  { value: "2,000+", label: "Parking spaces" },
  { value: "80,000+", label: "Expo sq ft" },
  { value: "150+", label: "Countries hosted" },
  { value: "2015", label: "Established" },
];

export default async function WhyICCBPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as Locale) ? rawLocale : "en") as Locale;

  return (
    <div className="pt-[88px] sm:pt-[112px]">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[320px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1555244162-803834f70033?w=3840&q=95"
          alt="Why ICCB"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40" />
        <div className="absolute bottom-0 inset-x-0 px-[clamp(1rem,4vw,3rem)] pb-10">
          <div className="max-w-[1440px] mx-auto">
            <span className="text-white/60 text-[11px] tracking-[0.18em] uppercase">WHY CHOOSE ICCB</span>
            <h1 className="display-lg text-white mt-2">THE STANDARD FOR<br />WORLD-CLASS EVENTS</h1>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[var(--accent)] py-8">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6 text-center text-white">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl font-light">{s.value}</p>
                <p className="text-white/70 text-[11px] tracking-wider uppercase mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reasons */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock className="mb-12">
            <span className="meta-label block mb-2">(ADVANTAGES)</span>
            <h2 className="display-md text-[var(--ink)]">6 REASONS TO CHOOSE ICCB</h2>
          </RevealBlock>
          <RevealGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {REASONS.map((r) => (
              <RevealItem key={r.no}>
                <div className="group bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] p-6 hover:shadow-lg transition-shadow">
                  <span className="font-display text-5xl text-[var(--accent)]/15 font-light block mb-4">{r.no}</span>
                  <h3 className="font-display text-xl text-[var(--ink)] font-light uppercase mb-3 group-hover:text-[var(--accent)] transition-colors">
                    {r.title}
                  </h3>
                  <p className="text-[var(--ink-muted)] text-[14px] leading-relaxed">{r.desc}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Checklist */}
      <section className="py-14 bg-[var(--bg-soft)] border-y border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <RevealBlock>
              <h2 className="display-md text-[var(--ink)] mb-8">INCLUDED IN EVERY BOOKING</h2>
              <ul className="space-y-3">
                {[
                  "Dedicated event coordinator from enquiry to post-event",
                  "24/7 security throughout your event",
                  "Uninterrupted power with generator backup",
                  "High-speed Wi-Fi across all halls",
                  "2,000+ parking spaces included",
                  "On-site technical support team",
                  "Multilingual staff available",
                  "Post-event cleaning and clearing",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle size={18} className="text-[var(--accent)] flex-shrink-0 mt-0.5" weight="light" />
                    <span className="text-[var(--ink)] text-[15px]">{item}</span>
                  </li>
                ))}
              </ul>
            </RevealBlock>
            <RevealBlock>
              <div className="bg-[var(--bg-deep)] rounded-[var(--radius-card)] p-8 h-full flex flex-col justify-center">
                <span className="text-white/50 text-[11px] tracking-[0.18em] uppercase block mb-4">Start Planning</span>
                <h3 className="font-display text-3xl text-white font-light uppercase mb-4">
                  Ready to Host Your Event?
                </h3>
                <p className="text-white/60 text-[15px] leading-relaxed mb-6">
                  Check availability, get an instant budget estimate, and reserve your date — all in minutes.
                </p>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/booking"
                    locale={locale}
                    className="flex items-center justify-center gap-2 bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] shadow-[0_8px_22px_-10px_var(--accent-glow)] hover:-translate-y-px text-white rounded-[var(--radius-btn)] py-4 text-[12px] font-bold tracking-[0.12em] uppercase hover:brightness-110 transition-colors"
                  >
                    Check Availability
                    <ArrowRight size={14} weight="bold" />
                  </Link>
                  <Link
                    href="/enquiry"
                    locale={locale}
                    className="flex items-center justify-center gap-2 border border-white/20 text-white/80 rounded-full py-4 text-[12px] font-medium tracking-[0.12em] uppercase hover:border-white/50 transition-colors"
                  >
                    Request a Quote
                  </Link>
                </div>
              </div>
            </RevealBlock>
          </div>
        </div>
      </section>
    </div>
  );
}
