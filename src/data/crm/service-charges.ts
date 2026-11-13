import type { ServiceCharge } from "@/types/crm";
import { base, EFFECTIVE } from "./_helpers";

type Row = Omit<ServiceCharge, "id" | "createdAt" | "updatedAt" | "deletedAt" | "isSample" | "effectiveFrom">;
const rows: Row[] = [
  // Per person / per item
  { key: "svc-main-meal", category: "per_person", name: "Service charge, lunch/dinner", unit: "person", rate: 125 },
  { key: "svc-light-meal", category: "per_person", name: "Service charge, breakfast/snacks", unit: "person", rate: 15 },
  { key: "extra-guest", category: "per_person", name: "Extra service (guests >10% over booked)", unit: "extra person", rate: 130 },
  { key: "parking-commercial", category: "per_person", name: "Parking / free space, commercial use", unit: "sq ft/day", rate: 7 },
  { key: "chair-cover", category: "per_person", name: "Chair cover", unit: "cover", rate: 40 },
  { key: "extra-chair", category: "per_person", name: "Extra chair", unit: "chair", rate: 50 },
  { key: "chair-transfer", category: "per_person", name: "Chair/table transfer", unit: "each", rate: 10 },
  { key: "extra-waiter", category: "per_person", name: "Extra waiter/cleaner", unit: "person", rate: 600 },
  { key: "extra-dish", category: "per_person", name: "Extra curry dish / dinner plate / rice dish", unit: "each", rate: 6 },
  { key: "extra-half-plate", category: "per_person", name: "Extra half plate", unit: "each", rate: 5 },
  { key: "lp-gas-45", category: "per_person", name: "LP gas (45 kg cylinder)", unit: "cylinder", rate: 6000 },
  { key: "lp-gas-12", category: "per_person", name: "LP gas (12 kg cylinder)", unit: "cylinder", rate: 2000 },
  // Hall-level
  { key: "external-lighting", category: "hall", name: "External lighting", unit: "event", rate: 30000, rateHall5: 10000 },
  { key: "hall-setup", category: "hall", name: "Hall set-up (exhibition/corporate/cultural)", unit: "event", rate: 12000, rateHall5: 6000 },
  // Generator support (per hour)
  { key: "gen-h24", category: "generator", name: "Generator support — Hall 2 & 4", unit: "hour", rate: 32000, maxHours: 3, hallCodes: ["hall-2", "hall-4"] },
  { key: "gen-h1", category: "generator", name: "Generator support — Hall 1", unit: "hour", rate: 20000, maxHours: 6, hallCodes: ["hall-1"] },
  { key: "gen-h3", category: "generator", name: "Generator support — Hall 3", unit: "hour", rate: 16000, maxHours: 6, hallCodes: ["hall-3"] },
  // Other items
  { key: "archway", category: "other", name: "Archway gate", unit: "piece", rate: 3000 },
  { key: "tea-cup", category: "other", name: "Tea cup set", unit: "set", rate: 30 },
  { key: "chafing-dish", category: "other", name: "Chafing dish", unit: "dish", rate: 400 },
  { key: "soup-bowl", category: "other", name: "Soup bowl set", unit: "set", rate: 50 },
  { key: "banner-2", category: "other", name: "Stand banner (1–2 days)", unit: "banner", rate: 200 },
  { key: "banner-4", category: "other", name: "Stand banner (3–4 days)", unit: "banner", rate: 300 },
  { key: "banner-10", category: "other", name: "Stand banner (5–10 days)", unit: "banner", rate: 400 },
  // Stalls
  { key: "food-stall", category: "stall", name: "Outside food stall (exhibition/cultural/other)", unit: "stall/day", rate: 20000 },
];

export const serviceChargesSeed: ServiceCharge[] = rows.map((r) => ({ ...base(`sc-${r.key}`), effectiveFrom: EFFECTIVE, ...r }));
