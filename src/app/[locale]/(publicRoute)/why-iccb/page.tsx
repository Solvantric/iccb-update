import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { RevealBlock } from "@/components/motion/RevealBlock";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { CertificationsSection } from "@/components/sections/CertificationsSection";
import { HeroSlides } from "@/components/about/AboutHero";
import { CountUpStats } from "@/components/why/CountUpStats";
import { ReasonsStack, type Reason } from "@/components/why/ReasonsStack";
import { IncludedShowcase } from "@/components/why/IncludedShowcase";

export const metadata: Metadata = {
  title: "Why ICCB — International Convention City Bashundhara",
  description:
    "Why ICCB is South Asia's premier event destination — 8.5 lac sq. ft., 20,000+ guest capacity, 3,500+ parking, six halls, Expo Village and a dedicated event team.",
};

const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=90&w=2400`;
const ICCB = (p: string) => `https://www.iccbbg.com/assets/images/${p}`;

/* Capacity & parking figures follow iccbbg.com (20,000+ guests, 3,500+ cars). */
const REASONS: Reason[] = [
  {
    no: "01",
    title: "South Asia's Largest Hall",
    desc: "Gulnaksha Hall alone seats 2,500 theatre-style. Across all six halls, ICCB can host more than 20,000 guests at a time — an unmatched scale in Bangladesh.",
    highlight: ["2,500 theatre-style", "six halls", "20,000 guests", "unmatched scale"],
    image: u("1742724769470-4f921b700c71"),
    points: [
      { label: "6 halls", image: ICCB("pages/hall/h1.jpg") },
      { label: "20,000+ guests", image: ICCB("pages/overview.jpg") },
      { label: "Pillar-free", image: u("1519167758481-83f550bb49b3") },
      { label: "Any layout", image: u("1540575467063-178a50c2df87") },
    ],
  },
  {
    no: "02",
    title: "One-Stop Event Ecosystem",
    desc: "Venue rental, catering, decoration, AV production, event management and accommodation referrals — everything coordinated by a single dedicated team.",
    highlight: ["catering", "decoration", "AV production", "single dedicated team"],
    image: u("1511795409834-ef04bbd61622"),
    points: [
      { label: "Catering", image: u("1555244162-803834f70033") },
      { label: "Decoration", image: u("1780542900375-0cf459e38fbb") },
      { label: "AV production", image: u("1505373877841-8d25f7d46678") },
      { label: "Event team", image: u("1551836022-d5d88e9218df") },
    ],
  },
  {
    no: "03",
    title: "Strategic Location",
    desc: "Situated next to the 300 ft. Purbachal Express Highway with parking for 3,500+ cars, 25 km from Hazrat Shahjalal International Airport.",
    highlight: ["300 ft. Purbachal Express Highway", "3,500+ cars", "25 km"],
    image: ICCB("pages/hall/h4.jpg"),
    points: [
      { label: "Highway access", image: ICCB("pages/hall/h4.jpg") },
      { label: "3,500+ parking", image: ICCB("grand-space/carparking-1.jpg") },
      { label: "Guest transport", image: ICCB("grand-space/guest-transportation.jpg") },
      { label: "25 km to airport", image: u("1436491865332-7a61a109cc05") },
    ],
  },
  {
    no: "04",
    title: "International-Grade Infrastructure",
    desc: "Fiber optics, 4K projection, LED walls, simultaneous interpretation booths, dedicated power backup and broadband Wi-Fi across all halls.",
    highlight: ["4K projection", "LED walls", "power backup", "Wi-Fi"],
    image: u("1505373877841-8d25f7d46678"),
    points: [
      { label: "LED walls", image: u("1505373877841-8d25f7d46678") },
      { label: "Projection", image: u("1556761175-5973dc0f32e7") },
      { label: "Wi-Fi", image: ICCB("grand-space/wifi-1.jpg") },
      { label: "CCTV", image: ICCB("grand-space/cctv.jpg") },
    ],
  },
  {
    no: "05",
    title: "Expo Village",
    desc: "80,000+ sq ft of dedicated exhibition space with modular booth systems, international buyer matchmaking and freight logistics support.",
    highlight: ["80,000+ sq ft", "modular booth systems", "buyer matchmaking"],
    image: u("1587825140708-dfaf72ae4b04"),
    points: [
      { label: "80,000+ sq ft", image: u("1587825140708-dfaf72ae4b04") },
      { label: "500+ booths", image: u("1778402566957-c21d77a67d0d") },
      { label: "Trade fairs", image: u("1531058020387-3be344556be6") },
      { label: "Launches", image: u("1492684223066-81342ee5ff30") },
    ],
  },
  {
    no: "06",
    title: "Multilingual Team",
    desc: "Staff fluent in Bengali, English, Arabic and Mandarin — ready to support international delegations and bilateral trade events.",
    highlight: ["Bengali, English, Arabic and Mandarin", "international delegations"],
    image: u("1627599936744-51d288f89af4"),
    points: [
      { label: "Hosts", image: ICCB("grand-space/trained-1.jpg") },
      { label: "Management", image: ICCB("grand-space/trained-3.jpg") },
      { label: "Delegations", image: u("1551836022-d5d88e9218df") },
      { label: "Service crew", image: ICCB("grand-space/service-1.jpg") },
    ],
  },
];

const HERO_SLIDES = [
  {
    lines: ["The Standard for"],
    highlight: "World-Class Events",
    text: "The largest event venue in South Asia — six halls, Expo Village, world-class catering and a team that makes every occasion memorable.",
    image: u("1742724769470-4f921b700c71").replace("w=2400", "w=3840"),
  },
  {
    lines: ["Room for"],
    highlight: "20,000+ Guests",
    text: "8.5 lac sq. ft. of space, pillar-free halls and parking for more than 3,500 cars at a time.",
    image: u("1540575467063-178a50c2df87").replace("w=2400", "w=3840"),
  },
  {
    lines: ["Everything Under"],
    highlight: "One Roof",
    text: "Venue, catering, decoration, AV and event management — coordinated by one dedicated team.",
    image: u("1780542900375-0cf459e38fbb").replace("w=2400", "w=3840"),
  },
  {
    lines: ["Home of the Country's"],
    highlight: "Biggest Expos",
    text: "ICCB Expo Village — 80,000+ sq ft of exhibition space for trade fairs and product launches.",
    image: u("1587825140708-dfaf72ae4b04").replace("w=2400", "w=3840"),
  },
];

const STATS = [
  { value: 20000, suffix: "+", label: "Guest capacity" },
  { value: 6, label: "Event halls" },
  { value: 3500, suffix: "+", label: "Parking spaces" },
  { value: 80000, suffix: "+", label: "Expo sq ft" },
  { value: 8, suffix: ".5 Lac", label: "Sq ft venue", plain: true },
  { value: 2015, label: "Established", plain: true },
];

const INCLUDED = [
  { title: "Dedicated event coordinator", note: "One point of contact from your first enquiry to the last guest leaving.", image: u("1551836022-d5d88e9218df") },
  { title: "24/7 security & CCTV", note: "Highly trained security personnel and end-to-end CCTV vigilance.", image: ICCB("grand-space/security-1.jpg") },
  { title: "Uninterrupted power backup", note: "Dedicated generators keep lights, sound and AC running without a flicker.", image: u("1540575467063-178a50c2df87") },
  { title: "High-speed Wi-Fi", note: "Broadband Wi-Fi across all halls for guests, speakers and live streams.", image: ICCB("grand-space/wifi-1.jpg") },
  { title: "3,500+ car parking", note: "A spacious, managed car park with trained staff guiding every arrival.", image: ICCB("grand-space/carparking-1.jpg") },
  { title: "On-site technical support", note: "AV and technical crew on hand for presentations, sound and lighting.", image: u("1556761175-5973dc0f32e7") },
  { title: "Fire safety team on standby", note: "A well-equipped in-house fire service team at every event.", image: ICCB("grand-space/security-2.jpg") },
  { title: "Post-event cleaning", note: "We clear and clean up afterwards, so you can simply enjoy the night.", image: ICCB("grand-space/service-1.jpg") },
];

export default async function WhyICCBPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as Locale) ? rawLocale : "en") as Locale;

  return (
    <div className="pt-[88px] sm:pt-[112px]">
      {/* 1 — Hero */}
      <HeroSlides eyebrow="Why Choose ICCB" slides={HERO_SLIDES} />

      {/* 2 — Stats (count up) */}
      <CountUpStats items={STATS} />

      {/* 3 — Six reasons, one at a time */}
      <section className="section-y bg-[var(--bg-soft)]">
        <div className="container-site">
          <div className="mx-auto max-w-2xl text-center">
            <RevealBlock><SectionLabel>Advantages</SectionLabel></RevealBlock>
            <RevealBlock delay={0.1}>
              <h2 className="mt-4 font-display uppercase text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] text-[var(--ink)]">
                Reasons to <span className="text-[var(--accent)]">Choose ICCB</span>
              </h2>
            </RevealBlock>
            <RevealBlock delay={0.2}>
              <p className="mt-5 text-[15.5px] leading-relaxed text-[var(--ink-body)]">
                Scroll through what makes ICCB the first choice for the country&apos;s biggest events.
              </p>
            </RevealBlock>
          </div>
          <div className="mt-12">
            <ReasonsStack reasons={REASONS} />
          </div>
        </div>
      </section>

      {/* 4 — Included in every booking (interactive checklist) */}
      <IncludedShowcase items={INCLUDED} locale={locale} />

      {/* 5 — Certifications, just above the footer */}
      <CertificationsSection />
    </div>
  );
}
