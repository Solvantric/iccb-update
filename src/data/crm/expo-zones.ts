import type { ExpoZoneTariff } from "@/types/crm";
import { base, EFFECTIVE } from "./_helpers";

export const expoZonesSeed: ExpoZoneTariff[] = [
  { ...base("expo-tariff-a"), key: "A", effectiveFrom: EFFECTIVE, zone: "A", label: "Expo Zone A (up to 60,000 sq ft)", minSqft: 0, maxSqft: 60000, ratePerSqftDay: 10, securityPersonal: 100000, securityOthers: 250000, extraHour: 25000, washroomCultural: 20000, washroomOther: 15000, freeParkingPct: 25, parkingRate: 1.5 },
  { ...base("expo-tariff-b"), key: "B", effectiveFrom: EFFECTIVE, zone: "B", label: "Expo Zone B (60,001–150,000 sq ft)", minSqft: 60001, maxSqft: 150000, ratePerSqftDay: 8, securityPersonal: 200000, securityOthers: 300000, extraHour: 30000, washroomCultural: 20000, washroomOther: 15000, freeParkingPct: 25, parkingRate: 1.5 },
];
