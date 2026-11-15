import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { RevealBlock, RevealGroup, RevealItem } from "@/components/motion/RevealBlock";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { AboutHero } from "@/components/about/AboutHero";
import { AboutJourney } from "@/components/about/AboutJourney";
import { RevealImage } from "@/components/about/RevealImage";
import {
  ArrowRight, Presentation, ShieldCheck, Columns, FireExtinguisher, ForkKnife, Heartbeat,
  UsersThree, Bus, CookingPot, Sparkle, Handshake,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "About ICCB — International Convention City Bashundhara",
  description:
    "International Convention City Bashundhara (ICCB) — the largest event venue in South Asia: 8.5 lac sq. ft., 20,000+ guests, 3,500+ car parking, next to the 300 ft. Purbachal Express Highway, Dhaka.",
};

const ICCB = (p: string) => `https://www.iccbbg.com/assets/images/${p}`;
const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=90&w=2400`;

/* All copy below is taken from iccbbg.com (Overview, Mission & Values). */
const HIGHLIGHTS = [
  { title: "8.5 Lac Sq. Ft.", text: "Spread over a spacious area, a little away from the hustle and bustle of the city.", img: ICCB("pages/hall/h4.jpg") },
  { title: "20,000+ Guests", text: "The capacity to accommodate more than 20,000 guests at a time.", img: ICCB("pages/overview.jpg") },
  { title: "3,500+ Cars", text: "A spacious parking area that can accommodate more than 3,500 cars at a time.", img: ICCB("grand-space/carparking-1.jpg") },
  { title: "Double Kitchen", text: "A team of professionals offering world-class double kitchen service.", img: u("1581349485608-9469926a8e5e") },
];

const COMMITMENTS = [
  { icon: Presentation, text: "Up-to-date technology for presentations" },
  { icon: ShieldCheck, text: "Seamless security" },
  { icon: Columns, text: "Auspicious venues with pillar-free halls" },
  { icon: FireExtinguisher, text: "Fire safety with a well-equipped fire service team" },
  { icon: ForkKnife, text: "Hygienic food and catering" },
  { icon: Heartbeat, text: "A healthy and safe environment for everyone" },
];

const VALUES = [
  { title: "Client First", text: "We are client-centric — every decision starts with what makes your event a success." },
  { title: "Always Improving", text: "We strive to do better at every event we host, learning from each one." },
  { title: "Earning Trust", text: "We owe our success to our clients, and we protect the trust they place in us." },
  { title: "Win Together", text: "Our team shares these values and works as one — when we win, we win together." },
];

const PEOPLE = [
  { icon: UsersThree, title: "Well-trained service staff", text: "Well-groomed and trained, with in-depth industry experience." },
  { icon: ShieldCheck, title: "Highly trained security", text: "End-to-end vigilance with professional security personnel and CCTV." },
  { icon: CookingPot, title: "Professional catering team", text: "World-class double kitchen service with hygiene and freshness." },
  { icon: Bus, title: "Guest transportation", text: "Comfortable transport for guests, plus parking for 3,500+ cars." },
];

const CULTURE = [
  { title: "Teamwork first", text: "We plan, set up and serve as one team — when we win, we win together." },
  { title: "Client-centric mindset", text: "Every decision starts with what makes our clients' events a success." },
  { title: "Always improving", text: "We learn from every event and raise the bar for the next one." },
  { title: "Safe & respectful workplace", text: "A healthy and safe environment for our guests and our people." },
];


export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as Locale) ? rawLocale : "en") as Locale;

  return (
    <div className="pt-[88px] sm:pt-[112px]">
      {/* ── 1. Hero slider ─────────────────────────────────────────── */}
      <AboutHero />

      {/* ── 2. Who we are ──────────────────────────────────────────── */}
      <section className="section-y bg-[var(--bg)]">
        <div className="container-site">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-center">
            <div>
              <RevealBlock><SectionLabel>Who We Are</SectionLabel></RevealBlock>
              <RevealBlock delay={0.1}>
                <h2 className="mt-4 font-display uppercase text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.05]">
                  <span className="text-[var(--accent)]">International Convention City Bashundhara</span>
                  <br />
                  <span className="text-[var(--ink)]">The Grand Place Designed for You</span>
                </h2>
              </RevealBlock>
              <RevealBlock delay={0.2}>
                <p className="mt-6 max-w-xl text-[15.5px] leading-[1.8] text-[var(--ink-body)]">
                  International Convention City Bashundhara (ICCB), the largest event venue in South Asia, is a grand place designed to
                  gratify your needs. Owned by one of the largest Bashundhara Group companies, ICCB&apos;s mandate is to create economic and
                  social benefits for the nation and to represent the country abroad. With international-standard amenities, end-to-end
                  vigilance and world-class catering, we make any occasion truly memorable — whether it&apos;s a corporate event or a personal
                  celebration.
                </p>
              </RevealBlock>
            </div>
            <RevealBlock delay={0.15}>
              <div className="relative">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[0_40px_70px_-40px_rgba(0,0,0,0.5)]">
                  <Image src={ICCB("pages/overview.jpg")} alt="Guests at an ICCB outdoor event" fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" />
                </div>
                <div className="absolute -bottom-6 -start-6 hidden sm:block w-[42%] aspect-[3/4] overflow-hidden rounded-xl border-4 border-[var(--bg)] shadow-xl">
                  <Image src={ICCB("pages/hall/h1.jpg")} alt="ICCB Gulnaksha hall building" fill sizes="220px" className="object-cover" />
                </div>
                <div className="absolute -top-5 -end-3 rounded-xl bg-[var(--accent)] px-5 py-4 text-white shadow-xl">
                  <p className="font-display text-[28px] leading-none">#1</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/85">Venue in South Asia</p>
                </div>
              </div>
            </RevealBlock>
          </div>

          {/* 4 points — appear one by one */}
          <RevealGroup stagger={0.18} className="mt-20 grid grid-cols-2 lg:grid-cols-4">
            {HIGHLIGHTS.map((h, i) => (
              <RevealItem key={h.title}>
                <div className={`group h-full px-5 py-2 lg:px-7 ${i % 2 === 1 ? "border-s" : ""} ${i > 0 ? "lg:border-s" : ""} border-[var(--line)] ${i > 1 ? "mt-8 lg:mt-0" : ""}`}>
                  <RevealImage src={h.img} alt={h.title} className="mb-5 aspect-[16/10] rounded-lg" sizes="(max-width: 1024px) 45vw, 260px" />
                  <p className="text-[12px] text-[var(--ink-muted)] tabular-nums">{String(i + 1).padStart(2, "0")}</p>
                  <span className="mt-2 mb-4 block h-[2px] w-8 bg-[var(--accent)]" />
                  <h3 className="font-display uppercase text-[19px] text-[var(--ink)]">{h.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--ink-muted)]">{h.text}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── 3. Our purpose: vision & mission ───────────────────────── */}
      <section className="section-y bg-[var(--bg)]">
        <div className="container-site">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <RevealBlock><SectionLabel>Our Purpose</SectionLabel></RevealBlock>
              <RevealBlock delay={0.1}>
                <h2 className="mt-4 font-display uppercase text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] text-[var(--ink)]">
                  Our <span className="text-[var(--accent)]">Vision &amp; Mission</span>
                </h2>
              </RevealBlock>
            </div>
            <RevealBlock delay={0.2}>
              <p className="max-w-sm text-[14.5px] leading-relaxed text-[var(--ink-muted)]">
                Hospitality and attention to detail guide everything we do — for every guest, at every event.
              </p>
            </RevealBlock>
          </div>

          <RevealGroup stagger={0.2} className="mt-12 grid gap-5 md:grid-cols-2">
            {[
              { n: "01", title: "Vision", text: "To become one of the top-performing convention centres in Asia.", img: u("1540575467063-178a50c2df87") },
              { n: "02", title: "Mission", text: "To make every occasion truly memorable — we deliver the experiences to be remembered for a lifetime.", img: u("1780542900375-0cf459e38fbb") },
            ].map((c) => (
              <RevealItem key={c.n}>
                <article className="group relative h-[420px] md:h-[480px] overflow-hidden rounded-2xl">
                  <Image src={c.img} alt={c.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
                  <p className="absolute top-6 start-7 font-display text-[88px] leading-none text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.6)]">{c.n}</p>
                  <div className="absolute inset-x-0 bottom-0 p-7 md:p-9">
                    <span className="mb-4 block h-[3px] w-10 bg-[var(--accent)] transition-all duration-500 group-hover:w-20" />
                    <h3 className="font-display uppercase text-white text-[clamp(1.8rem,3vw,2.6rem)] leading-none">Our {c.title}</h3>
                    <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-white/85">{c.text}</p>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>

          <RevealBlock delay={0.1}>
            <p className="mt-16 mb-6 text-center text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--ink-muted)]">Our commitment to every event</p>
          </RevealBlock>
          <RevealGroup stagger={0.12} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 border-y border-[var(--line)]">
            {COMMITMENTS.map(({ icon: Icon, text }, i) => (
              <RevealItem key={text}>
                <div className={`group h-full px-4 py-7 text-center ${i > 0 ? "lg:border-s" : ""} border-[var(--line)]`}>
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--bg-soft)] text-[var(--accent)] transition-all duration-500 group-hover:bg-[var(--accent)] group-hover:text-white">
                    <Icon size={22} weight="duotone" />
                  </span>
                  <p className="mt-3 text-[13px] font-medium leading-snug text-[var(--ink)]">{text}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── 3b. Our journey (scroll timeline) ─────────────────────── */}
      <AboutJourney />

      {/* ── 4. Our values ──────────────────────────────────────────── */}
      <section className="section-y bg-[var(--bg-soft)]">
        <div className="container-site">
          <div className="mx-auto max-w-2xl text-center">
            <RevealBlock><SectionLabel>Our Values</SectionLabel></RevealBlock>
            <RevealBlock delay={0.1}>
              <h2 className="mt-4 font-display uppercase text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] text-[var(--ink)]">
                The Principles Behind <span className="text-[var(--accent)]">Every Event</span>
              </h2>
            </RevealBlock>
            <RevealBlock delay={0.2}>
              <p className="mt-5 text-[15.5px] leading-relaxed text-[var(--ink-body)]">
                Our values shape every decision we make — keeping us committed to our clients, our people and the nation.
              </p>
            </RevealBlock>
          </div>

          <RevealGroup stagger={0.18} className="mt-14 grid grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <RevealItem key={v.title}>
                <div className={`h-full px-5 py-2 lg:px-7 ${i % 2 === 1 ? "border-s" : ""} ${i > 0 ? "lg:border-s" : ""} border-[var(--line)] ${i > 1 ? "mt-8 lg:mt-0" : ""}`}>
                  <span className="mb-4 block h-[2px] w-8 bg-[var(--accent)]" />
                  <h3 className="text-[13px] font-bold uppercase tracking-[0.12em] text-[var(--ink)]">{v.title}</h3>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--ink-muted)]">{v.text}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          <RevealBlock delay={0.1}>
            <div className="relative mt-16 aspect-[21/8] overflow-hidden rounded-2xl">
              <Image src={u("1742724769470-4f921b700c71")} alt="Grand ICCB banquet hall" fill sizes="(max-width: 1440px) 100vw, 1400px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
              <p className="absolute bottom-6 start-6 md:bottom-10 md:start-10 max-w-md font-display uppercase text-white text-[clamp(1.4rem,3vw,2.4rem)] leading-[1.1]">
                When we win, <span className="text-[var(--accent)]">we win together.</span>
              </p>
            </div>
          </RevealBlock>
        </div>
      </section>

      {/* ── 5. Our people ─────────────────────────────────────────── */}
      <section className="section-y bg-[var(--bg)]">
        <div className="container-site">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <RevealBlock><SectionLabel>Our People</SectionLabel></RevealBlock>
              <RevealBlock delay={0.1}>
                <h2 className="mt-4 font-display uppercase text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] text-[var(--ink)]">
                  The Faces Behind <span className="text-[var(--accent)]">Every Event</span>
                </h2>
              </RevealBlock>
            </div>
            <RevealBlock delay={0.2}>
              <p className="max-w-md text-[15px] leading-relaxed text-[var(--ink-muted)]">
                Our staffers are well-groomed and trained, with in-depth industry experience — from the kitchen to the hall floor.
              </p>
            </RevealBlock>
          </div>

          <RevealGroup stagger={0.15} className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { src: u("1759521296144-fe6f2d2dc769"), title: "Culinary Team", text: "World-class double kitchen service with hygiene and freshness." },
              { src: u("1792259536070-e23bf19c9692"), title: "Chefs & Catering", text: "Mughal, Bengali and continental menus, freshly prepared." },
              { src: ICCB("grand-space/trained-1.jpg"), title: "Service Staff", text: "Well-groomed hosts and service crew at every event." },
              { src: u("1721924960760-bb134eb9c679"), title: "Event Professionals", text: "Experienced planners who look after every detail." },
            ].map((p) => (
              <RevealItem key={p.title}>
                <article className="group relative aspect-[3/4] overflow-hidden rounded-2xl">
                  <Image src={p.src} alt={p.title} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-[1200ms] group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <span className="mb-3 block h-[2px] w-8 bg-[var(--accent)] transition-all duration-500 group-hover:w-14" />
                    <h3 className="font-display uppercase text-white text-[19px] leading-tight">{p.title}</h3>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/75 max-h-0 opacity-0 transition-all duration-500 group-hover:max-h-20 group-hover:opacity-100">{p.text}</p>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>

          <RevealGroup stagger={0.12} className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PEOPLE.map(({ icon: Icon, title, text }) => (
              <RevealItem key={title}>
                <div className="flex gap-3.5">
                  <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-[var(--bg-tint)] text-[var(--accent)]">
                    <Icon size={20} weight="duotone" />
                  </span>
                  <div>
                    <h3 className="text-[14px] font-semibold text-[var(--ink)]">{title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-[var(--ink-muted)]">{text}</p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── 6. Work culture ────────────────────────────────────────── */}
      <section className="section-y bg-[var(--bg-soft)]">
        <div className="container-site grid gap-12 lg:grid-cols-2 lg:items-center">
          <RevealBlock>
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[0_40px_70px_-40px_rgba(0,0,0,0.5)]">
                <Image src={ICCB("grand-space/service-1.jpg")} alt="ICCB service team lined up before an event" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
              </div>
              <div className="absolute -bottom-6 -end-4 max-w-[240px] rounded-xl bg-[var(--ink)] px-5 py-4 text-white shadow-xl">
                <p className="font-display uppercase text-[18px] leading-tight">When we win,</p>
                <p className="font-display uppercase text-[18px] leading-tight text-[var(--accent)]">we win together.</p>
              </div>
            </div>
          </RevealBlock>
          <div>
            <RevealBlock><SectionLabel>Work Culture</SectionLabel></RevealBlock>
            <RevealBlock delay={0.1}>
              <h2 className="mt-4 font-display uppercase text-[clamp(2rem,4vw,3rem)] leading-[1.05] text-[var(--ink)]">
                One Team, <span className="text-[var(--accent)]">One Goal</span>
              </h2>
            </RevealBlock>
            <RevealBlock delay={0.2}>
              <p className="mt-5 text-[15.5px] leading-[1.8] text-[var(--ink-body)]">
                Every team member knows our values and works together to deliver the best experience to our clients. We are client-centric,
                we keep improving at every event, and we protect the trust our clients place in us.
              </p>
            </RevealBlock>
            <RevealGroup stagger={0.14} className="mt-8 space-y-3">
              {CULTURE.map((c, i) => (
                <RevealItem key={c.title}>
                  <div className="group flex items-start gap-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4 transition-all duration-500 hover:border-[var(--accent)]/40 hover:shadow-[0_14px_30px_-22px_rgba(0,0,0,0.35)]">
                    <span className="font-display text-[22px] leading-none text-[var(--accent)]">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="text-[14.5px] font-semibold text-[var(--ink)]">{c.title}</h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-[var(--ink-muted)]">{c.text}</p>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* ── 7. CTA ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20">
        <Image src={u("1780542900375-0cf459e38fbb")} alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative container-site text-center">
          <RevealBlock>
            <Sparkle size={28} weight="fill" className="mx-auto text-[var(--accent)]" />
            <h2 className="mt-4 font-display uppercase text-white text-[clamp(2rem,4vw,3.2rem)] leading-[1.05]">
              Let&apos;s Get <span className="text-[var(--accent)]">Planning</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-white/80">
              Tell us about your event and our team will help you make it truly memorable.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/enquiry" locale={locale} className="btn btn-primary">
                Get Started <ArrowRight size={14} weight="bold" />
              </Link>
              <Link href="/booking" locale={locale} className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] border border-white/40 px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-white hover:text-[var(--ink)]">
                <Handshake size={16} /> Book Now
              </Link>
            </div>
          </RevealBlock>
        </div>
      </section>
    </div>
  );
}
