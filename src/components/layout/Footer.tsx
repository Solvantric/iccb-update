import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { CopyrightYear } from "./CopyrightYear";
import type { Locale } from "@/lib/i18n/routing";
import {
  Phone, EnvelopeSimple, MapPin, ArrowRight,
  InstagramLogo, FacebookLogo, LinkedinLogo,
} from "@phosphor-icons/react/dist/ssr";

const halls = [
  { slug: "gulnaksha", name: "Gulnaksha" },
  { slug: "pushpoguchcho", name: "Pushpoguchcho" },
  { slug: "rajdarshan", name: "Rajdarshan" },
  { slug: "noboratri", name: "Noboratri" },
  { slug: "pushpanjali", name: "Pushpanjali" },
  { slug: "seminar-hall", name: "Seminar Hall" },
];

const serviceLinks = [
  { slug: "venue-rental", name: "Venue Rental" },
  { slug: "catering", name: "Catering" },
  { slug: "decoration", name: "Decoration" },
  { slug: "event-management", name: "Event Management" },
  { slug: "heritage-restaurant", name: "Heritage Restaurant" },
  { slug: "expo-support", name: "Expo & Trade Fair" },
];

interface FooterProps {
  locale: Locale;
}

export function Footer({ locale }: FooterProps) {
  const t = useTranslations("footer");
  const tContact = useTranslations("contact");

  return (
    <footer className="bg-[var(--bg-soft)] text-[var(--ink-body)] border-t border-[var(--line)]">
      <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)] py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12">
          {/* Col 1: About + socials */}
          <div>
            <div className="mb-6">
              <span className="font-display text-3xl text-[var(--ink)] font-semibold tracking-widest uppercase">
                ICCB
              </span>
              <p className="text-[11px] text-[var(--accent-text)] font-semibold tracking-[0.12em] uppercase mt-1">
                International Convention City Bashundhara
              </p>
            </div>
            <p className="text-sm text-[var(--ink-muted)] leading-relaxed mb-6">
              South Asia&apos;s largest convention centre. Home to world-class expos, conferences, weddings, and concerts since 1 January 2015.
            </p>
            <p className="text-[11px] text-[var(--ink-muted)] tracking-[0.1em] uppercase mb-4">
              A Bashundhara Group Property
            </p>
            <div className="flex gap-3">
              <a href="#" aria-label="Instagram" className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-btn)] text-[var(--accent)] border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] hover:-translate-y-0.5 transition-all duration-300">
                <InstagramLogo size={20} weight="light" />
              </a>
              <a href="#" aria-label="Facebook" className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-btn)] text-[var(--accent)] border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] hover:-translate-y-0.5 transition-all duration-300">
                <FacebookLogo size={20} weight="light" />
              </a>
              <a href="#" aria-label="LinkedIn" className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-btn)] text-[var(--accent)] border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] hover:-translate-y-0.5 transition-all duration-300">
                <LinkedinLogo size={20} weight="light" />
              </a>
            </div>
          </div>

          {/* Col 2: Venues */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[var(--ink)] tracking-wide uppercase mb-5 after:content-[''] after:block after:mt-2 after:h-0.5 after:w-8 after:bg-[var(--accent-deep)]">
              {t("venues" as never)}
            </h3>
            <ul className="space-y-2.5">
              {halls.map((hall) => (
                <li key={hall.slug}>
                  <Link
                    href={`/venues/${hall.slug}`}
                    locale={locale}
                    className="inline-block text-sm text-[var(--ink-muted)] hover:text-[var(--accent)] hover:translate-x-1 rtl:hover:-translate-x-1 transition-all duration-300"
                  >
                    {hall.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Services */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[var(--ink)] tracking-wide uppercase mb-5 after:content-[''] after:block after:mt-2 after:h-0.5 after:w-8 after:bg-[var(--accent-deep)]">
              {t("services" as never)}
            </h3>
            <ul className="space-y-2.5">
              {serviceLinks.map((svc) => (
                <li key={svc.slug}>
                  <Link
                    href={`/services/${svc.slug}`}
                    locale={locale}
                    className="inline-block text-sm text-[var(--ink-muted)] hover:text-[var(--accent)] hover:translate-x-1 rtl:hover:-translate-x-1 transition-all duration-300"
                  >
                    {svc.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[var(--ink)] tracking-wide uppercase mb-5 after:content-[''] after:block after:mt-2 after:h-0.5 after:w-8 after:bg-[var(--accent-deep)]">
              {t("contact" as never)}
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <MapPin size={16} className="text-[var(--accent-deep)] mt-0.5 flex-shrink-0" weight="fill" />
                <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
                  Kuril Bishwa Road, Next to 300 ft. Purbachal Express Highway, Dhaka 1229
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <Phone size={16} className="text-[var(--accent-deep)] mt-0.5 flex-shrink-0" weight="fill" />
                <div className="text-sm font-semibold text-[var(--ink)] space-y-1">
                  <p>+88-02-41091551</p>
                  <p>+88-01991-197719</p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <EnvelopeSimple size={16} className="text-[var(--accent-deep)] flex-shrink-0" weight="fill" />
                <a href="mailto:iccb@bga-bd.com" className="text-sm font-semibold text-[var(--ink)] hover:text-[var(--accent)] transition-colors">
                  iccb@bga-bd.com
                </a>
              </div>

              {/* Newsletter */}
              <div className="mt-6 pt-6 border-t border-[var(--line)]">
                <p className="text-[11px] font-bold text-[var(--ink)] tracking-[0.14em] uppercase mb-3">
                  {t("newsletter" as never)}
                </p>
                <form className="flex gap-2">
                  <input
                    type="email"
                    placeholder={t("newsletterPlaceholder" as never) || "Your email"}
                    className="flex-1 min-w-0 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-input)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] text-white w-11 h-11 rounded-[var(--radius-btn)] flex items-center justify-center hover:brightness-110 transition-all flex-shrink-0"
                    aria-label={t("subscribe" as never) || "Subscribe"}
                  >
                    <ArrowRight size={16} weight="bold" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip — deep brand red */}
      <div className="bg-[var(--accent-deep)]">
        <div className="container-wide py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[12px] text-white/85 text-center sm:text-start">
            © <CopyrightYear /> ICCB — International Convention City Bashundhara. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" locale={locale} className="text-[12px] text-white/80 hover:text-white transition-colors">
              {t("privacy" as never)}
            </Link>
            <Link href="/terms" locale={locale} className="text-[12px] text-white/80 hover:text-white transition-colors">
              {t("terms" as never)}
            </Link>
            <Link href="/faq" locale={locale} className="text-[12px] text-white/80 hover:text-white transition-colors">
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
