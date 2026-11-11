import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, isRTL } from "@/lib/i18n/routing";
import type { Locale } from "@/lib/i18n/routing";
import { MockAdapterProvider } from "@/components/providers/MockAdapterProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { LocaleHtmlSync } from "@/components/providers/LocaleHtmlSync";

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://iccb.com.bd";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      template: `%s | ICCB`,
      default: "ICCB — International Convention City Bashundhara",
    },
    description: t("homeDescription"),
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        en: `${siteUrl}/en`,
        bn: `${siteUrl}/bn`,
        ar: `${siteUrl}/ar`,
        zh: `${siteUrl}/zh`,
        "x-default": `${siteUrl}/en`,
      },
    },
    openGraph: {
      type: "website",
      siteName: "ICCB — International Convention City Bashundhara",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const validLocale = routing.locales.includes(locale as Locale) ? (locale as Locale) : null;
  if (!validLocale) {
    notFound();
  }

  const messages = await getMessages();
  const dir = isRTL(validLocale) ? "rtl" : "ltr";

  return (
    <>
      {/* Syncs lang/dir attributes on <html> for accessibility */}
      <LocaleHtmlSync locale={validLocale} dir={dir} />
      <NextIntlClientProvider messages={messages} locale={validLocale}>
        <MockAdapterProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </MockAdapterProvider>
      </NextIntlClientProvider>
    </>
  );
}
