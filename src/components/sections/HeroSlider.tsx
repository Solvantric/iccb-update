"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CalendarBlank, UsersThree,
  Buildings, Pause, Play,
} from "@phosphor-icons/react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { HERO_SLIDES, heroTitle, type HeroSlide } from "@/data/hero";
import { heroSlides as HERO_CREDITS } from "@/data/images";
import { isAllowedImage, usePublishedContent } from "@/lib/crm/cms";
import { cn } from "@/lib/utils/cn";
import { useTranslations } from "next-intl";

const AUTOPLAY_MS = 6000;

/** Old default slide photos → their replacements */
const REPLACED: Record<string, string> = {
  "/images/hero/bashundhara-phc-banner.jpg": "/images/hero/iccb-hero-1.jpg",
};




/** Website content (Marketing) → hero slides; the last word is the red highlight. */
function useHeroSlides(locale: Locale): HeroSlide[] {
  const cms = usePublishedContent("hero");
  const t = useTranslations("home.hero.slides");
  // Non-English: show the translated default slides (website content from Marketing is entered in English).
  if (locale !== "en" || !cms?.length) {
    return HERO_SLIDES.map((h) => {
      if (locale === "en" || !t.has(h.id)) return h;
      const tr = t.raw(h.id) as { lines: string[]; highlight: string; sub: string };
      return { ...h, lines: tr.lines, highlight: tr.highlight, sub: tr.sub };
    });
  }
  return cms.map((c) => {
    const known = HERO_SLIDES.find((h) => heroTitle(h) === c.title.trim());
    const words = c.title.trim().split(/\s+/);
    const highlight = known?.highlight ?? words.pop() ?? "";
    const rest = known ? known.lines : words.length > 3 ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")] : [words.join(" ")].filter(Boolean);
    const fallback = known ?? HERO_SLIDES[0];
    // Content saved before a default photo changed still points at the old file — show the new one.
    const src = isAllowedImage(c.image) && !(c.image in REPLACED) ? c.image : (REPLACED[c.image ?? ""] ?? fallback.src);
    return { id: c.id, lines: rest, highlight, sub: c.subtitle ?? "", src, alt: c.title };
  });
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface HeroSliderProps { locale: Locale }

export function HeroSlider({ locale }: HeroSliderProps) {
  const t = useTranslations("home.hero");
  const SLIDES = useHeroSlides(locale);
  const count = SLIDES.length;
  const [indexRaw, setIndex] = useState(0);
  const index = indexRaw % count;
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const goTo = useCallback((next: number, d: 1 | -1 = 1) => {
    setDir(d);
    setIndex((next + count) % count);
    setProgress(0);
  }, [count]);

  const prev = () => goTo(index - 1, -1);
  const next = () => goTo(index + 1, 1);

  /* Autoplay */
  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setDir(1);
      setIndex((c) => (c + 1) % count);
      setProgress(0);
    }, AUTOPLAY_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, index, count]);

  /* Progress bar */
  useEffect(() => {
    if (paused) return;
    progressRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + 100 / (AUTOPLAY_MS / 50), 100));
    }, 50);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [paused, index]);

  const slide = SLIDES[index];
  const image = { src: slide.src, alt: { en: slide.alt } };
  const credit = HERO_CREDITS.find((h) => h.src === slide.src);

  /* Keyboard */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index]);

  return (
    <section
      className="relative overflow-hidden bg-[var(--bg-deep)] mt-[88px] sm:mt-[112px]"
      style={{ height: "clamp(560px, calc(100vh - 112px), 1080px)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label={t("aria")}
    >
      {/* Background images */}
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={index}
          custom={dir}
          variants={{
            enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit:  (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.9, ease: EASE }}
          className="absolute inset-0"
        >
          <motion.div
            animate={{ scale: [1.08, 1.0] }}
            transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
            className="absolute inset-0"
          >
            <Image
              src={image.src}
              alt={image.alt.en}
              fill
              className="object-cover"
              priority={index === 0}
              quality={90}
              sizes="100vw"
            />
          </motion.div>
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(20,20,25,.55) 0%, rgba(20,20,25,.1) 40%, rgba(20,20,25,.7) 100%)" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col justify-center py-16 px-[clamp(1rem,4vw,3rem)]">
        <div className="container-wide mx-0">
          {/* Text per slide */}
          <AnimatePresence mode="wait">
            <motion.div key={index} className="mb-6">
              {/* Lines */}
              {slide.lines.map((line, li) => (
                <div key={li} className="overflow-hidden">
                  <motion.h1
                    initial={{ y: "105%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-105%", opacity: 0 }}
                    transition={{ duration: 0.8, ease: EASE, delay: li * 0.12 }}
                    className="text-hero text-white leading-none font-bold"
                    style={{ fontSize: "clamp(2.5rem, 6vw, 5.25rem)" }}
                  >
                    {line}
                  </motion.h1>
                </div>
              ))}
              {/* Highlight word */}
              <div className="overflow-hidden">
                <motion.span
                  initial={{ y: "105%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-105%", opacity: 0 }}
                  transition={{ duration: 0.8, ease: EASE, delay: slide.lines.length * 0.12 }}
                  className="inline-block font-bold text-[var(--accent)]"
                  style={{ fontSize: "clamp(2.5rem, 6vw, 5.25rem)", lineHeight: 1.1 }}
                >
                  {slide.highlight}
                </motion.span>
              </div>

              {/* Progress bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="mt-6 h-[3px] w-[120px] bg-white/20 rounded-full overflow-hidden"
              >
                <motion.div
                  key={index}
                  initial={{ width: "0%" }}
                  animate={{ width: paused ? `${progress}%` : "100%" }}
                  transition={paused ? { duration: 0 } : { duration: AUTOPLAY_MS / 1000, ease: "linear" }}
                  className="h-full bg-[var(--accent)] rounded-full"
                />
              </motion.div>

              {/* Subline + buttons */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-white/75 text-[15px] md:text-[17px] mt-5 max-w-lg leading-relaxed"
              >
                {slide.sub}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Controls bar */}
      <div className="absolute bottom-6 md:bottom-28 start-[clamp(1rem,4vw,3rem)] z-20 flex items-center gap-4">
        <button onClick={prev} aria-label={t("prev")}
          className="w-10 h-10 rounded-full border border-white/30 text-white flex items-center justify-center hover:border-white hover:bg-white/10 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > index ? 1 : -1)}
              aria-label={t("goTo", { n: i + 1 })}
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                i === index ? "w-8 bg-[var(--accent)]" : "w-2 bg-white/40 hover:bg-white/70"
              )}
            />
          ))}
        </div>
        <button onClick={next} aria-label={t("next")}
          className="w-10 h-10 rounded-full border border-white/30 text-white flex items-center justify-center hover:border-white hover:bg-white/10 transition-colors">
          <ArrowRight size={16} />
        </button>
        <button
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? t("play") : t("pause")}
          className="w-10 h-10 rounded-full border border-white/30 text-white/70 flex items-center justify-center hover:border-white hover:text-white hover:bg-white/10 transition-colors"
        >
          {paused ? <Play size={14} weight="fill" /> : <Pause size={14} weight="fill" />}
        </button>
      </div>

      {/* Photo credit */}
      <div className="absolute bottom-6 end-[clamp(1rem,4vw,3rem)] text-white/30 text-[10px] tracking-wider z-10">
        {credit && [credit.photographer, credit.source].filter(Boolean).join(" / ")}
      </div>
    </section>
  );
}

/* =========================================================================
   BookingCard — white card that overlaps the hero bottom, stays fixed
   ========================================================================= */
interface BookingCardProps { locale: Locale }

type TabKey = "availability" | "enquiry" | "expo" | "ask";

const TABS: { key: TabKey; icon: React.ElementType }[] = [
  { key: "availability", icon: CalendarBlank },
  { key: "enquiry",      icon: Buildings },
  { key: "expo",         icon: UsersThree },
  { key: "ask",          icon: ArrowRight },
];
const EXPO_TYPES = [
  ["trade", "Trade fair"], ["exhibition", "Exhibition"], ["launch", "Product launch"], ["auto", "Auto & motor show"],
  ["education", "Education fair"], ["job", "Job fair"], ["food", "Food & lifestyle fair"], ["other", "Other"],
] as const;
const EVENT_TYPES = ["wedding", "reception", "corporate", "conference", "seminar", "concert", "other"] as const;

export function BookingCard({ locale }: BookingCardProps) {
  const t = useTranslations("home.booking");
  const [tab, setTab] = useState<TabKey>("availability");
  const [form, setForm] = useState({ eventType: "", date: "", guests: "" });
  const [kind, setKind] = useState<"halls" | "expo">("halls");
  const [expo, setExpo] = useState({ expoType: "", date: "", days: "3" });

  const availUrl = `/booking?eventType=${form.eventType}&date=${form.date}&guests=${form.guests}#booking-form-section`;
  const expoUrl = `/booking?mode=expo&expoType=${encodeURIComponent(expo.expoType)}&date=${expo.date}&days=${expo.days}#booking-form-section`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-20 mx-auto w-full max-w-5xl -mt-20 mb-0 px-[clamp(1rem,4vw,3rem)] hidden md:block"
    >
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-lg shadow-[0_8px_40px_rgba(43,42,46,.12)] overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-[var(--line)] overflow-x-auto">
          {TABS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-2 px-5 py-4 text-[13px] font-semibold whitespace-nowrap relative transition-colors",
                tab === key
                  ? "text-[var(--accent)]"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
              )}
            >
              <Icon size={16} weight={tab === key ? "fill" : "regular"} />
              {t(`tabs.${key}`)}
              {tab === key && (
                <motion.span
                  layoutId="tab-bar"
                  className="absolute bottom-0 inset-x-0 h-[2px] bg-[var(--accent)]"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5 md:p-6">
          {tab === "availability" && (
            <div>
            {/* Two kinds of booking: the 6 halls, or Expo Village */}
            <div className="mb-4 inline-flex rounded-full border border-[var(--line)] p-1">
              {([["halls", t("kindHalls")], ["expo", t("kindExpo")]] as const).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    "relative rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-colors",
                    kind === k ? "text-white" : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  )}
                >
                  {kind === k && <motion.span layoutId="kind-pill" className="absolute inset-0 rounded-full bg-[var(--accent)]" />}
                  <span className="relative">{label}</span>
                </button>
              ))}
            </div>
            {kind === "expo" ? (
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[160px]">
                  <label className="text-eyebrow block mb-1.5">{t("expoType")}</label>
                  <select
                    value={expo.expoType}
                    onChange={(e) => setExpo((f) => ({ ...f, expoType: e.target.value }))}
                    className="w-full border border-[var(--line)] rounded-[var(--radius-input)] px-3 py-2.5 text-[14px] text-[var(--ink)] bg-[var(--bg-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                  >
                    <option value="">{t("chooseType")}</option>
                    {EXPO_TYPES.map(([k, v]) => (
                      <option key={k} value={v}>{t(`expoTypes.${k}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="text-eyebrow block mb-1.5">{t("startDate")}</label>
                  <input
                    type="date"
                    value={expo.date}
                    onChange={(e) => setExpo((f) => ({ ...f, date: e.target.value }))}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full border border-[var(--line)] rounded-[var(--radius-input)] px-3 py-2.5 text-[14px] text-[var(--ink)] bg-[var(--bg-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                  />
                </div>
                <div className="flex-1 min-w-[110px]">
                  <label className="text-eyebrow block mb-1.5">{t("showDays")}</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={expo.days}
                    onChange={(e) => setExpo((f) => ({ ...f, days: e.target.value }))}
                    className="w-full border border-[var(--line)] rounded-[var(--radius-input)] px-3 py-2.5 text-[14px] text-[var(--ink)] bg-[var(--bg-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                  />
                </div>
                <Link href={expoUrl} locale={locale} className="btn btn-primary btn-sm whitespace-nowrap">
                  {t("checkExpo")} <ArrowRight size={13} weight="bold" />
                </Link>
              </div>
            ) : (
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[140px]">
                <label className="text-eyebrow block mb-1.5">{t("eventType")}</label>
                <select
                  value={form.eventType}
                  onChange={(e) => {
                    // Expo goes straight to the Expo Village booking
                    if (e.target.value === "expo") {
                      setKind("expo");
                      setExpo((x) => ({ ...x, date: x.date || form.date }));
                      return;
                    }
                    setForm((f) => ({ ...f, eventType: e.target.value }));
                  }}
                  className="w-full border border-[var(--line)] rounded-[var(--radius-input)] px-3 py-2.5 text-[14px] text-[var(--ink)] bg-[var(--bg-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                >
                  <option value="">{t("allTypes")}</option>
                  {EVENT_TYPES.map((k) => (
                    <option key={k} value={k}>{t(`eventTypes.${k}`)}</option>
                  ))}
                  <option value="expo">{t("expoOption")}</option>
                </select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="text-eyebrow block mb-1.5">{t("date")}</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-[var(--line)] rounded-[var(--radius-input)] px-3 py-2.5 text-[14px] text-[var(--ink)] bg-[var(--bg-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-eyebrow block mb-1.5">{t("guests")}</label>
                <input
                  type="number"
                  placeholder={t("guestsPh")}
                  value={form.guests}
                  onChange={(e) => setForm((f) => ({ ...f, guests: e.target.value }))}
                  min={1}
                  className="w-full border border-[var(--line)] rounded-[var(--radius-input)] px-3 py-2.5 text-[14px] text-[var(--ink)] bg-[var(--bg-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Link href={availUrl} locale={locale} className="btn btn-primary btn-sm whitespace-nowrap">
                  {t("checkAvailability")} <ArrowRight size={13} weight="bold" />
                </Link>
                <Link href="/booking#estimate" locale={locale}
                  className="text-[12px] text-[var(--accent-text)] hover:text-[var(--accent)] font-semibold text-center underline-grow">
                  {t("estimate")}
                </Link>
              </div>
            </div>
            )}
            </div>
          )}
          {tab === "enquiry" && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-[var(--ink-body)] text-[14px] max-w-md">
                {t("enquiryText")}
              </p>
              <Link href="/enquiry" locale={locale} className="btn btn-primary btn-sm whitespace-nowrap">
                {t("sendEnquiry")} <ArrowRight size={13} weight="bold" />
              </Link>
            </div>
          )}
          {tab === "expo" && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-[var(--ink-body)] text-[14px] max-w-md">
                {t("expoText")}
              </p>
              <Link href="/booking?mode=expo#booking-form-section" locale={locale} className="btn btn-primary btn-sm whitespace-nowrap">
                {t("expoEnquiry")} <ArrowRight size={13} weight="bold" />
              </Link>
            </div>
          )}
          {tab === "ask" && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-[var(--ink-body)] text-[14px] max-w-md">
                {t("askText")}
              </p>
              <Link href="/ask" locale={locale} className="btn btn-primary btn-sm whitespace-nowrap">
                {t("askBtn")} <ArrowRight size={13} weight="bold" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
