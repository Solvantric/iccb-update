"use client";
/**
 * Venues mega-menu (desktop dropdown) + compact list for the mobile drawer.
 * Lists "All Venues" and all six halls with small photos; a large preview follows the hovered hall.
 */
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { SquaresFour } from "@phosphor-icons/react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils/cn";
import { halls } from "@/data/halls";
import { hallTitle } from "@/data/hallDetails";

const ease = [0.22, 1, 0.36, 1] as const;

export function VenuesMegaMenu({ open, locale, activePath, onNavigate }: { open: boolean; locale: Locale; activePath: string; onNavigate: () => void }) {
  const row = "group flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-[var(--bg-soft)]";
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6, transition: { duration: 0.12 } }}
          transition={{ duration: 0.25, ease }}
          className="absolute start-0 top-full z-50 pt-4"
        >
          <motion.ul
            className="w-[17rem] overflow-hidden rounded-md border border-[var(--line)] bg-[var(--bg)] p-1.5 shadow-lg"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.03 } } }}
          >
            <motion.li variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { duration: 0.25, ease } } }}>
              <Link href="/venues" locale={locale} onClick={onNavigate} className={cn(row, activePath === "/venues" && "bg-[var(--bg-soft)]")}>
                <span className="grid h-8 w-11 flex-shrink-0 place-items-center rounded bg-[var(--accent)] text-white">
                  <SquaresFour size={16} weight="fill" />
                </span>
                <span className="text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--accent)]">All Venues</span>
              </Link>
            </motion.li>
            {halls.map((hall) => {
              const href = `/venues/${hall.slug}`;
              const on = activePath === href;
              return (
                <motion.li key={hall.id} variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { duration: 0.25, ease } } }}>
                  <Link href={href} locale={locale} onClick={onNavigate} className={cn(row, on && "bg-[var(--bg-soft)]")}>
                    <span className="relative h-8 w-11 flex-shrink-0 overflow-hidden rounded">
                      <Image src={hall.image} alt="" fill sizes="44px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                    </span>
                    <span className={cn("text-sm transition-colors group-hover:text-[var(--accent)]", on ? "text-[var(--accent)]" : "text-[var(--ink)]")}>
                      {hallTitle(hall.name.en)}
                    </span>
                  </Link>
                </motion.li>
              );
            })}
          </motion.ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Mobile drawer: hall rows with thumbnails. */
export function VenuesMobileList({ locale, onNavigate }: { locale: Locale; onNavigate: () => void }) {
  return (
    <motion.ul
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease }}
      className="overflow-hidden border-b border-[var(--line)] bg-[var(--bg-soft)]"
    >
      <li>
        <Link href="/venues" locale={locale} onClick={onNavigate} className="flex items-center gap-3 px-6 py-2.5 text-[14px] font-semibold text-[var(--accent)]">
          <span className="grid h-9 w-12 place-items-center rounded bg-[var(--accent)] text-white">
            <SquaresFour size={18} weight="fill" />
          </span>
          All Venues
        </Link>
      </li>
      {halls.map((h) => (
        <li key={h.id}>
          <Link href={`/venues/${h.slug}`} locale={locale} onClick={onNavigate} className="flex items-center gap-3 px-6 py-2 text-[14px] text-[var(--ink)] hover:text-[var(--accent)]">
            <span className="relative h-9 w-12 flex-shrink-0 overflow-hidden rounded">
              <Image src={h.image} alt="" fill sizes="48px" className="object-cover" />
            </span>
              <span className="font-medium">{hallTitle(h.name.en)}</span>
          </Link>
        </li>
      ))}
    </motion.ul>
  );
}
