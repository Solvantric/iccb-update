/** ICCB process rules shared by seeds, services and UI (pure, no store). */
import { addDays, format, subDays } from "date-fns";
import type { BookingDocument, ClientType, Evaluation, Rating } from "@/types/crm";
import { parseYmd } from "./pricing";

const ymd = (d: Date) => format(d, "yyyy-MM-dd");

export const PPM_AGENDA = [
  "No. of guests",
  "Event management (ICCB/own)",
  "Hall set-up (round table × chairs, theatre chairs)",
  "Lighting",
  "Sound system",
  "Stage size",
  "Ceiling installation",
  "Sofa rows",
  "AC operation time",
  "Head table capacity",
  "Special request (entry premises/hall time)",
  "Special requirement",
  "Hanging banner outside",
  "Banner in parking",
  "Food provider",
  "Food serving time",
  "Per-batch serving duration",
  "Last batch start time",
  "Food provision (buffet/service)",
  "Food type",
  "Driver food (inside/outside packet)",
  "Vehicle parking",
  "Shuttle bus",
  "Program preparation date",
] as const;

export const EVALUATION_CRITERIA = [
  "Cleanliness of the hall",
  "Cooling system",
  "Seating arrangement",
  "Lighting",
  "Toilets",
  "Greenery & landscaping",
  "Car parking",
  "Service staff",
  "Security",
  "Traffic management",
  "Gross service standard",
  "Comparison with other halls",
  "Food quality",
  "Booking & transaction procedure",
] as const;

export const RATING_LABELS: Record<Rating, string> = { 0: "Poor", 1: "Average", 2: "Good", 3: "Excellent" };

export function evaluationScore(ratings: Evaluation["ratings"]): number {
  const vals = Object.values(ratings);
  if (!vals.length) return 0;
  return Math.round((vals.reduce<number>((s, v) => s + v, 0) / (vals.length * 3)) * 100);
}

export const PPM_MIN_DAYS = 15;
export const DOCS_DUE_DAYS = 5;
export const VAT_CHALLAN_DAYS = 7;
export const REFUND_WORKING_DAYS = 15;

/** Fri & Sat are weekly holidays for working-day maths. */
export function addWorkingDays(fromYmd: string, n: number, holidays: string[] = []) {
  let d = parseYmd(fromYmd);
  let added = 0;
  const off = new Set(holidays);
  while (added < n) {
    d = addDays(d, 1);
    const day = d.getDay();
    if (day === 5 || day === 6 || off.has(ymd(d))) continue;
    added++;
  }
  return ymd(d);
}

export const refundDueDate = (eventYmd: string, holidays: string[] = []) => addWorkingDays(eventYmd, REFUND_WORKING_DAYS, holidays);
export const balanceDueDate = (eventYmd: string, days = 15) => ymd(subDays(parseYmd(eventYmd), days));
export const ppmDueDate = (eventYmd: string) => ymd(subDays(parseYmd(eventYmd), PPM_MIN_DAYS));

const MUSICAL = ["Concert", "Fashion Show"];

/** Required documents for a booking (§2.13). */
export function defaultDocuments(clientType: ClientType, eventNature: string, eventYmd: string, hasFood: boolean): BookingDocument[] {
  const due5 = eventYmd ? ymd(subDays(parseYmd(eventYmd), DOCS_DUE_DAYS)) : undefined;
  const due7 = eventYmd ? ymd(subDays(parseYmd(eventYmd), VAT_CHALLAN_DAYS)) : undefined;
  const ppm = eventYmd ? ppmDueDate(eventYmd) : undefined;
  const business = clientType === "exhibition" || clientType === "corporate" || clientType === "cultural";
  const ticketed = clientType === "cultural" || MUSICAL.includes(eventNature);
  const docs: Omit<BookingDocument, "id">[] = [
    { key: "nid", label: "NID or Passport", state: "pending" },
    ...(business ? [{ key: "trade_license", label: "Trade License + business card", state: "pending" as const }] : []),
    { key: "nbr", label: "NBR NOC (ticketed events)", state: ticketed ? "pending" : "na", dueDate: due5 },
    { key: "commerce", label: "Ministry of Commerce clearance", state: clientType === "exhibition" ? "pending" : "na", dueDate: due5 },
    { key: "cultural", label: "Ministry of Cultural Affairs clearance", state: clientType === "cultural" || MUSICAL.includes(eventNature) ? "pending" : "na", dueDate: due5 },
    { key: "education", label: "Ministry of Education clearance", state: eventNature === "Convocation" ? "pending" : "na", dueDate: due5 },
    { key: "police", label: "Police permission", state: clientType === "exhibition" || clientType === "corporate" || MUSICAL.includes(eventNature) ? "pending" : "na", dueDate: due5 },
    { key: "vat_challan", label: "Food VAT challan", state: hasFood ? "pending" : "na", dueDate: due7 },
    { key: "ppm_copy", label: "PPM copy", state: "pending", dueDate: ppm },
    { key: "payment_slip", label: "Payment slip", state: "pending" },
  ];
  return docs.map((d) => ({ ...d, id: d.key }));
}

export function isDocOverdue(d: BookingDocument, todayYmd: string) {
  return d.state === "pending" && !!d.dueDate && d.dueDate < todayYmd;
}
