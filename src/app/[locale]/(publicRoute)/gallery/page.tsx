import type { Metadata } from "next";
import Image from "next/image";
import { RevealBlock, RevealGroup, RevealItem } from "@/components/motion/RevealBlock";
import { galleryImages } from "@/data/images";

export const metadata: Metadata = {
  title: "Gallery — ICCB",
  description: "Browse photos from ICCB's halls, events, and facilities.",
};

const FILTERS = ["All", "Halls", "Events", "Catering", "Exterior"];

export default function GalleryPage() {
  return (
    <div className="pt-20 md:pt-24">
      {/* Page header */}
      <section className="bg-[var(--bg-soft)] py-12 border-b border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock>
            <span className="meta-label block mb-2">(GALLERY)</span>
            <h1 className="display-lg text-[var(--ink)]">PHOTO GALLERY</h1>
            <p className="text-[var(--ink-muted)] text-[16px] mt-3 max-w-xl">
              A glimpse into ICCB's halls, events, and world-class facilities.
            </p>
          </RevealBlock>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          {/* Masonry grid */}
          <RevealGroup className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {galleryImages.map((img, i) => (
              <RevealItem key={img.src}>
                <div className="break-inside-avoid group relative overflow-hidden rounded-[var(--radius-card)] bg-[var(--bg-soft)]">
                  <Image
                    src={img.src}
                    alt={img.alt.en}
                    width={800}
                    height={i % 3 === 0 ? 1067 : 600}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                  {img.photographer && (
                    <div className="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 p-3">
                      <p className="text-white/70 text-[11px]">© {img.photographer}</p>
                    </div>
                  )}
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          <RevealBlock className="mt-14 text-center">
            <p className="text-[var(--ink-muted)] text-[14px]">
              Sample photos sourced from Unsplash. Replace with actual ICCB photography.
            </p>
          </RevealBlock>
        </div>
      </section>
    </div>
  );
}
