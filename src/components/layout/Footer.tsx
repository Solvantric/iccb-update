import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { CopyrightYear } from "./CopyrightYear";
import type { Locale } from "@/lib/i18n/routing";
import {
  Phone, EnvelopeSimple, MapPin, ArrowRight,
  FacebookLogo, InstagramLogo, LinkedinLogo, YoutubeLogo, XLogo,
} from "@phosphor-icons/react/dist/ssr";

/* Layout follows bashundharaphcpile.com; all info is ICCB's own (iccbbg.com). */
const quickLinks = [
  { href: "/about", name: "About Us" },
  { href: "/why-iccb", name: "Why ICCB" },
  { href: "/gallery", name: "Photo Gallery" },
  { href: "/news", name: "News & Media" },
  { href: "/faq", name: "FAQ" },
];

const venues = [
  { href: "/venues/gulnaksha", name: "Gulnaksha" },
  { href: "/venues/pushpoguchcho", name: "Pushpoguchcho" },
  { href: "/venues/rajdarshan", name: "Rajdarshan" },
  { href: "/venues/noboratri", name: "Noboratri" },
  { href: "/venues/pushpanjali", name: "Pushpanjali" },
  { href: "/expo-zone", name: "Expo Village" },
];

const services = [
  { href: "/services/venue-rental", name: "Venue Rental" },
  { href: "/services/catering", name: "Catering" },
  { href: "/services/decoration", name: "Decoration" },
  { href: "/services/event-management", name: "Event Management" },
  { href: "/services/expo-support", name: "Expo & Trade Fair" },
];

const socials = [
  { href: "https://www.facebook.com/iccb.event", label: "Facebook", icon: FacebookLogo },
  { href: "https://www.instagram.com/iccb_bashundhara", label: "Instagram", icon: InstagramLogo },
  { href: "https://www.linkedin.com/company/international-convention-city-bashundhara-iccb", label: "LinkedIn", icon: LinkedinLogo },
  { href: "https://www.youtube.com/channel/UCOdG4Ux8tS_ao4K7TUk4dIQ", label: "YouTube", icon: YoutubeLogo },
  { href: "https://twitter.com/iccb_bd", label: "X (Twitter)", icon: XLogo },
];

const heading = "text-xs font-bold uppercase tracking-wide text-[var(--ink)] sm:text-sm";
const bar = <span aria-hidden className="mt-2 block h-0.5 w-8 bg-[var(--accent-deep)]" />;
const linkCls = "block py-2 text-xs leading-snug text-[var(--ink-muted)] transition-colors hover:text-[var(--accent)] sm:py-2.5 sm:text-sm sm:leading-5";

function LinkList({ items, locale }: { items: { href: string; name: string }[]; locale: Locale }) {
  return (
    <ul className="mt-4">
      {items.map((it, i) => (
        <li key={it.href + it.name} className={i ? "border-t border-[var(--line)]" : ""}>
          <Link href={it.href} locale={locale} className={linkCls}>
            {it.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

interface FooterProps {
  locale: Locale;
}

export function Footer({ locale }: FooterProps) {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-[var(--line)] bg-[var(--bg-soft)]">
      <div className="mx-auto grid max-w-6xl grid-cols-3 gap-x-4 gap-y-10 px-4 py-16 sm:grid-cols-4 sm:gap-x-6 sm:px-6 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1.25fr] lg:gap-x-8">
        {/* Brand */}
        <div className="col-span-3 sm:col-span-4 lg:col-span-1">
          <Link href="/" locale={locale} aria-label="ICCB — home" className="inline-block">
            <Image
              src="/images/ventures/iccb.svg"
              alt="ICCB — International Convention City Bashundhara"
              width={173}
              height={157}
              unoptimized
              className="h-28 w-auto"
            />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--ink-muted)]">
            International Convention City Bashundhara — the largest event venue in South Asia. We deliver the experiences to be
            remembered for a lifetime.
          </p>
          <Link
            href="/booking"
            locale={locale}
            className="mt-5 flex w-fit items-center gap-2 whitespace-nowrap rounded-sm border-2 border-[var(--accent)] px-5 py-2.5 text-[0.8125rem] font-medium text-[var(--ink)] transition-colors hover:bg-[var(--accent)] hover:text-white"
          >
            Check Availability <ArrowRight size={14} weight="bold" className="rtl:-scale-x-100" />
          </Link>
        </div>

        {/* Quick links */}
        <div className="min-w-0">
          <h3 className={heading}>Quick Links</h3>
          {bar}
          <LinkList items={quickLinks} locale={locale} />
        </div>

        {/* Venues */}
        <div className="min-w-0">
          <h3 className={heading}>Our {t("venues" as never)}</h3>
          {bar}
          <LinkList items={venues} locale={locale} />
        </div>

        {/* Services */}
        <div className="min-w-0">
          <h3 className={heading}>Our {t("services" as never)}</h3>
          {bar}
          <LinkList items={services} locale={locale} />
        </div>

        {/* Contact — icons on the left of each line, socials below */}
        <div className="col-span-3 min-w-0 sm:col-span-1">
          <h3 className={heading}>Get in Touch</h3>
          {bar}
          <ul className="mt-4">
            <li className="flex items-center gap-3 py-2.5 text-sm text-[var(--ink-muted)] sm:text-xs lg:text-sm">
              <Phone size={18} weight="fill" className="flex-shrink-0 text-[var(--accent)]" />
              <a href="tel:+880241091551" className="hover:text-[var(--accent)]">+88-02-41091551</a>
            </li>
            <li className="flex items-center gap-3 border-t border-[var(--line)] py-2.5 text-sm text-[var(--ink-muted)] sm:text-xs lg:text-sm">
              <Phone size={18} weight="fill" className="flex-shrink-0 text-[var(--accent)]" />
              <a href="tel:+8801991197719" className="hover:text-[var(--accent)]">+88-01991-197719</a>
            </li>
            <li className="flex items-center gap-3 border-t border-[var(--line)] py-2.5 text-sm text-[var(--ink-muted)] sm:text-xs lg:text-sm">
              <EnvelopeSimple size={18} weight="fill" className="flex-shrink-0 text-[var(--accent)]" />
              <a href="mailto:iccb@bga-bd.com" className="min-w-0 [overflow-wrap:anywhere] hover:text-[var(--accent)]">iccb@bga-bd.com</a>
            </li>
            <li className="flex items-start gap-3 border-t border-[var(--line)] py-2.5 text-sm text-[var(--ink-muted)] sm:text-xs lg:text-sm">
              <MapPin size={18} weight="fill" className="mt-0.5 flex-shrink-0 text-[var(--accent)]" />
              <span>
                Kuril Bishwa Road, Next to 300 ft.
                <br />
                Purbachal Express Highway, Dhaka-1229
              </span>
            </li>
          </ul>
          <div className="-ms-2 mt-4 flex gap-1">
            {socials.map(({ href, label, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label} (opens in a new tab)`}
                className="rounded-md p-2 text-[var(--accent)] transition-transform hover:-translate-y-0.5 hover:text-[var(--accent-deep)]"
              >
                <Icon size={22} weight="fill" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="bg-[var(--accent-deep)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-5 text-xs text-white sm:flex-row sm:justify-between sm:px-6">
          <p>
            © <CopyrightYear /> International Convention City Bashundhara. All Rights Reserved.
          </p>
          <nav className="flex items-center gap-3">
            <Link href="/privacy" locale={locale} className="hover:underline">{t("privacy" as never)}</Link>
            <span className="text-white/40">|</span>
            <Link href="/terms" locale={locale} className="hover:underline">{t("terms" as never)}</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
