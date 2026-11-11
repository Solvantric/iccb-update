import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { newsArticles, getArticleBySlug } from "@/data/news";
import { RevealBlock } from "@/components/motion/RevealBlock";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";

export async function generateStaticParams() {
  return newsArticles.flatMap((a) =>
    routing.locales.map((locale) => ({ locale, slug: a.slug }))
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: `${article.title.en} — ICCB News`,
    description: article.excerpt.en,
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as Locale) ? rawLocale : "en") as Locale;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const others = newsArticles.filter((a) => a.id !== article.id);

  return (
    <div className="pt-20 md:pt-24">
      {/* Hero */}
      <div className="relative h-[45vh] min-h-[280px] overflow-hidden">
        <Image
          src={article.image}
          alt={article.title.en}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" />
        <div className="absolute bottom-0 inset-x-0 px-[clamp(1rem,4vw,3rem)] pb-8">
          <div className="max-w-[1440px] mx-auto">
            <span className="text-[10px] uppercase tracking-wider text-white bg-[var(--accent)] px-3 py-1.5 rounded-full font-medium">
              {article.category}
            </span>
            <h1 className="display-lg text-white mt-3 max-w-3xl">{article.title.en}</h1>
            <p className="text-white/60 text-[13px] mt-3">
              {formatDate(article.publishedAt)} · By {article.author}
            </p>
          </div>
        </div>
      </div>

      <section className="py-14 md:py-20">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Article body */}
            <div className="lg:col-span-2">
              <RevealBlock>
                <p className="text-[var(--ink)] text-[16px] leading-relaxed mb-6">
                  {article.excerpt.en}
                </p>
                <p className="text-[var(--ink-muted)] text-[15px] leading-relaxed">
                  {article.content.en}
                </p>
                {article.isSample && (
                  <div className="mt-6 bg-[var(--bg-soft)] border border-[var(--line)] rounded-lg p-4">
                    <p className="text-[var(--ink-muted)] text-[13px]">
                      <strong className="text-[var(--ink)]">Note:</strong> This is sample content. Replace with actual news articles.
                    </p>
                  </div>
                )}
              </RevealBlock>

              <RevealBlock className="mt-8">
                <Link
                  href="/news"
                  locale={locale}
                  className="inline-flex items-center gap-2 text-[var(--ink-muted)] text-[12px] font-medium tracking-[0.12em] uppercase hover:text-[var(--accent)] transition-colors"
                >
                  <ArrowLeft size={12} />
                  Back to News
                </Link>
              </RevealBlock>
            </div>

            {/* Sidebar — other articles */}
            <div>
              <p className="meta-label mb-4">More News</p>
              <div className="space-y-5">
                {others.map((a) => (
                  <Link
                    key={a.id}
                    href={`/news/${a.slug}`}
                    locale={locale}
                    className="group flex gap-3 items-start hover:text-[var(--accent)] transition-colors"
                  >
                    <div className="w-16 h-12 relative overflow-hidden rounded flex-shrink-0">
                      <Image src={a.image} alt={a.title.en} fill className="object-cover" sizes="64px" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                        {a.title.en}
                      </p>
                      <p className="text-[11px] text-[var(--ink-muted)] mt-1">{formatDate(a.publishedAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-8 bg-[var(--surface)] border border-[var(--line)] rounded-lg p-5">
                <h3 className="font-display text-lg text-[var(--ink)] font-light uppercase mb-3">
                  Plan an Event
                </h3>
                <p className="text-[var(--ink-muted)] text-[13px] mb-4">
                  Ready to host your own world-class event at ICCB?
                </p>
                <Link
                  href="/booking"
                  locale={locale}
                  className="flex items-center justify-center gap-2 bg-[var(--accent)] text-white rounded-full py-3 text-[11px] font-medium tracking-[0.12em] uppercase hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Check Availability
                  <ArrowRight size={12} weight="bold" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
