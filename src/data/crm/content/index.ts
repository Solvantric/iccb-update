import type { ContentItem, ContentSection } from "@/types/crm";
import { heroSlides, galleryImages } from "@/data/images";
import { halls } from "@/data/halls";
import { services } from "@/data/services";
import { ventures } from "@/data/ventures";
import { newsArticles } from "@/data/news";
import { faqItems } from "@/data/faq";
import { testimonials } from "@/data/testimonials";
import { clientLogos } from "@/data/expo";
import { menuPackagesSeed } from "../menu-packages";
import { base } from "../_helpers";

type Item = Omit<ContentItem, "id" | "createdAt" | "updatedAt" | "deletedAt" | "isSample" | "section" | "order" | "published"> & { published?: boolean };

const make = (section: ContentSection, rows: Item[]): ContentItem[] =>
  rows.map((r, i) => ({ ...base(`cms-${section}-${i + 1}`, { isSample: true }), section, order: i + 1, published: r.published ?? true, ...r }));

export const heroContent = make("hero", heroSlides.map((h, i) => ({
  title: ["South Asia's largest event venue", "Weddings worth remembering", "Conferences at world scale", "Expos that move industries"][i] ?? h.alt.en,
  subtitle: h.alt.en,
  image: h.src,
  href: "/booking",
})));

export const venueContent = make("venues", halls.map((h) => ({ title: h.name.en, subtitle: `Theatre ${h.capacity.theatre ?? "—"} · Banquet ${h.capacity.banquet ?? "—"}`, image: h.images[0], href: `/venues/${h.slug}` })));
export const serviceContent = make("services", services.map((s) => ({ title: s.name.en, subtitle: s.tagline.en, body: s.description.en, image: s.image, href: `/services/${s.slug}` })));
export const ventureContent = make("ventures", ventures.map((v) => ({ title: v.name, subtitle: v.tagline, body: v.description, image: v.image, href: `/ventures/${v.slug}` })));
export const menuContent = make("menu", menuPackagesSeed.map((m) => ({ title: m.name, subtitle: `${m.cuisine} · from ৳${m.perHead.toLocaleString("en-US")}/head`, body: m.items.join(", ") })));
export const galleryContent = make("gallery", galleryImages.map((g) => ({ title: g.alt.en, subtitle: g.category, image: g.src })));
export const newsContent = make("news", newsArticles.map((n) => ({ title: n.title.en, subtitle: n.category, body: n.excerpt.en, image: n.image, href: `/news/${n.slug}` })));
export const faqContent = make("faq", faqItems.map((f) => ({ title: f.question.en, subtitle: f.category, body: f.answer.en })));
export const testimonialContent = make("testimonials", testimonials.map((t) => ({ title: t.name, subtitle: [t.role, t.organization].filter(Boolean).join(", "), body: t.content.en, image: t.image })));
export const expoClientContent = make("expo_clients", clientLogos.map((c) => ({ title: c.name, subtitle: c.abbr, image: c.logo })));

export const contentSeed: ContentItem[] = [
  ...heroContent,
  ...venueContent,
  ...serviceContent,
  ...ventureContent,
  ...menuContent,
  ...galleryContent,
  ...newsContent,
  ...faqContent,
  ...testimonialContent,
  ...expoClientContent,
];
