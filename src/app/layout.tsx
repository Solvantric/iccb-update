import type { Metadata } from "next";
import { Inter, Oswald, Noto_Sans, Noto_Sans_Bengali, Noto_Sans_Arabic, Noto_Sans_SC } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
  preload: true,
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-noto",
  display: "swap",
  preload: false,
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "600", "700"],
  variable: "--font-noto-bengali",
  display: "swap",
  preload: false,
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
  variable: "--font-noto-arabic",
  display: "swap",
  preload: false,
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-sc",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    template: "%s | ICCB",
    default: "ICCB — International Convention City Bashundhara",
  },
  description:
    "South Asia's premier convention, exhibition, and events destination in Dhaka, Bangladesh.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      className={`${inter.variable} ${oswald.variable} ${notoSans.variable} ${notoSansBengali.variable} ${notoSansArabic.variable} ${notoSansSC.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen flex flex-col bg-bg text-ink antialiased">
        <div id="scroll-progress" aria-hidden="true" />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
