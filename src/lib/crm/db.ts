"use client";
/**
 * The CRM "database": one persisted repository per entity, plus settings and
 * the demo session. Everything lives in localStorage under `iccb-crm-v4:*`.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ReviewRequest } from "@/types/crm";
import { LEAD_STAGES } from "@/types/crm";
import type { AnalyticsEvent, Booking, Client, ContentItem, Enquiry, Hall, Lead, Meeting, MenuPackage, Payment, RadarItem, ServiceItem, Settings, SpecialPrice, User } from "@/types/crm";
import { createRepository, STORAGE_PREFIX } from "./repository";
import {
  analyticsSeed,
  bookingsSeed,
  clientsSeed,
  menusSeed,
  servicesSeed,
  contentSeed,
  enquiriesSeed,
  hallsSeed,
  meetingsSeed,
  paymentsSeed,
  radarSeed,
  reviewsSeed,
  settingsSeed,
  specialPricesSeed,
  usersSeed,
} from "@/data/crm/seed";
import { leadTeamSeed, leadsSeed } from "@/data/crm/leadsSeed";

export const db = {
  bookings: createRepository<Booking>("bookings", bookingsSeed),
  clients: createRepository<Client>("clients", clientsSeed),
  payments: createRepository<Payment>("payments", paymentsSeed),
  meetings: createRepository<Meeting>("meetings", meetingsSeed),
  enquiries: createRepository<Enquiry>("enquiries", enquiriesSeed),
  halls: createRepository<Hall>("halls", hallsSeed),
  specials: createRepository<SpecialPrice>("specials", specialPricesSeed),
  menus: createRepository<MenuPackage>("menus", menusSeed),
  services: createRepository<ServiceItem>("services", servicesSeed),
  radar: createRepository<RadarItem>("radar", radarSeed),
  reviews: createRepository<ReviewRequest>("reviews", reviewsSeed),
  content: createRepository<ContentItem>("content", contentSeed),
  users: createRepository<User>("users", usersSeed),
  analytics: createRepository<AnalyticsEvent>("analytics", analyticsSeed),
  leads: createRepository<Lead>("leads", leadsSeed),
};
export type DbName = keyof typeof db;
export const DB_NAMES = Object.keys(db) as DbName[];

/* ─── Settings (singleton) ───────────────────────────────────────────────── */

interface SettingsState {
  settings: Settings;
  set: (patch: Partial<Settings>) => void;
}
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      settings: settingsSeed(),
      set: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    { name: `${STORAGE_PREFIX}:settings`, storage: createJSONStorage(() => localStorage), skipHydration: true,
      partialize: (s) => ({ settings: s.settings }),
      // New settings fields get their defaults even when older settings are stored.
      merge: (persisted, current) => {
        const p = (persisted as Partial<SettingsState> | undefined)?.settings;
        return p ? { ...current, settings: { ...current.settings, ...p, addOnRates: { ...current.settings.addOnRates, ...p.addOnRates }, securityByType: { ...current.settings.securityByType, ...p.securityByType } } } : current;
      },
    }
  )
);
export const getSettings = () => useSettings.getState().settings;

/* ─── Demo session ───────────────────────────────────────────────────────── */

interface SessionState {
  userId: string;
  signedIn: boolean;
  collapsed: boolean;
  setUser: (id: string) => void;
  signOut: () => void;
  setCollapsed: (v: boolean) => void;
}
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      userId: "u-admin",
      signedIn: false,
      collapsed: false,
      setUser: (userId) => set({ userId, signedIn: true }),
      signOut: () => set({ userId: "u-admin", signedIn: false }),
      setCollapsed: (collapsed) => set({ collapsed }),
    }),
    { name: `${STORAGE_PREFIX}:session`, storage: createJSONStorage(() => localStorage), skipHydration: true }
  )
);

export function currentUser(): User {
  const id = useSession.getState().userId;
  return db.users.get(id) ?? db.users.all()[0];
}
export function useCurrentUser(): User {
  const id = useSession((s) => s.userId);
  const users = db.users.store((s) => s.items);
  return users.find((u) => u.id === id) ?? users[0];
}

/* ─── Hydration ──────────────────────────────────────────────────────────── */

let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<() => void>();

export const isHydrated = () => hydrated;
export function onHydrated(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Remove data from older CRM versions (v1/v2) the first time v3 loads. */
function clearOldVersions() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("iccb-crm-") && !k.startsWith(`${STORAGE_PREFIX}:`)) localStorage.removeItem(k);
    }
  } catch {
    // storage blocked
  }
}

/** Fill in fields that older or partial stored records may miss, so pages never crash on them. */
function normalize() {
  const fix = <T,>(items: T[], fn: (x: T) => T) => items.map(fn);
  // Sales reps used by the Leads funnel, for data stored before they existed.
  const users = db.users.all();
  const missing = leadTeamSeed().filter((u) => !users.some((x) => x.id === u.id));
  if (missing.length) db.users.replaceAll([...users, ...missing]);
  // Leads stored before multi-assign had a single `ownerId`; leads stored before
  // the step journey existed get the sample journey (sample leads) or an empty one.
  const sampleJourney = new Map(leadsSeed().map((l) => [l.id, l.journey ?? []]));
  db.leads.replaceAll(
    fix(db.leads.all(), (l) => {
      let x = l;
      if (!Array.isArray(x.ownerIds)) {
        const old = (x as unknown as { ownerId?: string }).ownerId;
        x = { ...x, ownerIds: old ? [old] : [] };
      }
      if (!Array.isArray(x.journey)) x = { ...x, journey: x.isSample ? (sampleJourney.get(x.id) ?? []).filter((j) => LEAD_STAGES.indexOf(j.stage) <= LEAD_STAGES.indexOf(x.stage)) : [] };
      return x;
    })
  );
  db.meetings.replaceAll(fix(db.meetings.all(), (m) => ({ ...m, type: m.type ?? "Site visit", rep: m.rep ?? "Unassigned", status: m.status ?? "scheduled", time: m.time ?? "11:00" })));
  db.payments.replaceAll(fix(db.payments.all(), (p) => ({ ...p, kind: p.kind ?? "Installment" })));
  db.enquiries.replaceAll(fix(db.enquiries.all(), (e) => ({ ...e, source: e.source ?? (e.type === "booking" ? "Booking form" : "Contact form") })));
  db.bookings.replaceAll(
    fix(db.bookings.all(), (b) => {
      const a = { ...(b.addOns ?? { decoration: "none" }) } as Record<string, unknown>;
      for (const meal of ["breakfast", "lunch", "snacks", "dinner"]) if (typeof a[meal] === "number") a[meal] = { persons: a[meal] };
      return {
        ...b,
        slot: b.slot ?? "Evening (5 PM – 11 PM)",
        layout: b.layout ?? "Banquet with stage",
        history: b.history ?? [],
        addOns: { decoration: "none", ...a } as Booking["addOns"],
        feedback: b.feedback?.ratings ? b.feedback : undefined,
      };
    })
  );
}

export function hydrateAll(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (hydrating) return hydrating;
  clearOldVersions();
  hydrating = Promise.all([...DB_NAMES.map((n) => db[n].store.persist.rehydrate()), useSettings.persist.rehydrate(), useSession.persist.rehydrate()]).then(() => {
    // Seeds are relative to "today": persist them once so related records stay consistent on later days.
    try {
      for (const n of DB_NAMES) if (localStorage.getItem(`${STORAGE_PREFIX}:${n}`) === null) (db[n].store.setState as (p: object) => void)({ ...db[n].store.getState() });
      if (localStorage.getItem(`${STORAGE_PREFIX}:settings`) === null) useSettings.setState((s) => ({ ...s }));
    } catch {
      // private mode — data lives in memory for this tab
    }
    try {
      normalize();
    } catch {
      // never block the app on a data fix-up
    }
    hydrated = true;
    listeners.forEach((l) => l());
  });
  return hydrating;
}

/** Keep tabs in sync: the website form in one tab shows up in the dashboard in another. */
export function listenCrossTab() {
  const onStorage = (e: StorageEvent) => {
    if (!e.key?.startsWith(`${STORAGE_PREFIX}:`)) return;
    const name = e.key.slice(STORAGE_PREFIX.length + 1);
    if (name === "settings") void useSettings.persist.rehydrate();
    else if (name in db) void db[name as DbName].store.persist.rehydrate();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

export function resetDemoData() {
  for (const n of DB_NAMES) db[n].reset();
  useSettings.setState({ settings: settingsSeed() });
}

export function exportJson(): string {
  const out: Record<string, unknown> = { exportedAt: new Date().toISOString(), settings: getSettings() };
  for (const n of DB_NAMES) out[n] = db[n].all();
  return JSON.stringify(out, null, 2);
}
