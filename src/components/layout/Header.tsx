"use client";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import { localeNames, type Locale } from "@/lib/i18n/routing";
import {
  List, X, Sun, Moon, Globe, ArrowRight, SquaresFour, SignIn,
} from "@phosphor-icons/react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { href: "/about", labelKey: "about" },
  { href: "/why-iccb", labelKey: "whyIccb" },
  { href: "/venues", labelKey: "venues" },
  { href: "/expo-zone", labelKey: "expoZone" },
  { href: "/services", labelKey: "services" },
  { href: "/gallery", labelKey: "gallery" },
  { href: "/contact", labelKey: "contact" },
] as const;

// Pages that have a full-screen dark hero — header stays transparent at top
const DARK_HERO_PATHS = ["", "/", "/venues", "/expo-zone", "/gallery", "/about", "/why-iccb"];

interface HeaderProps {
  locale: Locale;
  transparent?: boolean;
  dark?: boolean;
}

export function Header({ locale, transparent = false, dark = false }: HeaderProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(dark);
  const lastScrollY = useRef(0);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      if (y > lastScrollY.current && y > 200) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = y;

      const el = document.getElementById("scroll-progress");
      if (el) {
        const pct = (y / (document.body.scrollHeight - window.innerHeight)) * 100;
        el.style.width = `${Math.min(pct, 100)}%`;
      }
    };
    // Run immediately so refreshing-while-scrolled works correctly
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Determine if the current page has a dark hero (transparent header should show white text)
  const basePath = pathname.replace(new RegExp(`^/${locale}`), "") || "/";
  const pageHasDarkHero = DARK_HERO_PATHS.some(
    (p) => basePath === p || basePath === `${p}/`
  );
  const isTransparent = transparent && !scrolled && pageHasDarkHero;

  // Text color: white only when truly transparent over a dark hero
  const textColor = isTransparent ? "text-white" : "text-[var(--ink)]";
  const logoColor = isTransparent ? "text-white" : "text-[var(--ink)]";

  function toggleTheme() {
    const html = document.documentElement;
    html.classList.toggle("dark");
    setIsDark(html.classList.contains("dark"));
  }

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          isTransparent
            ? "bg-transparent"
            : "bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--line)]",
          hidden && !menuOpen ? "-translate-y-full" : "translate-y-0"
        )}
      >
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)] h-16 md:h-20 flex items-center justify-between">
          {/* Left: menu button */}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className={cn(
              "flex items-center gap-2 text-[11px] font-medium tracking-[0.18em] uppercase",
              textColor,
              "hover:opacity-70 transition-opacity"
            )}
          >
            <List size={20} weight="light" />
            <span className="hidden sm:inline">Menu</span>
          </button>

          {/* Centre: logo */}
          <Link href="/" locale={locale} className={cn("flex flex-col items-center", logoColor)}>
            <span className="font-display text-2xl md:text-3xl font-light tracking-[0.12em] uppercase leading-none">
              ICCB
            </span>
            <span className="text-[9px] tracking-[0.14em] uppercase opacity-70 hidden md:block mt-0.5">
              International Convention City Bashundhara
            </span>
          </Link>

          {/* Right: lang + theme + CTA */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Language switcher */}
            <div className="relative group hidden md:block">
              <button
                className={cn(
                  "flex items-center gap-1 text-[11px] font-medium tracking-[0.1em] uppercase",
                  textColor, "hover:opacity-70 transition-opacity"
                )}
              >
                <Globe size={16} weight="light" />
                <span>{locale.toUpperCase()}</span>
              </button>
              <div className="absolute top-full end-0 mt-2 py-1 bg-[var(--surface)] border border-[var(--line)] rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity min-w-[120px]">
                {(Object.entries(localeNames) as [Locale, string][]).map(([loc, name]) => (
                  <Link
                    key={loc}
                    href={pathname.replace(`/${locale}`, `/${loc}`) || "/"}
                    locale={loc}
                    className={cn(
                      "block px-4 py-2 text-[13px] text-[var(--ink)] hover:text-[var(--accent)] transition-colors",
                      loc === locale && "text-[var(--accent)]"
                    )}
                  >
                    {name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Light mode" : "Dark mode"}
              className={cn("hover:opacity-70 transition-opacity", textColor)}
            >
              {isDark ? <Sun size={18} weight="light" /> : <Moon size={18} weight="light" />}
            </button>

            {/* Dashboard link */}
            <Link
              href="/dashboard"
              className={cn(
                "hidden md:flex items-center gap-1.5 text-[11px] font-medium tracking-[0.1em] uppercase hover:opacity-70 transition-opacity",
                textColor
              )}
            >
              <SquaresFour size={16} weight="light" />
              <span>Dashboard</span>
            </Link>

            {/* Sign in link */}
            <Link
              href="/sign-in"
              locale={locale}
              className={cn(
                "hidden md:flex items-center gap-1.5 text-[11px] font-medium tracking-[0.1em] uppercase hover:opacity-70 transition-opacity",
                textColor
              )}
            >
              <SignIn size={16} weight="light" />
              <span>Sign In</span>
            </Link>

            {/* Book now CTA */}
            <Link
              href="/booking"
              locale={locale}
              className="hidden md:flex items-center gap-2 bg-[var(--accent)] text-[var(--on-accent)] px-5 py-2 rounded-full text-[11px] font-medium tracking-[0.12em] uppercase hover:bg-[var(--accent-hover)] transition-colors"
            >
              {t("bookNow" as never) || "Book Now"}
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </div>
      </header>

      {/* Full-screen overlay menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-[var(--bg-deep)] flex overflow-hidden"
          >
            {/* Menu content */}
            <div className="flex-1 flex flex-col p-8 md:p-12 overflow-y-auto">
              <div className="flex justify-between items-center mb-12 md:mb-16">
                <span className="text-white/60 text-[11px] tracking-[0.18em] uppercase">
                  ICCB · DHAKA — SINCE 2015
                </span>
                <button
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="text-white hover:text-[var(--accent)] transition-colors"
                >
                  <X size={28} weight="light" />
                </button>
              </div>

              <nav className="flex-1" aria-label="Main navigation">
                <ul className="space-y-1">
                  {NAV_LINKS.map(({ href, labelKey }, i) => (
                    <motion.li
                      key={href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        href={href}
                        locale={locale}
                        onClick={() => setMenuOpen(false)}
                        className="group flex items-center justify-between py-3 md:py-4 border-b border-white/10 hover:border-[var(--accent)] transition-colors"
                      >
                        <span className="font-display text-3xl md:text-5xl text-white font-light tracking-tight uppercase group-hover:text-[var(--accent)] transition-colors">
                          {t(labelKey as never)}
                        </span>
                        <ArrowRight
                          size={24}
                          weight="light"
                          className="text-white/40 group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all"
                        />
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/enquiry"
                  locale={locale}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 bg-[var(--accent)] text-white px-8 py-4 rounded-full text-[13px] font-medium tracking-[0.12em] uppercase hover:bg-[var(--accent-hover)] transition-colors"
                >
                  {t("makeEnquiry" as never)}
                </Link>
                <Link
                  href="/booking"
                  locale={locale}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 border border-white/30 text-white px-8 py-4 rounded-full text-[13px] font-medium tracking-[0.12em] uppercase hover:border-white hover:bg-white/10 transition-colors"
                >
                  {t("bookNow" as never)}
                </Link>
              </div>

              {/* Dashboard + Sign In row */}
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 border border-white/15 text-white/60 hover:text-white hover:border-white/40 px-5 py-2.5 rounded-full text-[12px] font-medium tracking-[0.12em] uppercase transition-colors"
                >
                  <SquaresFour size={14} weight="light" />
                  Dashboard
                </Link>
                <Link
                  href="/sign-in"
                  locale={locale}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 border border-white/15 text-white/60 hover:text-white hover:border-white/40 px-5 py-2.5 rounded-full text-[12px] font-medium tracking-[0.12em] uppercase transition-colors"
                >
                  <SignIn size={14} weight="light" />
                  Sign In
                </Link>
              </div>

              {/* Language switcher in menu */}
              <div className="mt-6 flex gap-4">
                {(Object.entries(localeNames) as [Locale, string][]).map(([loc, name]) => (
                  <Link
                    key={loc}
                    href={pathname.replace(`/${locale}`, `/${loc}`) || "/"}
                    locale={loc}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "text-[12px] text-white/50 hover:text-white transition-colors",
                      loc === locale && "text-white underline underline-offset-4"
                    )}
                  >
                    {name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right image panel — desktop only */}
            <div className="hidden lg:block w-96 relative overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=90&w=800"
                alt="ICCB convention hall"
                fill
                className="object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-deep)] to-transparent" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
