import type { Metadata } from "next";
import { RevealBlock, RevealGroup, RevealItem } from "@/components/motion/RevealBlock";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { HeroSlides, type HeroSlide } from "@/components/about/AboutHero";
import { Phone, Envelope, MapPin, Clock, CalendarCheck, ForkKnife, Storefront, Megaphone, ArrowUpRight, WhatsappLogo, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ContactForm } from "@/components/contact/ContactForm";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";

export const metadata: Metadata = {
  title: "Contact — ICCB",
  description: "Get in touch with ICCB. Call, email, or visit our convention centre on Purbachal Express Highway, Dhaka.",
};

const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=90&w=3840`;

const SLIDES: HeroSlide[] = [
  { lines: ["Let's Plan"], highlight: "Your Next Event", text: "Our team is available 7 days a week to help you plan your event.", image: u("1780542900375-0cf459e38fbb") },
  { lines: ["Visit Us at"], highlight: "Purbachal", text: "Next to the 300 ft. Purbachal Express Highway, Kuril Bishwa Road, Dhaka 1229.", image: u("1742724769470-4f921b700c71") },
  { lines: ["Call, Email or"], highlight: "Drop By", text: "Talk to our sales, catering and expo teams — we usually reply within a day.", image: u("1540575467063-178a50c2df87") },
];

const CONTACTS = [
  {
    icon: MapPin,
    label: "Visit Us",
    title: "ICCB, Purbachal",
    lines: ["Kuril Bishwa Road, Next to 300 ft.", "Purbachal Express Highway, Dhaka 1229"],
    action: { href: "https://www.google.com/maps/search/?api=1&query=International+Convention+City+Bashundhara", text: "Get directions" },
  },
  {
    icon: Phone,
    label: "Call Us",
    title: "+88-01991-197719",
    lines: ["+88-02-41091551", "Available 7 days a week"],
    action: { href: "tel:+8801991197719", text: "Call now" },
  },
  {
    icon: Envelope,
    label: "Email Us",
    title: "info@iccbbg.com",
    lines: ["sales@iccbbg.com", "Reply within one working day"],
    action: { href: "mailto:info@iccbbg.com", text: "Send email" },
  },
  {
    icon: Clock,
    label: "Office Hours",
    title: "Sun – Thu",
    lines: ["9:00 AM – 6:00 PM", "Fri – Sat: 10:00 AM – 4:00 PM"],
    action: { href: "/booking", text: "Book a visit" },
  },
];

const DEPARTMENTS = [
  { icon: CalendarCheck, dept: "Sales & Bookings", email: "sales@iccbbg.com", note: "Hall reservations & quotes" },
  { icon: ForkKnife, dept: "Catering", email: "catering@iccbbg.com", note: "Menu planning & packages" },
  { icon: Storefront, dept: "Expo Village", email: "expo@iccbbg.com", note: "Exhibition booth enquiries" },
  { icon: Megaphone, dept: "Media & PR", email: "media@iccbbg.com", note: "Press & partnership requests" },
];

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as Locale) ? rawLocale : "en") as Locale;

  return (
    <div className="pt-[88px] sm:pt-[112px]">
      {/* Hero slider */}
      <HeroSlides eyebrow="Contact Us" slides={SLIDES} raiseDots />

      {/* Quick actions — overlap the hero */}
      <div className="relative z-20 container-site -mt-14 md:-mt-16">
        <RevealGroup stagger={0.1} className="grid grid-cols-2 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] lg:grid-cols-4">
          {[
            { icon: Phone, title: "Call us", sub: "+88-01991-197719", href: "tel:+8801991197719" },
            { icon: WhatsappLogo, title: "WhatsApp", sub: "Chat with our team", href: "https://wa.me/8801991197719" },
            { icon: Envelope, title: "Email", sub: "info@iccbbg.com", href: "mailto:info@iccbbg.com" },
            { icon: CalendarCheck, title: "Book a date", sub: "Check availability", href: "/booking" },
          ].map(({ icon: Icon, title, sub, href }, i) => {
            const inner = (
              <>
                <span className="absolute inset-0 origin-bottom scale-y-0 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100" />
                <span className="relative grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-[var(--bg-tint)] text-[var(--accent)] transition-colors duration-500 group-hover:bg-white/20 group-hover:text-white">
                  <Icon size={22} weight="fill" />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-[var(--ink)] transition-colors duration-500 group-hover:text-white">{title}</span>
                  <span className="block truncate text-[12.5px] text-[var(--ink-muted)] transition-colors duration-500 group-hover:text-white/80">{sub}</span>
                </span>
                <ArrowRight size={16} weight="bold" className="relative hidden text-[var(--ink-muted)] transition-all duration-500 group-hover:translate-x-1 group-hover:text-white sm:block rtl:-scale-x-100" />
              </>
            );
            const cls = `group relative flex items-center gap-4 overflow-hidden px-5 py-5 ${i % 2 ? "border-s" : ""} ${i > 1 ? "border-t lg:border-t-0" : ""} ${i > 0 ? "lg:border-s" : ""} border-[var(--line)]`;
            return (
              <RevealItem key={title}>
                {href.startsWith("/") ? (
                  <Link href={href} locale={locale} className={cls}>{inner}</Link>
                ) : (
                  <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={cls}>{inner}</a>
                )}
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>

      <section className="section-y bg-[var(--bg)]">
        <div className="container-site">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <RevealBlock><SectionLabel>Get in Touch</SectionLabel></RevealBlock>
            <RevealBlock delay={0.1}>
              <h2 className="mt-4 font-display uppercase text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] text-[var(--ink)]">
                We&apos;d Love to <span className="text-[var(--accent)]">Hear From You</span>
              </h2>
            </RevealBlock>
          </div>

          {/* Contact cards — same structure, every line aligned */}
          <RevealGroup stagger={0.12} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CONTACTS.map(({ icon: Icon, label, title, lines, action }, i) => {
              const external = action.href.startsWith("http");
              const cls = "mt-auto inline-flex items-center gap-1.5 pt-5 text-[13px] font-semibold text-[var(--accent)] transition-all group-hover:gap-2.5";
              return (
                <RevealItem key={label}>
                  <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-[0_24px_44px_-30px_rgba(0,0,0,0.4)]">
                    <Icon aria-hidden size={120} weight="thin" className="pointer-events-none absolute -end-6 -top-6 text-[var(--ink)]/[0.04] transition-transform duration-700 group-hover:rotate-12" />
                    <div className="flex items-center justify-between">
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent)] text-white shadow-[0_10px_22px_-12px_var(--accent)] transition-transform duration-500 group-hover:scale-110">
                        <Icon size={22} weight="fill" />
                      </span>
                      <span className="font-display text-[15px] text-[var(--ink-muted)]/50">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <p className="mt-5 text-[11.5px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">{label}</p>
                    <p className="mt-1.5 text-[17px] font-semibold leading-snug text-[var(--ink)]">{title}</p>
                    <div className="mt-2 space-y-1">
                      {lines.map((l) => (
                        <p key={l} className="text-[14px] leading-relaxed text-[var(--ink-muted)]">{l}</p>
                      ))}
                    </div>
                    {action.href.startsWith("/") ? (
                      <Link href={action.href} locale={locale} className={cls}>{action.text} <ArrowRight size={13} weight="bold" className="rtl:-scale-x-100" /></Link>
                    ) : (
                      <a href={action.href} target={external ? "_blank" : undefined} rel="noopener noreferrer" className={cls}>
                        {action.text} <ArrowRight size={13} weight="bold" className="rtl:-scale-x-100" />
                      </a>
                    )}
                    <span aria-hidden className="absolute bottom-0 start-0 h-[3px] w-0 bg-[var(--accent)] transition-all duration-500 group-hover:w-full" />
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>

          {/* Send a message — one clean card */}
          <RevealBlock>
            <div className="mx-auto mt-16 max-w-4xl rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_30px_60px_-45px_rgba(0,0,0,0.35)] sm:p-10">
              <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <SectionLabel>Write to Us</SectionLabel>
                  <h2 className="mt-3 font-display uppercase text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.05] text-[var(--ink)]">
                    Send Us a <span className="text-[var(--accent)]">Message</span>
                  </h2>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-soft)] px-4 py-2 text-[12.5px] font-medium text-[var(--ink-muted)]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> We reply within one working day
                </span>
              </div>
              <ContactForm />
            </div>
          </RevealBlock>

          {/* Location — info panel + big map side by side (nothing overlaps the map) */}
          <RevealBlock delay={0.1}>
            <div className="mt-12 grid overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] lg:grid-cols-[360px_1fr]">
              <div className="flex flex-col p-7 sm:p-8">
                <SectionLabel>Find Us</SectionLabel>
                <h3 className="mt-3 font-display uppercase text-[26px] leading-tight text-[var(--ink)]">
                  ICCB, <span className="text-[var(--accent)]">Purbachal</span>
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--ink-muted)]">
                  Kuril Bishwa Road, Next to 300 ft. Purbachal Express Highway, Dhaka 1229, Bangladesh.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    { icon: MapPin, text: "Next to the 300 ft. Highway" },
                    { icon: ArrowUpRight, text: "25 km from Shahjalal Airport" },
                    { icon: CalendarCheck, text: "3,500+ car parking on site" },
                  ].map(({ icon: I, text }) => (
                    <li key={text} className="flex items-center gap-3 text-[14px] text-[var(--ink)]">
                      <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-[var(--bg-tint)] text-[var(--accent)]"><I size={15} weight="bold" /></span>
                      {text}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=International+Convention+City+Bashundhara"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--accent)] lg:mt-auto"
                >
                  Get directions <ArrowUpRight size={14} weight="bold" />
                </a>
              </div>
              <div className="relative h-[380px] lg:h-auto lg:min-h-[480px]">
                <iframe
                  src="https://maps.google.com/maps?q=International%20Convention%20City%20Bashundhara%2C%20Dhaka&z=15&output=embed"
                  className="absolute inset-0 h-full w-full"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="ICCB location on Google Maps"
                />
              </div>
            </div>
          </RevealBlock>
        </div>
      </section>

      {/* Departments — warm cream band before the footer */}
      <section className="relative overflow-hidden bg-[#F6F1EA] py-16 md:py-20 text-[var(--ink)] dark:bg-[#1a1714]">
        <div aria-hidden className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(#d9cfc2_1px,transparent_1px)] [background-size:22px_22px] dark:opacity-10" />
        <div className="relative container-site">
          <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <RevealBlock>
              <SectionLabel>Departments</SectionLabel>
              <h2 className="mt-4 font-display uppercase text-[clamp(1.8rem,3.6vw,2.8rem)] leading-[1.05]">
                Reach the <span className="text-[var(--accent)]">Right Team</span>
              </h2>
            </RevealBlock>
            <RevealBlock delay={0.1}>
              <p className="max-w-sm text-[14.5px] leading-relaxed text-[var(--ink-muted)]">Write directly to the team that handles your request for a faster reply.</p>
            </RevealBlock>
          </div>
          <RevealGroup stagger={0.12} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DEPARTMENTS.map(({ icon: Icon, dept, email, note }) => (
              <RevealItem key={dept}>
                <a
                  href={`mailto:${email}`}
                  className="group relative block h-full overflow-hidden rounded-2xl border border-[#e7ddd0] bg-[var(--surface)] p-6 shadow-[0_18px_40px_-32px_rgba(60,40,20,0.45)] transition-all duration-500 hover:-translate-y-1 hover:border-[var(--accent)]/50 hover:shadow-[0_28px_50px_-30px_rgba(60,40,20,0.45)]"
                >
                  <div className="flex items-start justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--bg-tint)] text-[var(--accent)] transition-colors duration-500 group-hover:bg-[var(--accent)] group-hover:text-white">
                      <Icon size={21} weight="duotone" />
                    </span>
                    <ArrowUpRight size={18} className="text-[var(--ink-muted)]/60 transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
                  </div>
                  <p className="mt-5 text-[16px] font-semibold">{dept}</p>
                  <p className="mt-1 text-[13px] text-[var(--ink-muted)]">{note}</p>
                  <p className="mt-4 text-[13.5px] font-medium text-[var(--accent)]">{email}</p>
                </a>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
    </div>
  );
}
