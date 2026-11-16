"use client";
/**
 * "Find your hall" — pick a layout and a guest count; capacity bars animate and the halls
 * that fit light up (best fit = the smallest hall that still holds everyone).
 */
import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowRight, Star, Heart, Flower, Champagne, Cake, Microphone, Presentation, MusicNotes, Student, Handshake, Diamond, ForkKnife, RocketLaunch, UsersThree, PencilRuler, type Icon } from "@phosphor-icons/react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import type { Hall } from "@/types";
import { hallTitle } from "@/data/hallDetails";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Ornament } from "./Ornament";

const ease = [0.22, 1, 0.36, 1] as const;
const LAYOUTS = [
  { k: "theatre", t: "Theatre" },
  { k: "banquet", t: "Banquet" },
  { k: "classroom", t: "Classroom" },
  { k: "cocktail", t: "Cocktail" },
] as const;
type LayoutKey = (typeof LAYOUTS)[number]["k"];

/** Event types → the layout they are usually set in. */
const EVENTS: { t: string; icon: Icon; layout: LayoutKey }[] = [
  { t: "Wedding", icon: Heart, layout: "banquet" },
  { t: "Holud / Mehendi", icon: Flower, layout: "banquet" },
  { t: "Engagement", icon: Diamond, layout: "banquet" },
  { t: "Reception / Gala", icon: Champagne, layout: "banquet" },
  { t: "Iftar / Dinner", icon: ForkKnife, layout: "banquet" },
  { t: "Birthday / Party", icon: Cake, layout: "cocktail" },
  { t: "Networking", icon: Handshake, layout: "cocktail" },
  { t: "Conference", icon: Microphone, layout: "theatre" },
  { t: "Seminar", icon: Presentation, layout: "theatre" },
  { t: "Product Launch", icon: RocketLaunch, layout: "theatre" },
  { t: "AGM / Meeting", icon: UsersThree, layout: "theatre" },
  { t: "Concert / Show", icon: MusicNotes, layout: "theatre" },
  { t: "Training / Exam", icon: Student, layout: "classroom" },
  { t: "Workshop", icon: PencilRuler, layout: "classroom" },
];

export function CapacityExplorer({ halls, locale }: { halls: Hall[]; locale: Locale }) {
  const [layout, setLayout] = useState<LayoutKey>("banquet");
  const [event, setEvent] = useState<string | null>("Wedding");
  const [guests, setGuests] = useState(600);
  const cap = (h: Hall) => h.capacity[layout] ?? 0;
  const max = Math.max(...halls.map(cap));
  const fits = halls.filter((h) => cap(h) >= guests);
  const best = [...fits].sort((a, b) => cap(a) - cap(b))[0];
  const SLIDER_MAX = 3000;

  return (
    <section className="section-y relative overflow-hidden bg-[var(--bg-soft)]">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ duration: 0.6, ease }}>
            <SectionLabel>Find Your Hall</SectionLabel>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: false }}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
            className="mt-4 font-display uppercase text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] text-[var(--ink)]"
          >
            Which Hall <span className="text-[var(--accent)]">Fits Your Guests?</span>
          </motion.h2>
          <Ornament className="mt-5" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-10% 0px" }}
          transition={{ duration: 0.8, ease, delay: 0.2 }}
          className="mx-auto mt-12 max-w-6xl rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_30px_70px_-45px_rgba(0,0,0,0.4)] md:p-9"
        >
          {/* event type */}
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">What&apos;s your event?</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {EVENTS.map(({ t, icon: Ico, layout: l }) => {
              const on = event === t;
              return (
                <motion.button
                  key={t}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setEvent(t);
                    setLayout(l);
                  }}
                  className={`inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-2 text-[12.5px] font-medium transition-all duration-300 ${on ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-[0_10px_20px_-12px_var(--accent)]" : "border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"}`}
                >
                  <Ico size={16} weight={on ? "fill" : "regular"} />
                  {t}
                </motion.button>
              );
            })}
          </div>

          <div className="my-7 h-px bg-[var(--line)]" />

          {/* controls */}
          <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center md:gap-10">
            <LayoutGroup id="layout-tabs">
              <div className="inline-flex rounded-full bg-[var(--bg-soft)] p-1">
                {LAYOUTS.map((l) => (
                  <button
                    key={l.k}
                    type="button"
                    onClick={() => {
                      setLayout(l.k);
                      setEvent(null);
                    }}
                    className={`relative rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors sm:px-4 ${layout === l.k ? "text-white" : "text-[var(--ink-muted)] hover:text-[var(--ink)]"}`}
                  >
                    {layout === l.k && <motion.span layoutId="pill" className="absolute inset-0 rounded-full bg-[var(--accent)]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                    <span className="relative">{l.t}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="guest-range" className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                  Guests
                </label>
                <span className="font-display text-[28px] leading-none text-[var(--ink)] tabular-nums">{guests.toLocaleString()}</span>
              </div>
              <input
                id="guest-range"
                type="range"
                min={50}
                max={SLIDER_MAX}
                step={50}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="mt-3 w-full accent-[var(--accent)]"
              />
            </div>
          </div>

          {/* bars */}
          <ul className="mt-8 space-y-3">
            {halls.map((h, i) => {
              const c = cap(h);
              const ok = c >= guests;
              const isBest = best?.id === h.id;
              return (
                <motion.li
                  key={h.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false }}
                  transition={{ duration: 0.5, ease, delay: 0.3 + i * 0.08 }}
                >
                  <Link
                    href={`/venues/${h.slug}`}
                    locale={locale}
                    className={`group grid grid-cols-[48px_1fr] items-center gap-3 rounded-xl p-1.5 transition-all duration-500 sm:grid-cols-[56px_150px_1fr] sm:gap-4 ${ok ? "opacity-100" : "opacity-45 grayscale"} hover:bg-[var(--bg-soft)]`}
                  >
                    <span className="relative h-10 w-12 overflow-hidden rounded-md sm:w-14">
                      <Image src={h.image} alt="" fill sizes="56px" className="object-cover" />
                    </span>
                    <span className="hidden text-[14px] font-semibold text-[var(--ink)] group-hover:text-[var(--accent)] sm:block">{hallTitle(h.name.en)}</span>
                    <span className="relative h-9 overflow-hidden rounded-lg bg-[var(--bg-soft)]">
                      <motion.span
                        className={`absolute inset-y-0 start-0 rounded-lg ${ok ? "bg-gradient-to-r from-[var(--accent-deep)] to-[var(--accent)]" : "bg-[var(--ink-muted)]/40"}`}
                        animate={{ width: c ? `${(c / max) * 100}%` : "0%" }}
                        transition={{ duration: 0.8, ease }}
                      />
                      {/* guest marker */}
                      <motion.span
                        aria-hidden
                        className="absolute inset-y-0 w-[2px] bg-[var(--ink)]"
                        animate={{ left: `${Math.min(guests / max, 1) * 100}%` }}
                        transition={{ duration: 0.4, ease }}
                      />
                      <span className="absolute start-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-md bg-[var(--surface)]/90 px-2 py-0.5 text-[12px] font-semibold text-[var(--ink)]">
                        <span className="sm:hidden">{h.name.en} ·</span>
                        {c ? `${c.toLocaleString()} guests` : "Not offered"}
                      </span>
                      <AnimatePresence>
                        {isBest && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            className="absolute inset-y-1.5 end-2 inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--accent)] shadow"
                          >
                            <Star size={11} weight="fill" /> Best fit
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </Link>
                </motion.li>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center">
            <p className="text-[14.5px] text-[var(--ink-muted)]">
              <AnimatePresence mode="popLayout">
                <motion.span key={fits.length} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} className="inline-block font-display text-[22px] text-[var(--accent)]">
                  {fits.length}
                </motion.span>
              </AnimatePresence>{" "}
              {fits.length === 1 ? "hall fits" : "halls fit"} {guests.toLocaleString()} guests{event ? ` for a ${event.toLowerCase()}` : ""} in {layout} style
              {!fits.length && " — talk to us about combining spaces or Expo Village."}
            </p>
            <Link href={best ? `/booking?hallId=${best.id}#booking-form-section` : "/contact"} locale={locale} className="btn btn-primary group">
              {best ? `Check ${best.name.en} dates` : "Talk to our team"}
              <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-1 rtl:-scale-x-100" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
