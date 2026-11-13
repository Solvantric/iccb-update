import { addDays, format } from "date-fns";

export const SEED_TS = "2026-01-01T00:00:00.000Z";
export const EFFECTIVE = "2025-01-01";

export function base<T extends string>(id: T, extra: { isSample?: boolean; createdAt?: string } = {}) {
  const ts = extra.createdAt ?? SEED_TS;
  return { id, createdAt: ts, updatedAt: ts, deletedAt: null, isSample: extra.isSample };
}

/** Deterministic PRNG so seeds are stable for a given day. */
export function rng(seed = 42) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const pick = <T,>(r: () => number, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];
export const int = (r: () => number, min: number, max: number) => Math.floor(r() * (max - min + 1)) + min;

export const ymd = (d: Date) => format(d, "yyyy-MM-dd");
export const daysFromToday = (n: number) => ymd(addDays(new Date(), n));
export const isoFromToday = (n: number, hour = 10) => {
  const d = addDays(new Date(), n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
