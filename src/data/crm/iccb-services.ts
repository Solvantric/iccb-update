import type { IccbService } from "@/types/crm";
import { base } from "./_helpers";

const s = { isSample: true };
export const iccbServicesSeed: IccbService[] = [
  { ...base("isvc-deco-premium", s), name: "ICCB Events decoration — Premium", category: "Decoration", unit: "event", rate: 350000, description: "Full thematic stage, ceiling and floral." },
  { ...base("isvc-deco-standard", s), name: "ICCB Events decoration — Standard", category: "Decoration", unit: "event", rate: 180000, description: "Stage, entrance and table florals." },
  { ...base("isvc-deco-basic", s), name: "ICCB Events decoration — Basic", category: "Decoration", unit: "event", rate: 90000 },
  { ...base("isvc-sound", s), name: "Sound system (line array)", category: "Sound & Light", unit: "day", rate: 45000 },
  { ...base("isvc-light", s), name: "Stage & intelligent lighting", category: "Sound & Light", unit: "day", rate: 60000 },
  { ...base("isvc-led", s), name: "LED wall (P3.9) per sq ft", category: "LED & AV", unit: "sq ft", rate: 350 },
  { ...base("isvc-projector", s), name: "Projector + screen", category: "LED & AV", unit: "day", rate: 12000 },
  { ...base("isvc-photo", s), name: "Photo & video coverage", category: "LED & AV", unit: "event", rate: 75000 },
  { ...base("isvc-generator", s), name: "Additional generator backup", category: "Power", unit: "hour", rate: 18000 },
  { ...base("isvc-extra-hour", s), name: "Extra business hour", category: "Extra hours", unit: "hour", rate: 15000 },
  { ...base("isvc-shuttle", s), name: "Guest shuttle bus", category: "Logistics", unit: "trip", rate: 6000 },
  { ...base("isvc-valet", s), name: "Valet parking team", category: "Logistics", unit: "event", rate: 25000 },
];
