import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://iccbbg.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/", "/portal/", "/bn/portal/", "/ar/portal/", "/zh/portal/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
