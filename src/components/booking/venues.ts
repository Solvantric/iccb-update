"use client";
/**
 * Venue list for the public booking page and estimator.
 * CRM halls (rates managed in the dashboard) + any website hall the CRM doesn't have yet
 * (currently the Seminar Hall), using the website's sample pricing. Read-only — the CRM is untouched.
 */
import { useHalls } from "@/lib/crm/hooks";
import { halls as SITE_HALLS } from "@/data/halls";

export interface Venue {
  id: string;
  name: string;
  capacity: number;
  weekdayRate: number;
  weekendRate: number;
  extraHourRate: number;
  image?: string;
  /** false → hall isn't in the CRM yet; requests go in as enquiries */
  inCrm: boolean;
}

export const venuePhoto = (id: string) => SITE_HALLS.find((h) => h.id === id || h.slug === id)?.image;

export function useVenues(): Venue[] {
  const crm = useHalls().filter((h) => h.active);
  const list: Venue[] = crm.map((h) => ({
    id: h.id,
    name: h.name,
    capacity: h.capacity,
    weekdayRate: h.weekdayRate,
    weekendRate: h.weekendRate,
    extraHourRate: h.extraHourRate,
    image: venuePhoto(h.id),
    inCrm: true,
  }));
  for (const s of SITE_HALLS) {
    if (list.some((v) => v.id === s.id)) continue;
    const base = s.priceFrom ?? 80_000;
    list.push({
      id: s.id,
      name: s.name.en,
      capacity: s.capacity.theatre,
      weekdayRate: base,
      weekendRate: Math.round((base * 1.1) / 1000) * 1000,
      extraHourRate: Math.round((base * 0.08) / 1000) * 1000,
      image: s.image,
      inCrm: false,
    });
  }
  return list;
}
