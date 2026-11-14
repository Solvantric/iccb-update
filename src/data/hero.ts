import { heroSlides } from "@/data/images";

/** Homepage hero copy (default content; Marketing → Website content can override it). */
export interface HeroSlide {
  id: string;
  lines: string[];
  highlight: string;
  sub: string;
  src: string;
  alt: string;
}

const COPY = [
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

export const HERO_SLIDES: HeroSlide[] = COPY.map((c) => {
  const img = heroSlides.find((h) => h.id === c.id) ?? heroSlides[0];
  return { ...c, src: img.src, alt: img.alt.en };
});

/** Full one-line title, e.g. "Where the World Meets in Dhaka." */
export const heroTitle = (s: Pick<HeroSlide, "lines" | "highlight">) => [...s.lines, s.highlight].join(" ");
