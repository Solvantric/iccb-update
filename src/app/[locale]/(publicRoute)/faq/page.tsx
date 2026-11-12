import type { Metadata } from "next";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { faqItems } from "@/data/faq";
import { RevealBlock } from "@/components/motion/RevealBlock";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { FaqAccordion } from "@/components/faq/FaqAccordion";

export const metadata: Metadata = {
  title: "FAQ — ICCB",
  description: "Frequently asked questions about ICCB — venues, booking, catering, facilities, and more.",
};

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "venues", label: "Venues" },
  { id: "booking", label: "Booking" },
  { id: "catering", label: "Catering" },
  { id: "facilities", label: "Facilities" },
  { id: "location", label: "Location" },
  { id: "decoration", label: "Decoration" },
];

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as Locale) ? rawLocale : "en") as Locale;

  return (
    <div className="pt-[88px] sm:pt-[112px]">
      {/* Page header */}
      <section className="bg-[var(--bg-soft)] py-12 border-b border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock>
            <span className="meta-label block mb-2">(FAQ)</span>
            <h1 className="display-lg text-[var(--ink)]">FREQUENTLY ASKED QUESTIONS</h1>
            <p className="text-[var(--ink-muted)] text-[16px] mt-3 max-w-xl">
              Everything you need to know about planning your event at ICCB.
            </p>
          </RevealBlock>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="max-w-3xl mx-auto px-[clamp(1rem,4vw,3rem)]">
          <FaqAccordion items={faqItems} categories={CATEGORIES} />
        </div>
      </section>

      {/* Still have questions */}
      <section className="py-14 bg-[var(--bg-soft)] border-t border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)] text-center">
          <RevealBlock>
            <h2 className="font-display text-2xl text-[var(--ink)] font-light uppercase mb-3">
              Still have questions?
            </h2>
            <p className="text-[var(--ink-muted)] text-[15px] mb-6">
              Our team is happy to help. Send us a message or call directly.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                locale={locale}
                className="inline-flex items-center gap-2 bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] shadow-[0_8px_22px_-10px_var(--accent-glow)] hover:-translate-y-px text-white rounded-[var(--radius-btn)] px-6 py-3.5 text-[12px] font-bold tracking-[0.12em] uppercase hover:brightness-110 transition-colors"
              >
                Contact Us
                <ArrowRight size={13} weight="bold" />
              </Link>
              <Link
                href="/enquiry"
                locale={locale}
                className="inline-flex items-center gap-2 border-2 border-[var(--accent)] text-[var(--ink)] rounded-[var(--radius-btn)] px-6 py-3.5 text-[12px] font-bold tracking-[0.12em] uppercase hover:bg-[var(--accent)] hover:text-white transition-colors"
              >
                Send Enquiry
              </Link>
            </div>
          </RevealBlock>
        </div>
      </section>
    </div>
  );
}
