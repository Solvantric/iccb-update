"use client";
import { RevealBlock } from "@/components/motion/RevealBlock";

const VIDEO_ID = "5xrEvhLymd8";

export function VideoBlock() {
  return (
    <section className="py-[clamp(4rem,10vw,9rem)] bg-[var(--bg-soft)]">
      <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
        <RevealBlock className="text-center mb-10">
          <span className="meta-label block mb-3">(OUR STORY)</span>
          <h2 className="font-display text-4xl md:text-5xl text-[var(--ink)] font-normal uppercase tracking-wide">
            ICCB EXPO VILLAGE
          </h2>
          <p className="text-[var(--ink-muted)] text-[16px] mt-4 max-w-xl mx-auto">
            Experience Bangladesh&apos;s largest exhibition and convention destination.
          </p>
        </RevealBlock>

        <RevealBlock>
          <div className="relative aspect-video max-w-5xl mx-auto overflow-hidden rounded-2xl ring-1 ring-[var(--line)] shadow-2xl">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${VIDEO_ID}&controls=1&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3`}
              title="ICCB Expo Village — Official Tour"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </RevealBlock>

        <RevealBlock delay={0.15} className="mt-10 text-center">
          <p className="text-[var(--ink-muted)] text-[11px] tracking-[0.16em] uppercase">
            ICCB — INTERNATIONAL CONVENTION CITY BASHUNDHARA · DHAKA, BANGLADESH
          </p>
        </RevealBlock>
      </div>
    </section>
  );
}
