"use client";
/** Expo Zone page sections. */
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight, CalendarBlank, CalendarPlus, Clock, 
  Car, FirstAidKit, TShirt, Plant, Buildings, Play, MapPin, type Icon,
} from "@phosphor-icons/react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Ornament } from "@/components/venues/Ornament";
import { Count } from "@/components/venues/Count";
import { UPCOMING_EXPOS, EXPO_SOURCES, EXPO_MOMENTS, type UpcomingExpo } from "@/data/expoUpcoming";
import { YouTubeBackground } from "./YouTubeBackground";

const ease = [0.22, 1, 0.36, 1] as const;

/* A ticking clock that is null during SSR / first paint (no hydration mismatch). */
let nowCache = 0;
const clock = {
  subscribe(cb: () => void) {
    nowCache = Date.now();
    queueMicrotask(cb);
    const t = setInterval(() => {
      nowCache = Date.now();
      cb();
    }, 1000);
    return () => clearInterval(t);
  },
  get: () => nowCache,
  server: () => 0,
};
function useNow() {
  return useSyncExternalStore(clock.subscribe, clock.get, clock.server);
}

const day = (iso: string) => new Date(`${iso}T09:00:00+06:00`).getTime();
const fmtRange = (e: UpcomingExpo) => {
  const s = new Date(e.start), en = new Date(e.end);
  const m = (d: Date) => d.toLocaleString("en", { month: "short", timeZone: "UTC" });
  return s.getUTCMonth() === en.getUTCMonth()
    ? `${s.getUTCDate()}–${en.getUTCDate()} ${m(s)} ${s.getUTCFullYear()}`
    : `${s.getUTCDate()} ${m(s)} – ${en.getUTCDate()} ${m(en)} ${en.getUTCFullYear()}`;
};

function Heading({ label, children, light = false, center = true }: { label: string; children: React.ReactNode; light?: boolean; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : ""}>
      <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ duration: 0.6, ease }}>
        <SectionLabel light={light}>{label}</SectionLabel>
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: false }}
        transition={{ duration: 0.8, ease, delay: 0.1 }}
        className={`mt-4 font-display uppercase text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] ${light ? "text-white" : "text-[var(--ink)]"}`}
      >
        {children}
      </motion.h2>
      <Ornament light={light} align={center ? "center" : "start"} className="mt-5" />
    </div>
  );
}

/* ─── Hero: drone video (2:05 → 2:30, looped) ─────────────────────────── */
export function ExpoHero({ locale }: { locale: Locale }) {
  const title = ["EXPO", "VILLAGE"];
  return (
    <section className="relative h-[92vh] min-h-[620px] max-h-[960px] overflow-hidden bg-black">
      <YouTubeBackground videoId="3RATxen32xw" start={125} end={150} poster="https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&q=90&w=2400" title="ICCB drone video" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      <div className="relative flex h-full items-center container-site pb-28">
        <motion.div className="max-w-3xl" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } } }}>
          <motion.p variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.24em] text-white/80">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
            </span>
            ICCB · Bangladesh&apos;s largest single-roof exhibition space
          </motion.p>
          <h1 className="mt-5 font-display uppercase leading-[0.92] text-white">
            {title.map((w, wi) => (
              <span key={w} className={`block overflow-hidden text-[clamp(3.4rem,11vw,9rem)] ${wi === 1 ? "text-[var(--accent)]" : ""}`}>
                <motion.span className="inline-block" variants={{ hidden: { y: "105%" }, show: { y: "0%", transition: { duration: 1, ease } } }}>
                  {w}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }} className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/85 md:text-[18px]">
            Where Bangladesh meets the world — national trade fairs, international expos and product showcases, with modular booths and
            full exhibitor support under one roof.
          </motion.p>
          <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }} className="mt-8 flex flex-wrap gap-3">
            <Link href="/booking?mode=expo#booking-form-section" locale={locale} className="btn btn-primary group">
              Book Expo Village <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-1 rtl:-scale-x-100" />
            </Link>
            <a href="#upcoming" className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] border border-white/40 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-[var(--ink)]">
              <CalendarBlank size={16} /> Upcoming Expos
            </a>
            <a
              href="https://www.youtube.com/watch?v=3RATxen32xw"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-2 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-white/85 hover:text-white"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 backdrop-blur-sm">
                <Play size={14} weight="fill" />
              </span>
              Watch the full film
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* glass stats */}
      <motion.div
        className="absolute inset-x-0 bottom-0 border-t border-white/15 bg-black/30 backdrop-blur-md"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease, delay: 1 }}
      >
        <div className="container-site grid grid-cols-2 md:grid-cols-4 md:divide-x md:divide-white/15 rtl:divide-x-reverse">
          {[
            { v: 80000, s: "+", l: "Sq ft of exhibition space" },
            { v: 45, s: "+", l: "Trade shows in the next 12 months" },
            { v: 3500, s: "+", l: "Car parking spaces" },
            { v: 2025, s: "", l: "Expo Village opened", plain: true },
          ].map((st) => (
            <div key={st.l} className="px-3 py-4 md:px-6">
              <p className="font-display text-[26px] leading-none text-white md:text-[32px]">
                {st.plain ? st.v : <Count to={st.v} suffix={st.s} />}
              </p>
              <p className="mt-1 text-[10.5px] uppercase tracking-[0.16em] text-white/65">{st.l}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ─── Upcoming expos ───────────────────────────────────────────────────── */
function Countdown({ to, now }: { to: number; now: number }) {
  const diff = Math.max(0, to - now);
  const parts = [
    { l: "Days", v: Math.floor(diff / 864e5) },
    { l: "Hours", v: Math.floor((diff / 36e5) % 24) },
    { l: "Mins", v: Math.floor((diff / 6e4) % 60) },
    { l: "Secs", v: Math.floor((diff / 1e3) % 60) },
  ];
  return (
    <div className="flex gap-2">
      {parts.map((p) => (
        <div key={p.l} className="min-w-[64px] rounded-xl border border-white/15 bg-white/10 px-2 py-2.5 text-center backdrop-blur-sm">
          <div className="relative h-8 overflow-hidden font-display text-[28px] leading-8 text-white tabular-nums">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={p.v} className="block" initial={{ y: -28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 28, opacity: 0 }} transition={{ duration: 0.35 }}>
                {String(p.v).padStart(2, "0")}
              </motion.span>
            </AnimatePresence>
          </div>
          <p className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/60">{p.l}</p>
        </div>
      ))}
    </div>
  );
}

const SECTOR_ICON: Record<string, Icon> = {
  Automotive: Car, Healthcare: FirstAidKit, "Textile & Leather": TShirt, "Food & Agro": Plant, "Construction & Energy": Buildings,
};

function icsHref(e: UpcomingExpo) {
  const d = (s: string) => s.replace(/-/g, "");
  const endPlus = new Date(new Date(e.end).getTime() + 864e5).toISOString().slice(0, 10);
  const body = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ICCB//Expo//EN", "BEGIN:VEVENT",
    `UID:${e.id}@iccb`, `DTSTART;VALUE=DATE:${d(e.start)}`, `DTEND;VALUE=DATE:${d(endPlus)}`,
    `SUMMARY:${e.name}`, "LOCATION:International Convention City Bashundhara (ICCB)\\, Dhaka", "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
}

function ExpoCard({ e, i, now, isNext, locale }: { e: UpcomingExpo; i: number; now: number; isNext: boolean; locale: Locale }) {
  const reduced = useReducedMotion();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [8, -8]), { stiffness: 170, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-10, 10]), { stiffness: 170, damping: 18 });
  const glareX = useTransform(mx, [0, 1], ["0%", "100%"]);
  const glareY = useTransform(my, [0, 1], ["0%", "100%"]);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.35), transparent 45%)`;
  const daysTo = now ? Math.ceil((day(e.start) - now) / 864e5) : null;

  return (
    <motion.article
      layout
      initial="hidden"
      whileInView="show"
      viewport={{ once: false, amount: 0.15 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      variants={{
        hidden: { opacity: 0, y: 60, rotateX: reduced ? 0 : -25 },
        show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.8, ease, delay: (i % 3) * 0.12 } },
      }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <motion.div
        onMouseMove={(ev) => {
          if (reduced) return;
          const r = ev.currentTarget.getBoundingClientRect();
          mx.set((ev.clientX - r.left) / r.width);
          my.set((ev.clientY - r.top) / r.height);
        }}
        onMouseLeave={() => {
          mx.set(0.5);
          my.set(0.5);
        }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-[var(--surface)] transition-shadow duration-500 hover:shadow-[0_40px_70px_-36px_rgba(0,0,0,0.55)] ${isNext ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30" : "border-[var(--line)]"}`}
      >
        <motion.div
          className="relative aspect-[16/10] overflow-hidden bg-black"
          variants={{
            hidden: { clipPath: "inset(0 0 35% 0)" },
            show: { clipPath: "inset(0 0 0% 0)", transition: { duration: 1, ease, delay: 0.15 + (i % 3) * 0.12 } },
          }}
        >
          <Image src={e.image} alt={e.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-[1.2s] group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
          {isNext ? (
            <span className="absolute end-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white" /> Next up
            </span>
          ) : (
            daysTo !== null && daysTo > 0 && (
              <span className="absolute end-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                <Clock size={12} /> in {daysTo} days
              </span>
            )
          )}
          <span className="absolute bottom-3 start-4 rounded-full bg-white/15 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm">{e.sector}</span>
          <span className="absolute bottom-3 end-4 font-display text-[13px] tracking-[0.2em] text-white/70">{String(i + 1).padStart(2, "0")}</span>
        </motion.div>
        <div className="flex flex-1 flex-col p-5" style={{ transform: "translateZ(20px)" }}>
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">{e.short}</p>
          <h3 className="mt-1 font-display text-[20px] uppercase leading-tight text-[var(--ink)]">{e.name}</h3>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--ink-muted)]">{e.about}</p>
          <p className="mt-3 flex items-center gap-2 text-[13px] font-medium text-[var(--ink)]">
            <CalendarBlank size={15} className="text-[var(--accent)]" /> {fmtRange(e)}
          </p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-5">
            <Link href="/enquiry" locale={locale} className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] hover:text-[var(--accent)]">
              Exhibit here <ArrowRight size={13} weight="bold" className="transition-transform group-hover:translate-x-1 rtl:-scale-x-100" />
            </Link>
            <a href={icsHref(e)} download={`${e.id}.ics`} aria-label={`Add ${e.name} to calendar`} className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] text-[var(--ink-muted)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-white">
              <CalendarPlus size={16} />
            </a>
          </div>
        </div>
        {/* moving glare */}
        <motion.span aria-hidden style={{ background: glare }} className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-[var(--accent)] transition-transform duration-500 group-hover:scale-x-100 rtl:origin-right" />
      </motion.div>
    </motion.article>
  );
}

export function UpcomingExpos({ locale }: { locale: Locale }) {
  const now = useNow();
  const [sector, setSector] = useState("All");
  const upcoming = useMemo(
    () => UPCOMING_EXPOS.filter((e) => !now || day(e.end) + 864e5 > now).sort((a, b) => a.start.localeCompare(b.start)),
    [now],
  );
  const next = upcoming[0];
  const sectors = ["All", ...Array.from(new Set(UPCOMING_EXPOS.map((e) => e.sector)))];
  const list = upcoming.filter((e) => sector === "All" || e.sector === sector);
  const live = next && now && now >= day(next.start) && now < day(next.end) + 864e5;

  return (
    <section id="upcoming" className="section-y scroll-mt-24 bg-[var(--bg)]">
      <div className="container-site">
        <Heading label="Upcoming Expos">
          What&apos;s <span className="text-[var(--accent)]">Coming Up</span>
        </Heading>

        {/* featured next expo */}
        {next && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.9, ease }}
            className="relative mt-12 overflow-hidden rounded-3xl bg-black"
          >
            <motion.div className="absolute inset-0" initial={{ scale: 1.15 }} whileInView={{ scale: 1 }} viewport={{ once: false }} transition={{ duration: 2, ease }}>
              <Image src={next.image} alt={next.name} fill quality={90} sizes="100vw" className="object-cover opacity-60" />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/10" />
            <div className="relative grid gap-8 p-7 md:p-12 lg:grid-cols-[1.3fr_1fr] lg:items-end">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                  {live ? "Happening now" : "Next at Expo Village"}
                </span>
                <h3 className="mt-5 font-display text-[clamp(2rem,4.4vw,3.6rem)] uppercase leading-[1] text-white">{next.name}</h3>
                <p className="mt-4 max-w-lg text-[15.5px] text-white/80">{next.about}</p>
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-white/85">
                  <span className="flex items-center gap-2"><CalendarBlank size={17} className="text-[var(--accent)]" /> {fmtRange(next)}</span>
                  <span className="flex items-center gap-2"><MapPin size={17} className="text-[var(--accent)]" /> ICCB, Dhaka</span>
                </div>
              </div>
              <div className="lg:justify-self-end">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">{live ? "Ends in" : "Opens in"}</p>
                {now ? <Countdown to={live ? day(next.end) + 864e5 : day(next.start)} now={now} /> : <div className="h-[76px]" />}
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/enquiry" locale={locale} className="btn btn-primary">Exhibit / Enquire</Link>
                  <a href={icsHref(next)} download={`${next.id}.ics`} className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] border border-white/40 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-white hover:text-[var(--ink)]">
                    <CalendarPlus size={16} /> Add to calendar
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* sector filter */}
        <LayoutGroup id="expo-sectors">
          <div className="mt-12 flex flex-wrap justify-center gap-2">
            {sectors.map((s) => {
              const on = s === sector;
              const SIcon = SECTOR_ICON[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSector(s)}
                  className={`relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${on ? "border-transparent text-white" : "border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"}`}
                >
                  {on && <motion.span layoutId="sector-pill" className="absolute inset-0 rounded-full bg-[var(--accent)]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                  {SIcon && <SIcon size={15} className="relative" />}
                  <span className="relative">{s}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        {/* all upcoming expos — 3D tilt cards */}
        <motion.div layout className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 [perspective:1400px]">
          <AnimatePresence mode="popLayout">
            {list.map((e, i) => (
              <ExpoCard key={e.id} e={e} i={i} now={now} isNext={e.id === next?.id} locale={locale} />
            ))}
          </AnimatePresence>
        </motion.div>

        <p className="mt-8 text-center text-[12px] text-[var(--ink-muted)]">
          Dates from public trade-fair listings ({EXPO_SOURCES.map((s, i) => (
            <span key={s.href}>
              {i > 0 && ", "}
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--accent)]">{s.label}</a>
            </span>
          ))}) and may change — please confirm with the organiser.
        </p>
      </div>
    </section>
  );
}

/* ─── Real moments (infinite photo reel) ──────────────────────────────── */
export function ExpoMoments() {
  const reduced = useReducedMotion();
  const row = [...EXPO_MOMENTS, ...EXPO_MOMENTS];
  return (
    <section className="section-y overflow-hidden bg-[var(--bg-soft)]">
      <div className="container-site">
        <Heading label="Real Moments">
          Shows We&apos;ve <span className="text-[var(--accent)]">Hosted</span>
        </Heading>
      </div>
      <div className="relative mt-12">
        <motion.div
          className="flex w-max gap-4"
          animate={reduced ? undefined : { x: ["0%", "-50%"] }}
          transition={{ duration: 60, ease: "linear", repeat: Infinity }}
        >
          {row.map((m, i) => (
            <figure key={`${m.image}-${i}`} className="group relative h-[280px] w-[400px] flex-shrink-0 overflow-hidden rounded-2xl bg-black md:h-[340px] md:w-[500px]">
              <Image src={m.image} alt={`${m.title} ${m.year} at ICCB`} fill sizes="500px" className="object-cover transition-transform duration-[1.2s] group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-5">
                <span className="font-display text-[13px] tracking-[0.2em] text-[var(--accent)]">{m.year}</span>
                <p className="mt-1 font-display text-[20px] uppercase leading-tight text-white">{m.title}</p>
              </figcaption>
            </figure>
          ))}
        </motion.div>
        <div className="pointer-events-none absolute inset-y-0 start-0 w-24 bg-gradient-to-r from-[var(--bg-soft)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 end-0 w-24 bg-gradient-to-l from-[var(--bg-soft)] to-transparent" />
      </div>
      <p className="container-site mt-6 text-center text-[11.5px] text-[var(--ink-muted)]">
        Real photos from ICCB — Press Information Department, Bangladesh (public domain), via Wikimedia Commons.
      </p>
    </section>
  );
}

/* ─── CTA ─────────────────────────────────────────────────────────────── */
export function ExpoCTA({ locale }: { locale: Locale }) {
  return (
    <section className="relative overflow-hidden bg-black py-20 md:py-28">
      <motion.div className="absolute inset-0" initial={{ scale: 1.15 }} whileInView={{ scale: 1 }} viewport={{ once: false }} transition={{ duration: 2, ease }}>
        <Image src="https://images.unsplash.com/photo-1778402566957-c21d77a67d0d?auto=format&fit=crop&q=90&w=2400" alt="" fill sizes="100vw" className="object-cover opacity-45" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
      <motion.div className="relative container-site max-w-3xl text-center" initial="hidden" whileInView="show" viewport={{ once: false }} variants={{ show: { transition: { staggerChildren: 0.12 } } }}>
        <motion.h2 variants={{ hidden: { opacity: 0, y: 24, filter: "blur(8px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease } } }} className="font-display uppercase text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.02] text-white">
          Plan Your Next <span className="text-[var(--accent)]">Expo</span> at ICCB
        </motion.h2>
        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}>
          <Ornament light className="mt-6" />
        </motion.div>
        <motion.p variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }} className="mt-6 text-[16px] text-white/80">
          Pick your dates, estimate booths and services, and send your request — our expo team will reach you right away.
        </motion.p>
        <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }} className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/booking?mode=expo#booking-form-section" locale={locale} className="btn btn-primary">
            Book Expo Village <ArrowRight size={14} weight="bold" />
          </Link>
          <Link href="/booking?mode=expo#estimate" locale={locale} className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] border border-white/40 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-white hover:text-[var(--ink)]">
            Estimate my expo
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─── Year at a glance — pinned, scroll-driven horizontal month track ──── */
const MONTHS = (() => {
  const sorted = [...UPCOMING_EXPOS].sort((a, b) => a.start.localeCompare(b.start));
  const first = new Date(sorted[0].start);
  const last = new Date(sorted[sorted.length - 1].start);
  const out: { key: string; date: Date; events: UpcomingExpo[] }[] = [];
  for (let d = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1)); d <= last; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))) {
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    out.push({ key, date: d, events: sorted.filter((e) => e.start.startsWith(key)) });
  }
  return out;
})();

const OPEN_IMG = "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&q=90&w=1200";

/** One month of the calendar — photo on top, white half below with the month and its shows. */
function MonthCard({ m, locale }: { m: (typeof MONTHS)[number]; mi: number; locale: Locale }) {
  const name = m.date.toLocaleString("en", { month: "long", timeZone: "UTC" });
  const short = m.date.toLocaleString("en", { month: "short", timeZone: "UTC" });
  const empty = m.events.length === 0;
  const cover = m.events[0]?.image ?? OPEN_IMG;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 0.8, ease }}
      className="group flex h-[min(70vh,560px)] w-[min(84vw,380px)] flex-shrink-0 flex-col overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_34px_60px_-40px_rgba(0,0,0,0.45)]"
    >
      <div className="relative h-1/2 flex-shrink-0 overflow-hidden bg-black">
        <Image src={cover} alt="" fill sizes="380px" className={`object-cover transition-transform duration-[1.2s] group-hover:scale-105 ${empty ? "opacity-60 grayscale" : ""}`} />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="font-display text-[26px] uppercase leading-none text-[var(--ink)]">
          {name} <span className="text-[var(--accent)]">{m.date.getUTCFullYear()}</span>
        </p>

        {empty ? (
          <>
            <p className="mt-4 text-[14px] leading-relaxed text-[var(--ink-muted)]">No trade show listed yet — the dates are open for your expo.</p>
            <Link href="/booking?mode=expo#booking-form-section" locale={locale} className="mt-auto inline-flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
              Check {name} dates <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-1 rtl:-scale-x-100" />
            </Link>
          </>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--line)]">
            {m.events.slice(0, 3).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0 truncate text-[14px] font-medium text-[var(--ink)]">{e.short}</span>
                <span className="whitespace-nowrap text-[13px] tabular-nums text-[var(--accent)]">
                  {new Date(e.start).getUTCDate()}–{new Date(e.end).getUTCDate()} {short}
                </span>
              </li>
            ))}
            {m.events.length > 3 && <li className="pt-2.5 text-[12.5px] text-[var(--ink-muted)]">+ {m.events.length - 3} more</li>}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

export function ExpoTimeline({ locale }: { locale: Locale }) {
  const ref = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => setDist(Math.max(0, el.scrollWidth - window.innerWidth));
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist]);
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <section ref={ref} className="relative bg-[var(--bg-soft)]" style={{ height: `calc(100vh + ${dist}px)` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden pt-16">
        <motion.div ref={track} style={{ x }} className="flex w-max items-stretch gap-6 px-[clamp(1rem,6vw,6rem)]">
          {/* intro panel */}
          <div className="flex w-[min(84vw,440px)] flex-shrink-0 flex-col justify-center">
            <SectionLabel>Year at a Glance</SectionLabel>
            <h2 className="mt-4 font-display uppercase text-[clamp(2.2rem,4.4vw,3.6rem)] leading-[1.02] text-[var(--ink)]">
              The Expo <span className="text-[var(--accent)]">Calendar</span>
            </h2>
            <Ornament align="start" className="mt-5" />
            <p className="mt-5 text-[15.5px] leading-relaxed text-[var(--ink-body)]">
              Month by month, the trade shows filling Expo Village — and the open dates still waiting for your event.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              Keep scrolling <ArrowRight size={14} className="animate-pulse text-[var(--accent)] rtl:-scale-x-100" />
            </p>
          </div>

          {MONTHS.map((m, mi) => (
            <MonthCard key={m.key} m={m} mi={mi} locale={locale} />
          ))}
        </motion.div>

        {/* progress */}
        <div className="mx-auto mt-8 h-[3px] w-[min(80vw,520px)] overflow-hidden rounded-full bg-[var(--line)]">
          <motion.div className="h-full origin-left bg-[var(--accent)] rtl:origin-right" style={{ scaleX: bar }} />
        </div>
      </div>
    </section>
  );
}
