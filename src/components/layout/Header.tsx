"use client";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import { localeNames, type Locale } from "@/lib/i18n/routing";
import {
  List, X, Sun, Moon, Globe, ArrowRight, SquaresFour,
  CaretDown, Buildings, ForkKnife, Package, CalendarCheck,
  Crown, Sparkle, Briefcase,
} from "@phosphor-icons/react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Nav structure ──────────────────────────────────────────────────────── */
const NAV_LINKS = [
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
  const [isDark, setIsDark] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      setScrolled(y > 40);
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
    const html = document.documentElement;
    html.classList.toggle("dark");
    setIsDark(html.classList.contains("dark"));
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

  /* Header height + logo size based on scroll */
  const headerH = scrolled ? "h-[72px] md:h-[72px]" : "h-[72px] md:h-[96px]";
  const logoH   = scrolled ? "h-10 md:h-12" : "h-12 md:h-[72px]";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 bg-[var(--bg)] border-b border-[var(--line)] transition-all duration-[350ms] ease-out",
          scrolled ? "shadow-[0_2px_16px_rgba(43,42,46,.06)]" : ""
        )}
      >
        <div className={cn(
          "container-wide flex items-center justify-between transition-all duration-[350ms] ease-out",
          headerH
        )}>
          {/* Logo */}
          <Link href="/" locale={locale} className="flex-shrink-0 flex items-center">
            <div
              className="relative transition-all duration-[350ms] ease-out flex-shrink-0"
              style={{ width: scrolled ? "48px" : "64px", height: scrolled ? "48px" : "64px" }}
            >
              <Image
                src="https://res.cloudinary.com/sgufp9aq/image/upload/v1794418824/iccb-logo.png"
                alt="ICCB"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              const hasChildren = "children" in link && link.children;

              return (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => hasChildren && openDD(link.href)}
                  onMouseLeave={closeDD}
                >
                  <Link
                    href={link.href}
                    locale={locale}
                    className={cn(
                      "flex items-center gap-1 px-3 py-2 text-[14px] font-semibold relative transition-colors duration-200",
                      active
                        ? "text-[var(--accent)]"
                        : "text-[var(--ink)] hover:text-[var(--accent)]"
                    )}
                  >
                    {t(link.labelKey as never)}
                    {hasChildren && <CaretDown size={12} weight="bold" />}
                    {/* Active underline */}
                    {active && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute bottom-0 inset-x-3 h-0.5 bg-[var(--accent)] rounded-full"
                      />
                    )}
                  </Link>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {hasChildren && openDropdown === link.href && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        onMouseEnter={() => openDD(link.href)}
                        onMouseLeave={closeDD}
                        className="absolute top-full start-0 mt-1 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card-lg)] shadow-xl min-w-[220px] py-2 z-50"
                      >
                        {(link as typeof NAV_LINKS[2]).children.map((child) => {
                          const ChildIcon = child.icon;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              locale={locale}
                              onClick={() => setOpenDropdown(null)}
                              className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[var(--ink)] hover:text-[var(--accent)] hover:bg-[var(--bg-tint)] transition-colors"
                            >
                              <ChildIcon size={16} weight="duotone" className="text-[var(--ink-muted)]" />
                              {child.label}
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Language switcher */}
            <div className="relative group hidden md:block">
              <button className="flex items-center gap-1 text-[13px] font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors px-2 py-1">
                <Globe size={15} />
                <span>{locale.toUpperCase()}</span>
              </button>
              <div className="absolute top-full end-0 mt-1.5 bg-[var(--surface)] border border-[var(--line)] rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity min-w-[130px] py-1 z-50">
                {(Object.entries(localeNames) as [Locale, string][]).map(([loc, name]) => (
                  <Link
                    key={loc}
                    href={pathname.replace(`/${locale}`, `/${loc}`) || "/"}
                    locale={loc}
                    className={cn(
                      "block px-4 py-2 text-[13px] text-[var(--ink)] hover:text-[var(--accent)] hover:bg-[var(--bg-tint)] transition-colors",
                      loc === locale && "text-[var(--accent)] font-semibold"
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
              className="p-2 text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Dashboard */}
            <Link
              href="/dashboard"
              className="hidden xl:flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors px-2 py-1"
            >
              <SquaresFour size={16} />
            </Link>

            {/* Divider */}
            <span className="hidden md:block w-px h-6 bg-[var(--line)]" />

            {/* Book Now CTA */}
            <Link
              href="/booking"
              locale={locale}
              className="btn btn-primary btn-sm hidden md:inline-flex"
            >
              Book Now
              <ArrowRight size={14} weight="bold" />
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 text-[var(--ink)]"
            >
              <List size={22} />
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
                      <ArrowRight size={16} className="text-[var(--ink-muted)]" />
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
