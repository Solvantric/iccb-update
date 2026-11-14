"use client";
import { RevealBlock, RevealGroup, RevealItem } from "@/components/motion/RevealBlock";
import { SectionLabel } from "@/components/ui/SectionLabel";
import {
  CarProfile, Lightning, Snowflake, ChefHat, ShieldCheck, Wheelchair, MapPin, WifiHigh,
} from "@phosphor-icons/react";
import { FacilityCard } from "./FacilityCard";

/**
 * Barely-visible doodle backdrop on pure white: catering, dining & event line art
 * (cloche, cutlery, glasses, cake, chandelier, mic, teacup, gift…), neutral grey only.
 */
function SectionArt() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full text-[var(--ink)] opacity-[0.055] dark:opacity-[0.07] [mask-image:radial-gradient(ellipse_at_center,rgba(0,0,0,0.45)_30%,black_80%)]"
      >
        <defs>
          <pattern id="why-doodle" width="360" height="360" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              {/* Cloche (catering dome) */}
              <g transform="translate(18 30) rotate(-8 45 40)">
                <path d="M6 62h78" />
                <path d="M14 62a31 31 0 0 1 62 0" />
                <path d="M45 31v-4" />
                <circle cx="45" cy="24" r="3.5" />
                <path d="M26 50a22 22 0 0 1 10-10" />
              </g>
              {/* Fork & knife */}
              <g transform="translate(150 18) rotate(12 20 40)">
                <path d="M8 4v18a6 6 0 0 0 12 0V4M14 4v18M14 28v50" />
                <path d="M34 4c8 6 9 22 2 30v44" />
              </g>
              {/* Wine glass */}
              <g transform="translate(258 26) rotate(-6 24 40)">
                <path d="M8 4h32c0 18-6 30-16 30S8 22 8 4z" />
                <path d="M10 16h28" />
                <path d="M24 34v30M12 66h24" />
              </g>
              {/* Plate with cutlery */}
              <g transform="translate(36 166)">
                <circle cx="50" cy="40" r="30" />
                <circle cx="50" cy="40" r="20" />
                <path d="M6 18v14a4 4 0 0 0 8 0V18M10 36v28" />
                <path d="M92 18c6 4 6 16 1 22v24" />
              </g>
              {/* Tiered cake */}
              <g transform="translate(180 150) rotate(6 40 40)">
                <rect x="6" y="52" width="68" height="22" rx="3" />
                <rect x="16" y="32" width="48" height="20" rx="3" />
                <rect x="26" y="14" width="28" height="18" rx="3" />
                <path d="M40 14V6M37 4c1-3 5-3 6 0" />
                <path d="M6 62c8 4 14-4 22 0s14 4 22 0 16-4 24 0" />
              </g>
              {/* Chandelier */}
              <g transform="translate(286 150)">
                <path d="M30 0v18" />
                <path d="M4 30c0 8 52 8 52 0" />
                <path d="M30 18c-14 0-26 4-26 12M30 18c14 0 26 4 26 12" />
                <path d="M4 30v-8M56 30v-8M30 34v-10" />
                <path d="M2 20c1-3 3-4 2-7M54 20c1-3 3-4 2-7M28 22c1-3 3-4 2-7" />
                <path d="M12 38l-3 8M48 38l3 8M30 36v10" />
              </g>
              {/* Microphone (conference) */}
              <g transform="translate(40 276) rotate(-12 20 36)">
                <rect x="12" y="2" width="16" height="30" rx="8" />
                <path d="M6 22a14 14 0 0 0 28 0" />
                <path d="M20 36v14M10 50h20" />
              </g>
              {/* Teacup */}
              <g transform="translate(150 282)">
                <path d="M8 14h40v14a20 20 0 0 1-40 0z" />
                <path d="M48 18h6a7 7 0 0 1 0 14h-8" />
                <path d="M2 50h56" />
                <path d="M20 8c-2-4 2-6 0-10M30 8c-2-4 2-6 0-10" />
              </g>
              {/* Gift box */}
              <g transform="translate(272 270) rotate(8 30 36)">
                <rect x="4" y="22" width="52" height="40" rx="2" />
                <path d="M2 22h56v-8H2zM30 14v48" />
                <path d="M30 14c-6-12-20-10-14-2M30 14c6-12 20-10 14-2" />
              </g>
              {/* Small accents: sparkles & dots */}
              <path d="M128 120l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
              <path d="M330 110l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
              <path d="M100 250l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
              <circle cx="240" cy="110" r="2" />
              <circle cx="120" cy="340" r="2" />
              <circle cx="345" cy="245" r="2" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#why-doodle)" />
      </svg>
    </div>
  );
}

const facilities = [
  { icon: CarProfile, anim: "drive" as const, title: "2,000+ Parking Spaces", desc: "Dedicated on-site parking for large events, with security and valet service." },
  { icon: Lightning, anim: "flicker" as const, title: "Full Power Backup", desc: "High-capacity generators ensure uninterrupted power throughout all events." },
  { icon: Snowflake, anim: "spin" as const, title: "Central Air Conditioning", desc: "Precision-controlled climate in all halls, keeping every event comfortable." },
  { icon: ChefHat, anim: "wobble" as const, title: "Own Modern Kitchen", desc: "State-of-the-art kitchen with strict quality-control from farm to table." },
  { icon: ShieldCheck, anim: "shield" as const, title: "24/7 Security", desc: "Professional security team, CCTV coverage, and controlled access throughout." },
  { icon: Wheelchair, anim: "roll" as const, title: "Fully Accessible", desc: "Wheelchair access, lifts, and accessible facilities across all venues." },
  { icon: MapPin, anim: "bounce" as const, title: "Prime Location", desc: "On the 300 ft. Purbachal Express Highway, 25 km from Dhaka airport." },
  { icon: WifiHigh, anim: "signal" as const, title: "High-Speed Internet", desc: "Dedicated fiber-optic connectivity for conferences and hybrid events." },
];

export function WhyICCB() {
  return (
    <section className="relative isolate overflow-hidden bg-[var(--bg)] py-[clamp(4rem,10vw,9rem)]">
      <SectionArt />
      <div className="relative max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
        {/* Centered heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-14">
          <RevealBlock>
            <SectionLabel>(FACILITIES)</SectionLabel>
          </RevealBlock>
          <RevealBlock delay={0.08}>
            <h2 className="display-lg text-[var(--ink)] mt-3 mb-5">
              WHY CHOOSE <span className="text-[var(--accent)]">ICCB</span>
            </h2>
          </RevealBlock>
          <RevealBlock delay={0.12}>
            <span aria-hidden="true" className="block h-[3px] w-14 bg-[var(--accent)] mx-auto mb-5" />
            <p className="text-[var(--ink-body)] text-[16px] leading-relaxed">
              Every detail is designed to make your event flawless. World-class infrastructure, professional staff, and comprehensive services — all in one iconic location.
            </p>
          </RevealBlock>
        </div>

        {/* Compact facility grid — 4 per row, 2 rows on desktop */}
        <RevealGroup className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 max-w-6xl mx-auto">
          {facilities.map((f, i) => (
            <RevealItem key={f.title}>
              <FacilityCard icon={f.icon} anim={f.anim} title={f.title} desc={f.desc} index={i} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
