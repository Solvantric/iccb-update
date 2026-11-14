"use client";
/**
 * The CRM "database": one persisted repository per domain + session + helpers.
 * Everything lives in localStorage under `iccb-crm-v1:*` — no API routes.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { format } from "date-fns";
import type {
  AnalyticsEvent,
  AuditEntry,
  Booking,
  CancellationRule,
  CapacityRow,
  Client,
  ContentItem,
  DecorationCategory,
  Enquiry,
  ExpoZoneTariff,
  Hall,
  HallTariff,
  IccbService,
  Invoice,
  Lead,
  MenuPackage,
  Notification,
  Offer,
  OfferRecipient,
  Payment,
  PortalAccess,
  RadarEvent,
  Role,
  SecurityRule,
  ServiceCharge,
  Settings,
  Task,
  TaxRule,
  User,
  Vendor,
  VendorReview,
} from "@/types/crm";
import { createRepository, setAuditHook, STORAGE_PREFIX, type Repository } from "./repository";
import { ratesAsOf, type PricingRates } from "./pricing";
import { featureSettings } from "./feature-settings";
import { hallsSeed } from "@/data/crm/halls";
import { tariffsSeed, taxesSeed } from "@/data/crm/tariffs";
import { securitySeed } from "@/data/crm/security-money";
import { serviceChargesSeed } from "@/data/crm/service-charges";
import { decorationSeed } from "@/data/crm/decoration-categories";
import { expoZonesSeed } from "@/data/crm/expo-zones";
import { cancellationSeed } from "@/data/crm/cancellation-rules";
import { capacitiesSeed } from "@/data/crm/capacities";
import { menuPackagesSeed } from "@/data/crm/menu-packages";
import { iccbServicesSeed } from "@/data/crm/iccb-services";
import { usersSeed } from "@/data/crm/users";
import { clientsSeed } from "@/data/crm/clients";
import { bookingsSeed } from "@/data/crm/bookings";
import { paymentsSeed } from "@/data/crm/payments";
import { invoicesSeed } from "@/data/crm/invoices";
import { enquiriesSeed } from "@/data/crm/enquiries";
import { leadsSeed } from "@/data/crm/leads";
import { tasksSeed } from "@/data/crm/tasks";
import { notificationsSeed } from "@/data/crm/notifications";
import { radarEventsSeed } from "@/data/crm/radar-events";
import { analyticsEventsSeed } from "@/data/crm/analytics-events";
import { contentSeed } from "@/data/crm/content";
import { auditLogSeed } from "@/data/crm/audit-log";
import { settingsSeed } from "@/data/crm/settings";
import { portalSeed, vendorReviewsSeed } from "@/data/crm/_generated";
import { vendorsSeed } from "@/data/crm/vendors";
import { offerRecipientsSeed, offersSeed } from "@/data/crm/offers";

/* ─── Repositories ───────────────────────────────────────────────────────── */

export const db = {
  halls: createRepository<Hall>("halls", hallsSeed, "Hall"),
  tariffs: createRepository<HallTariff>("tariffs", tariffsSeed, "Hall tariff"),
  security: createRepository<SecurityRule>("security", securitySeed, "Security rule"),
  charges: createRepository<ServiceCharge>("charges", serviceChargesSeed, "Service charge"),
  decoration: createRepository<DecorationCategory>("decoration", decorationSeed, "Decoration category"),
  expo: createRepository<ExpoZoneTariff>("expo", expoZonesSeed, "Expo zone tariff"),
  cancellation: createRepository<CancellationRule>("cancellation", cancellationSeed, "Cancellation rule"),
  taxes: createRepository<TaxRule>("taxes", taxesSeed, "Tax"),
  capacities: createRepository<CapacityRow>("capacities", capacitiesSeed, "Capacity row"),
  menus: createRepository<MenuPackage>("menus", menuPackagesSeed, "Menu package"),
  iccbServices: createRepository<IccbService>("iccbServices", iccbServicesSeed, "ICCB service"),
  users: createRepository<User>("users", usersSeed, "User"),
  clients: createRepository<Client>("clients", clientsSeed, "Client"),
  bookings: createRepository<Booking>("bookings", bookingsSeed, "Booking"),
  payments: createRepository<Payment>("payments", paymentsSeed, "Money receipt"),
  invoices: createRepository<Invoice>("invoices", invoicesSeed, "Document"),
  enquiries: createRepository<Enquiry>("enquiries", enquiriesSeed, "Enquiry"),
  leads: createRepository<Lead>("leads", leadsSeed, "Lead"),
  tasks: createRepository<Task>("tasks", tasksSeed, "Task"),
  notifications: createRepository<Notification>("notifications", notificationsSeed, "Notification"),
  radar: createRepository<RadarEvent>("radar", radarEventsSeed, "Radar item"),
  analytics: createRepository<AnalyticsEvent>("analytics", analyticsEventsSeed, "Analytics event"),
  content: createRepository<ContentItem>("content", contentSeed, "Content item"),
  audit: createRepository<AuditEntry>("audit", auditLogSeed, "Audit entry"),
  settings: createRepository<Settings>("settings", settingsSeed, "Settings"),
  portal: createRepository<PortalAccess>("portal", portalSeed, "Portal link"),
  offers: createRepository<Offer>("offers", offersSeed, "Offer"),
  offerRecipients: createRepository<OfferRecipient>("offerRecipients", offerRecipientsSeed, "Offer recipient"),
  vendors: createRepository<Vendor>("vendors", vendorsSeed, "Vendor"),
  vendorReviews: createRepository<VendorReview>("vendorReviews", vendorReviewsSeed, "Vendor review"),
};

export type DbName = keyof typeof db;
export const DB_NAMES = Object.keys(db) as DbName[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyRepo = Repository<any>;
export const repo = (name: DbName) => db[name] as unknown as AnyRepo;

/* ─── Session (demo sign-in; no real auth) ───────────────────────────────── */

export type UiLang = "en" | "bn";

interface SessionState {
  userId: string;
  signedIn: boolean;
  lang: UiLang;
  collapsed: boolean;
  setUser: (userId: string) => void;
  signOut: () => void;
  setLang: (lang: UiLang) => void;
  setCollapsed: (v: boolean) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      userId: "u-admin",
      signedIn: false,
      lang: "en",
      collapsed: false,
      setUser: (userId) => set({ userId, signedIn: true }),
      signOut: () => set({ userId: "u-admin", signedIn: false }),
      setLang: (lang) => set({ lang }),
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

export const useRole = (): Role => useCurrentUser().role;

/* ─── Audit hook ─────────────────────────────────────────────────────────── */

const NOT_AUDITED = new Set(["audit", "notifications", "analytics"]);

setAuditHook((e) => {
  if (NOT_AUDITED.has(e.entity)) return;
  const u = currentUser();
  const at = new Date().toISOString();
  db.audit.create(
    { at, actorId: u.id, actorName: u.name, actorRole: u.role, entity: e.entity, entityId: e.entityId, action: e.action, summary: e.summary, before: e.before, after: e.after },
    { silent: true }
  );
});

/* ─── Settings & numbering ───────────────────────────────────────────────── */

export const getSettings = (): Settings => db.settings.get("settings") ?? db.settings.all()[0];
export const getFeatureSettings = () => featureSettings(getSettings());

export type NumberKind = keyof Settings["numberFormats"];

export function previewNumber(kind: NumberKind, fmt = getSettings().numberFormats[kind], seq = 1, date = new Date()) {
  const ym = fmt.monthly ? format(date, "yyyyMM") : "";
  return `${fmt.prefix}${ym}${String(seq).padStart(fmt.digits, "0")}`;
}

/** Next unique number for a record type, e.g. ICCB202611000012. */
export function nextNumber(kind: NumberKind, date = new Date()): string {
  const s = getSettings();
  const fmt = s.numberFormats[kind];
  const key = `${kind}:${fmt.monthly ? format(date, "yyyyMM") : "all"}`;
  const n = (s.counters[key] ?? 0) + 1;
  db.settings.update(s.id, { counters: { ...s.counters, [key]: n } }, { silent: true });
  return previewNumber(kind, fmt, n, date);
}

export function nextProgramRegNo(): string {
  const s = getSettings();
  const n = Math.max(s.counters.programReg ?? 0, s.programRegStart) + 1;
  db.settings.update(s.id, { counters: { ...s.counters, programReg: n } }, { silent: true });
  return String(n);
}

/* ─── Pricing rates from the live store ──────────────────────────────────── */

export function getAllRates(): PricingRates {
  return {
    halls: db.halls.all(),
    tariffs: db.tariffs.all(),
    security: db.security.all(),
    charges: db.charges.all(),
    decoration: db.decoration.all(),
    expo: db.expo.all(),
    cancellation: db.cancellation.all(),
    taxes: db.taxes.all(),
    capacities: db.capacities.all(),
  };
}

export const getRates = (asOf?: string) => ratesAsOf(getAllRates(), asOf);

/* ─── Hydration ──────────────────────────────────────────────────────────── */

let hydrating: Promise<void> | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

export function hydrateAll(): Promise<void> {
  if (hydrating) return hydrating;
  hydrating = Promise.all([...DB_NAMES.map((n) => repo(n).store.persist.rehydrate()), useSession.persist.rehydrate()]).then(() => {
    // Seeds are generated relative to "today". Persist every table the first time
    // so related records (bookings ↔ payments ↔ documents) stay consistent on later days.
    try {
      for (const n of DB_NAMES) {
        if (localStorage.getItem(`${STORAGE_PREFIX}:${n}`) === null) repo(n).store.setState((s) => ({ ...s }));
      }
    } catch {
      // storage unavailable (private mode) — data lives in memory for this tab
    }
    hydrated = true;
    listeners.forEach((l) => l());
  });
  return hydrating;
}

export const isHydrated = () => hydrated;
export function onHydrated(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Keep tabs in sync: when another tab writes, rehydrate that store. */
export function listenCrossTab() {
  const handler = (e: StorageEvent) => {
    if (!e.key?.startsWith(`${STORAGE_PREFIX}:`)) return;
    const name = e.key.slice(STORAGE_PREFIX.length + 1);
    if (name === "session") useSession.persist.rehydrate();
    else if (name in db) repo(name as DbName).store.persist.rehydrate();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

/* ─── Data tools (Admin → Settings → Data) ───────────────────────────────── */

export function resetAll() {
  for (const n of DB_NAMES) repo(n).reset();
  const u = currentUser();
  db.audit.create(
    { at: new Date().toISOString(), actorId: u.id, actorName: u.name, actorRole: u.role, entity: "system", entityId: "all", action: "reset", summary: "Reset all demo data" },
    { silent: true }
  );
}

export function exportAll() {
  return {
    app: "iccb-crm",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: Object.fromEntries(DB_NAMES.map((n) => [n, repo(n).all()])),
  };
}

export function importAll(json: unknown): { tables: number; rows: number } {
  const payload = json as { app?: string; data?: Record<string, unknown> };
  if (!payload || payload.app !== "iccb-crm" || typeof payload.data !== "object" || !payload.data) {
    throw new Error("This file is not an ICCB CRM export.");
  }
  let tables = 0;
  let rows = 0;
  for (const [name, items] of Object.entries(payload.data)) {
    if (!(name in db) || !Array.isArray(items)) continue;
    repo(name as DbName).replaceAll(items);
    tables++;
    rows += items.length;
  }
  const u = currentUser();
  db.audit.create(
    { at: new Date().toISOString(), actorId: u.id, actorName: u.name, actorRole: u.role, entity: "system", entityId: "all", action: "import", summary: `Imported ${rows} rows into ${tables} tables` },
    { silent: true }
  );
  return { tables, rows };
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const cell = (v: unknown) => {
    const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
}

export function downloadFile(name: string, content: string | Blob, type = "text/plain") {
  const blob = typeof content === "string" ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
