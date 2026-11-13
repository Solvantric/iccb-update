import type { Enquiry } from "@/types/crm";
import { base, isoFromToday, daysFromToday } from "./_helpers";

const S = { isSample: true };
type Row = Omit<Enquiry, "id" | "createdAt" | "updatedAt" | "deletedAt" | "isSample"> & { ago: number };
const rows: Row[] = [
  { ago: 0, type: "booking", source: "website", name: "Shahriar Alam", mobile: "01712345671", email: "shahriar@example.com", eventType: "Wedding", preferredDate: daysFromToday(75), guests: 800, hallPreference: "Noboratri", message: "Looking for a December Friday. Need ICCB catering and decoration.", status: "new" },
  { ago: 0, type: "chatbot", source: "chatbot", name: "Mithila Rahman", mobile: "01812345672", eventType: "Reception", guests: 500, message: "Chatbot lead: asked about Hall-5 price for a reception.", status: "new", language: "bn" },
  { ago: 1, type: "ask", source: "website", name: "Kazi Fahim", mobile: "01912345673", email: "fahim@example.com", message: "Is outside catering allowed for a corporate iftar?", status: "assigned", assignedTo: "u-se2" },
  { ago: 1, type: "exhibitor", source: "website", name: "Liang Wei", mobile: "01612345674", email: "liang@example.com", eventType: "Trade Fair", guests: 8000, preferredDate: daysFromToday(160), message: "International machinery fair, need 90,000 sq ft in Expo Zone B.", status: "new", language: "zh" },
  { ago: 2, type: "enquiry", source: "whatsapp", name: "Afsana Mimi", mobile: "01512345675", eventType: "Holud", guests: 250, preferredDate: daysFromToday(40), message: "Want a site visit this weekend.", status: "replied", assignedTo: "u-se1", replyNote: "Site visit booked for Saturday 4 pm." },
  { ago: 3, type: "contact", source: "website", name: "Omar Al-Farsi", mobile: "01312345676", email: "omar@example.com", message: "Conference for 1,200 delegates, need simultaneous interpretation.", status: "assigned", assignedTo: "u-se3", language: "ar" },
  { ago: 4, type: "enquiry", source: "phone", name: "Sohel Rana", mobile: "01712345677", eventType: "Convocation", guests: 3000, message: "University convocation, need Hall-4 with gallery.", status: "converted", assignedTo: "u-se2", bookingId: "bk-3" },
  { ago: 6, type: "chatbot", source: "chatbot", name: "Priya Saha", mobile: "01812345678", eventType: "Birthday", guests: 150, message: "Chatbot lead: small birthday — which hall?", status: "closed", replyNote: "Too small for ICCB halls; referred to Heritage Restaurant." },
  { ago: 8, type: "booking", source: "website", name: "Rafiq Hasan", mobile: "01912345679", eventType: "Corporate", guests: 600, preferredDate: daysFromToday(30), message: "Annual general meeting.", status: "replied", assignedTo: "u-se1", replyNote: "Sent estimate for Rajdarshan." },
  { ago: 10, type: "exhibitor", source: "referral", name: "Mahbub Morshed", mobile: "01612345680", eventType: "Exhibition", guests: 4000, message: "Want to book a stall at the lighting expo.", status: "closed", replyNote: "Stalls are sold by the organizer — shared contact." },
];
export const enquiriesSeed: Enquiry[] = rows.map(({ ago, ...r }, i) => ({ ...base(`enq-${i + 1}`, { ...S, createdAt: isoFromToday(-ago, 9 + (i % 8)) }), ...r }));
