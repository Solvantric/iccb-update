import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
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
    <footer className="bg-[var(--bg-deep)] text-white/80">
      <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)] py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12">
          {/* Col 1: About + socials */}
          <div>
            <div className="mb-6">
              <span className="font-display text-3xl text-white font-light tracking-widest uppercase">
                ICCB
              </span>
              <p className="text-[11px] text-white/50 tracking-[0.12em] uppercase mt-1">
                International Convention City Bashundhara
              </p>
            </div>
            <p className="text-sm text-white/60 leading-relaxed mb-6">
              South Asia&apos;s largest convention centre. Home to world-class expos, conferences, weddings, and concerts since 1 January 2015.
            </p>
            <p className="text-[11px] text-white/40 tracking-[0.1em] uppercase mb-4">
              A Bashundhara Group Property
            </p>
            <div className="flex gap-3">
              <a href="#" aria-label="Instagram" className="text-white/40 hover:text-[var(--accent)] transition-colors">
                <InstagramLogo size={20} weight="light" />
              </a>
              <a href="#" aria-label="Facebook" className="text-white/40 hover:text-[var(--accent)] transition-colors">
                <FacebookLogo size={20} weight="light" />
              </a>
              <a href="#" aria-label="LinkedIn" className="text-white/40 hover:text-[var(--accent)] transition-colors">
                <LinkedinLogo size={20} weight="light" />
              </a>
            </div>
          </div>

          {/* Col 2: Venues */}
          <div>
            <h3 className="text-[11px] text-white/40 tracking-[0.18em] uppercase mb-5">
              {t("venues" as never)}
            </h3>
            <ul className="space-y-2.5">
              {halls.map((hall) => (
                <li key={hall.slug}>
                  <Link
                    href={`/venues/${hall.slug}`}
                    locale={locale}
                    className="text-sm text-white/60 hover:text-[var(--accent)] transition-colors"
                  >
                    {hall.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Services */}
          <div>
            <h3 className="text-[11px] text-white/40 tracking-[0.18em] uppercase mb-5">
              {t("services" as never)}
            </h3>
            <ul className="space-y-2.5">
              {serviceLinks.map((svc) => (
                <li key={svc.slug}>
                  <Link
                    href={`/services/${svc.slug}`}
                    locale={locale}
                    className="text-sm text-white/60 hover:text-[var(--accent)] transition-colors"
                  >
                    {svc.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact */}
          <div>
            <h3 className="text-[11px] text-white/40 tracking-[0.18em] uppercase mb-5">
              {t("contact" as never)}
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <MapPin size={16} className="text-[var(--accent)] mt-0.5 flex-shrink-0" weight="light" />
                <p className="text-sm text-white/60 leading-relaxed">
                  Kuril Bishwa Road, Next to 300 ft. Purbachal Express Highway, Dhaka 1229
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <Phone size={16} className="text-[var(--accent)] mt-0.5" weight="light" />
                <div className="text-sm text-white/60 space-y-1">
                  <p>+88-02-41091551</p>
                  <p>+88-01991-197719</p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <EnvelopeSimple size={16} className="text-[var(--accent)]" weight="light" />
                <a href="mailto:iccb@bga-bd.com" className="text-sm text-white/60 hover:text-[var(--accent)] transition-colors">
                  iccb@bga-bd.com
                </a>
              </div>

              {/* Newsletter */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-[11px] text-white/40 tracking-[0.14em] uppercase mb-3">
                  {t("newsletter" as never)}
                </p>
                <form className="flex gap-2">
                  <input
                    type="email"
                    placeholder={t("newsletterPlaceholder" as never) || "Your email"}
                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                  <button
                    type="submit"
                    className="bg-[var(--accent)] text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--accent-hover)] transition-colors flex-shrink-0"
                    aria-label={t("subscribe" as never) || "Subscribe"}
                  >
                    <ArrowRight size={16} weight="bold" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[12px] text-white/40">
            © {new Date().getFullYear()} ICCB — International Convention City Bashundhara. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" locale={locale} className="text-[12px] text-white/40 hover:text-white/70 transition-colors">
              {t("privacy" as never)}
            </Link>
            <Link href="/terms" locale={locale} className="text-[12px] text-white/40 hover:text-white/70 transition-colors">
              {t("terms" as never)}
            </Link>
            <Link href="/faq" locale={locale} className="text-[12px] text-white/40 hover:text-white/70 transition-colors">
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
