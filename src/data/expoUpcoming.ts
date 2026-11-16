/**
 * Upcoming trade shows at ICCB, taken from public trade-fair listings (eventseye.com, tradefairdates.com),
 * checked 16 Nov 2026. Only events whose dates both listings agree on (or one lists without a "?") are included.
 * ⚠️ Organisers may change dates — confirm with ICCB / the organiser before launch.
 *
 * Photos under /images/iccb/expo/ are REAL earlier editions/fairs at ICCB (Press Information Department,
 * public domain, via Wikimedia Commons).
 */
const real = (n: string) => `/images/iccb/expo/${n}.jpg`;
const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=90&w=2000`;

export interface UpcomingExpo {
  id: string;
  name: string;
  short: string;
  start: string; // YYYY-MM-DD
  end: string;
  sector: string;
  about: string;
  image: string;
}

export const UPCOMING_EXPOS: UpcomingExpo[] = [
  {
    id: "bevmx-2026", name: "Bangladesh Electric Vehicle & Mobility Exhibition", short: "BEVMX 2026",
    start: "2026-11-26", end: "2026-11-28", sector: "Automotive",
    about: "Electric vehicles, mobility solutions and charging infrastructure.",
    image: real("exhibition-stalls-2019"),
  },
  {
    id: "bimex-2026", name: "Bangladesh International Medical Expo", short: "BIMEX 2026",
    start: "2026-11-26", end: "2026-11-28", sector: "Healthcare",
    about: "Medical, dental and pharmaceutical equipment and services.",
    image: u("1761195689615-9469b65dac01"),
  },
  {
    id: "leathertech-2026", name: "LeatherTech Bangladesh", short: "LeatherTech 2026",
    start: "2026-12-03", end: "2026-12-05", sector: "Textile & Leather",
    about: "Leather and footwear machinery, materials and finished goods.",
    image: real("leathertech-2022"),
  },
  {
    id: "denim-expo-2027", name: "Bangladesh Denim Expo", short: "Denim Expo 2027",
    start: "2027-01-13", end: "2027-01-16", sector: "Textile & Leather",
    about: "Denim fabrics, garments, washing and finishing for global buyers.",
    image: real("green-textile-expo-2026"),
  },
  {
    id: "yarn-fabrics-2027", name: "Bangladesh Yarn, Fabrics & Accessories Show", short: "Yarn & Fabrics 2027",
    start: "2027-01-13", end: "2027-01-16", sector: "Textile & Leather",
    about: "Sourcing show for yarn, fabrics and apparel accessories.",
    image: u("1778402566957-c21d77a67d0d"),
  },
  {
    id: "buildex-2027", name: "BUILDEX Bangladesh", short: "BUILDEX 2027",
    start: "2027-04-01", end: "2027-04-03", sector: "Construction & Energy",
    about: "Construction, building materials and real estate — alongside RENEX, BPLX and WaterEx.",
    image: u("1587825140708-dfaf72ae4b04"),
  },
  {
    id: "motor-show-2027", name: "Dhaka Motor Show", short: "Motor Show 2027",
    start: "2027-04-22", end: "2027-04-24", sector: "Automotive",
    about: "Cars, bikes, commercial vehicles and auto parts under one roof.",
    image: real("dhaka-motor-show-2019"),
  },
  {
    id: "food-bd-2027", name: "Food Bangladesh International Expo", short: "Food Bangladesh 2027",
    start: "2027-05-06", end: "2027-05-08", sector: "Food & Agro",
    about: "Food and beverage products, processing and packaging.",
    image: real("bapa-foodpro-2026"),
  },
  {
    id: "agro-bd-2027", name: "Agro Bangladesh International Expo", short: "Agro Bangladesh 2027",
    start: "2027-05-06", end: "2027-05-08", sector: "Food & Agro",
    about: "Agriculture, irrigation, farm machinery, seeds and fertilisers.",
    image: real("agri-tech-fair-2026"),
  },
  {
    id: "poultry-2027", name: "International Poultry & Livestock Bangladesh Expo", short: "Poultry & Livestock 2027",
    start: "2027-05-06", end: "2027-05-08", sector: "Food & Agro",
    about: "Poultry, livestock and aquaculture production and processing.",
    image: real("poultry-show-2023"),
  },
  {
    id: "meditex-2027", name: "Meditex Bangladesh", short: "Meditex 2027",
    start: "2027-05-06", end: "2027-05-08", sector: "Healthcare",
    about: "Hospital, pharmaceutical, medical and surgical equipment.",
    image: u("1540575467063-178a50c2df87"),
  },
  {
    id: "hvacr-2027", name: "Safe HVAC-R & Cold Chain", short: "HVAC-R 2027",
    start: "2027-05-27", end: "2027-05-29", sector: "Construction & Energy",
    about: "HVAC-R, air filtration, refrigeration and cold-chain solutions.",
    image: u("1778402566957-c21d77a67d0d"),
  },
];

export const EXPO_SOURCES = [
  { label: "eventseye.com", href: "https://www.eventseye.com/fairs/pl1_trade-shows_dhaka_7614.html" },
  { label: "tradefairdates.com", href: "https://www.tradefairdates.com/Exhibition-Centre-International-Convention-City-Bashundhara-ICCB-Dhaka-ZS8857.html" },
];

/** Real moments at ICCB (public domain, PID via Wikimedia Commons). */
export const EXPO_MOMENTS = [
  { image: real("leathertech-2022"), title: "Leathertech Bangladesh", year: "2022" },
  { image: real("dhaka-motor-show-2019"), title: "Dhaka Motor Show", year: "2019" },
  { image: real("bapa-foodpro-2026"), title: "BAPA Foodpro International Expo", year: "2026" },
  { image: real("green-textile-expo-2026"), title: "Bangladesh–China Green Textile Expo", year: "2026" },
  { image: real("agri-tech-fair-2026"), title: "International Agricultural Technology Fair", year: "2026" },
  { image: real("ceramic-expo-2025"), title: "Ceramic Expo Bangladesh", year: "2025" },
  { image: real("poultry-show-2023"), title: "International Poultry Show", year: "2023" },
  { image: real("exhibition-stalls-2019"), title: "Exhibition stalls at ICCB", year: "2019" },
];
