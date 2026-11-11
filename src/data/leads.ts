import type { Lead } from "@/types";

// In-memory store (mirrored to localStorage in browser)
const STORAGE_KEY = "iccb_leads";

function loadFromStorage(): Lead[] {
  if (typeof window === "undefined") return sampleLeads;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return sampleLeads;
}

function saveToStorage(leads: Lead[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  } catch {}
}

export const sampleLeads: Lead[] = [
  {
    id: "lead-001",
    name: "Kamal Hossain",
    organization: "Bangladesh Garment Manufacturers",
    phone: "+880 1711-234567",
    email: "kamal@bgmea.com.bd",
    eventType: "exhibition",
    hallId: "gulnaksha",
    date: "2026-02-15",
    guests: 2000,
    source: "website",
    status: "contacted",
    notes: "Annual trade fair, 3-day event",
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "expo-2026",
    createdAt: "2026-11-01T10:30:00Z",
    updatedAt: "2026-11-02T14:00:00Z",
    score: 85,
    isHot: true,
    isSample: true,
  },
  {
    id: "lead-002",
    name: "Dr. Sarah Ahmed",
    organization: "Bangladesh Medical Society",
    phone: "+880 1912-345678",
    email: "sarah@bms.org",
    eventType: "conference",
    hallId: "rajdarshan",
    date: "2026-01-20",
    guests: 800,
    source: "website",
    status: "proposal",
    notes: "International medical conference",
    utmSource: "linkedin",
    createdAt: "2026-10-28T09:00:00Z",
    updatedAt: "2026-11-05T11:30:00Z",
    score: 72,
    isHot: false,
    isSample: true,
  },
  {
    id: "lead-003",
    name: "Tanvir Rahman",
    phone: "+880 1876-543210",
    email: "tanvir@gmail.com",
    eventType: "wedding",
    hallId: "pushpoguchcho",
    date: "2026-12-18",
    guests: 1500,
    source: "whatsapp",
    status: "new",
    notes: "Winter wedding",
    createdAt: "2026-11-09T16:45:00Z",
    updatedAt: "2026-11-09T16:45:00Z",
    score: 60,
    isHot: false,
    isSample: true,
  },
  {
    id: "lead-004",
    name: "Liu Wei",
    organization: "China-Bangladesh Trade Council",
    phone: "+8801991-234567",
    email: "liu@cbtc.org",
    eventType: "expo",
    hallId: "gulnaksha",
    date: "2026-03-10",
    guests: 3000,
    source: "radar",
    status: "negotiation",
    notes: "Annual bilateral trade expo",
    utmSource: "radar",
    createdAt: "2026-10-15T08:00:00Z",
    updatedAt: "2026-11-08T10:00:00Z",
    score: 90,
    isHot: true,
    isSample: true,
  },
];

let _leads: Lead[] | null = null;

function getLeads(): Lead[] {
  if (!_leads) _leads = loadFromStorage();
  return _leads;
}

export const addLead = (lead: Lead): void => {
  const leads = getLeads();
  leads.unshift(lead);
  _leads = leads;
  saveToStorage(leads);
};

export const updateLead = (id: string, updates: Partial<Lead>): void => {
  const leads = getLeads();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx >= 0) {
    leads[idx] = { ...leads[idx], ...updates, updatedAt: new Date().toISOString() };
    _leads = leads;
    saveToStorage(leads);
  }
};

export const getAllLeads = (): Lead[] => getLeads();
