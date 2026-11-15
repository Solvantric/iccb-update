/**
 * ICCB CRM sample data — fake Bangladeshi names only, every record `isSample`.
 * Dates are relative to "today" so the demo always looks current.
 */
import { addDays, format, subDays, subHours } from "date-fns";
import { calcBill } from "@/lib/crm/bill";
import { HERO_SLIDES, heroTitle } from "@/data/hero";
import { galleryImages } from "@/data/images";
import { halls as STATIC_HALLS } from "@/data/halls";
import type { ReviewRequest } from "@/types/crm";
import type { AnalyticsEvent, AnalyticsType, Booking, Client, ContentItem, Device, Enquiry, Hall, Meeting, MenuPackage, Payment, RadarItem, ServiceItem, Settings, SpecialPrice, TrafficSource, User } from "@/types/crm";

const ymd = (d: Date) => format(d, "yyyy-MM-dd");
const day = (offset: number) => ymd(addDays(new Date(), offset));
const iso = (daysAgo: number, hoursAgo = 0) => subHours(subDays(new Date(), daysAgo), hoursAgo).toISOString();
const S = { isSample: true } as const;

export const settingsSeed = (): Settings => ({
  orgName: "International Convention City Bashundhara (ICCB)",
  phone: "+88-01991-197719",
  email: "booking@iccb.example",
  address: "Kuril, Purbachal Express Highway, Dhaka 1229, Bangladesh",
  refPrefix: "ICCB",
  weekendDays: [5, 6],
  addOnRates: {
    decorationBasic: 90_000,
    decorationStandard: 180_000,
    decorationPremium: 350_000,
    outsideA: 120_000,
    outsideB: 75_000,
    outsideC: 50_000,
    breakfast: 350,
    lunch: 1_100,
    snacks: 280,
    dinner: 1_350,
    serviceChargeMain: 125,
    serviceChargeLight: 15,
  },
  foodVatPercent: 15,
  securityByType: { Wedding: 75_000, Reception: 75_000, Corporate: 100_000, Conference: 100_000, Exhibition: 150_000, Concert: 300_000, Other: 100_000 },
  refundDays: 15,
  paymentTerms: "60% of the bill as advance confirms the date; the balance is due 7 days before the event. Security money is refunded within 15 working days, minus damages.",
});

const FEATURES = ["Central AC", "2 green rooms", "CCTV", "Free Wi-Fi", "Generator backup"];
export const hallsSeed = (): Hall[] => [
  { ...S, id: "gulnaksha", code: "Hall-1", name: "Gulnaksha", capacity: 1800, areaSqft: 28_000, weekdayRate: 400_000, weekendRate: 450_000, extraHourRate: 15_000, features: [...FEATURES, "LED wall"], active: true, createdAt: iso(120) },
  { ...S, id: "pushpoguchcho", code: "Hall-2", name: "Pushpoguchcho", capacity: 1500, areaSqft: 24_000, weekdayRate: 400_000, weekendRate: 450_000, extraHourRate: 15_000, features: FEATURES, active: true, createdAt: iso(120) },
  { ...S, id: "rajdarshan", code: "Hall-3", name: "Rajdarshan", capacity: 1200, areaSqft: 20_000, weekdayRate: 400_000, weekendRate: 450_000, extraHourRate: 15_000, features: FEATURES, active: true, createdAt: iso(120) },
  { ...S, id: "noboratri", code: "Hall-4", name: "Noboratri", capacity: 2500, areaSqft: 36_000, weekdayRate: 550_000, weekendRate: 600_000, extraHourRate: 25_000, features: [...FEATURES, "Gallery"], active: true, createdAt: iso(120) },
  { ...S, id: "pushpanjali", code: "Hall-5", name: "Pushpanjali", capacity: 600, areaSqft: 9_000, weekdayRate: 200_000, weekendRate: 200_000, extraHourRate: 10_000, features: ["Central AC", "CCTV", "Free Wi-Fi"], active: true, createdAt: iso(120) },
];

export const menusSeed = (): MenuPackage[] => [
  { ...S, id: "menu-breakfast", name: "Breakfast", meal: "breakfast", perHead: 350, items: ["Paratha", "Egg", "Vegetable", "Tea / coffee"], active: true, createdAt: iso(90) },
  { ...S, id: "menu-corporate-lunch", name: "Corporate Lunch Box", meal: "lunch", perHead: 650, items: ["Polao", "Chicken curry", "Vegetable", "Dessert", "Water"], active: true, createdAt: iso(90) },
  { ...S, id: "menu-continental", name: "Continental Buffet", meal: "lunch", perHead: 1_650, items: ["Cream soup", "Grilled chicken", "Fish fillet", "Pasta", "Dessert bar"], active: true, createdAt: iso(90) },
  { ...S, id: "menu-snacks", name: "Evening Snacks", meal: "snacks", perHead: 280, items: ["Samosa", "Sandwich", "Pastry", "Tea / coffee"], active: true, createdAt: iso(90) },
  { ...S, id: "menu-mughal-classic", name: "Mughal Classic", meal: "dinner", perHead: 1_450, items: ["Kacchi biryani", "Chicken roast", "Borhani", "Firni", "Salad"], active: true, createdAt: iso(90) },
  { ...S, id: "menu-mughal-royal", name: "Mughal Royal", meal: "dinner", perHead: 1_850, items: ["Mutton kacchi", "Chicken roast", "Beef rezala", "Jali kabab", "Borhani", "Shahi tukra"], active: true, createdAt: iso(90) },
  { ...S, id: "menu-multi-grand", name: "Multi-Cuisine Grand", meal: "dinner", perHead: 2_200, items: ["Thai soup", "Kacchi", "Chinese vegetables", "Grilled fish", "Live dessert counter"], active: true, createdAt: iso(90) },
];

export const servicesSeed = (): ServiceItem[] => [
  { ...S, id: "svc-sound", name: "Sound system (line array)", category: "Sound & light", unit: "day", rate: 45_000, active: true, createdAt: iso(90) },
  { ...S, id: "svc-light", name: "Stage & intelligent lighting", category: "Sound & light", unit: "day", rate: 60_000, active: true, createdAt: iso(90) },
  { ...S, id: "svc-led", name: "LED wall (P3.9)", category: "LED & AV", unit: "sq ft", rate: 350, active: true, createdAt: iso(90) },
  { ...S, id: "svc-projector", name: "Projector + screen", category: "LED & AV", unit: "day", rate: 12_000, active: true, createdAt: iso(90) },
  { ...S, id: "svc-photo", name: "Photo & video coverage", category: "LED & AV", unit: "event", rate: 75_000, active: true, createdAt: iso(90) },
  { ...S, id: "svc-generator", name: "Generator support", category: "Power", unit: "hour", rate: 20_000, active: true, createdAt: iso(90) },
  { ...S, id: "svc-chair-cover", name: "Chair cover", category: "Furniture", unit: "cover", rate: 40, active: true, createdAt: iso(90) },
  { ...S, id: "svc-extra-chair", name: "Extra chair", category: "Furniture", unit: "chair", rate: 50, active: true, createdAt: iso(90) },
  { ...S, id: "svc-waiter", name: "Extra waiter / cleaner", category: "Staff", unit: "person", rate: 600, active: true, createdAt: iso(90) },
  { ...S, id: "svc-archway", name: "Archway gate", category: "Other", unit: "piece", rate: 3_000, active: true, createdAt: iso(90) },
  { ...S, id: "svc-shuttle", name: "Guest shuttle bus", category: "Logistics", unit: "trip", rate: 6_000, active: true, createdAt: iso(90) },
  { ...S, id: "svc-valet", name: "Valet parking team", category: "Logistics", unit: "event", rate: 25_000, active: true, createdAt: iso(90) },
];

export const clientsSeed = (): Client[] => [
  { ...S, id: "cl-1", clientNo: "C-0001", name: "Rahim Uddin", type: "Individual", mobile: "01711-234567", email: "rahim.uddin@example.com", address: "Mirpur 10, Dhaka", idNo: "NID 1990 2694 5512", tags: ["Wedding"], createdAt: iso(0, 2) },
  { ...S, id: "cl-2", clientNo: "C-0002", name: "Tanvir Hasan", type: "Corporate", organization: "BrightPath Ltd", mobile: "01819-445566", email: "tanvir@brightpath.example", address: "Gulshan 2, Dhaka", idNo: "TRAD/DNCC/04512", tags: ["Corporate"], createdAt: iso(1) },
  { ...S, id: "cl-3", clientNo: "C-0003", name: "Sadia Islam", type: "Individual", mobile: "01912-778899", email: "sadia.islam@example.com", address: "Dhanmondi 27, Dhaka", tags: ["Wedding", "VIP"], createdAt: iso(18) },
  { ...S, id: "cl-4", clientNo: "C-0004", name: "Kamal Hossain", type: "Corporate", organization: "Bengal Tech Ltd", mobile: "01552-334455", email: "kamal@bengaltech.example", address: "Banani, Dhaka", idNo: "TRAD/DNCC/09981", tags: ["Corporate", "Repeat"], notes: "Books twice a year. Prefers Pushpoguchcho.", createdAt: iso(60) },
  { ...S, id: "cl-5", clientNo: "C-0005", name: "Farhana Akter Mitu", type: "Individual", mobile: "01611-998877", address: "Uttara Sector 7, Dhaka", tags: ["Wedding"], createdAt: iso(40) },
  { ...S, id: "cl-6", clientNo: "C-0006", name: "Jahid Rahman", type: "Corporate", organization: "Nova Mobile", mobile: "01733-112233", tags: ["Corporate"], notes: "Postponed launch — follow up in January.", createdAt: iso(7) },
  { ...S, id: "cl-7", clientNo: "C-0007", name: "Mahbub Alam", type: "Government", organization: "ICT Division", mobile: "01715-667700", email: "mahbub.alam@ict.example", address: "Agargaon, Dhaka", tags: ["Government"], createdAt: iso(3) },
  { ...S, id: "cl-8", clientNo: "C-0008", name: "Nasrin Sultana", type: "NGO", organization: "Green Earth Foundation", mobile: "01799-454545", email: "nasrin@greenearth.example", tags: ["NGO", "Seminar"], createdAt: iso(45) },
];

const hist = (daysAgo: number, by: string, text: string) => ({ at: iso(daysAgo), by, text });
const DAY = "Day (10 AM – 4 PM)" as const;
const EVE = "Evening (5 PM – 11 PM)" as const;

export const bookingsSeed = (): Booking[] => [
  {
    ...S, id: "bk-1", ref: "ICCB-2026-0001", clientId: "cl-1", name: "Rahim Uddin", mobile: "01711-234567", email: "rahim.uddin@example.com",
    eventName: "Rahim & Nadia Wedding", eventType: "Wedding", hallId: "gulnaksha", date: day(12), slot: EVE, layout: "Banquet with stage", guests: 900, cars: 150, note: "Prefers an evening slot.",
    status: "reserved", contacted: false, addOns: { decoration: "none" }, discount: 0, source: "website",
    history: [{ at: iso(0, 2), by: "Website", text: "Reserved from the website form" }], createdAt: iso(0, 2),
  },
  {
    ...S, id: "bk-2", ref: "ICCB-2026-0002", clientId: "cl-2", name: "Tanvir Hasan", mobile: "01819-445566", email: "tanvir@brightpath.example", organization: "BrightPath Ltd",
    eventName: "BrightPath Annual Meet", eventType: "Corporate", hallId: "rajdarshan", date: day(20), slot: DAY, layout: "Theatre", guests: 600, cars: 120,
    status: "reserved", contacted: true, addOns: { decoration: "basic", lunch: { persons: 600, menuId: "menu-corporate-lunch" }, services: [{ serviceId: "svc-projector", qty: 1 }] }, discount: 0, source: "website",
    history: [{ at: iso(1), by: "Website", text: "Reserved from the website form" }, hist(0, "Nusrat Jahan", "Marked as contacted")], createdAt: iso(1),
  },
  {
    ...S, id: "bk-3", ref: "ICCB-2026-0003", clientId: "cl-3", name: "Sadia Islam", mobile: "01912-778899", email: "sadia.islam@example.com",
    eventName: "Sadia & Arif Reception", eventType: "Reception", hallId: "noboratri", date: day(6), slot: EVE, layout: "Full banquet", guests: 1800, cars: 300, coordinator: "Sabbir Ahmed", note: "Stage on the north side.",
    status: "booked", contacted: true,
    addOns: { decoration: "premium", dinner: { persons: 1800, menuId: "menu-mughal-royal" }, extraHours: 1, services: [{ serviceId: "svc-sound", qty: 1 }, { serviceId: "svc-light", qty: 1 }, { serviceId: "svc-photo", qty: 1 }] },
    discount: 150_000, source: "website", runSheet: {},
    history: [hist(18, "Website", "Reserved from the website form"), hist(9, "Nusrat Jahan", "Booking confirmed")], createdAt: iso(18),
  },
  {
    ...S, id: "bk-4", ref: "ICCB-2026-0004", clientId: "cl-4", name: "Kamal Hossain", mobile: "01552-334455", email: "kamal@bengaltech.example", organization: "Bengal Tech Ltd",
    eventName: "Bengal Tech Summit 2026", eventType: "Conference", hallId: "pushpoguchcho", date: day(25), slot: "Full day", layout: "Theatre", guests: 1200, cars: 250, coordinator: "Sabbir Ahmed",
    status: "booked", contacted: true,
    addOns: { decoration: "outsideC", decorationFirm: "Event Craft BD", breakfast: { persons: 1200, menuId: "menu-breakfast" }, lunch: { persons: 1200, menuId: "menu-continental" }, services: [{ serviceId: "svc-led", qty: 200 }, { serviceId: "svc-sound", qty: 1 }] },
    discount: 0, source: "staff",
    history: [hist(14, "Nusrat Jahan", "Created by staff"), hist(4, "Nusrat Jahan", "Booking confirmed")], createdAt: iso(14),
  },
  {
    ...S, id: "bk-5", ref: "ICCB-2026-0005", clientId: "cl-5", name: "Farhana Akter Mitu", mobile: "01611-998877",
    eventName: "Mitu's Holud Night", eventType: "Wedding", hallId: "pushpanjali", date: day(-10), slot: EVE, layout: "Banquet with stage", guests: 450, coordinator: "Sabbir Ahmed",
    status: "closed", contacted: true, addOns: { decoration: "basic", dinner: { persons: 450, menuId: "menu-mughal-classic" } }, discount: 0, source: "website",
    runSheet: { "Hall opened": true, "Setup ready": true, "Sound check": true, "Food served": true, "Hall closed": true }, actualGuests: 480,
    feedback: { ratings: { Venue: 5, Food: 4, Service: 5, Cleanliness: 4, "Sound & light": 4 }, comment: "Lovely evening, food could be a bit warmer.", at: iso(8) },
    damages: [{ id: "dm-1", item: "Broken chair", qty: 2, rate: 1_500 }],
    history: [hist(40, "Website", "Reserved from the website form"), hist(33, "Nusrat Jahan", "Booking confirmed"), hist(9, "Sabbir Ahmed", "Event closed")], createdAt: iso(40),
  },
  {
    ...S, id: "bk-6", ref: "ICCB-2026-0006", clientId: "cl-6", name: "Jahid Rahman", mobile: "01733-112233", organization: "Nova Mobile",
    eventName: "Nova Phone Launch", eventType: "Corporate", hallId: "gulnaksha", date: day(15), slot: EVE, layout: "Cocktail", guests: 700,
    status: "cancelled", contacted: true, addOns: { decoration: "none" }, discount: 0, source: "website",
    history: [hist(7, "Website", "Reserved from the website form"), hist(5, "Nusrat Jahan", "Cancelled — client postponed")], createdAt: iso(7),
  },
  {
    ...S, id: "bk-7", ref: "ICCB-2026-0007", clientId: "cl-4", name: "Kamal Hossain", mobile: "01552-334455", email: "kamal@bengaltech.example", organization: "Bengal Tech Ltd",
    eventName: "Bengal Tech Townhall", eventType: "Corporate", hallId: "rajdarshan", date: day(2), slot: DAY, layout: "Classroom", guests: 500, cars: 80, coordinator: "Sabbir Ahmed",
    status: "booked", contacted: true, addOns: { decoration: "none", snacks: { persons: 500, menuId: "menu-snacks" }, services: [{ serviceId: "svc-projector", qty: 2 }] }, discount: 20_000, source: "staff",
    runSheet: { "Setup ready": true },
    history: [hist(12, "Nusrat Jahan", "Created by staff"), hist(10, "Nusrat Jahan", "Booking confirmed")], createdAt: iso(12),
  },
  {
    ...S, id: "bk-8", ref: "ICCB-2026-0008", clientId: "cl-7", name: "Mahbub Alam", mobile: "01715-667700", email: "mahbub.alam@ict.example", organization: "ICT Division",
    eventName: "Smart Bangladesh Seminar", eventType: "Conference", hallId: "pushpanjali", date: day(30), slot: DAY, layout: "Theatre", guests: 450,
    status: "reserved", contacted: false, addOns: { decoration: "none", lunch: { persons: 450 } }, discount: 0, source: "website",
    history: [{ at: iso(3), by: "Website", text: "Reserved from the website form" }], createdAt: iso(3),
  },
  {
    ...S, id: "bk-9", ref: "ICCB-2026-0009", clientId: "cl-8", name: "Nasrin Sultana", mobile: "01799-454545", email: "nasrin@greenearth.example", organization: "Green Earth Foundation",
    eventName: "Green Earth Climate Seminar", eventType: "Conference", hallId: "rajdarshan", date: day(-24), slot: DAY, layout: "Classroom", guests: 350, coordinator: "Sabbir Ahmed",
    status: "closed", contacted: true, addOns: { decoration: "none", lunch: { persons: 350, menuId: "menu-corporate-lunch" }, services: [{ serviceId: "svc-projector", qty: 1 }] }, discount: 0, source: "staff",
    runSheet: { "Hall opened": true, "Setup ready": true, "Sound check": true, "Food served": true, "Hall closed": true }, actualGuests: 330,
    feedback: { ratings: { Venue: 4, Food: 3, Service: 4, Cleanliness: 5, "Sound & light": 3 }, comment: "Projector took time to start. Otherwise good.", at: iso(22) },
    history: [hist(45, "Nusrat Jahan", "Created by staff"), hist(40, "Nusrat Jahan", "Booking confirmed"), hist(23, "Sabbir Ahmed", "Event closed")], createdAt: iso(45),
  },
];

/** Closed sample events are fully paid: the final payment is whatever is left on the bill. */
const balanceOf = (id: string, paidBefore: number) => {
  const b = bookingsSeed().find((x) => x.id === id)!;
  const st = settingsSeed();
  return calcBill(b, { halls: hallsSeed(), addOns: st.addOnRates, weekendDays: st.weekendDays, menus: menusSeed(), services: servicesSeed(), foodVatPercent: st.foodVatPercent }).total - paidBefore;
};

export const paymentsSeed = (): Payment[] => [
  { ...S, id: "pay-1", receiptNo: "0001", bookingId: "bk-5", kind: "Advance", amount: 300_000, date: day(-33), method: "Bank transfer", reference: "DBBL-TRX-88412", receivedBy: "Nusrat Jahan", createdAt: iso(33) },
  { ...S, id: "pay-2", receiptNo: "0002", bookingId: "bk-5", kind: "Final", amount: balanceOf("bk-5", 300_000), date: day(-12), method: "Cheque", reference: "CHQ 0045521", receivedBy: "Nusrat Jahan", note: "Final payment", createdAt: iso(12) },
  { ...S, id: "pay-3", receiptNo: "0003", bookingId: "bk-3", kind: "Advance", amount: 2_000_000, date: day(-9), method: "Bank transfer", reference: "BRAC-TRX-55120", receivedBy: "Nusrat Jahan", createdAt: iso(9) },
  { ...S, id: "pay-4", receiptNo: "0004", bookingId: "bk-4", kind: "Advance", amount: 1_200_000, date: day(-4), method: "Cash", receivedBy: "Nusrat Jahan", createdAt: iso(4) },
  { ...S, id: "pay-5", receiptNo: "0005", bookingId: "bk-3", kind: "Installment", amount: 800_000, date: day(-2), method: "bKash", reference: "BK8H2K1L9", receivedBy: "Admin", note: "Second instalment", createdAt: iso(2) },
  { ...S, id: "pay-6", receiptNo: "0006", bookingId: "bk-7", kind: "Advance", amount: 400_000, date: day(-10), method: "Bank transfer", reference: "CITY-TRX-11208", receivedBy: "Nusrat Jahan", createdAt: iso(10) },
  { ...S, id: "pay-7", receiptNo: "0007", bookingId: "bk-5", kind: "Security deposit", amount: 75_000, date: day(-12), method: "Cash", receivedBy: "Nusrat Jahan", createdAt: iso(12) },
  { ...S, id: "pay-8", receiptNo: "0008", bookingId: "bk-9", kind: "Final", amount: balanceOf("bk-9", 0), date: day(-30), method: "Bank transfer", reference: "EBL-TRX-40017", receivedBy: "Nusrat Jahan", createdAt: iso(30) },
];

export const meetingsSeed = (): Meeting[] => [
  { ...S, id: "mt-1", bookingId: "bk-1", clientName: "Rahim Uddin", mobile: "01711-234567", type: "Site visit", date: day(0), time: "11:00", rep: "Nusrat Jahan", location: "ICCB reception", note: "Site visit with the family.", status: "scheduled", createdAt: iso(0, 2) },
  { ...S, id: "mt-2", bookingId: "bk-2", clientName: "Tanvir Hasan", mobile: "01819-445566", type: "Follow-up call", date: day(0), time: "16:30", rep: "Nusrat Jahan", note: "Discuss lunch menu.", status: "scheduled", createdAt: iso(1) },
  { ...S, id: "mt-3", bookingId: "bk-4", clientName: "Kamal Hossain", mobile: "01552-334455", type: "PPM", date: day(3), time: "12:00", rep: "Sabbir Ahmed", location: "Meeting room 2", note: "Stage, LED wall and seating plan.", status: "scheduled", createdAt: iso(4) },
  { ...S, id: "mt-4", clientName: "Nusrat Sultana", mobile: "01822-667788", type: "Site visit", date: day(5), time: "15:00", rep: "Nusrat Jahan", location: "Pushpanjali", note: "Walk-in: wants to see Pushpanjali.", status: "scheduled", createdAt: iso(1) },
  { ...S, id: "mt-5", bookingId: "bk-3", clientName: "Sadia Islam", mobile: "01912-778899", type: "PPM", date: day(-10), time: "17:00", rep: "Sabbir Ahmed", location: "Meeting room 1", note: "Confirmed decoration and dinner.", outcome: "Menu and stage plan signed off.", status: "done", createdAt: iso(12) },
  { ...S, id: "mt-6", bookingId: "bk-7", clientName: "Kamal Hossain", mobile: "01552-334455", type: "Final briefing", date: day(1), time: "14:00", rep: "Sabbir Ahmed", location: "Rajdarshan", note: "Walk-through with the client's admin team.", status: "scheduled", createdAt: iso(3) },
];

export const enquiriesSeed = (): Enquiry[] => [
  { ...S, id: "enq-1", type: "booking", source: "Booking form", bookingId: "bk-1", name: "Rahim Uddin", mobile: "01711-234567", email: "rahim.uddin@example.com", message: "Rahim & Nadia Wedding · Gulnaksha · 900 guests", seen: false, createdAt: iso(0, 2) },
  { ...S, id: "enq-2", type: "question", source: "Ask a question", name: "Shirin Akhter", mobile: "01915-221144", message: "Is there parking for about 300 cars on a Friday evening?", seen: false, createdAt: iso(0, 5) },
  { ...S, id: "enq-3", type: "booking", source: "Booking form", bookingId: "bk-2", name: "Tanvir Hasan", mobile: "01819-445566", email: "tanvir@brightpath.example", message: "BrightPath Annual Meet · Rajdarshan · 600 guests", seen: true, createdAt: iso(1) },
  { ...S, id: "enq-4", type: "booking", source: "Booking form", bookingId: "bk-8", name: "Mahbub Alam", mobile: "01715-667700", email: "mahbub.alam@ict.example", message: "Smart Bangladesh Seminar · Pushpanjali · 450 guests", seen: false, createdAt: iso(3) },
  { ...S, id: "enq-5", type: "booking", source: "Booking form", bookingId: "bk-6", name: "Jahid Rahman", mobile: "01733-112233", message: "Nova Phone Launch · Gulnaksha · 700 guests", seen: true, createdAt: iso(7) },
  { ...S, id: "enq-6", type: "question", source: "Contact form", name: "Mahmudul Karim", mobile: "01688-332211", email: "mahmud@example.com", message: "Subject: Decoration\nCan we bring our own decorator for a holud?", seen: true, createdAt: iso(9) },
  { ...S, id: "enq-7", type: "question", source: "Chatbot", name: "Chat visitor", mobile: "01866-090909", message: "Chatbot conversation:\n• Price for 300 guests lunch?\n• Weekday please", seen: true, createdAt: iso(11) },
  { ...S, id: "enq-8", type: "booking", source: "Booking form", bookingId: "bk-3", name: "Sadia Islam", mobile: "01912-778899", email: "sadia.islam@example.com", message: "Sadia & Arif Reception · Noboratri · 1,800 guests", seen: true, createdAt: iso(18) },
];

export const usersSeed = (): User[] => [
  { ...S, id: "u-admin", name: "Admin", email: "admin@iccb.example", phone: "01700-000001", role: "admin", active: true, createdAt: iso(200) },
  { ...S, id: "u-sales", name: "Nusrat Jahan", email: "nusrat@iccb.example", phone: "01700-000002", role: "sales", active: true, createdAt: iso(200) },
  { ...S, id: "u-ops", name: "Sabbir Ahmed", email: "sabbir@iccb.example", phone: "01700-000003", role: "operations", active: true, createdAt: iso(200) },
  { ...S, id: "u-mkt", name: "Imran Chowdhury", email: "imran@iccb.example", phone: "01700-000004", role: "marketing", active: true, createdAt: iso(200) },
];

export const specialPricesSeed = (): SpecialPrice[] => [];

export const reviewsSeed = (): ReviewRequest[] => [
  {
    ...S, id: "rv-1", token: "demo-mitu-holud", bookingId: "bk-5", clientName: "Farhana Akter Mitu", mobile: "01611-998877", eventName: "Mitu's Holud Night", sentBy: "Sabbir Ahmed",
    status: "submitted", answers: [4, 4, 3, 4, 3, 4, 3, 2, 3, 4], comment: "Beautiful hall and very caring staff. Parking was a bit slow at 8 PM.", reviewerName: "Farhana Akter Mitu", reviewerMobile: "01611-998877", submittedAt: iso(7), createdAt: iso(9),
  },
  {
    ...S, id: "rv-2", token: "demo-green-earth", bookingId: "bk-9", clientName: "Nasrin Sultana", mobile: "01799-454545", eventName: "Green Earth Climate Seminar", sentBy: "Sabbir Ahmed",
    status: "submitted", answers: [3, 4, 4, 3, 2, 3, 2, 3, 3, 3], comment: "Good venue for seminars. The projector needs a quicker setup.", reviewerName: "Rafiq Islam (event manager)", reviewerMobile: "01799-121212", submittedAt: iso(21), createdAt: iso(23),
  },
  { ...S, id: "rv-3", token: "demo-bengal-townhall", bookingId: "bk-7", clientName: "Kamal Hossain", mobile: "01552-334455", eventName: "Bengal Tech Townhall", sentBy: "Nusrat Jahan", status: "pending", createdAt: iso(0, 3) },
];

export const radarSeed = (): RadarItem[] => [
  { ...S, id: "rd-1", scope: "national", title: "Dhaka Apparel Sourcing Expo", organizer: "BD Garments Forum", date: day(70), location: "Dhaka", category: "Exhibition", score: 88, summary: "Annual sourcing fair; last venue is under renovation.", eventType: "Exhibition", guests: 2500, dismissed: false, createdAt: iso(2) },
  { ...S, id: "rd-2", scope: "national", title: "National Pharma Conference", organizer: "Pharma Society BD", date: day(95), location: "Dhaka", category: "Conference", score: 74, summary: "1,200 delegates, two-day plenary plus dinner.", eventType: "Conference", guests: 1200, dismissed: false, createdAt: iso(3) },
  { ...S, id: "rd-3", scope: "national", title: "Chattogram Bankers' Gala", organizer: "Port City Bankers Club", date: day(48), location: "Chattogram", category: "Gala", score: 61, summary: "Looking for a larger hall in Dhaka this year.", eventType: "Corporate", guests: 800, dismissed: false, leadAt: iso(1), createdAt: iso(5) },
  { ...S, id: "rd-4", scope: "international", title: "South Asia Fintech Week", organizer: "SA Fintech Alliance", date: day(130), location: "Rotating · Asia", category: "Conference", score: 82, summary: "Host city for next edition not yet decided.", eventType: "Conference", guests: 1500, dismissed: false, createdAt: iso(2) },
  { ...S, id: "rd-5", scope: "international", title: "Asian Textile Machinery Show", organizer: "ATM Expo Ltd", date: day(160), location: "Singapore → Dhaka?", category: "Exhibition", score: 69, summary: "Organizer exploring a Bangladesh edition.", eventType: "Exhibition", guests: 3000, dismissed: false, createdAt: iso(6) },
  { ...S, id: "rd-7", scope: "national", title: "Bangladesh Wedding Expo", organizer: "Shaadi Fair BD", date: day(55), location: "Dhaka", category: "Exhibition", score: 77, summary: "Bridal fair with 120 stalls; wants a weekend date.", eventType: "Exhibition", guests: 4000, dismissed: false, createdAt: iso(4) },
  { ...S, id: "rd-8", scope: "international", title: "Asia Pacific Dental Congress", organizer: "APDC Secretariat", date: day(190), location: "Regional", category: "Congress", score: 71, summary: "Three-day congress with exhibition; host city open.", eventType: "Conference", guests: 1800, dismissed: false, createdAt: iso(7) },
  { ...S, id: "rd-6", scope: "international", title: "Bay of Bengal Climate Forum", organizer: "BoB Climate Network", date: day(110), location: "Regional", category: "Forum", score: 57, summary: "Mid-size forum, 600 delegates, needs breakout rooms.", eventType: "Conference", guests: 600, dismissed: false, createdAt: iso(8) },
];

/** Extra radar ideas revealed one by one by "Refresh". */
export const radarExtra: Omit<RadarItem, "id" | "createdAt">[] = [
  { ...S, scope: "national", title: "Dhaka Furniture Fair", organizer: "BD Furniture Makers", date: day(85), location: "Dhaka", category: "Exhibition", score: 72, summary: "Outgrew its current venue last year.", eventType: "Exhibition", guests: 2000, dismissed: false },
  { ...S, scope: "international", title: "Asia Medical Tourism Summit", organizer: "AMT Council", date: day(140), location: "Regional", category: "Summit", score: 66, summary: "Shortlisting South Asian host cities.", eventType: "Conference", guests: 900, dismissed: false },
  { ...S, scope: "national", title: "University Convocation 2027", organizer: "Private University Consortium", date: day(100), location: "Dhaka", category: "Convocation", score: 79, summary: "Needs 3,000+ seats on one day.", eventType: "Other", guests: 3000, dismissed: false },
];

export const contentSeed = (): ContentItem[] => {
  const c = (section: ContentItem["section"], items: Omit<ContentItem, "id" | "section" | "published" | "order" | "createdAt">[]) =>
    items.map((it, i) => ({ ...S, ...it, id: `${section}-${i + 1}`, section, published: true, order: i, createdAt: iso(60) }));
  return [
    ...c("hero", HERO_SLIDES.map((h) => ({ title: heroTitle(h), subtitle: h.sub, image: h.src }))),
    ...c("venues", STATIC_HALLS.slice(0, 6).map((h) => ({ title: h.name.en, subtitle: `Up to ${h.capacity.theatre.toLocaleString("en-IN")} guests`, body: h.features[0]?.en, image: h.image }))),
    ...c("gallery", galleryImages.slice(0, 6).map((g) => ({ title: g.alt.en, subtitle: g.category, image: g.src }))),
    ...c("faq", [
      { title: "How do I book a hall?", body: "Fill in the booking form on our website. Your date is reserved and our representative calls you to confirm.", subtitle: "booking" },
      { title: "Is my date confirmed after the form?", body: "Your date is reserved. It becomes booked once ICCB staff confirm it with you.", subtitle: "booking" },
      { title: "How can I pay?", body: "Cash, bank transfer, cheque, bKash, Nagad or card at our counter. There is no online payment.", subtitle: "booking" },
      { title: "Is parking available?", body: "Yes, ICCB has large on-site parking for guests.", subtitle: "facilities" },
      { title: "Can I visit before booking?", body: "Of course — tick “I'd like to meet ICCB at the venue” on the booking form and we'll schedule a visit.", subtitle: "venues" },
    ]),
    ...c("testimonials", [
      { title: "Ayesha Siddiqua", subtitle: "Bride, Dhaka", body: "Our wedding at ICCB was flawless. The team handled everything." },
      { title: "Rafiq Ahmed", subtitle: "HR Head, a telecom company", body: "Smooth booking and a very professional event team." },
      { title: "Shahana Parvin", subtitle: "Event planner", body: "Clean halls, good sound and helpful staff on the day." },
      { title: "Mizanur Rahman", subtitle: "Expo organizer", body: "The expo zone easily handled our 200 stalls." },
      { title: "Tahmina Haque", subtitle: "Reception host", body: "Food and decoration were excellent. Guests loved it." },
    ]),
  ];
};

/** Deterministic pseudo-random so the charts look the same on every reset. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export const analyticsSeed = (): AnalyticsEvent[] => {
  const r = rng(42);
  const out: AnalyticsEvent[] = [];
  const pickSource = (): TrafficSource => {
    const x = r();
    return x < 0.42 ? "Google" : x < 0.7 ? "Facebook" : x < 0.86 ? "Direct" : x < 0.95 ? "WhatsApp" : "Other";
  };
  let n = 0;
  for (let d = 89; d >= 0; d--) {
    const visits = 5 + Math.floor(r() * 7);
    for (let v = 0; v < visits; v++) {
      const source = pickSource();
      const at = subHours(subDays(new Date(), d), Math.floor(r() * 12)).toISOString();
      const dx = r();
      const device: Device = dx < 0.68 ? "Mobile" : dx < 0.93 ? "Desktop" : "Tablet";
      const PAGES = ["/", "/", "/venues", "/booking", "/gallery", "/menu", "/contact", "/faq"];
      const VENUES = ["/venues/gulnaksha", "/venues/noboratri", "/venues/pushpoguchcho", "/venues/rajdarshan", "/venues/pushpanjali"];
      const pageFor = (type: AnalyticsType) => (type === "venue_view" ? VENUES[Math.floor(r() * VENUES.length)] : type === "visit" ? PAGES[Math.floor(r() * PAGES.length)] : "/booking");
      const push = (type: AnalyticsType) => out.push({ id: `an-${n++}`, type, source, device, page: pageFor(type), createdAt: at, isSample: true });
      push("visit");
      if (r() < 0.45) {
        push("venue_view");
        if (r() < 0.35) {
          push("form_open");
          if (r() < 0.45) push("form_submit");
        }
      }
    }
  }
  return out;
};
