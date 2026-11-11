import type { MetadataRoute } from "next";
import { routing } from "@/lib/i18n/routing";
import { halls } from "@/data/halls";
import { services } from "@/data/services";
import { newsArticles } from "@/data/news";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://iccbbg.com";

function url(path: string, locale: string) {
  return locale === routing.defaultLocale
    ? `${BASE}${path}`
    : `${BASE}/${locale}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "/",
    "/venues",
    "/services",
    "/menu",
    "/booking",
    "/enquiry",
    "/expo-zone",
    "/gallery",
    "/news",
    "/about",
    "/contact",
    "/faq",
    "/privacy",
    "/terms",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of staticPaths) {
      entries.push({ url: url(path, locale), changeFrequency: "weekly", priority: path === "/" ? 1 : 0.8 });
    }
    for (const hall of halls) {
      entries.push({ url: url(`/venues/${hall.slug}`, locale), changeFrequency: "monthly", priority: 0.7 });
    }
    for (const service of services) {
      entries.push({ url: url(`/services/${service.slug}`, locale), changeFrequency: "monthly", priority: 0.7 });
    }
    for (const article of newsArticles) {
      entries.push({ url: url(`/news/${article.slug}`, locale), changeFrequency: "monthly", priority: 0.6 });
    }
  }

  return entries;
}
