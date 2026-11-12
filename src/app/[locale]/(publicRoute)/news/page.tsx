import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { newsArticles } from "@/data/news";
import { RevealBlock, RevealGroup, RevealItem } from "@/components/motion/RevealBlock";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "News & Updates — ICCB",
  description: "Latest news, event announcements, and updates from ICCB — International Convention City Bashundhara.",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
}

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as Locale) ? rawLocale : "en") as Locale;

  const [featured, ...rest] = newsArticles;

  return (
    <div className="pt-[88px] sm:pt-[112px]">
      {/* Page header */}
      <section className="bg-[var(--bg-soft)] py-12 border-b border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock>
            <span className="meta-label block mb-2">(NEWS)</span>
            <h1 className="display-lg text-[var(--ink)]">NEWS & UPDATES</h1>
            <p className="text-[11px] text-[var(--ink-muted)] mt-2">
              Sample articles — replace with actual news content
            </p>
          </RevealBlock>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          {/* Featured article */}
          {featured && (
            <RevealBlock className="mb-12">
              <Link href={`/news/${featured.slug}`} locale={locale} className="group block">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-[16/9] lg:aspect-auto lg:min-h-[300px] overflow-hidden">
                    <Image
                      src={featured.image}
                      alt={featured.title.en}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  </div>
                  <div className="p-6 md:p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--accent)] font-medium bg-[var(--accent)]/10 px-2.5 py-1 rounded-full">
                        {featured.category}
                      </span>
                      <span className="text-[var(--ink-muted)] text-[12px]">Featured</span>
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl text-[var(--ink)] font-light mb-4 group-hover:text-[var(--accent)] transition-colors">
                      {featured.title.en}
                    </h2>
                    <p className="text-[var(--ink-muted)] text-[15px] leading-relaxed mb-5">
                      {featured.excerpt.en}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--ink-muted)] text-[13px]">{formatDate(featured.publishedAt)}</span>
                      <span className="flex items-center gap-2 text-[var(--accent-text)] text-[12px] font-medium tracking-[0.12em] uppercase group-hover:gap-3 transition-all">
                        Read More <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </RevealBlock>
          )}

          {/* Rest of articles */}
          {rest.length > 0 && (
            <RevealGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rest.map((article) => (
                <RevealItem key={article.id}>
                  <Link href={`/news/${article.slug}`} locale={locale} className="group block">
                    <article className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <Image
                          src={article.image}
                          alt={article.title.en}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <div className="absolute top-3 start-3">
                          <span className="text-[10px] uppercase tracking-wider text-white bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full font-medium">
                            {article.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h2 className="font-display text-xl text-[var(--ink)] font-light group-hover:text-[var(--accent)] transition-colors mb-3 flex-1">
                          {article.title.en}
                        </h2>
                        <p className="text-[var(--ink-muted)] text-[14px] leading-relaxed mb-4 line-clamp-2">
                          {article.excerpt.en}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--ink-muted)] text-[12px]">{formatDate(article.publishedAt)}</span>
                          <span className="flex items-center gap-1.5 text-[var(--accent-text)] text-[12px] font-medium tracking-[0.12em] uppercase group-hover:gap-2.5 transition-all">
                            Read <ArrowRight size={11} />
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </div>
      </section>
    </div>
  );
}
