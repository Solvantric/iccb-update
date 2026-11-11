import type { Metadata } from "next";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { cateringPackages } from "@/data/pricing";
import { RevealBlock, RevealGroup, RevealItem } from "@/components/motion/RevealBlock";
import { ArrowRight, CheckCircle, Tag } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Catering Menu — ICCB",
  description: "Explore ICCB's catering packages: Mughal Classic, Continental, and Multi-Cuisine Grand. Sample menus for events from 50 to 10,000 guests.",
};

const CUISINE_DETAILS = {
  Mughal: {
    color: "var(--accent)",
    description: "Authentic Mughal recipes perfected over centuries — rich gravies, slow-cooked meats, and aromatic rice dishes.",
    items: [
      "Chicken/Beef Biryani (Basmati, Saffron)",
      "Mutton Rezala",
      "Chicken Bhuna Masala",
      "Dal Tadka",
      "Naan & Paratha",
      "Borhani (Spiced Yogurt Drink)",
      "Firni / Zarda",
    ],
  },
  Continental: {
    color: "#3B82F6",
    description: "Classic European and international dishes with a focus on fresh ingredients and refined presentation.",
    items: [
      "Cream of Mushroom Soup",
      "Fresh Garden Salad Bar",
      "Grilled Chicken / Fish Fillet",
      "Pasta Alfredo / Arrabiata",
      "Dinner Rolls",
      "Soft Drinks & Juices",
      "Tiramisu / Panna Cotta",
    ],
  },
  Multi: {
    color: "#8B5CF6",
    description: "A grand buffet spanning Mughal, Continental, and Chinese cuisines — perfect for large galas and international events.",
    items: [
      "Live Cooking Stations (3 cuisines)",
      "Seafood Platter",
      "Sushi & Chinese Corner",
      "Full Mughal Spread",
      "Continental Carving Station",
      "Premium Mocktail Bar",
      "Dessert Buffet (8 items)",
    ],
  },
};

export default async function MenuPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as Locale) ? rawLocale : "en") as Locale;

  return (
    <div className="pt-20 md:pt-24">
      {/* Page header */}
      <section className="bg-[var(--bg-deep)] py-14 border-b border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock>
            <span className="text-white/50 text-[11px] tracking-[0.18em] uppercase block mb-2">(CATERING)</span>
            <h1 className="display-lg text-white">OUR MENU</h1>
            <p className="text-white/60 text-[16px] mt-3 max-w-xl">
              Three curated packages designed for every occasion and guest count. All items are sample — final menus confirmed with our catering team.
            </p>
          </RevealBlock>
        </div>
      </section>

      {/* Package overview */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealGroup className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {cateringPackages.map((pkg) => {
              const detail = CUISINE_DETAILS[pkg.cuisine as keyof typeof CUISINE_DETAILS];
              return (
                <RevealItem key={pkg.id}>
                  <article className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] overflow-hidden hover:shadow-lg transition-shadow">
                    <div
                      className="h-2"
                      style={{ backgroundColor: detail?.color }}
                    />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="font-display text-2xl text-[var(--ink)] font-light uppercase">
                            {pkg.name.en}
                          </h2>
                          <p className="text-[var(--ink-muted)] text-[13px] mt-1">{detail?.description}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {pkg.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border border-[var(--line)] text-[var(--ink-muted)]"
                          >
                            <Tag size={9} />
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="bg-[var(--bg-soft)] rounded-lg p-4 mb-5">
                        <p className="text-[11px] text-[var(--ink-muted)] uppercase tracking-wider mb-3">Sample Menu Items</p>
                        <ul className="space-y-2">
                          {(detail?.items || pkg.items.map((i) => i.en)).map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-[var(--ink)] text-[13px]">
                              <CheckCircle size={14} className="text-[var(--accent)] flex-shrink-0 mt-0.5" weight="light" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="border-t border-[var(--line)] pt-4 flex items-center justify-between">
                        <div>
                          <p className="font-display text-3xl text-[var(--ink)] font-light">৳{pkg.pricePerHead.toLocaleString()}</p>
                          <p className="text-[11px] text-[var(--ink-muted)] tracking-wider uppercase mt-0.5">per head · excl. tax</p>
                        </div>
                        <Link
                          href="/enquiry"
                          locale={locale}
                          className="flex items-center gap-1.5 bg-[var(--accent)] text-white rounded-full px-4 py-2.5 text-[11px] font-medium tracking-[0.12em] uppercase hover:bg-[var(--accent-hover)] transition-colors"
                        >
                          Book
                          <ArrowRight size={11} weight="bold" />
                        </Link>
                      </div>
                    </div>
                  </article>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      {/* Catering notes */}
      <section className="py-14 bg-[var(--bg-soft)] border-y border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <RevealBlock>
              <h2 className="font-display text-2xl text-[var(--ink)] font-light uppercase mb-5">
                Catering Notes
              </h2>
              <ul className="space-y-3">
                {[
                  "All food is freshly prepared on-site in our HACCP-compliant kitchen.",
                  "Halal-certified ingredients used across all packages.",
                  "Minimum order: 50 covers for Mughal Classic, 100 for Continental, 150 for Multi-Cuisine Grand.",
                  "Pricing excludes VAT (15%) and service charge (10%).",
                  "Custom menus available upon request — contact our catering team.",
                  "Tastings can be arranged for events over 500 guests.",
                ].map((note, i) => (
                  <li key={i} className="flex items-start gap-3 text-[var(--ink)] text-[14px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 flex-shrink-0" />
                    {note}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-[var(--ink-muted)] mt-5">
                * All menu items and pricing are sample data. Final menus and costs are confirmed by ICCB catering team.
              </p>
            </RevealBlock>

            <RevealBlock>
              <h2 className="font-display text-2xl text-[var(--ink)] font-light uppercase mb-5">
                Heritage Restaurant
              </h2>
              <p className="text-[var(--ink-muted)] text-[15px] leading-relaxed mb-5">
                Beyond event catering, ICCB Heritage Restaurant offers an authentic Mughal-themed à la carte dining experience within the convention complex. Open daily for lunch and dinner.
              </p>
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-lg p-5 space-y-3">
                {[
                  { label: "Cuisine", value: "Mughal — Traditional & Fusion" },
                  { label: "Opened", value: "June 2021" },
                  { label: "Capacity", value: "80 covers (indoor) + Private rooms" },
                  { label: "Hours", value: "12:00–15:00, 18:00–22:00 daily" },
                ].map((info) => (
                  <div key={info.label} className="flex justify-between text-[14px]">
                    <span className="text-[var(--ink-muted)]">{info.label}</span>
                    <span className="text-[var(--ink)] font-medium">{info.value}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/services/heritage-restaurant"
                locale={locale}
                className="inline-flex items-center gap-2 mt-5 text-[var(--accent-text)] text-[12px] font-medium tracking-[0.12em] uppercase hover:gap-3 transition-all"
              >
                Learn More
                <ArrowRight size={12} />
              </Link>
            </RevealBlock>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 text-center">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock>
            <h2 className="display-md text-[var(--ink)] mb-4">PLAN YOUR EVENT MENU</h2>
            <p className="text-[var(--ink-muted)] text-[16px] max-w-md mx-auto mb-8">
              Contact our catering team to arrange a tasting or discuss a custom menu.
            </p>
            <Link
              href="/enquiry"
              locale={locale}
              className="inline-flex items-center gap-2 bg-[var(--accent)] text-white rounded-full px-8 py-4 text-[12px] font-medium tracking-[0.12em] uppercase hover:bg-[var(--accent-hover)] transition-colors"
            >
              Request Catering Quote
              <ArrowRight size={14} weight="bold" />
            </Link>
          </RevealBlock>
        </div>
      </section>
    </div>
  );
}
