"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CalendarBlank, UsersThree, Buildings } from "@phosphor-icons/react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { heroSlides } from "@/data/images";
import { cn } from "@/lib/utils/cn";

const AUTOPLAY_INTERVAL = 4200;

const slideData = [
  {
    id: "grand-hall",
    headline: ["WHERE THE WORLD", "MEETS IN DHAKA"],
    sub: "South Asia's largest event venue · 4 halls · 10,000+ guests",
    label: "(ICCB, DHAKA)",
  },
  {
    id: "expo",
    headline: ["WHERE INDUSTRIES", "EXHIBIT"],
    sub: "Bangladesh's premier international exhibition destination",
    label: "(EXPO ZONE)",
  },
  {
    id: "conference",
    headline: ["WORLD-CLASS", "CONFERENCE FACILITIES"],
    sub: "Multilingual conventions for 400–2,500 delegates",
    label: "(CONFERENCES)",
  },
  {
    id: "wedding",
    headline: ["YOUR DREAM", "OCCASION, PERFECTED"],
    sub: "Elegant banquet settings for 600–1,800 guests",
    label: "(WEDDINGS)",
  },
  {
    id: "concert",
    headline: ["STAGE THE", "EXTRAORDINARY"],
    sub: "Professional acoustics, lighting, and staging for 2,500+",
    label: "(CONCERTS)",
  },
];

interface HeroSliderProps {
  locale: Locale;
}

export function HeroSlider({ locale }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [availForm, setAvailForm] = useState({ eventType: "", date: "", guests: "" });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((idx: number) => {
    setCurrent((idx + slideData.length) % slideData.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % slideData.length);
    }, AUTOPLAY_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused]);

  const slide = slideData[current];
  const image = heroSlides.find((s) => s.id === slide.id) || heroSlides[0];

  const availUrl = `/booking?eventType=${availForm.eventType}&date=${availForm.date}&guests=${availForm.guests}`;

  return (
    <section
      className="relative h-screen min-h-[600px] max-h-[1080px] overflow-hidden bg-[var(--bg-deep)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Hero — ICCB Convention Centre"
    >
      {/* Background images with Ken Burns */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          <motion.div
            animate={{ scale: [1, 1.06] }}
            transition={{ duration: 8, ease: "linear" }}
            className="absolute inset-0"
          >
            <Image
              src={image.src}
              alt={image.alt.en}
              fill
              className="object-cover"
              priority={current === 0}
              sizes="100vw"
            />
          </motion.div>
          {/* Dark overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,.45), rgba(0,0,0,.2) 40%, rgba(0,0,0,.7))",
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Top bar meta */}
      <div className="absolute top-24 md:top-28 inset-x-0 px-[clamp(1rem,4vw,3rem)] flex justify-between items-start pointer-events-none">
        <span className="text-white/50 text-[11px] tracking-[0.18em] uppercase">
          ICCB · DHAKA — SINCE 2015
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-white/50 text-[11px] tracking-[0.18em] uppercase"
          >
            {slide.label}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Main content */}
      <div className="relative h-full flex flex-col justify-end pb-32 md:pb-40 px-[clamp(1rem,4vw,3rem)]">
        <div className="max-w-[1440px] mx-auto w-full">
          {/* Slide counter */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-white/60 text-[11px] font-medium tracking-[0.18em]">
              0{current + 1}
            </span>
            <div className="flex gap-1.5">
              {slideData.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={cn(
                    "h-px transition-all duration-500",
                    i === current
                      ? "w-8 bg-white"
                      : "w-4 bg-white/30 hover:bg-white/60"
                  )}
                />
              ))}
            </div>
            <span className="text-white/30 text-[11px] font-medium tracking-[0.18em]">
              / 0{slideData.length}
            </span>
          </div>

          {/* Headline — word by word animation */}
          <AnimatePresence mode="wait">
            <motion.div key={current} className="mb-4 overflow-hidden">
              {slide.headline.map((line, li) => (
                <div key={li} className="overflow-hidden">
                  <motion.h1
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-100%" }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: li * 0.1 }}
                    className="display-xl text-white leading-none"
                  >
                    {line}
                  </motion.h1>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Sub line */}
          <AnimatePresence mode="wait">
            <motion.p
              key={current + "sub"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-white/70 text-[14px] md:text-[16px] font-sans mb-8 max-w-lg"
            >
              {slide.sub}
            </motion.p>
          </AnimatePresence>

          {/* Availability bar */}
          <div className="bg-white/10 backdrop-blur-md border border-white/18 rounded-full p-1 pl-4 md:pl-6 flex flex-col md:flex-row md:items-center gap-3 md:gap-0 max-w-3xl">
            {/* Event type */}
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <Buildings size={16} className="text-white/60 flex-shrink-0" weight="light" />
              <select
                value={availForm.eventType}
                onChange={(e) => setAvailForm((f) => ({ ...f, eventType: e.target.value }))}
                className="bg-transparent text-white text-[13px] font-sans appearance-none focus:outline-none cursor-pointer flex-1 min-w-0 py-2 md:py-0 truncate"
                aria-label="Event type"
              >
                <option value="" className="text-black">Event Type</option>
                <option value="conference" className="text-black">Conference</option>
                <option value="exhibition" className="text-black">Exhibition</option>
                <option value="wedding" className="text-black">Wedding</option>
                <option value="concert" className="text-black">Concert</option>
                <option value="corporate" className="text-black">Corporate</option>
                <option value="expo" className="text-black">Expo</option>
                <option value="other" className="text-black">Other</option>
              </select>
            </div>
            <div className="hidden md:block w-px h-8 bg-white/20" />
            {/* Date */}
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 md:px-4">
              <CalendarBlank size={16} className="text-white/60 flex-shrink-0" weight="light" />
              <input
                type="date"
                value={availForm.date}
                onChange={(e) => setAvailForm((f) => ({ ...f, date: e.target.value }))}
                className="bg-transparent text-white text-[13px] font-sans focus:outline-none cursor-pointer flex-1 min-w-0 py-2 md:py-0 [color-scheme:dark]"
                aria-label="Date"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="hidden md:block w-px h-8 bg-white/20" />
            {/* Guests */}
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 md:px-4">
              <UsersThree size={16} className="text-white/60 flex-shrink-0" weight="light" />
              <input
                type="number"
                placeholder="Guests"
                value={availForm.guests}
                onChange={(e) => setAvailForm((f) => ({ ...f, guests: e.target.value }))}
                className="bg-transparent text-white text-[13px] font-sans placeholder:text-white/50 focus:outline-none flex-1 min-w-0 py-2 md:py-0 w-20"
                aria-label="Number of guests"
                min="1"
              />
            </div>
            {/* CTA button */}
            <Link
              href={availUrl}
              locale={locale}
              className="flex items-center gap-2 bg-[var(--accent)] text-white rounded-full px-6 py-3 text-[11px] font-medium tracking-[0.12em] uppercase hover:bg-[var(--accent-hover)] transition-colors whitespace-nowrap flex-shrink-0 self-stretch md:self-auto items-center justify-center"
            >
              CHECK AVAILABILITY
              <ArrowRight size={13} weight="bold" />
            </Link>
          </div>
        </div>
      </div>

      {/* Photo credit */}
      <div className="absolute bottom-6 end-[clamp(1rem,4vw,3rem)] text-white/30 text-[10px] tracking-wider">
        Photo: {image.photographer} / {image.source}
      </div>
    </section>
  );
}
