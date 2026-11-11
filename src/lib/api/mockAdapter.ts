"use client";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { halls, getHallBySlug } from "@/data/halls";
import { services, getServiceBySlug } from "@/data/services";
import { cateringPackages } from "@/data/pricing";
import { getAllLeads, addLead, updateLead } from "@/data/leads";
import { getAllBookings, addBooking, updateBooking } from "@/data/bookings";
import { getAllQueries, addQuery, updateQuery } from "@/data/queries";
import { getAvailability, updateAvailability } from "@/data/availability";
import { newsArticles, getArticleBySlug } from "@/data/news";
import { faqItems } from "@/data/faq";
import { expoEvents, clientLogos } from "@/data/expo";
import { testimonials } from "@/data/testimonials";
import { galleryImages } from "@/data/images";
import { sampleLeads } from "@/data/leads";
import type { Lead, Booking } from "@/types";
import { nanoid } from "nanoid";

// Mock analytics store
const analyticsStore: unknown[] = [];

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function randomDelay() {
  return delay(150 + Math.random() * 250);
}

function ok<T>(data: T): AxiosResponse<{ data: T; success: true }> {
  return {
    data: { data, success: true },
    status: 200,
    statusText: "OK",
    headers: {},
    config: {} as AxiosRequestConfig,
  } as AxiosResponse;
}

type Handler = (config: AxiosRequestConfig) => Promise<AxiosResponse>;

const routes: Array<{ method: string; pattern: RegExp; handler: Handler }> = [];

function route(method: string, pattern: RegExp, handler: Handler) {
  routes.push({ method: method.toUpperCase(), pattern, handler });
}

// ─── Halls ────────────────────────────────────────────────────────────────
route("GET", /^\/halls$/, async () => {
  await randomDelay();
  return ok(halls);
});
route("GET", /^\/halls\/([^/]+)$/, async (config) => {
  await randomDelay();
  const slug = config.url!.match(/^\/halls\/([^/]+)$/)![1];
  const hall = getHallBySlug(slug);
  if (!hall) throw { response: { status: 404, data: { message: "Hall not found" } } };
  return ok(hall);
});

// ─── Services ─────────────────────────────────────────────────────────────
route("GET", /^\/services$/, async () => {
  await randomDelay();
  return ok(services);
});
route("GET", /^\/services\/([^/]+)$/, async (config) => {
  await randomDelay();
  const slug = config.url!.match(/^\/services\/([^/]+)$/)![1];
  const service = getServiceBySlug(slug);
  if (!service) throw { response: { status: 404, data: { message: "Service not found" } } };
  return ok(service);
});

// ─── Availability ─────────────────────────────────────────────────────────
route("GET", /^\/availability/, async (config) => {
  await randomDelay();
  const url = new URL("http://x" + config.url);
  const hallId = url.searchParams.get("hallId") || "gulnaksha";
  const month = url.searchParams.get("month") || "";
  return ok(getAvailability(hallId, month));
});
route("POST", /^\/availability\/update$/, async (config) => {
  await randomDelay();
  const slot = config.data ? JSON.parse(config.data) : config.data;
  updateAvailability(slot);
  return ok({ updated: true });
});

// ─── Leads ────────────────────────────────────────────────────────────────
route("GET", /^\/leads/, async () => {
  await randomDelay();
  return ok(getAllLeads());
});
route("POST", /^\/leads$/, async (config) => {
  await randomDelay();
  const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  const lead: Lead = {
    ...body,
    id: `lead-${nanoid(8)}`,
    status: "new",
    score: 50,
    isHot: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSample: false,
  };
  addLead(lead);
  // Dispatch event for Hot Lead Alert
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("iccb:new-lead", { detail: lead }));
  }
  return ok(lead);
});
route("PATCH", /^\/leads\/([^/]+)$/, async (config) => {
  await randomDelay();
  const id = config.url!.match(/^\/leads\/([^/]+)$/)![1];
  const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  updateLead(id, body);
  return ok({ updated: true });
});

// ─── Bookings ─────────────────────────────────────────────────────────────
route("GET", /^\/bookings/, async () => {
  await randomDelay();
  return ok(getAllBookings());
});
route("POST", /^\/bookings$/, async (config) => {
  await randomDelay();
  const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  const booking: Booking = {
    ...body,
    id: `bk-${nanoid(8)}`,
    referenceNumber: `ICCB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 100)}`,
    status: "pending_hold",
    createdAt: new Date().toISOString(),
    isSample: false,
  };
  addBooking(booking);
  // Update availability
  updateAvailability({
    hallId: booking.hallId,
    date: booking.date,
    shift: booking.shift,
    status: "reserved",
    holdExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  });
  return ok(booking);
});
route("PATCH", /^\/bookings\/([^/]+)$/, async (config) => {
  await randomDelay();
  const id = config.url!.match(/^\/bookings\/([^/]+)$/)![1];
  const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  updateBooking(id, body);
  // If confirming booking, update availability to 'booked'
  if (body.status === "confirmed") {
    const bookings = getAllBookings();
    const booking = bookings.find((b) => b.id === id);
    if (booking) {
      updateAvailability({ hallId: booking.hallId, date: booking.date, shift: booking.shift, status: "booked" });
    }
  }
  return ok({ updated: true });
});

// ─── Enquiry ──────────────────────────────────────────────────────────────
route("POST", /^\/enquiry$/, async (config) => {
  await randomDelay();
  const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  const lead: Lead = {
    id: `lead-${nanoid(8)}`,
    name: body.name,
    organization: body.organization,
    phone: body.phone,
    email: body.email,
    eventType: body.eventType,
    hallId: body.hallId,
    date: body.date,
    guests: body.guests,
    notes: body.notes,
    source: "website",
    status: "new",
    utmSource: body.utmSource,
    score: 60,
    isHot: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSample: false,
  };
  addLead(lead);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("iccb:new-lead", { detail: lead }));
  }
  return ok({ referenceNumber: `ENQ-${nanoid(6).toUpperCase()}`, leadId: lead.id });
});

// ─── Ask ──────────────────────────────────────────────────────────────────
route("POST", /^\/ask$/, async (config) => {
  await randomDelay();
  const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  const query = {
    id: `q-${nanoid(8)}`,
    type: "ask" as const,
    name: body.name,
    emailOrPhone: body.emailOrPhone,
    question: body.question,
    language: body.language || "en",
    status: "open" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSample: false,
  };
  addQuery(query);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("iccb:new-query", { detail: query }));
  }
  return ok(query);
});

// ─── Queries ──────────────────────────────────────────────────────────────
route("GET", /^\/queries/, async () => {
  await randomDelay();
  return ok(getAllQueries());
});
route("PATCH", /^\/queries\/([^/]+)$/, async (config) => {
  await randomDelay();
  const id = config.url!.match(/^\/queries\/([^/]+)$/)![1];
  const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  updateQuery(id, body);
  return ok({ updated: true });
});

// ─── Menu / catering ──────────────────────────────────────────────────────
route("GET", /^\/menu$/, async () => {
  await randomDelay();
  return ok(cateringPackages);
});

// ─── News ─────────────────────────────────────────────────────────────────
route("GET", /^\/news$/, async () => {
  await randomDelay();
  return ok(newsArticles);
});
route("GET", /^\/news\/([^/]+)$/, async (config) => {
  await randomDelay();
  const slug = config.url!.match(/^\/news\/([^/]+)$/)![1];
  const article = getArticleBySlug(slug);
  if (!article) throw { response: { status: 404, data: { message: "Not found" } } };
  return ok(article);
});

// ─── FAQ ──────────────────────────────────────────────────────────────────
route("GET", /^\/faq$/, async () => {
  await randomDelay();
  return ok(faqItems);
});

// ─── Expo ─────────────────────────────────────────────────────────────────
route("GET", /^\/expo-events$/, async () => {
  await randomDelay();
  return ok(expoEvents);
});
route("GET", /^\/client-logos$/, async () => {
  await randomDelay();
  return ok(clientLogos);
});

// ─── Testimonials ─────────────────────────────────────────────────────────
route("GET", /^\/testimonials$/, async () => {
  await randomDelay();
  return ok(testimonials);
});

// ─── Gallery ──────────────────────────────────────────────────────────────
route("GET", /^\/gallery/, async () => {
  await randomDelay();
  return ok(galleryImages);
});

// ─── Analytics ────────────────────────────────────────────────────────────
route("POST", /^\/analytics\/events$/, async (config) => {
  const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  const events = Array.isArray(body) ? body : [body];
  analyticsStore.push(...events);
  return ok({ received: events.length });
});
route("GET", /^\/analytics\/overview/, async () => {
  await randomDelay();
  return ok({
    visitors: 1247,
    leads: getAllLeads().length,
    enquiries: getAllLeads().filter((l) => l.source === "website").length,
    bookings: getAllBookings().length,
    conversionRate: 4.2,
    avgResponseTime: "1.8h",
  });
});
route("GET", /^\/analytics\/visitors/, async () => {
  await randomDelay();
  return ok({ recent: [], total: 1247, sources: { google: 42, direct: 28, whatsapp: 15, linkedin: 10, other: 5 } });
});

// ─── Dashboard auth ───────────────────────────────────────────────────────
route("POST", /^\/auth\/login$/, async (config) => {
  await delay(600);
  const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  if (body.email === "admin@iccb.demo" && body.password === "demo1234") {
    return ok({
      token: "mock-jwt-token-" + nanoid(16),
      user: { id: "user-1", name: "Admin User", email: "admin@iccb.demo", role: "admin" },
    });
  }
  throw { response: { status: 401, data: { message: "Invalid credentials" } } };
});

// ─── Chat ─────────────────────────────────────────────────────────────────
route("POST", /^\/chat$/, async (config) => {
  await delay(800 + Math.random() * 400);
  const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  const responses: Record<string, string> = {
    default: "Thank you for reaching out to ICCB. I can help you with venue availability, event planning, catering, and more. What would you like to know?",
    availability: "You can check real-time availability on our booking page. For specific dates, please use the availability calendar. A sales manager will confirm within 2 hours.",
    catering: "ICCB offers Mughal Classic (from ৳850/head), Continental (from ৳1,200/head), and Multi-Cuisine Grand (from ৳1,800/head) packages. External catering is not permitted.",
    capacity: "ICCB can accommodate 10,000+ guests simultaneously. Our halls range from 400 to 2,500 guests (theatre). Which hall interests you?",
    location: "ICCB is located next to the 300 ft. Purbachal Express Highway, Kuril Bishwa Road, Dhaka 1229. Easy access from the airport and all major areas.",
  };
  const msg = body.message?.toLowerCase() || "";
  let reply = responses.default;
  if (msg.includes("availab") || msg.includes("book")) reply = responses.availability;
  else if (msg.includes("cater") || msg.includes("food") || msg.includes("menu")) reply = responses.catering;
  else if (msg.includes("capac") || msg.includes("guest") || msg.includes("seat")) reply = responses.capacity;
  else if (msg.includes("location") || msg.includes("address") || msg.includes("where")) reply = responses.location;
  return ok({ reply, role: "assistant" });
});

// ─── Radar ────────────────────────────────────────────────────────────────
route("GET", /^\/radar/, async () => {
  await randomDelay();
  const items = [
    { id: "r1", title: "REHAB Fair 2026 Looking for Venue", source: "REHAB Press", date: "2026-11-05", location: "Dhaka", industry: "Real Estate", country: "Bangladesh", relevanceScore: 92, summary: "REHAB, the Real Estate and Housing Association of Bangladesh, is planning their annual property fair for February 2026. Last edition saw 50,000 visitors.", suggestedPitch: "Highlight Gulnaksha hall's 150 exhibition booth capacity and ample parking for buyers.", status: "active" as const, isSample: true },
    { id: "r2", title: "WHO South-East Asia Regional Conference 2026", source: "WHO SEARO", date: "2026-11-01", location: "Dhaka", industry: "Healthcare", country: "International", relevanceScore: 87, summary: "WHO SEARO is considering Dhaka for a regional health ministers' conference. Requires conference hall for 1,200 pax with interpretation services.", suggestedPitch: "Rajdarshan hall with 4-language simultaneous interpretation is ideal. Emphasize international standards.", status: "active" as const, isSample: true },
    { id: "r3", title: "Bangladesh Fashion Week Spring 2026", source: "BFGMEA", date: "2026-10-28", location: "Dhaka", industry: "Fashion & Textile", country: "Bangladesh", relevanceScore: 78, summary: "Bangladesh Fashion Week is seeking a prestigious venue for its Spring 2026 edition. Looking for 800-1,000 pax capacity with strong AV.", suggestedPitch: "Noboratri's flexibility and stage setup make it perfect. Cross-sell catering for the gala dinner.", status: "active" as const, isSample: true },
  ];
  return ok(items);
});

// ─── Demand heatmap ───────────────────────────────────────────────────────
route("GET", /^\/demand-heatmap/, async (config) => {
  await randomDelay();
  const url = new URL("http://x" + config.url);
  const hallId = url.searchParams.get("hallId") || "gulnaksha";
  const month = url.searchParams.get("month") || "";
  // Generate sample demand data
  const data: Record<string, number> = {};
  const year = month.split("-")[0] || "2026";
  const monthNum = month.split("-")[1] || "12";
  const days = new Date(Number(year), Number(monthNum), 0).getDate();
  for (let d = 1; d <= days; d++) {
    const dateStr = `${year}-${monthNum}-${String(d).padStart(2, "0")}`;
    data[dateStr] = Math.floor(Math.random() * 100);
  }
  return ok(data);
});

// ─── Install adapter ──────────────────────────────────────────────────────
let installed = false;

export function installMockAdapter() {
  if (installed) return;
  installed = true;

  axios.defaults.adapter = async (config: AxiosRequestConfig) => {
    const url = config.url || "";
    const method = (config.method || "GET").toUpperCase();

    // Strip base URL prefix
    const baseURL = config.baseURL || "";
    const path = url.startsWith(baseURL) ? url.slice(baseURL.length) : url;

    for (const r of routes) {
      if (r.method === method && r.pattern.test(path)) {
        try {
          return await r.handler({ ...config, url: path });
        } catch (err) {
          throw err;
        }
      }
    }

    console.warn(`[MockAdapter] No route found for ${method} ${path}`);
    throw { response: { status: 404, data: { message: `No mock for ${method} ${path}` } } };
  };
}
