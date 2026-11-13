"use client";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import { localeNames, type Locale } from "@/lib/i18n/routing";
import {
  List, X, Sun, Moon, Globe, ArrowRight,
  CaretDown, Buildings, ForkKnife, Package, CalendarCheck,
  Crown, Sparkle,
} from "@phosphor-icons/react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Nav structure ──────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { href: "/",        labelKey: "home" },
  { href: "/about",    labelKey: "about" },
  { href: "/why-iccb", labelKey: "whyIccb" },
  {
    href: "/venues", labelKey: "venues",
    children: [
      { href: "/venues", label: "All Halls", icon: Buildings },
      { href: "/venues/gulnaksha", label: "Gulnaksha Hall", icon: Buildings },
      { href: "/venues/pushpoguchcho", label: "Pushpoguchcho Hall", icon: Buildings },
      { href: "/venues/rajdarshan", label: "Rajdarshan Hall", icon: Buildings },
    ],
  },
  {
    href: "/services", labelKey: "services",
    children: [
      { href: "/services/venue-rental",      label: "Venue Rental",      icon: Buildings },
      { href: "/services/catering",          label: "Catering",          icon: ForkKnife },
      { href: "/services/decoration",        label: "Decoration",        icon: Sparkle },
      { href: "/services/event-management",  label: "Event Management",  icon: CalendarCheck },
      { href: "/services/heritage-restaurant", label: "Heritage Restaurant", icon: Crown },
      { href: "/services/expo-support",      label: "Expo Support",      icon: Package },
    ],
  },
  { href: "/expo-zone", labelKey: "expoZone" },
  { href: "/contact",   labelKey: "contact" },
] as const;

interface HeaderProps {
  locale: Locale;
}

export function Header({ locale }: HeaderProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      setScrolled(y > 8);
      const el = document.getElementById("scroll-progress");
      if (el) {
        const pct = (y / (document.body.scrollHeight - window.innerHeight)) * 100;
        el.style.width = `${Math.min(pct, 100)}%`;
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  /* Active path check */
  const basePath = pathname.replace(new RegExp(`^/${locale}`), "") || "/";
  const isActive = (href: string) =>
    href === "/" ? basePath === "/" : basePath.startsWith(href);

  /* Dropdown handlers */
  const openDD = (key: string) => {
    if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
    setOpenDropdown(key);
  };
  const closeDD = () => {
    dropdownTimer.current = setTimeout(() => setOpenDropdown(null), 120);
  };

  return (
    <>
      {/* Header — mirrors bashundharaphcpile.com: max-w-6xl, 88/112px tall, shrinks to 64px on scroll */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--line)] bg-bg/80 backdrop-blur-md">
        <div
          className={cn(
            "mx-auto flex max-w-6xl items-center justify-between px-4 transition-[height] duration-300 ease-out sm:px-6",
            scrolled ? "h-16" : "h-[88px] sm:h-[112px]"
          )}
        >
          {/* Logo — 72% of header height */}
          <Link href="/" locale={locale} className="flex h-full items-center" aria-label="ICCB — home">
            <Image
              src="https://res.cloudinary.com/sgufp9aq/image/upload/v1794418824/iccb-logo.png"
              alt="ICCB — International Convention City Bashundhara"
              width={173}
              height={161}
              className="h-[72%] w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-5 lg:flex xl:gap-7" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              const hasChildren = "children" in link && link.children;
              const linkCls = cn(
                "flex items-center gap-1 whitespace-nowrap border-b-2 pb-1 text-sm font-medium transition-colors",
                active
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--ink)] hover:text-[var(--accent)]"
              );

              if (!hasChildren) {
                return (
                  <span key={link.href}>
                    <Link href={link.href} locale={locale} className={linkCls}>
                      {t(link.labelKey as never)}
                    </Link>
                  </span>
                );
              }

              const open = openDropdown === link.href;
              return (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => openDD(link.href)}
                  onMouseLeave={closeDD}
                >
                  <Link
                    href={link.href}
                    locale={locale}
                    aria-expanded={open}
                    className={linkCls}
                  >
                    {t(link.labelKey as never)}
                    <CaretDown
                      size={16}
                      className={cn("transition-transform", open && "rotate-180")}
                      aria-hidden
                    />
                  </Link>

                  <div
                    className={cn(
                      "absolute start-0 top-full z-50 pt-4 transition-opacity",
                      open ? "opacity-100" : "pointer-events-none opacity-0"
                    )}
                  >
                    <ul className="min-w-[15rem] overflow-hidden rounded-md border border-[var(--line)] bg-[var(--bg)] py-1 shadow-lg">
                      {(link as typeof NAV_LINKS[3]).children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            locale={locale}
                            tabIndex={open ? 0 : -1}
                            onClick={() => setOpenDropdown(null)}
                            className={cn(
                              "block whitespace-nowrap px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-soft)] hover:text-[var(--accent)]",
                              basePath === child.href ? "text-[var(--accent)]" : "text-[var(--ink)]"
                            )}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}

            {/* Divider */}
            <span aria-hidden="true" className="h-6 w-px bg-[var(--line)]" />

            {/* Language + theme */}
            <div className="flex items-center gap-3">
              <div className="relative group">
                <button
                  type="button"
                  aria-label="Change language"
                  className="flex items-center gap-1 whitespace-nowrap text-sm font-medium text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
                >
                  <Globe size={16} />
                  <span>{locale.toUpperCase()}</span>
                </button>
                <div className="absolute end-0 top-full z-50 pt-4 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
                  <ul className="min-w-[10rem] overflow-hidden rounded-md border border-[var(--line)] bg-[var(--bg)] py-1 shadow-lg">
                    {(Object.entries(localeNames) as [Locale, string][]).map(([loc, name]) => (
                      <li key={loc}>
                        <Link
                          href={pathname.replace(`/${locale}`, `/${loc}`) || "/"}
                          locale={loc}
                          className={cn(
                            "block whitespace-nowrap px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-soft)] hover:text-[var(--accent)]",
                            loc === locale ? "text-[var(--accent)]" : "text-[var(--ink)]"
                          )}
                        >
                          {name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? "Light mode" : "Dark mode"}
                className="flex items-center text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>

            {/* CTA */}
            <Link
              href="/booking"
              locale={locale}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {t("bookNow" as never)}
              <ArrowRight size={16} />
            </Link>
          </nav>

          {/* Mobile: theme + hamburger */}
          <div className="flex items-center gap-1 lg:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Light mode" : "Dark mode"}
              className="inline-flex items-center justify-center p-2 text-[var(--ink)]"
            >
              {isDark ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t("openMenu" as never)}
              aria-expanded={menuOpen}
              className="inline-flex items-center justify-center p-2 text-[var(--ink)]"
            >
              <List size={32} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile full-height drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-[90] bg-black/40 lg:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 end-0 z-[100] w-80 bg-[var(--bg)] border-s border-[var(--line)] flex flex-col overflow-y-auto lg:hidden"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--line)]">
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image
                    src="https://res.cloudinary.com/sgufp9aq/image/upload/v1794418824/iccb-logo.png"
                    alt="ICCB"
                    fill
                    className="object-contain"
                  />
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 py-4" aria-label="Mobile navigation">
                {NAV_LINKS.map(({ href, labelKey }, i) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={href}
                      locale={locale}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-6 py-3.5 text-[15px] font-semibold border-b border-[var(--line)] transition-colors",
                        isActive(href)
                          ? "text-[var(--accent)]"
                          : "text-[var(--ink)] hover:text-[var(--accent)] hover:bg-[var(--bg-tint)]"
                      )}
                    >
                      {t(labelKey as never)}
                      <ArrowRight size={16} className="text-[var(--accent)]" />
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="px-6 py-5 space-y-3 border-t border-[var(--line)]">
                <Link
                  href="/booking"
                  locale={locale}
                  onClick={() => setMenuOpen(false)}
                  className="btn btn-primary w-full justify-center"
                >
                  Book Now <ArrowRight size={14} weight="bold" />
                </Link>
                <Link
                  href="/enquiry"
                  locale={locale}
                  onClick={() => setMenuOpen(false)}
                  className="btn btn-secondary w-full justify-center"
                >
                  Make an Enquiry
                </Link>
              </div>

              <div className="px-6 pb-5 flex items-center gap-4">
                {(Object.entries(localeNames) as [Locale, string][]).map(([loc, name]) => (
                  <Link
                    key={loc}
                    href={pathname.replace(`/${locale}`, `/${loc}`) || "/"}
                    locale={loc}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "text-[12px] text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors",
                      loc === locale && "text-[var(--accent)] font-semibold"
                    )}
                  >
                    {name}
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
