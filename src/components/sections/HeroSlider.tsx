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
import { heroSlides } from "@/data/images";
import { cn } from "@/lib/utils/cn";

const AUTOPLAY_MS = 6000;

const SLIDES = [
  {
    id: "grand-hall",
    lines: ["Where the World", "Meets in"],
    highlight: "Dhaka.",
    sub: "South Asia's largest convention centre",
  },
  {
    id: "expo",
    lines: ["Bangladesh's Premier", "Exhibition"],
    highlight: "Destination.",
    sub: "Expo Village · 80,000 sq ft · 500+ booths · 40+ expos/year",
  },
  {
    id: "conference",
    lines: ["World-Class", "Conference"],
    highlight: "Facilities.",
    sub: "Multilingual conventions for 400–2,500 delegates",
  },
  {
    id: "wedding",
    lines: ["Your Dream", "Occasion,"],
    highlight: "Perfected.",
    sub: "Elegant banquet settings for 600–1,800 guests",
  },
  {
    id: "concert",
    lines: ["Stage the"],
    highlight: "Extraordinary.",
    sub: "Professional acoustics, lighting, and staging for 2,500+",
  },
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface HeroSliderProps { locale: Locale }

export function HeroSlider({ locale }: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const goTo = useCallback((next: number, d: 1 | -1 = 1) => {
    setDir(d);
    setIndex((next + SLIDES.length) % SLIDES.length);
    setProgress(0);
  }, []);

  const prev = () => goTo(index - 1, -1);
  const next = () => goTo(index + 1, 1);

  /* Autoplay */
  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setDir(1);
      setIndex((c) => (c + 1) % SLIDES.length);
      setProgress(0);
    }, AUTOPLAY_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, index]);

  /* Progress bar */
  useEffect(() => {
    if (paused) return;
    progressRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + 100 / (AUTOPLAY_MS / 50), 100));
    }, 50);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [paused, index]);

  const slide = SLIDES[index];
  const image = heroSlides.find((s) => s.id === slide.id) || heroSlides[0];

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
      aria-label="ICCB hero carousel"
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
        <button onClick={prev} aria-label="Previous slide"
          className="w-10 h-10 rounded-full border border-white/30 text-white flex items-center justify-center hover:border-white hover:bg-white/10 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > index ? 1 : -1)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                i === index ? "w-8 bg-[var(--accent)]" : "w-2 bg-white/40 hover:bg-white/70"
              )}
            />
          ))}
        </div>
        <button onClick={next} aria-label="Next slide"
          className="w-10 h-10 rounded-full border border-white/30 text-white flex items-center justify-center hover:border-white hover:bg-white/10 transition-colors">
          <ArrowRight size={16} />
        </button>
        <button
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play" : "Pause"}
          className="w-10 h-10 rounded-full border border-white/30 text-white/70 flex items-center justify-center hover:border-white hover:text-white hover:bg-white/10 transition-colors"
        >
          {paused ? <Play size={14} weight="fill" /> : <Pause size={14} weight="fill" />}
        </button>
      </div>

      {/* Photo credit */}
      <div className="absolute bottom-6 end-[clamp(1rem,4vw,3rem)] text-white/30 text-[10px] tracking-wider z-10">
        {image.photographer} / {image.source}
      </div>
    </section>
  );
}

/* =========================================================================
   BookingCard — white card that overlaps the hero bottom, stays fixed
   ========================================================================= */
interface BookingCardProps { locale: Locale }

type TabKey = "availability" | "enquiry" | "expo" | "ask";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "availability", label: "Check Availability", icon: CalendarBlank },
  { key: "enquiry",      label: "Make an Enquiry",    icon: Buildings },
  { key: "expo",         label: "Expo Enquiry",       icon: UsersThree },
  { key: "ask",          label: "Ask a Question",     icon: ArrowRight },
];

export function BookingCard({ locale }: BookingCardProps) {
  const [tab, setTab] = useState<TabKey>("availability");
  const [form, setForm] = useState({ eventType: "", date: "", guests: "" });

  const availUrl = `/booking?eventType=${form.eventType}&date=${form.date}&guests=${form.guests}`;

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
          {TABS.map(({ key, label, icon: Icon }) => (
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
              {label}
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
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[140px]">
                <label className="text-eyebrow block mb-1.5">Event Type</label>
                <select
                  value={form.eventType}
                  onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}
                  className="w-full border border-[var(--line)] rounded-[var(--radius-input)] px-3 py-2.5 text-[14px] text-[var(--ink)] bg-[var(--bg-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                >
                  <option value="">All types</option>
                  {["Conference", "Exhibition", "Wedding", "Concert", "Corporate", "Expo", "Seminar", "Other"].map((t) => (
                    <option key={t} value={t.toLowerCase()}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="text-eyebrow block mb-1.5">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-[var(--line)] rounded-[var(--radius-input)] px-3 py-2.5 text-[14px] text-[var(--ink)] bg-[var(--bg-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-eyebrow block mb-1.5">Guests</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={form.guests}
                  onChange={(e) => setForm((f) => ({ ...f, guests: e.target.value }))}
                  min={1}
                  className="w-full border border-[var(--line)] rounded-[var(--radius-input)] px-3 py-2.5 text-[14px] text-[var(--ink)] bg-[var(--bg-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Link href={availUrl} locale={locale} className="btn btn-primary btn-sm whitespace-nowrap">
                  Check Availability <ArrowRight size={13} weight="bold" />
                </Link>
                <Link href="/booking#calculator" locale={locale}
                  className="text-[12px] text-[var(--accent-text)] hover:text-[var(--accent)] font-semibold text-center underline-grow">
                  Get a budget estimate →
                </Link>
              </div>
            </div>
          )}
          {tab === "enquiry" && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-[var(--ink-body)] text-[14px] max-w-md">
                Tell us about your event and we'll get back with a tailored proposal within 24 hours.
              </p>
              <Link href="/enquiry" locale={locale} className="btn btn-primary btn-sm whitespace-nowrap">
                Send Enquiry <ArrowRight size={13} weight="bold" />
              </Link>
            </div>
          )}
          {tab === "expo" && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-[var(--ink-body)] text-[14px] max-w-md">
                Interested in exhibiting or sponsoring at ICCB Expo Village? Contact our expo team.
              </p>
              <Link href="/expo-zone#exhibitor-enquiry" locale={locale} className="btn btn-primary btn-sm whitespace-nowrap">
                Expo Enquiry <ArrowRight size={13} weight="bold" />
              </Link>
            </div>
          )}
          {tab === "ask" && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-[var(--ink-body)] text-[14px] max-w-md">
                Have a quick question about ICCB? Our team is ready to help.
              </p>
              <Link href="/ask" locale={locale} className="btn btn-primary btn-sm whitespace-nowrap">
                Ask a Question <ArrowRight size={13} weight="bold" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
