"use client";
/**
 * Building blocks for an individual hall page (/venues/[slug]).
 * Classical look: roman numerals, arched frames, ornament dividers — with scroll-driven motion.
 */
import { useCallback, useEffect, useState, type ComponentType } from "react";
import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, ArrowLeft, CaretLeft, CaretRight, X, CalendarCheck, ChatCircleText,
  Snowflake, Microphone, MonitorPlay, Lightning, Car, Translate, VideoCamera, Sun, Presentation, SquaresFour,
  Door, SpeakerHigh, Sparkle, MagnifyingGlassPlus, CookingPot, UserCircleCheck, Armchair, WifiHigh, ShieldCheck,
  FireExtinguisher, Wheelchair, Broom, Van, type IconProps,
} from "@phosphor-icons/react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import type { Hall } from "@/types";
import { hallDetail, hallTitle } from "@/data/hallDetails";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Ornament } from "./Ornament";
import { Count } from "./Count";
import { HallSlideBg, HallSlideText } from "./HallSlide";

const ease = [0.22, 1, 0.36, 1] as const;

/* ─── Hero — the hall's own slide (same design as the All Venues hero) ───────── */
const HERO_AUTOPLAY = 5000;

export function HallHero({ hall, locale }: { hall: Hall; locale: Locale }) {
  const d = hallDetail(hall.slug);
  const reduced = useReducedMotion();
  const photos = [hall.image, ...d.gallery.slice(0, 2)];
  const [p, setP] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setP((v) => (v + 1) % photos.length), HERO_AUTOPLAY);
    return () => clearTimeout(t);
  }, [p, reduced, photos.length]);

  return (
    <section className="relative h-[86vh] min-h-[600px] max-h-[900px] overflow-hidden bg-black">
      <HallSlideBg photo={photos[p]} alt={hallTitle(hall.name.en)} priority={p === 0} />

      <div className="relative flex h-full items-center container-site pb-20">
        <HallSlideText
          hall={hall}
          top={
            <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-white/65">
              <Link href="/" locale={locale} className="hover:text-white">Home</Link>
              <span>/</span>
              <Link href="/venues" locale={locale} className="hover:text-white">Venues</Link>
              <span>/</span>
              <span className="text-white">{hall.name.en}</span>
            </nav>
          }
          footer={
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/booking?hallId=${hall.id}#booking-form-section`} locale={locale} className="btn btn-primary">
                <CalendarCheck size={16} weight="bold" /> Check Availability
              </Link>
              <a href="#layouts" className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] border border-white/40 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-[var(--ink)]">
                View Layouts
              </a>
            </div>
          }
        />
      </div>

      {/* photo dots with progress */}
      <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {photos.map((_, k) => (
          <button
            key={k}
            type="button"
            onClick={() => setP(k)}
            aria-label={`Photo ${k + 1}`}
            className={`relative h-1.5 overflow-hidden rounded-full transition-all duration-500 ${k === p ? "w-10 bg-white/30" : "w-2 bg-white/50 hover:bg-white/80"}`}
          >
            {k === p && !reduced && (
              <motion.span key={p} className="absolute inset-y-0 left-0 bg-[var(--accent)]" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: HERO_AUTOPLAY / 1000, ease: "linear" }} />
            )}
          </button>
        ))}
      </div>
      {d.credit && p > 0 && <span className="absolute end-4 top-4 text-[10px] text-white/55">{d.credit}</span>}
    </section>
  );
}

/* ─── Overview ─────────────────────────────────────────────────────────── */
export function HallOverview({ hall }: { hall: Hall }) {
  const d = hallDetail(hall.slug);
  const second = d.gallery[0] ?? hall.images[1] ?? hall.image;
  return (
    <section className="section-y bg-[var(--bg)]">
      <div className="container-site grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, margin: "-15% 0px" }}
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        >
          {[
            <SectionLabel key="l">The Hall</SectionLabel>,
            <h2 key="h" className="mt-4 font-display uppercase text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] text-[var(--ink)]">
              About <span className="text-[var(--accent)]">{hallTitle(hall.name.en)}</span>
            </h2>,
            <Ornament key="o" align="start" className="mt-5" />,
            <p key="p" className="mt-6 max-w-xl text-[16px] leading-relaxed text-[var(--ink-body)]">{d.description}</p>,
            <div key="i" className="mt-8">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">Ideal for</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {d.idealFor.map((t) => (
                  <span key={t} className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-[13px] font-medium text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
                    {t}
                  </span>
                ))}
              </div>
            </div>,
          ].map((node, i) => (
            <motion.div key={i} variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }}>
              {node}
            </motion.div>
          ))}
        </motion.div>

        {/* arched photo pair */}
        <div className="relative mx-auto grid w-full max-w-lg grid-cols-[1.2fr_1fr] items-end gap-4">
          <motion.div
            className="relative aspect-[3/4.4] overflow-hidden rounded-t-[999px] shadow-[0_40px_70px_-40px_rgba(0,0,0,0.5)]"
            initial={{ clipPath: "inset(100% 0 0 0)" }}
            whileInView={{ clipPath: "inset(0% 0 0 0)" }}
            viewport={{ once: false, margin: "-15% 0px" }}
            transition={{ duration: 1.2, ease }}
          >
            <Image src={hall.image} alt={hallTitle(hall.name.en)} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
          </motion.div>
          <div className="space-y-4 pb-10">
            <motion.div
              className="relative aspect-[3/4] overflow-hidden rounded-t-[999px]"
              initial={{ clipPath: "inset(100% 0 0 0)" }}
              whileInView={{ clipPath: "inset(0% 0 0 0)" }}
              viewport={{ once: false, margin: "-15% 0px" }}
              transition={{ duration: 1.2, ease, delay: 0.25 }}
            >
              <Image src={second} alt="" fill sizes="(max-width: 1024px) 40vw, 20vw" className="object-cover" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.7, ease, delay: 0.6 }}
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-center"
            >
              <p className="font-display text-[34px] leading-none text-[var(--accent)]">
                <Count to={hall.capacity.cocktail ?? hall.capacity.theatre} />
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">Max guests</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Layout visualiser ───────────────────────────────────────────────── */
type LayoutKey = "theatre" | "banquet" | "classroom" | "cocktail" | "exhibition";
const LAYOUT_INFO: Record<LayoutKey, { t: string; note: string }> = {
  theatre: { t: "Theatre", note: "Rows of chairs facing the stage — conferences, launches and ceremonies." },
  banquet: { t: "Banquet", note: "Round tables of eight to ten — weddings, receptions and gala dinners." },
  classroom: { t: "Classroom", note: "Tables and chairs facing the front — training, exams and workshops." },
  cocktail: { t: "Cocktail", note: "Standing reception with high tables — networking and evening mixers." },
  exhibition: { t: "Exhibition", note: "Shell-scheme booths with aisles — fairs, expos and showcases." },
};

/* Fixed "real room" palette — an illustration, so it stays the same in light and dark mode. */
const C = {
  floor: "#f4ede3", tile: "#e9dfd1", wall: "#2f2a26", stage: "#2a2420", stageEdge: "#6b5240", led: "#151a2e",
  chairRed: "#b3262d", chairBack: "#7d1a20", cover: "#ffffff", coverEdge: "#cdbca6", wood: "#c9a77c", woodEdge: "#9c7b55",
  dark: "#3b332d", flower: "#e0607a", leaf: "#5d8a4e", carpet: "#b3262d", head: "#3b2f28", body: "#7b6b5d", booth: "#ffffff",
};

/** Chair seen from above. Faces "up" (towards the stage) at rotate 0. */
function Chair({ x, y, r = 0, s = 1, color = C.chairRed, back = C.chairBack }: { x: number; y: number; r?: number; s?: number; color?: string; back?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <rect x={-3.6} y={-3.2} width={7.2} height={6} rx={1.6} fill={color} />
      <rect x={-3.8} y={2.2} width={7.6} height={2.2} rx={1} fill={back} />
    </g>
  );
}

function Person({ x, y, r = 0 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <ellipse cx={0} cy={0.8} rx={4.4} ry={2.6} fill={C.body} />
      <circle cx={0} cy={0} r={2.3} fill={C.head} />
    </g>
  );
}

function Stage({ label = "STAGE", screen = true }: { label?: string; screen?: boolean }) {
  return (
    <motion.g initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
      {screen && (
        <>
          <rect x={150} y={13} width={120} height={7} rx={1.5} fill={C.led} />
          <rect x={150} y={13} width={120} height={7} rx={1.5} fill="url(#ledGlow)" opacity={0.8} />
        </>
      )}
      <rect x={110} y={22} width={200} height={34} rx={3} fill={C.stage} />
      <rect x={110} y={52} width={200} height={4} fill={C.stageEdge} />
      {/* flower line along the stage front */}
      {Array.from({ length: 20 }).map((_, i) => (
        <circle key={i} cx={115 + i * 10} cy={59} r={2.1} fill={i % 2 ? C.flower : C.leaf} />
      ))}
      <rect x={196} y={32} width={14} height={9} rx={1.5} fill={C.stageEdge} />
      <text x={210} y={50} textAnchor="middle" fill="white" fontSize={8} fontWeight={700} letterSpacing={2.5}>{label}</text>
    </motion.g>
  );
}

function Plan({ layout }: { layout: LayoutKey }) {
  const els: { k: string; node: React.ReactNode }[] = [];

  if (layout === "theatre") {
    // gently curved rows facing the stage, centre aisle
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 20; c++) {
        if (c === 9 || c === 10) continue;
        const x = 30 + c * 18.8;
        const curve = Math.pow((x - 210) / 180, 2) * 10;
        els.push({ k: `${r}-${c}`, node: <Chair x={x} y={82 + r * 20 - curve} r={((x - 210) / 180) * -12} /> });
      }
  } else if (layout === "classroom") {
    for (let r = 0; r < 6; r++)
      for (let t = 0; t < 4; t++) {
        const x = 28 + t * 92 + (t >= 2 ? 6 : 0);
        const y = 80 + r * 31;
        els.push({ k: `t${r}-${t}`, node: <rect x={x} y={y} width={72} height={9} rx={1.5} fill={C.wood} stroke={C.woodEdge} strokeWidth={0.8} /> });
        for (let s = 0; s < 3; s++) els.push({ k: `s${r}-${t}-${s}`, node: <Chair x={x + 12 + s * 24} y={y + 15} color={C.dark} back="#1f1a17" /> });
        els.push({ k: `n${r}-${t}`, node: <rect x={x + 30} y={y + 2.5} width={9} height={4} rx={0.6} fill="#fff" opacity={0.9} /> });
      }
  } else if (layout === "banquet") {
    // three tables either side of the centre carpet aisle
    const xs = [40, 100, 160, 260, 320, 380];
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < xs.length; c++) {
        const cy = 98 + r * 62;
        const x = xs[c];
        els.push({
          k: `t${r}-${c}`,
          node: (
            <g>
              <circle cx={x} cy={cy + 1.5} r={15} fill="rgba(0,0,0,0.12)" />
              <circle cx={x} cy={cy} r={14.5} fill={C.cover} stroke={C.coverEdge} strokeWidth={1} />
              <circle cx={x} cy={cy} r={3.4} fill={C.flower} />
              <circle cx={x} cy={cy} r={1.4} fill={C.leaf} />
            </g>
          ),
        });
        for (let s = 0; s < 8; s++) {
          const a = (s / 8) * Math.PI * 2;
          const deg = (a * 180) / Math.PI + 90;
          els.push({ k: `s${r}-${c}-${s}`, node: <Chair x={x + Math.cos(a) * 21} y={cy + Math.sin(a) * 21} r={deg + 180} color={C.cover} back={C.coverEdge} /> });
        }
      }
  } else if (layout === "cocktail") {
    const pts = [[64,96],[150,88],[250,100],[336,90],[100,160],[200,150],[300,165],[372,150],[60,222],[160,215],[250,232],[340,226]];
    pts.forEach(([x, y], i) => {
      els.push({ k: `t${i}`, node: <g><circle cx={x} cy={y + 1} r={7.5} fill="rgba(0,0,0,0.12)" /><circle cx={x} cy={y} r={7} fill={C.cover} stroke={C.coverEdge} /><circle cx={x - 2} cy={y - 1} r={1.4} fill={C.flower} /></g> });
      for (let s = 0; s < 4; s++) {
        const a = (s / 4) * Math.PI * 2 + (i % 2 ? 0.4 : 1.1);
        els.push({ k: `p${i}-${s}`, node: <Person x={x + Math.cos(a) * 15} y={y + Math.sin(a) * 15} r={(a * 180) / Math.PI - 90} /> });
      }
    });
  } else {
    // exhibition: shell-scheme booths in rows with aisles
    const colors = [C.chairRed, "#2f6f9f", "#3f7d4a", "#c58a1b"];
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 7; c++) {
        const x = 26 + c * 54;
        const y = 34 + r * 58 + (r >= 2 ? 10 : 0);
        const fascia = colors[(r + c) % colors.length];
        els.push({
          k: `${r}-${c}`,
          node: (
            <g>
              <rect x={x} y={y} width={46} height={38} fill="#ebe2d4" />
              <path d={`M${x} ${y + 38} V${y} H${x + 46} V${y + 38}`} fill="none" stroke={C.booth} strokeWidth={2.4} />
              <path d={`M${x} ${y + 38} V${y} H${x + 46} V${y + 38}`} fill="none" stroke="#bfb2a0" strokeWidth={0.6} />
              <rect x={x + 3} y={y + 30} width={40} height={5} rx={1} fill={fascia} />
              <rect x={x + 14} y={y + 12} width={18} height={7} rx={1} fill="#fff" stroke="#cdbca6" strokeWidth={0.6} />
            </g>
          ),
        });
      }
  }

  const stage = layout !== "exhibition";
  return (
    <svg viewBox="0 0 420 290" className="h-full w-full">
      <defs>
        <pattern id="floorTile" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill={C.floor} />
          <path d="M20 0H0V20" fill="none" stroke={C.tile} strokeWidth="0.8" />
        </pattern>
        <linearGradient id="ledGlow" x1="0" x2="1">
          <stop offset="0" stopColor="#b3262d" />
          <stop offset="0.5" stopColor="#f0a35b" />
          <stop offset="1" stopColor="#6b3fa0" />
        </linearGradient>
      </defs>
      {/* floor + walls with entrance doors at the back */}
      <rect x="6" y="6" width="408" height="278" rx="6" fill="url(#floorTile)" />
      <path d="M6 6 H414 V284 H262 M158 284 H6 Z" fill="none" stroke={C.wall} strokeWidth={5} strokeLinejoin="round" />
      <path d="M158 284 a 22 22 0 0 1 22 -22 M262 284 a 22 22 0 0 0 -22 -22" fill="none" stroke={C.wall} strokeWidth={1} strokeDasharray="2 2" />
      <text x="210" y="279" textAnchor="middle" fill={C.wall} fontSize={7} fontWeight={700} letterSpacing={2}>ENTRANCE</text>
      {/* red carpet aisle */}
      {(layout === "theatre" || layout === "banquet") && (
        <motion.rect x={198} y={62} width={24} height={200} fill={C.carpet} opacity={0.85} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ transformOrigin: "210px 262px" }} transition={{ duration: 0.8, ease }} />
      )}
      {stage && <Stage label={layout === "banquet" ? "STAGE · DAIS" : "STAGE"} screen={layout !== "cocktail"} />}
      {layout === "cocktail" && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <rect x={14} y={70} width={10} height={170} rx={2} fill={C.wood} stroke={C.woodEdge} />
          <text x={19} y={160} textAnchor="middle" fill={C.wall} fontSize={6.5} fontWeight={700} transform="rotate(-90 19 160)" letterSpacing={2}>BAR</text>
          <rect x={396} y={70} width={10} height={170} rx={2} fill={C.cover} stroke={C.coverEdge} />
          <text x={401} y={160} textAnchor="middle" fill={C.wall} fontSize={6.5} fontWeight={700} transform="rotate(90 401 160)" letterSpacing={2}>BUFFET</text>
        </motion.g>
      )}
      <g>
        {els.map((e, i) => (
          <motion.g
            key={e.k}
            initial={{ opacity: 0, scale: 0.2, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.25 + Math.min(i * 0.005, 0.9) }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          >
            {e.node}
          </motion.g>
        ))}
      </g>
    </svg>
  );
}

/** Top-view floor plan of the chosen set-up. */
function RoomView({ layout }: { layout: LayoutKey }) {
  return (
    <div>
      <div className="relative aspect-[420/290] w-full overflow-hidden rounded-xl shadow-[0_24px_40px_-30px_rgba(0,0,0,0.35)]">
        <AnimatePresence mode="wait">
          <motion.div key={layout} className="h-full w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
            <Plan layout={layout} />
          </motion.div>
        </AnimatePresence>
      </div>
      {/* legend */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11.5px] text-[var(--ink-muted)]">
        {[
          { c: C.chairRed, t: "Chair" },
          { c: C.cover, t: "Table / covered chair", b: C.coverEdge },
          { c: C.stage, t: "Stage" },
          { c: C.carpet, t: "Carpet aisle" },
          { c: C.flower, t: "Floral décor" },
        ].map((l) => (
          <span key={l.t} className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm" style={{ background: l.c, border: l.b ? `1px solid ${l.b}` : undefined }} />
            {l.t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function LayoutVisualizer({ hall }: { hall: Hall }) {
  const layouts = (Object.keys(LAYOUT_INFO) as LayoutKey[]).filter((k) => (hall.capacity[k] ?? 0) > 0);
  const [active, setActive] = useState<LayoutKey>(layouts.includes("banquet") ? "banquet" : layouts[0]);
  const max = Math.max(...layouts.map((k) => hall.capacity[k] ?? 0));

  return (
    <section id="layouts" className="section-y scroll-mt-24 bg-[var(--bg-soft)]">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ duration: 0.6, ease }}>
            <SectionLabel>Seating Layouts</SectionLabel>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: false }}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
            className="mt-4 font-display uppercase text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] text-[var(--ink)]"
          >
            Capacity by <span className="text-[var(--accent)]">Layout</span>
          </motion.h2>
          <Ornament className="mt-5" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-10% 0px" }}
          transition={{ duration: 0.8, ease, delay: 0.15 }}
          className="mt-12 grid overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_30px_70px_-45px_rgba(0,0,0,0.4)] lg:grid-cols-[340px_1fr]"
        >
          <LayoutGroup id="layouts">
            <ul className="border-b border-[var(--line)] p-3 lg:border-b-0 lg:border-e">
              {layouts.map((k) => {
                const on = k === active;
                const v = hall.capacity[k] ?? 0;
                return (
                  <li key={k}>
                    <button
                      type="button"
                      onClick={() => setActive(k)}
                      onMouseEnter={() => setActive(k)}
                      className="relative w-full rounded-2xl px-5 py-4 text-start"
                    >
                      {on && <motion.span layoutId="layout-bg" className="absolute inset-0 rounded-2xl bg-[var(--bg-soft)]" transition={{ type: "spring", stiffness: 380, damping: 34 }} />}
                      <span className="relative flex items-baseline justify-between gap-3">
                        <span className={`text-[15px] font-semibold transition-colors ${on ? "text-[var(--accent)]" : "text-[var(--ink)]"}`}>{LAYOUT_INFO[k].t}</span>
                        <span className="font-display text-[22px] leading-none text-[var(--ink)] tabular-nums">
                          {v.toLocaleString()}
                          {k === "exhibition" && <span className="ms-1 text-[12px] text-[var(--ink-muted)]">booths</span>}
                        </span>
                      </span>
                      <span className="relative mt-2.5 block h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
                        <motion.span
                          className="absolute inset-y-0 start-0 rounded-full bg-[var(--accent)]"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(v / max) * 100}%` }}
                          viewport={{ once: false }}
                          transition={{ duration: 1, ease }}
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </LayoutGroup>

          <div className="p-5 md:p-8">
            <RoomView layout={active} />
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease }} className="mt-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-display text-[26px] uppercase leading-none text-[var(--ink)]">{LAYOUT_INFO[active].t} style</p>
                  <p className="mt-2 max-w-md text-[14px] text-[var(--ink-muted)]">{LAYOUT_INFO[active].note}</p>
                </div>
                <p className="font-display text-[44px] leading-none text-[var(--accent)]">
                  {(hall.capacity[active] ?? 0).toLocaleString()}
                  <span className="ms-2 text-[13px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">{active === "exhibition" ? "booths" : "guests"}</span>
                </p>
              </motion.div>
            </AnimatePresence>
            <p className="mt-4 text-[11.5px] text-[var(--ink-muted)]">Illustrative set-up — not to scale; each symbol stands for a group of seats. Your final floor plan is drawn up with our event team.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Features ─────────────────────────────────────────────────────────── */
const FEATURE_ICONS: [RegExp, ComponentType<IconProps>][] = [
  [/air|ac\b/i, Snowflake],
  [/sound|speaker/i, SpeakerHigh],
  [/led|screen|projector|projection/i, MonitorPlay],
  [/power|backup/i, Lightning],
  [/parking/i, Car],
  [/interpretation|language/i, Translate],
  [/video|conferenc/i, VideoCamera],
  [/light/i, Sun],
  [/stage|podium|rigging/i, Presentation],
  [/partition|modular/i, SquaresFour],
  [/foyer/i, Door],
  [/av\b|audio/i, Microphone],
];
const iconFor = (t: string) => FEATURE_ICONS.find(([re]) => re.test(t))?.[1] ?? Sparkle;

/** Shared ICCB facilities used to round every hall up to 12 features. */
const EXTRAS: { t: string; icon: ComponentType<IconProps> }[] = [
  { t: "In-house catering & double kitchen", icon: CookingPot },
  { t: "Décor & lighting by our design team", icon: Sparkle },
  { t: "Dedicated event coordinator", icon: UserCircleCheck },
  { t: "Prayer rooms & green rooms", icon: Armchair },
  { t: "High-speed Wi-Fi", icon: WifiHigh },
  { t: "24/7 CCTV & trained security", icon: ShieldCheck },
  { t: "3,500+ car parking", icon: Car },
  { t: "Fire safety & emergency exits", icon: FireExtinguisher },
  { t: "Wheelchair-friendly access", icon: Wheelchair },
  { t: "Clean restrooms & housekeeping", icon: Broom },
  { t: "Guest transport on request", icon: Van },
  { t: "Dedicated power backup", icon: Lightning },
];

function featureList(hall: Hall) {
  const out: { t: string; icon: ComponentType<IconProps> }[] = [];
  const used = new Set<ComponentType<IconProps>>();
  for (const f of hall.features) {
    const icon = iconFor(f.en);
    if (used.has(icon)) continue;
    used.add(icon);
    out.push({ t: f.en, icon });
  }
  for (const e of EXTRAS) {
    if (out.length >= 12) break;
    if (used.has(e.icon)) continue;
    used.add(e.icon);
    out.push(e);
  }
  return out.slice(0, 12);
}

export function HallFeatures({ hall }: { hall: Hall }) {
  const list = featureList(hall);
  return (
    <section className="section-y bg-[var(--bg)]">
      <div className="container-site">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ duration: 0.6, ease }}>
              <SectionLabel>Features & Facilities</SectionLabel>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: false }}
              transition={{ duration: 0.8, ease, delay: 0.1 }}
              className="mt-4 font-display uppercase text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] text-[var(--ink)]"
            >
              Everything <span className="text-[var(--accent)]">In Place</span>
            </motion.h2>
          </div>
          <Ornament align="start" />
        </div>

        <motion.ul
          className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.15 }}
          variants={{ show: { transition: { staggerChildren: 0.13, delayChildren: 0.1 } } }}
        >
          {list.map(({ t, icon: Icon }, i) => (
            <motion.li
              key={t}
              variants={{ hidden: { opacity: 0, y: 36, scale: 0.92 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease } } }}
              className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 transition-all duration-500 hover:-translate-y-1.5 hover:border-[var(--accent)]/40 hover:shadow-[0_26px_50px_-30px_rgba(0,0,0,0.45)] sm:p-6"
            >
              <span className="absolute end-4 top-4 font-display text-[13px] text-[var(--ink-muted)]/40">{String(i + 1).padStart(2, "0")}</span>

              {/* icon medallion */}
              <motion.span
                variants={{ hidden: { scale: 0, rotate: -120 }, show: { scale: 1, rotate: 0, transition: { type: "spring", stiffness: 260, damping: 17, delay: 0.2 } } }}
                className="relative grid h-14 w-14 place-items-center"
              >
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--accent)]/15 to-[var(--accent)]/[0.03] ring-1 ring-[var(--accent)]/20 transition-all duration-500 group-hover:rotate-6 group-hover:from-[var(--accent)] group-hover:to-[var(--accent-deep)] group-hover:ring-transparent" />
                <span className="absolute -inset-1.5 rounded-[20px] border border-dashed border-[var(--accent)]/0 transition-all duration-700 group-hover:rotate-45 group-hover:border-[var(--accent)]/40" />
                <Icon size={28} weight="duotone" className="relative text-[var(--accent)] transition-all duration-500 group-hover:scale-110 group-hover:text-white" />
              </motion.span>

              <p className="relative mt-5 text-[14.5px] font-semibold leading-snug text-[var(--ink)] sm:text-[15px]">{t}</p>
              <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-[var(--accent)] transition-transform duration-500 group-hover:scale-x-100 rtl:origin-right" />
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

/* ─── Gallery with lightbox ───────────────────────────────────────────── */
export function HallGallery({ hall }: { hall: Hall }) {
  const d = hallDetail(hall.slug);
  const imgs = Array.from(new Set([...hall.images, ...d.gallery])).slice(0, 5);
  const [open, setOpen] = useState<number | null>(null);
  const go = useCallback((dir: number) => setOpen((o) => (o === null ? o : (o + dir + imgs.length) % imgs.length)), [imgs.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, go]);

  const spans = ["md:col-span-2 md:row-span-2", "", "", "", ""];

  return (
    <section className="section-y bg-[var(--bg-soft)]">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ duration: 0.6, ease }}>
            <SectionLabel>Gallery</SectionLabel>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: false }}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
            className="mt-4 font-display uppercase text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] text-[var(--ink)]"
          >
            Inside <span className="text-[var(--accent)]">{hall.name.en}</span>
          </motion.h2>
          <Ornament className="mt-5" />
        </div>

        <motion.div
          className="mt-12 grid auto-rows-[180px] grid-cols-2 gap-3 md:auto-rows-[220px] md:grid-cols-4"
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, margin: "-10% 0px" }}
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        >
          {imgs.map((src, i) => (
            <motion.button
              key={src}
              type="button"
              onClick={() => setOpen(i)}
              variants={{ hidden: { opacity: 0, clipPath: "inset(0 0 100% 0)" }, show: { opacity: 1, clipPath: "inset(0 0 0% 0)", transition: { duration: 1, ease } } }}
              className={`group relative overflow-hidden rounded-2xl bg-black ${spans[i] ?? ""} ${i === 0 ? "col-span-2 row-span-2" : ""}`}
              aria-label={`Open photo ${i + 1}`}
            >
              <Image src={src} alt={`${hallTitle(hall.name.en)} — photo ${i + 1}`} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-[1.2s] group-hover:scale-110" />
              <span className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/35" />
              <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-[var(--ink)]">
                  <MagnifyingGlassPlus size={22} />
                </span>
              </span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {d.credit && <p className="container-site mt-4 text-end text-[11px] text-[var(--ink-muted)]">{d.credit}</p>}

      <AnimatePresence>
        {open !== null && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={open}
                className="relative h-[78vh] w-full max-w-6xl"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4, ease }}
                onClick={(e) => e.stopPropagation()}
              >
                <Image src={imgs[open]} alt={`${hallTitle(hall.name.en)} — photo ${open + 1}`} fill sizes="100vw" className="object-contain" />
              </motion.div>
            </AnimatePresence>
            <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="absolute end-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <X size={20} />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous photo" className="absolute start-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <CaretLeft size={22} />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next photo" className="absolute end-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <CaretRight size={22} />
            </button>
            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[13px] tracking-[0.2em] text-white/70">
              {open + 1} / {imgs.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ─── Booking band ────────────────────────────────────────────────────── */
export function HallBookingBand({ hall, locale }: { hall: Hall; locale: Locale }) {
  const d = hallDetail(hall.slug);
  return (
    <section className="relative overflow-hidden bg-black py-20 md:py-28">
      <motion.div className="absolute inset-0" initial={{ scale: 1.15 }} whileInView={{ scale: 1 }} viewport={{ once: false }} transition={{ duration: 2, ease }}>
        <Image src={d.gallery[1] ?? hall.image} alt="" fill sizes="100vw" className="object-cover opacity-45" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
      <motion.div
        className="relative container-site max-w-3xl text-center"
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, margin: "-10% 0px" }}
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
      >
        <motion.p variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }} className="font-display text-[13px] tracking-[0.3em] text-[var(--accent)]">
          HALL {d.numeral} · RESERVE YOUR DATE
        </motion.p>
        <motion.h2 variants={{ hidden: { opacity: 0, y: 24, filter: "blur(8px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease } } }} className="mt-4 font-display uppercase text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.02] text-white">
          Make {hall.name.en} <span className="text-[var(--accent)]">Yours</span>
        </motion.h2>
        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}>
          <Ornament light className="mt-6" />
        </motion.div>
        <motion.p variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }} className="mt-6 text-[16px] text-white/80">
          See live availability, build your package and get an instant estimate. Our team contacts you right after your request.
        </motion.p>
        <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }} className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href={`/booking?hallId=${hall.id}#booking-form-section`} locale={locale} className="btn btn-primary group">
            <CalendarCheck size={16} weight="bold" /> Check Availability
          </Link>
          <Link href="/enquiry" locale={locale} className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] border border-white/40 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-white hover:text-[var(--ink)]">
            <ChatCircleText size={16} /> Request a Quote
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─── Other halls + prev / next ───────────────────────────────────────── */
export function OtherHalls({ hall, halls, locale }: { hall: Hall; halls: Hall[]; locale: Locale }) {
  const idx = halls.findIndex((h) => h.id === hall.id);
  const prev = halls[(idx - 1 + halls.length) % halls.length];
  const next = halls[(idx + 1) % halls.length];
  const others = halls.filter((h) => h.id !== hall.id);

  return (
    <section className="section-y bg-[var(--bg)]">
      <div className="container-site">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ duration: 0.6, ease }}>
              <SectionLabel>Explore More</SectionLabel>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: false }}
              transition={{ duration: 0.8, ease, delay: 0.1 }}
              className="mt-4 font-display uppercase text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] text-[var(--ink)]"
            >
              Other <span className="text-[var(--accent)]">Halls</span>
            </motion.h2>
          </div>
          <Link href="/venues" locale={locale} className="inline-flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] hover:text-[var(--accent)]">
            All venues <ArrowRight size={14} className="rtl:-scale-x-100" />
          </Link>
        </div>

        <motion.div
          className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-5"
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, margin: "-10% 0px" }}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        >
          {others.map((h) => {
            const d = hallDetail(h.slug);
            return (
              <motion.div key={h.id} variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }}>
                <Link href={`/venues/${h.slug}`} locale={locale} className="group relative block aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-2xl bg-black">
                  <Image src={h.image} alt={hallTitle(h.name.en)} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover opacity-85 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-4 text-center">
                    <span className="block font-display text-[12px] tracking-[0.25em] text-white/60">{d.numeral}</span>
                    <span className="block font-display text-[18px] uppercase leading-tight text-white">{h.name.en}</span>
                    <span className="mt-1 block max-h-0 overflow-hidden text-[12px] text-white/75 transition-all duration-500 group-hover:max-h-10">
                      Up to {h.capacity.theatre.toLocaleString()} guests
                    </span>
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* prev / next */}
        <div className="mt-14 grid gap-3 border-t border-[var(--line)] pt-8 sm:grid-cols-2">
          {[
            { h: prev, dir: "Previous hall", icon: ArrowLeft, align: "" },
            { h: next, dir: "Next hall", icon: ArrowRight, align: "sm:flex-row-reverse sm:text-end" },
          ].map(({ h, dir, icon: Icon, align }) => (
            <Link key={dir} href={`/venues/${h.slug}`} locale={locale} className={`group flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-[var(--bg-soft)] ${align}`}>
              <span className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl">
                <Image src={h.image} alt="" fill sizes="96px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  {dir}
                </span>
                <span className="block font-display text-[22px] uppercase leading-tight text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]">{h.name.en}</span>
              </span>
              <Icon size={20} className="flex-shrink-0 text-[var(--accent)] transition-transform group-hover:scale-125 rtl:-scale-x-100" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
