/**
 * Website-only presentation copy for each hall (taglines, descriptions, "ideal for", gallery extras).
 * Specs (area, capacity, features) stay in `halls.ts`. ⚠️ Sample copy — confirm wording with ICCB.
 *
 * gallery[0] = a REAL photo taken at ICCB (Wikimedia Commons; mostly public-domain PID photos).
 * Which hall each event was held in isn't stated in the source — swap in ICCB's own hall photos when available.
 */
const real = (slug: string) => `/images/iccb/halls/${slug}.jpg`;
const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=90&w=2400`;

export interface HallDetail {
  numeral: string;
  tagline: string;
  description: string;
  idealFor: string[];
  gallery: string[];
  /** Attribution for the real ICCB photo (gallery[0]) when its licence requires one. */
  credit?: string;
}

export const HALL_DETAILS: Record<string, HallDetail> = {
  gulnaksha: {
    numeral: "I",
    tagline: "The grand flagship hall",
    description:
      "ICCB's largest pillar-free hall — a soaring ceiling, a full professional stage and room for thousands. Built for national conventions, mega weddings and award nights that need real scale.",
    idealFor: ["Mega Weddings", "National Conventions", "Award Nights", "Concerts", "Exhibitions"],
    gallery: [real("gulnaksha"), u("1540575467063-178a50c2df87"), u("1519167758481-83f550bb49b3"), u("1511795409834-ef04bbd61622"), u("1587825140708-dfaf72ae4b04")],
  },
  pushpoguchcho: {
    numeral: "II",
    tagline: "Grandeur that adapts",
    description:
      "A vast, flexible hall with a modular partition system — open it fully for a grand reception or divide it for parallel sessions on the same day.",
    idealFor: ["Wedding Receptions", "Corporate Galas", "Product Launches", "Trade Shows"],
    gallery: [real("pushpoguchcho"), "/images/iccb/halls/expo-floor.jpg", u("1555244162-803834f70033"), u("1519741497674-611481863552"), u("1540575467063-178a50c2df87")],
    credit: "Photo: Mahmud3213, CC BY-SA 4.0, via Wikimedia Commons",
  },
  rajdarshan: {
    numeral: "III",
    tagline: "Where nations meet",
    description:
      "Equipped for international conferences — interpretation booths, video conferencing and a commanding stage make Rajdarshan the hall of choice for summits and diplomatic events.",
    idealFor: ["International Summits", "Conferences", "Seminars", "Government Events"],
    gallery: [real("rajdarshan"), u("1587825140708-dfaf72ae4b04"), u("1475721027785-f74eccf877e2"), u("1511795409834-ef04bbd61622")],
  },
  noboratri: {
    numeral: "IV",
    tagline: "Elegance in every light",
    description:
      "Natural daylight with a full blackout option and a flexible stage — Noboratri moves easily from a bright daytime seminar to an evening celebration.",
    idealFor: ["Holud & Mehendi", "Birthday & Anniversary", "Corporate Dinners", "Workshops"],
    gallery: [real("noboratri"), u("1511795409834-ef04bbd61622"), u("1519741497674-611481863552"), u("1555244162-803834f70033")],
  },
  pushpanjali: {
    numeral: "V",
    tagline: "Intimate, yet grand",
    description:
      "A refined mid-size hall with a built-in AV system and its own pre-function foyer — ideal when the guest list is select but the occasion is important.",
    idealFor: ["Engagements", "Annual General Meetings", "Press Events", "Cultural Programmes"],
    gallery: [real("pushpanjali"), u("1529543544282-ea669407fca3"), u("1475721027785-f74eccf877e2"), u("1519167758481-83f550bb49b3")],
  },
  "seminar-hall": {
    numeral: "VI",
    tagline: "Focused, connected, ready",
    description:
      "A compact, fully-equipped room for training, seminars and board-level meetings — projector, screen and video conferencing ready the moment you arrive.",
    idealFor: ["Seminars", "Training Sessions", "Board Meetings", "Workshops"],
    gallery: [real("seminar-hall"), u("1475721027785-f74eccf877e2"), u("1540575467063-178a50c2df87")],
  },
};

export const hallDetail = (slug: string): HallDetail =>
  HALL_DETAILS[slug] ?? { numeral: "", tagline: "", description: "", idealFor: [], gallery: [] };

/** Display name, e.g. "Gulnaksha Hall" (Seminar Hall already includes "Hall"). */
export const hallTitle = (name: string) => (/hall$/i.test(name) ? name : `${name} Hall`);
