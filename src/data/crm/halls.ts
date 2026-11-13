import type { Hall } from "@/types/crm";
import { base } from "./_helpers";

const FACILITIES = ["2 green rooms", "Central AC", "CCTV", "Free Wi-Fi", "Fresh room", "1 archway gate", "2 microphones", "1 raffle-draw box"];

export const hallsSeed: Hall[] = [
  { ...base("hall-1"), code: "hall-1", name: "Gulnaksha", number: "Hall-1", kind: "hall", tariffGroup: "h123", generatorKva: 700, facilities: FACILITIES, active: true, order: 1, notes: "Weddings, receptions, corporate events and exhibitions." },
  { ...base("hall-2"), code: "hall-2", name: "Pushpoguchcho", number: "Hall-2", kind: "hall", tariffGroup: "h123", generatorKva: 1350, facilities: FACILITIES, active: true, order: 2 },
  { ...base("hall-3"), code: "hall-3", name: "Rajdarshan", number: "Hall-3", kind: "hall", tariffGroup: "h123", generatorKva: 500, facilities: FACILITIES, active: true, order: 3 },
  { ...base("hall-4"), code: "hall-4", name: "Noboratri", number: "Hall-4", kind: "hall", tariffGroup: "h4", generatorKva: 1350, facilities: FACILITIES, active: true, order: 4, notes: "Largest banquet hall, with gallery." },
  { ...base("hall-5"), code: "hall-5", name: "Pushpanjali", number: "Hall-5", kind: "hall", tariffGroup: "h5", facilities: FACILITIES, active: true, order: 5, notes: "Smaller hall for social and corporate events." },
  { ...base("expo-a"), code: "expo-a", name: "Expo Zone A", number: "Expo-A", kind: "expo", tariffGroup: "expoA", areaSqft: "up to 60,000 sq ft", facilities: ["Washrooms", "Parking"], active: true, order: 6 },
  { ...base("expo-b"), code: "expo-b", name: "Expo Zone B", number: "Expo-B", kind: "expo", tariffGroup: "expoB", areaSqft: "60,001–150,000 sq ft", facilities: ["Washrooms", "Parking"], active: true, order: 7 },
  { ...base("seminar", { isSample: true }), code: "seminar", name: "Seminar Hall", number: "Seminar", kind: "seminar", tariffGroup: "seminar", facilities: ["Projector", "Sound system"], active: true, order: 8, notes: "Tariff TBD — confirm with ICCB." },
];
