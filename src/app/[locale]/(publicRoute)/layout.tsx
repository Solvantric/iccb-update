export const instant = false;
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingDock } from "@/components/layout/FloatingDock";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { ToastProvider } from "@/components/ui/Toast";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as Locale) ? rawLocale : "en") as Locale;

  return (
    <ToastProvider>
      <Header locale={locale} transparent />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer locale={locale} />
      <FloatingDock />
      <ChatWidget locale={locale} />
      <CookieBanner />
    </ToastProvider>
  );
}
