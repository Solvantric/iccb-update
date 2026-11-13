"use client";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { RevealBlock, RevealGroup, RevealItem } from "@/components/motion/RevealBlock";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import { clientLogos } from "@/data/expo";
import { PartnerLogo } from "@/components/ui/PartnerLogo";

const TILE_GAP = 12;
const TILE_STEP = 148 + TILE_GAP; // PartnerLogo width + gap
const STEP_MS = 2200; // pause between moves
const MOVE_S = 0.7; // slide duration

/**
 * Partner logos that slide one tile at a time (left or right), pause, then slide again — looping forever.
 * Track = two copies of the list; we start showing the second copy and walk back towards 0,
 * then snap (invisibly) back to the start.
 */
function LogoStepper({
  logos,
  delayMs = 0,
  direction = "right",
}: {
  logos: typeof clientLogos;
  delayMs?: number;
  direction?: "left" | "right";
}) {
  const reduced = useReducedMotion();
  const L = logos.length;
  const track = [...logos, ...logos];
  const [k, setK] = useState(0);
  const [instant, setInstant] = useState(false);
  const [paused, setPaused] = useState(false);
  const outerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(0);

  // Fit a whole number of tiles so no logo is ever cut off at the edge
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const measure = () => setVisible(Math.max(1, Math.floor((el.clientWidth + TILE_GAP) / TILE_STEP)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || paused) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        setInstant(false);
        setK((v) => v + 1);
      }, STEP_MS);
    }, delayMs);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [reduced, paused, delayMs]);

  return (
    <div ref={outerRef} dir="ltr" className="w-full">
      <div
        className="relative overflow-hidden mx-auto"
        style={{ width: visible ? visible * TILE_STEP - TILE_GAP : "100%" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <motion.div
          className="flex gap-3 w-max"
          animate={{ x: direction === "right" ? -(L - k) * TILE_STEP : -k * TILE_STEP }}
          initial={false}
          transition={instant ? { duration: 0 } : { duration: MOVE_S, ease: [0.65, 0, 0.35, 1] }}
          onAnimationComplete={() => {
            if (k >= L) {
              setInstant(true);
              setK(0);
            }
          }}
        >
          {track.map((logo, i) => (
            <PartnerLogo key={`${logo.id}-${i}`} logo={logo} />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

interface ExpoZoneProps {
  locale: Locale;
}

export function ExpoZone({ locale }: ExpoZoneProps) {
  return (
    <section className="bg-[var(--bg)] py-[clamp(4rem,10vw,9rem)] overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* LEFT: Full photo */}
          <RevealBlock className="order-2 lg:order-1">
            <div className="relative">
              <div className="aspect-[4/3] lg:aspect-square relative overflow-hidden rounded-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&q=95&w=3840"
                  alt="ICCB Expo Village — international trade fair"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-6 start-6 end-6">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                    <p className="text-white/60 text-[10px] tracking-[0.16em] uppercase mb-1">Bangladesh&apos;s Largest</p>
                    <p className="font-display text-xl text-white font-normal">Exhibition Destination</p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-white/80 text-[12px]">30+ Annual Expos</span>
                      <span className="text-white/40">·</span>
                      <span className="text-white/80 text-[12px]">20K+ Visitors</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Upcoming expo badge */}
              <RevealBlock delay={0.3} className="absolute -top-4 -end-4 md:end-auto md:-start-6">
                <div className="bg-[var(--accent)] text-white rounded-xl p-4 shadow-xl max-w-[180px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-[9px] tracking-[0.14em] uppercase font-medium">Upcoming</span>
                  </div>
                  <p className="font-display text-base font-normal leading-tight">BUILDEX 2026</p>
                  <p className="text-white/80 text-[11px] mt-1">15–18 March 2026</p>
                </div>
              </RevealBlock>
            </div>
          </RevealBlock>

          {/* RIGHT: Content + marquee logos */}
          <div className="order-1 lg:order-2">
            <RevealBlock>
              <SectionLabel>(EXPO ZONE)</SectionLabel>
            </RevealBlock>
            <RevealBlock delay={0.08}>
              <h2 className="display-lg text-[var(--ink)] mt-3 mb-6">
                WHERE INDUSTRIES EXHIBIT
              </h2>
            </RevealBlock>
            <RevealBlock delay={0.12}>
              <p className="text-[var(--ink-muted)] text-[16px] leading-relaxed mb-8 max-w-md">
                ICCB Expo Village is Bangladesh&apos;s largest dedicated exhibition space, hosting international trade fairs, product launches, and industry showcases attended by global organisations.
              </p>
            </RevealBlock>

            {/* Mini stats */}
            <RevealGroup className="grid grid-cols-3 gap-4 mb-10">
              {[
                { n: "30+", label: "Annual expos" },
                { n: "350+", label: "Exhibitors" },
                { n: "20K+", label: "Visitors/show" },
              ].map((s) => (
                <RevealItem key={s.label}>
                  <div className="border border-[var(--line)] rounded-xl p-4 text-center bg-[var(--bg-soft)]">
                    <p className="font-display text-3xl text-[var(--ink)] font-normal">{s.n}</p>
                    <p className="text-[var(--ink-muted)] text-[11px] tracking-[0.1em] uppercase mt-1">{s.label}</p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>

            {/* CTA buttons */}
            <RevealBlock delay={0.2} className="mt-8 flex gap-3 flex-wrap">
              <Link
                href="/expo-zone"
                locale={locale}
                className="flex items-center gap-2 bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] shadow-[0_8px_22px_-10px_var(--accent-glow)] hover:-translate-y-px text-white rounded-[var(--radius-btn)] px-6 py-3 text-[11px] font-bold tracking-[0.12em] uppercase hover:brightness-110 transition-colors"
              >
                Plan Your Expo
                <ArrowRight size={13} weight="bold" />
              </Link>
              <Link
                href="/enquiry"
                locale={locale}
                className="flex items-center gap-2 border-2 border-[var(--accent)] text-[var(--ink)] rounded-[var(--radius-btn)] px-6 py-3 text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-[var(--accent)] hover:text-white transition-colors"
              >
                Exhibitor Enquiry
              </Link>
            </RevealBlock>
          </div>
        </div>

        {/* Partner logos — full width, centred under the photo + content */}
        <RevealBlock delay={0.1} className="mt-14 lg:mt-16 max-w-5xl mx-auto text-center">
          <p className="text-[11px] tracking-[0.14em] uppercase text-[var(--ink-muted)] mb-5">
            Our Global Partners &amp; Exhibitors
          </p>
          <div className="space-y-3">
            <LogoStepper logos={clientLogos} />
            <LogoStepper
              logos={[...clientLogos.slice(Math.ceil(clientLogos.length / 2)), ...clientLogos.slice(0, Math.ceil(clientLogos.length / 2))]}
              delayMs={STEP_MS / 2}
            />
          </div>
        </RevealBlock>
      </div>
    </section>
  );
}
