import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { CheckCircle, ArrowRight } from "@phosphor-icons/react/dist/ssr";

export const metadata = {
  title: "Thank You — ICCB",
  robots: { index: false },
};

export default async function ThankYouPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as Locale) ? rawLocale : "en") as Locale;

  return (
    <div className="pt-[88px] sm:pt-[112px] min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <CheckCircle size={56} className="text-[var(--status-success)] mx-auto mb-5" weight="light" />
        <h1 className="font-display text-3xl text-[var(--ink)] font-light uppercase mb-3">
          Thank You!
        </h1>
        <p className="text-[var(--ink-muted)] text-[15px] mb-8">
          Your request has been received. Our team will contact you within 2 hours to confirm details.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            locale={locale}
            className="inline-flex items-center gap-2 bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] shadow-[0_8px_22px_-10px_var(--accent-glow)] hover:-translate-y-px text-white rounded-[var(--radius-btn)] px-7 py-3.5 text-[12px] font-bold tracking-[0.12em] uppercase hover:brightness-110 transition-colors"
          >
            Back to Home
            <ArrowRight size={13} weight="bold" />
          </Link>
          <Link
            href="/venues"
            locale={locale}
            className="inline-flex items-center gap-2 border-2 border-[var(--accent)] text-[var(--ink)] rounded-[var(--radius-btn)] px-7 py-3.5 text-[12px] font-bold tracking-[0.12em] uppercase hover:bg-[var(--accent)] hover:text-white transition-colors"
          >
            Explore Halls
          </Link>
        </div>
      </div>
    </div>
  );
}
