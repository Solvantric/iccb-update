import type { CapacityRow } from "@/types/crm";
import { base } from "./_helpers";

/** Stage 29' × 19'. main + extra (mezzanine / gallery) + waiting. */
export const capacitiesSeed: CapacityRow[] = [
  { ...base("cap-full-banquet"), layout: "full_banquet", label: "Full banquet", byHall: {
    "hall-1": { main: 900, extra: 100 }, "hall-2": { main: 900, extra: 100 }, "hall-3": { main: 900, extra: 100 }, "hall-4": { main: 1400, extra: 280 } } },
  { ...base("cap-banquet-stage"), layout: "banquet_stage", label: "Banquet with stage", byHall: {
    "hall-1": { main: 600, extra: 100 }, "hall-2": { main: 600, extra: 100 }, "hall-3": { main: 600, extra: 100 }, "hall-4": { main: 1200, extra: 280 } } },
  { ...base("cap-banquet-waiting"), layout: "banquet_waiting", label: "Banquet + waiting with stage", byHall: {
    "hall-1": { main: 500, extra: 100, waiting: 150 }, "hall-2": { main: 500, extra: 100, waiting: 150 }, "hall-3": { main: 500, extra: 100, waiting: 150 }, "hall-4": { main: 1000, extra: 280, waiting: 200 } } },
  { ...base("cap-theatre"), layout: "theatre", label: "Theatre", byHall: {
    "hall-1": { main: 1400, extra: 150 }, "hall-2": { main: 1500, extra: 200 }, "hall-3": { main: 1500, extra: 200 }, "hall-4": { main: 2800, extra: 640, note: "gallery 550" } } },
  { ...base("cap-chairs"), layout: "chairs", label: "Chairs", isCount: true, byHall: {
    "hall-1": { main: 1300, extra: 0 }, "hall-2": { main: 1300, extra: 0 }, "hall-3": { main: 1300, extra: 0 }, "hall-4": { main: 1500, extra: 0, note: "+ gallery" } } },
  { ...base("cap-sofas"), layout: "sofas", label: "Sofas", isCount: true, byHall: {
    "hall-1": { main: 80, extra: 0 }, "hall-2": { main: 80, extra: 0 }, "hall-3": { main: 80, extra: 0 }, "hall-4": { main: 120, extra: 0 } } },
  { ...base("cap-service-tables"), layout: "service_tables", label: "Service tables", isCount: true, byHall: {
    "hall-1": { main: 12, extra: 0 }, "hall-2": { main: 12, extra: 0 }, "hall-3": { main: 12, extra: 0 }, "hall-4": { main: 15, extra: 0 } } },
];

export const LAYOUT_OPTIONS = [
  { value: "full_banquet", label: "Full banquet" },
  { value: "banquet_stage", label: "Banquet with stage" },
  { value: "banquet_waiting", label: "Banquet + waiting with stage" },
  { value: "theatre", label: "Theatre" },
  { value: "classroom", label: "Classroom" },
  { value: "exhibition", label: "Exhibition booths" },
  { value: "cocktail", label: "Cocktail" },
];
