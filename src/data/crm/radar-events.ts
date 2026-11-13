import type { RadarEvent } from "@/types/crm";
import { base, daysFromToday, isoFromToday } from "./_helpers";

type Cat = RadarEvent["category"];
// [title, organizer, industry, category, scope, country, flag, city, startIn, days, attendance, score, hall, recurrence, lastHeldAt]
type Row = [string, string, string, Cat, "national" | "international", string, string, string, number, number, number, number, string, RadarEvent["recurrence"], string?];

const ROWS: Row[] = [
  ["Dhaka International Textile & Garment Machinery Expo", "Textile Expo Org BD (sample)", "Textile & garments", "Trade fair", "national", "Bangladesh", "🇧🇩", "Dhaka", 95, 4, 45000, 96, "Expo Zone B + Hall 1–4", "annual", "ICCB"],
  ["Build Bangladesh Construction Expo", "Build Expo Ltd. (sample)", "Construction", "Trade fair", "national", "Bangladesh", "🇧🇩", "Dhaka", 120, 3, 30000, 92, "Expo Zone B", "annual", "ICCB"],
  ["Power & Energy Bangladesh Summit", "Energy Forum BD (sample)", "Power & energy", "Summit", "national", "Bangladesh", "🇧🇩", "Dhaka", 70, 2, 3500, 88, "Hall-4 (theatre) + Hall-5", "annual"],
  ["Gulf Food Processing Show", "Gulf Expo Group (sample)", "Food processing", "Trade fair", "international", "UAE", "🇦🇪", "Dubai", 140, 4, 60000, 71, "Expo Zone B (regional edition)", "annual"],
  ["South Asia Medical Devices Expo", "MedExpo Asia (sample)", "Healthcare", "Exhibition", "international", "India", "🇮🇳", "Kolkata", 110, 3, 18000, 84, "Expo Zone A + Seminar Hall", "annual"],
  ["Bangladesh Education & Career Fair", "EduFair BD (sample)", "Education", "Education fair", "national", "Bangladesh", "🇧🇩", "Dhaka", 45, 2, 15000, 81, "Hall 1 + Hall 2", "biennial"],
  ["Asia Pacific Fintech Conference", "APAC Fintech Council (sample)", "Banking & fintech", "Conference", "international", "Singapore", "🇸🇬", "Singapore", 160, 2, 2500, 77, "Hall-3 + Seminar Hall", "annual"],
  ["Dhaka Wedding Expo", "Wedding Expo BD (sample)", "Weddings & lifestyle", "Wedding expo", "national", "Bangladesh", "🇧🇩", "Dhaka", 30, 3, 20000, 94, "Hall-4 + Hall-5", "annual", "ICCB"],
  ["Winter Classical Music Festival", "Bengal Music Foundation (sample)", "Music & culture", "Concert", "national", "Bangladesh", "🇧🇩", "Dhaka", 55, 4, 40000, 79, "Expo Zone B (open-air stage)", "annual"],
  ["International Agro Machinery Fair", "Agro Expo Asia (sample)", "Agriculture", "Trade fair", "international", "Thailand", "🇹🇭", "Bangkok", 130, 3, 25000, 68, "Expo Zone A", "annual"],
  ["Bangladesh Pharma Summit", "Pharma Association (sample)", "Pharmaceuticals", "Summit", "national", "Bangladesh", "🇧🇩", "Dhaka", 85, 1, 1800, 83, "Hall-1 (theatre)", "annual"],
  ["North Dhaka University Convocation", "North Dhaka University (sample)", "Education", "Convocation", "national", "Bangladesh", "🇧🇩", "Dhaka", 65, 1, 6000, 90, "Hall-4 + gallery", "annual", "ICCB"],
  ["Solar & Renewable Energy Expo", "Green Expo Ltd. (sample)", "Renewable energy", "Exhibition", "national", "Bangladesh", "🇧🇩", "Dhaka", 150, 3, 12000, 86, "Expo Zone A", "annual"],
  ["Middle East Hospitality Week", "MEHW Org (sample)", "Hospitality", "Exhibition", "international", "Saudi Arabia", "🇸🇦", "Riyadh", 175, 3, 30000, 62, "Expo Zone B", "annual"],
  ["Dhaka Motor Show", "Auto Expo BD (sample)", "Automobile", "Exhibition", "national", "Bangladesh", "🇧🇩", "Dhaka", 100, 3, 35000, 89, "Expo Zone B + parking", "annual"],
  ["South Asia Logistics Conference", "SA Logistics Forum (sample)", "Logistics", "Conference", "international", "Sri Lanka", "🇱🇰", "Colombo", 90, 2, 1200, 64, "Hall-5 + Seminar Hall", "annual"],
  ["IT & Software Expo Bangladesh", "Tech Association BD (sample)", "Technology", "Exhibition", "national", "Bangladesh", "🇧🇩", "Dhaka", 75, 3, 28000, 91, "Hall 1–3 combined", "annual", "ICCB"],
  ["Asian Jewellery & Gem Fair", "Gem Fair Asia (sample)", "Jewellery", "Trade fair", "international", "Hong Kong", "🇭🇰", "Hong Kong", 200, 4, 40000, 58, "Hall-4", "annual"],
  ["Bangladesh Fashion Week", "Fashion Council BD (sample)", "Fashion", "Exhibition", "national", "Bangladesh", "🇧🇩", "Dhaka", 50, 3, 8000, 87, "Hall-2 (ramp) + Hall-5", "annual"],
  ["Global Garments Sustainability Summit", "Sustainable Apparel Forum (sample)", "Textile & garments", "Summit", "international", "Bangladesh", "🇧🇩", "Dhaka", 115, 2, 2000, 93, "Hall-3 + Seminar Hall", "annual"],
  ["Ceramic & Tiles Expo", "Ceramic Makers BD (sample)", "Building materials", "Trade fair", "national", "Bangladesh", "🇧🇩", "Dhaka", 135, 3, 15000, 74, "Expo Zone A", "biennial"],
  ["International Plastics & Packaging Fair", "PlastiExpo (sample)", "Packaging", "Trade fair", "international", "China", "🇨🇳", "Guangzhou", 145, 4, 50000, 61, "Expo Zone B", "annual"],
  ["Dhaka Rock Festival", "Live Nation BD (sample)", "Music & culture", "Concert", "national", "Bangladesh", "🇧🇩", "Dhaka", 40, 1, 15000, 76, "Expo Zone B (outdoor)", "annual"],
  ["SAARC Health Ministers Conference", "Regional Health Forum (sample)", "Healthcare", "Conference", "international", "Nepal", "🇳🇵", "Kathmandu", 180, 3, 900, 66, "Hall-1 + Seminar Hall", "one-off"],
  ["Bangladesh Furniture Fair", "Furniture Makers BD (sample)", "Furniture", "Trade fair", "national", "Bangladesh", "🇧🇩", "Dhaka", 60, 4, 22000, 85, "Hall 1–4", "annual", "ICCB"],
  ["Halal Food & Lifestyle Expo", "Halal Expo Asia (sample)", "Food", "Exhibition", "international", "Malaysia", "🇲🇾", "Kuala Lumpur", 125, 3, 20000, 69, "Expo Zone A", "annual"],
  ["Banking Excellence Awards", "Banking Journal BD (sample)", "Banking & fintech", "Summit", "national", "Bangladesh", "🇧🇩", "Dhaka", 35, 1, 1100, 82, "Hall-4 (banquet)", "annual"],
  ["Leather & Footwear Sourcing Show", "Leather Expo (sample)", "Leather", "Trade fair", "international", "Bangladesh", "🇧🇩", "Dhaka", 155, 3, 9000, 88, "Expo Zone A + Hall-5", "annual"],
  ["Startup Bangladesh Summit", "Startup BD (sample)", "Technology", "Summit", "national", "Bangladesh", "🇧🇩", "Dhaka", 80, 2, 4000, 80, "Hall-3 + Hall-5", "annual"],
  ["Asia Dental Congress", "Asia Dental Assoc. (sample)", "Healthcare", "Conference", "international", "Bangladesh", "🇧🇩", "Dhaka", 190, 3, 2500, 78, "Hall-1 + exhibition foyer", "biennial"],
  ["Real Estate & Housing Fair", "Housing Association (sample)", "Real estate", "Trade fair", "national", "Bangladesh", "🇧🇩", "Dhaka", 105, 5, 50000, 95, "Hall 1–4 + Expo Zone A", "annual", "ICCB"],
  ["Qatar Business Delegation Forum", "Qatar Trade Council (sample)", "Trade & investment", "Conference", "international", "Qatar", "🇶🇦", "Doha", 98, 1, 600, 57, "Hall-5", "one-off"],
];

function toEvent(row: Row, i: number, extra: Partial<RadarEvent> = {}): RadarEvent {
  const [title, organizer, industry, category, scope, country, flag, city, startIn, days, attendance, score, hall, recurrence, lastHeldAt] = row;
  return {
    ...base(`radar-${i + 1}`, { isSample: true, createdAt: isoFromToday(-((i * 3) % 20), 9) }),
    title,
    organizer,
    industry,
    category,
    scope,
    country,
    flag,
    city,
    startDate: daysFromToday(startIn),
    endDate: daysFromToday(startIn + days - 1),
    expectedAttendance: attendance,
    sourceName: scope === "national" ? "Industry news (sample)" : "International trade calendar (sample)",
    sourceUrl: "https://example.com/events",
    publishedAt: daysFromToday(-((i * 5) % 30)),
    score,
    summary: `${title} expects about ${attendance.toLocaleString("en-US")} visitors over ${days} day${days > 1 ? "s" : ""}. ${scope === "international" ? `The organizer is looking at South Asian host cities for a regional edition.` : `The organizer is reviewing venues for the next edition.`}`,
    whyFits: `${category} of this size needs ${attendance > 15000 ? "large covered space plus 3,500+ car parking" : "a conference-grade hall with catering"} — a core ICCB strength.`,
    suggestedHall: hall,
    pitch: [
      `${hall} fits the expected ${attendance.toLocaleString("en-US")} attendance.`,
      "In-house ICCB Catering, security and 3,500+ car parking on site.",
      "Early-bird hold on preferred dates with a dedicated event manager.",
    ],
    recurrence,
    lastHeldAt,
    status: i % 11 === 3 ? "contacted" : i % 13 === 5 ? "saved" : i % 17 === 7 ? "dismissed" : "new",
    ...extra,
  };
}

export const radarEventsSeed: RadarEvent[] = ROWS.map((r, i) => toEvent(r, i));

/** Items revealed by "Refresh radar" (simulated AI scan). */
const REFRESH_ROWS: Row[] = [
  ["Bangladesh Pharma & Lab Expo", "PharmaLab Expo (sample)", "Pharmaceuticals", "Exhibition", "national", "Bangladesh", "🇧🇩", "Dhaka", 88, 3, 14000, 90, "Expo Zone A + Hall-5", "annual"],
  ["South Asian Wedding Couture Week", "Couture Asia (sample)", "Weddings & lifestyle", "Wedding expo", "international", "India", "🇮🇳", "New Delhi", 118, 3, 16000, 83, "Hall-4 + Hall-2", "annual"],
  ["Digital Bangladesh Innovation Summit", "ICT Forum (sample)", "Technology", "Summit", "national", "Bangladesh", "🇧🇩", "Dhaka", 66, 2, 5000, 87, "Hall-3 + Seminar Hall", "annual"],
  ["International Boiler & Pump Expo", "Industrial Expo Asia (sample)", "Industrial", "Trade fair", "international", "Bangladesh", "🇧🇩", "Dhaka", 142, 3, 11000, 85, "Expo Zone A", "annual"],
  ["Gulf Bangladeshi Diaspora Gala", "Diaspora Council (sample)", "Community", "Concert", "international", "Kuwait", "🇰🇼", "Kuwait City", 92, 1, 3500, 72, "Hall-4 (banquet)", "one-off"],
];
export const radarRefreshPool: RadarEvent[] = REFRESH_ROWS.map((r, i) => toEvent(r, 100 + i, { status: "new", isNew: true }));
