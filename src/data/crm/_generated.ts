/**
 * Deterministic demo data: clients, bookings, payments, documents, tasks.
 * All names, phones and companies are fake. Every record is `isSample: true`.
 */
import { addDays, format, subDays } from "date-fns";
import type {
  ActivityItem,
  Booking,
  BookingStatus,
  Client,
  ClientType,
  Invoice,
  Notification,
  Payment,
  PortalAccess,
  Rating,
  Source,
  Task,
  VendorReview,
} from "@/types/crm";
import { buildEstimate, daysBetween, findHall, firstEventDate, lastEventDate, parseYmd, ratesAsOf, ratesFromSeed, tariffFor } from "@/lib/crm/pricing";
import { defaultDocuments, evaluationScore, EVALUATION_CRITERIA, PPM_AGENDA, refundDueDate, balanceDueDate } from "@/lib/crm/rules";
import { detectLeakage, mergeFindings } from "@/lib/crm/leakage";
import { base, int, pick, rng } from "./_helpers";
import { SALES_EXECUTIVES } from "./users";
import { menuPackagesSeed } from "./menu-packages";
import { VENDOR_BY_FIRM } from "./vendors";
import { OFFER_ENDED_ID, offerRecipientsSeed, offersSeed } from "./offers";

const r = rng(20261112);
const today = new Date();
today.setHours(0, 0, 0, 0);
const ymd = (d: Date) => format(d, "yyyy-MM-dd");
const iso = (d: Date, h = 11) => {
  const x = new Date(d);
  x.setHours(h, int(r, 0, 59), 0, 0);
  return x.toISOString();
};
const S = { isSample: true };

const FIRST = ["Arif", "Tahmina", "Shafiqul", "Nadia", "Kamrul", "Rumana", "Mehedi", "Sharmin", "Zahid", "Laboni", "Rashed", "Farzana", "Sabbir", "Moushumi", "Tariq", "Anika", "Habib", "Jannatul", "Rezaul", "Sumaiya", "Ashraf", "Nabila", "Mizanur", "Tanjila"];
const LAST = ["Rahman", "Hossain", "Chowdhury", "Ahmed", "Islam", "Karim", "Sarker", "Talukder", "Siddique", "Haque", "Mollah", "Uddin", "Bhuiyan", "Akter", "Kabir", "Mia"];
const COMPANIES = ["Meghna Textiles Ltd.", "Padma Agro Foods", "Jamuna Pharma Ltd.", "Karnaphuli Steel", "Surma Digital", "Rupsha Builders", "Teesta Garments", "Buriganga Logistics", "Shitalakshya Power", "Dhaka Tech Expo Ltd.", "Bengal Events & Expo", "Sundarban Ceramics", "Madhumati Bank PLC", "Kushiara Telecom", "Gorai Motors"];
const AREAS = ["Gulshan-2, Dhaka", "Banani, Dhaka", "Dhanmondi, Dhaka", "Uttara Sector 7, Dhaka", "Bashundhara R/A, Dhaka", "Mirpur DOHS, Dhaka", "Baridhara, Dhaka", "Motijheel, Dhaka", "Agrabad, Chattogram", "Mohammadpur, Dhaka"];

const mobile = () => `01${pick(r, ["3", "5", "6", "7", "8", "9"])}${String(int(r, 10000000, 99999999))}`;

interface Plan {
  type: ClientType;
  nature: string;
  title: (n: string, c: string) => string;
  halls: string[];
  guests: [number, number];
}
const PLANS: Plan[] = [
  { type: "personal", nature: "Wedding", title: (n) => `${n.split(" ")[0]}'s Wedding`, halls: ["hall-1", "hall-2", "hall-3", "hall-4", "hall-5"], guests: [350, 1300] },
  { type: "personal", nature: "Reception", title: (n) => `${n.split(" ")[1]} Family Reception`, halls: ["hall-1", "hall-2", "hall-4", "hall-5"], guests: [300, 1200] },
  { type: "personal", nature: "Holud", title: (n) => `Gaye Holud — ${n.split(" ")[0]}`, halls: ["hall-5", "hall-3"], guests: [200, 450] },
  { type: "corporate", nature: "Conference", title: (_n, c) => `${c.replace(/ Ltd\.| PLC/g, "")} Annual Conference`, halls: ["hall-1", "hall-3", "hall-2"], guests: [400, 1200] },
  { type: "corporate", nature: "Award Ceremony", title: (_n, c) => `${c.replace(/ Ltd\.| PLC/g, "")} Excellence Awards`, halls: ["hall-4", "hall-2"], guests: [500, 1100] },
  { type: "corporate", nature: "Product Launch", title: (_n, c) => `${c.replace(/ Ltd\.| PLC/g, "")} Product Launch`, halls: ["hall-5", "hall-3"], guests: [150, 450] },
  { type: "cultural", nature: "Concert", title: () => pick(r, ["Winter Sufi Night", "Rabindra Sandhya", "Dhaka Rock Fest", "Folk Fusion Live"]), halls: ["hall-4", "hall-2"], guests: [1200, 3000] },
  { type: "exhibition", nature: "Trade Fair", title: () => pick(r, ["Dhaka Lighting Expo", "Build Bangladesh Expo", "Agro Machinery Fair", "Medical Devices Expo", "Textile Machinery Show"]), halls: ["expo-a", "expo-b", "hall-1"], guests: [2000, 6000] },
  { type: "others", nature: "Convocation", title: () => pick(r, ["North Dhaka University Convocation", "Bashundhara Institute Convocation"]), halls: ["hall-4"], guests: [1500, 3200] },
];

const SOURCES: Source[] = ["website", "website", "walk_in", "phone", "whatsapp", "chatbot", "referral", "radar"];

const counters: Record<string, number> = {};
const seq = (type: string, d: Date, digits: number, prefix: string) => {
  const ym = format(d, "yyyyMM");
  const k = `${type}:${ym}`;
  counters[k] = (counters[k] ?? 0) + 1;
  return `${prefix}${ym}${String(counters[k]).padStart(digits, "0")}`;
};
let programReg = 1067300;

export const clientsSeed: Client[] = [];
export const bookingsSeed: Booking[] = [];
export const paymentsSeed: Payment[] = [];
export const invoicesSeed: Invoice[] = [];
export const tasksSeed: Task[] = [];
export const notificationsSeed: Notification[] = [];

const rates = ratesAsOf(ratesFromSeed());
const userName: Record<string, string> = {
  "u-se1": "Nusrat Jahan",
  "u-se2": "Rakib Ahmed",
  "u-se3": "Sadia Islam",
  "u-sm": "Tanvir Hasan",
  "u-ops": "Mahmudul Karim",
  "u-acc": "Shirin Akter",
};

const TOTAL = 36;
for (let i = 0; i < TOTAL; i++) {
  // Spread events from ~180 days ago to ~180 days ahead.
  const offset = Math.round(-178 + (i * 356) / (TOTAL - 1)) + int(r, -3, 3);
  const eventDate = addDays(today, offset);
  const plan = pick(r, PLANS);
  const name = `${pick(r, FIRST)} ${pick(r, LAST)}`;
  const company = pick(r, COMPANIES);
  const isOrg = plan.type !== "personal";
  const leadTime = int(r, 25, 110);
  const bookingDay = subDays(eventDate, Math.min(leadTime, offset > 0 ? offset + leadTime : leadTime));
  const bookingDate = bookingDay > today ? subDays(today, int(r, 1, 6)) : bookingDay;

  // Status by timeline.
  let status: BookingStatus;
  let closed: Booking["closed"] = null;
  if (offset < -12) status = "completed";
  else if (offset < 0) status = r() < 0.5 ? "completed" : "confirmed";
  else if (offset < 20) status = r() < 0.8 ? "confirmed" : "requested";
  else status = r() < 0.55 ? "confirmed" : "requested";
  if (i % 9 === 4) {
    closed = offset < 0
      ? { kind: "cancelled", reason: "Family emergency — event called off", at: iso(subDays(eventDate, 40)), charge: 0 }
      : { kind: "lost", reason: pick(r, ["Chose another venue", "Budget too high", "Date not available"]), at: iso(subDays(today, int(r, 2, 20))), charge: 0 };
    status = closed.kind === "cancelled" ? "confirmed" : "requested";
  }

  const hallId = pick(r, plan.halls);
  const isExpo = hallId.startsWith("expo");
  const guestsOpt = Math.round(int(r, plan.guests[0], plan.guests[1]) / 5) * 5;
  const multiDay = isExpo || plan.type === "exhibition";
  const dateStr = ymd(eventDate);

  const days: Booking["days"] = [];
  if (multiDay) {
    days.push({ id: "prep", dayType: "preparation", hallId, date: ymd(subDays(eventDate, 1)), start: "08:00", end: "20:00", sqft: isExpo ? (hallId === "expo-a" ? 55000 : 90000) : undefined });
    for (let k = 0; k < 3; k++) days.push({ id: `d${k + 1}`, dayType: "program", hallId, date: ymd(addDays(eventDate, k)), start: "10:00", end: "20:00", sqft: isExpo ? (hallId === "expo-a" ? 55000 : 90000) : undefined, parkingSqft: isExpo ? 20000 : undefined });
  } else {
    const evening = plan.type === "personal" || plan.type === "cultural";
    days.push({ id: "d1", dayType: "program", hallId, date: dateStr, start: evening ? "12:00" : "08:00", end: evening ? (r() < 0.2 ? "02:00" : "23:30") : "20:00" });
  }

  const food = plan.type === "personal"
    ? { breakfast: false, lunch: r() < 0.3, snacks: false, dinner: true }
    : plan.type === "corporate"
      ? { breakfast: r() < 0.4, lunch: true, snacks: true, dinner: false }
      : { breakfast: false, lunch: false, snacks: false, dinner: false };

  const pkg = plan.type === "personal" ? pick(r, menuPackagesSeed.slice(0, 4)) : plan.type === "corporate" ? menuPackagesSeed[4] : null;
  const menus: Booking["menus"] = pkg ? [{ id: "m1", packageId: pkg.id, name: pkg.name, guests: guestsOpt, perHead: pkg.perHead }] : [];

  const decoProvider: Booking["decoration"]["provider"] = plan.type === "personal" ? (r() < 0.35 ? "outside" : "iccb") : plan.type === "cultural" ? "outside" : "none";
  const decoration: Booking["decoration"] = decoProvider === "outside" ? { provider: "outside", firm: pick(r, ["Shubho Decor", "Rongdhonu Events", "Golden Touch Decor"]), category: pick(r, ["A", "B", "C"] as const) } : { provider: decoProvider };

  const addons: Booking["addons"] = [];
  if (decoProvider === "iccb") addons.push({ id: "a1", kind: "iccb", catalogId: "isvc-deco-standard", name: "ICCB Events decoration — Standard", unit: "event", qty: 1, rate: 180000 });
  if (plan.type === "corporate" || plan.type === "cultural") addons.push({ id: "a2", kind: "iccb", catalogId: "isvc-sound", name: "Sound system (line array)", unit: "day", qty: days.filter((d) => d.dayType === "program").length, rate: 45000 });
  if (plan.type !== "personal" && !isExpo) addons.push({ id: "a3", kind: "service", catalogId: "sc-hall-setup", name: "Hall set-up (exhibition/corporate/cultural)", unit: "event", qty: 1, rate: hallId === "hall-5" ? 6000 : 12000 });
  if (r() < 0.4) addons.push({ id: "a4", kind: "service", catalogId: "sc-chair-cover", name: "Chair cover", unit: "cover", qty: Math.min(guestsOpt, 800), rate: 40 });

  const wantsDiscount = i % 7 === 2;
  const discount: Booking["discount"] = wantsDiscount
    ? { mode: "amount", value: pick(r, [20000, 30000, 50000, 75000]), reason: "Repeat client goodwill", approval: status === "requested" && !closed ? "pending" : "approved", requestedBy: "u-se1", decidedBy: status === "requested" ? undefined : "u-sm" }
    : { mode: "amount", value: 0, approval: "none" };

  const assignedTo = status === "requested" && i % 5 === 0 ? undefined : SALES_EXECUTIVES[i % SALES_EXECUTIVES.length];
  const source = pick(r, SOURCES);

  const clientId = `cl-${i + 1}`;
  const client: Client = {
    ...base(clientId, { ...S, createdAt: iso(bookingDate, 9) }),
    clientNo: seq("client", bookingDate, 4, "C"),
    name,
    organization: isOrg ? company : undefined,
    type: plan.type,
    mobile: mobile(),
    email: `${name.split(" ")[0].toLowerCase()}.${i + 1}@example.com`,
    address: pick(r, AREAS),
    tags: [isOrg ? "corporate" : "family", ...(i % 6 === 0 ? ["VIP"] : []), ...(i % 8 === 3 ? ["repeat"] : [])],
  };
  clientsSeed.push(client);

  const estimateInput = { days, guests: { optimum: guestsOpt, maximum: Math.round(guestsOpt * 1.1) }, food, menus, addons, decoration, discount, clientType: plan.type, applyAit: false };
  const est = buildEstimate(estimateInput, rates);
  const repName = assignedTo ? userName[assignedTo] : "Unassigned";
  const createdAt = iso(bookingDate, 10);

  const activity: ActivityItem[] = [{ id: "act-1", at: createdAt, by: "System", type: "system", text: `Booking request received via ${source.replace("_", "-")}` }];
  const checklist: Booking["checklist"] = {
    form_received: { done: true, at: createdAt, by: "System" },
    estimate: { done: true, at: createdAt, by: "System" },
  };
  const responded = !!assignedTo && (status !== "requested" || r() < 0.6);
  const firstResponseAt = responded ? new Date(new Date(createdAt).getTime() + int(r, 20, 220) * 60000).toISOString() : undefined;
  if (assignedTo) activity.push({ id: "act-2", at: createdAt, by: "System", type: "system", text: `Assigned to ${repName} (round-robin)` });
  if (firstResponseAt) activity.push({ id: "act-3", at: firstResponseAt, by: repName, type: "call", text: "Called client — interested, meeting proposed" });
  const meetingAt = responded && (status !== "requested" || r() < 0.5) ? iso(addDays(bookingDate, int(r, 1, 4)), 15) : undefined;
  if (meetingAt) activity.push({ id: "act-4", at: meetingAt, by: repName, type: "change", text: "Site visit / meeting scheduled at ICCB" });

  const bookingId = `bk-${i + 1}`;
  const evDate = days.find((d) => d.dayType === "program")!.date;
  const documents = defaultDocuments(plan.type, plan.nature, evDate, food.lunch || food.dinner || food.breakfast || food.snacks);
  const confirmedLike = status !== "requested";

  if (confirmedLike) {
    for (const k of ["id_verified", "finalized", "booking_form", "approved"]) checklist[k] = { done: true, at: meetingAt ?? createdAt, by: k === "approved" ? "Tanvir Hasan" : repName };
    activity.push({ id: "act-5", at: meetingAt ?? createdAt, by: "Tanvir Hasan", type: "status", text: "Status changed: Requested → Confirmed" });
    // Documents progress toward the event.
    for (const d of documents) {
      if (d.state === "na") continue;
      if (status === "completed" || offset < 6 || d.key === "nid" || d.key === "trade_license" || r() < 0.4) d.state = "yes";
    }
  }

  // Payments.
  const payDay = (d: Date) => (d > today ? today : d);
  const addPayment = (amount: number, purpose: Payment["purpose"], when: Date, method: Payment["method"]) => {
    const date = payDay(when);
    const p: Payment = {
      ...base(`pay-${bookingId}-${paymentsSeed.length}`, { ...S, createdAt: iso(date, 13) }),
      mrNo: seq("mr", date, 7, "MR"),
      bookingId,
      clientId,
      amount,
      method,
      chequeNo: method === "cash" ? undefined : String(int(r, 100000, 999999)),
      bank: method === "cash" ? undefined : pick(r, ["Dutch-Bangla Bank", "BRAC Bank", "City Bank", "Eastern Bank"]),
      date: ymd(date),
      receivedBy: "Shirin Akter",
      purpose,
    };
    paymentsSeed.push(p);
    activity.push({ id: `act-p${paymentsSeed.length}`, at: p.createdAt, by: "Shirin Akter", type: "payment", text: `Money receipt ${p.mrNo} — ৳${amount.toLocaleString("en-US")} (${purpose})` });
    return p;
  };

  if (confirmedLike && !(closed?.kind === "lost")) {
    const advance = Math.round(est.venueRent * 0.6);
    addPayment(advance, "advance", addDays(new Date(meetingAt ?? createdAt), 1), pick(r, ["cheque", "pay_order", "cash"]));
    checklist.advance = { done: true, at: createdAt, by: "Shirin Akter" };
    const daysToEvent = offset;
    if (status === "completed" || daysToEvent < 15) {
      addPayment(est.grandTotal - est.security - advance, "balance", subDays(eventDate, int(r, 15, 20)), "pay_order");
      addPayment(est.security, "security", subDays(eventDate, 15), "cheque");
      checklist.balance_paid = { done: true, at: createdAt, by: "Shirin Akter" };
    } else if (r() < 0.3) {
      addPayment(Math.round((est.grandTotal - est.security - advance) * 0.5), "balance", subDays(today, int(r, 1, 10)), "cheque");
    }
  }

  // Ops artefacts.
  let ppm: Booking["ppm"];
  let factSheet: Booking["factSheet"];
  let evaluation: Booking["evaluation"];
  let damage: Booking["damage"];
  let refund: Booking["refund"];
  let completedAt: string | undefined;

  if (confirmedLike && (status === "completed" || offset < 25) && !closed) {
    ppm = {
      date: ymd(subDays(eventDate, int(r, 15, 22))),
      time: "15:00",
      venue: "ICCB Sales Office",
      attendees: `${name} (client), ${repName}, Mahmudul Karim (Operations)`,
      agenda: Object.fromEntries(PPM_AGENDA.map((_, k) => [k + 1, k === 0 ? `${guestsOpt} guests` : k === 14 ? "ICCB Catering" : k === 8 ? "AC from 11:00 am" : ""])),
      notes: "All arrangements agreed. Client to share final guest list 3 days before.",
      done: true,
    };
    checklist.ppm = { done: true, at: iso(subDays(eventDate, 16)), by: repName };
  }

  if (status === "completed") {
    const actual = Math.round(guestsOpt * (r() < 0.25 ? 1.15 : 0.97));
    factSheet = {
      hallOpenedBy: "Mahmudul Karim", preparationHours: 6, businessHours: 12, actualGuests: actual, extraHours: r() < 0.3 ? 1 : 0,
      acLog: [{ id: "ac1", start: "11:00", end: "23:00" }], generatorLog: [{ id: "g1", date: dateStr, hours: 0, minutes: i % 4 === 1 ? 40 : 0 }],
      foodProvider: "ICCB Catering", kitchenUsedTime: "10:00–22:00", driverPackets: int(r, 20, 80), foodStallQty: 0,
      serviceBoys: Math.round(guestsOpt / 12), atATimeSetup: Math.round(guestsOpt / 2), tablePerSetup: 10, headTable: 1, waiting: 150,
      hygiene: 4, serviceDress: 5, mannerism: 4, cleaningLog: [{ id: "c1", time: "16:00", rating: 4 }, { id: "c2", time: "20:00", rating: 5 }],
      summary: "Event ran smoothly. Minor delay in second batch serving.", hallClosedBy: "Mahmudul Karim", done: true,
    };
    const ratings = Object.fromEntries(EVALUATION_CRITERIA.map((_, k) => [k + 1, (k % 5 === 4 ? 1 : int(r, 2, 3)) as Rating]));
    evaluation = { ratings, suggestion: pick(r, ["Parking exit could be faster.", "Excellent food, very happy.", "Washrooms need more attention during peak time.", ""]), score: evaluationScore(ratings), submittedAt: iso(addDays(eventDate, 1)), submittedVia: r() < 0.5 ? "public" : "staff" };
    const hasDamage = r() < 0.35;
    damage = {
      rows: hasDamage ? [{ id: "dm1", department: "Maintenance / Civil", item: "Wall paint scratch near stage", time: "22:30", uom: "sq ft", qty: 20, rate: 250 }, { id: "dm2", department: "Cleaning & Care", item: "Carpet stain cleaning", time: "23:00", uom: "piece", qty: 2, rate: 1500 }] : [],
      certifiedBy: "Mahmudul Karim", noDamage: !hasDamage, done: true,
    };
    const dmg = damage.rows.reduce((s, x) => s + x.qty * x.rate, 0);
    const refundDue = refundDueDate(dateStr);
    const refunded = refundDue < ymd(today) || r() < 0.5;
    refund = { amount: est.security - dmg, dueDate: refundDue, refundedAt: refunded ? iso(subDays(new Date(refundDue), int(r, 0, 5))) : undefined, chequeNo: refunded ? String(int(r, 100000, 999999)) : undefined };
    for (const k of ["fact_sheet", "evaluation", "damage", "final_invoice"]) checklist[k] = { done: true, at: iso(addDays(eventDate, 1)), by: "Mahmudul Karim" };
    if (refunded) {
      checklist.refund = { done: true, at: refund.refundedAt, by: "Shirin Akter" };
      completedAt = refund.refundedAt;
      activity.push({ id: "act-9", at: completedAt!, by: "Shirin Akter", type: "status", text: "Status changed: Confirmed → Completed" });
    } else {
      status = "confirmed"; // awaiting refund before completion
    }
  }

  if (closed?.kind === "cancelled") {
    closed.charge = Math.round(est.venueRent * 0.25);
    activity.push({ id: "act-x", at: closed.at, by: "Tanvir Hasan", type: "status", text: `Booking cancelled — charge ৳${closed.charge.toLocaleString("en-US")}` });
  }
  if (closed?.kind === "lost") activity.push({ id: "act-x", at: closed.at, by: repName, type: "status", text: `Marked lost — ${closed.reason}` });

  const booking: Booking = {
    ...base(bookingId, { ...S, createdAt }),
    bfNo: seq("booking", bookingDate, 6, "ICCB"),
    refNo: `REF-${String(1000 + i)}`,
    programRegNo: confirmedLike ? String(++programReg) : "",
    bookingDate: ymd(bookingDate),
    priceVersion: ymd(bookingDate),
    clientId,
    clientType: plan.type,
    eventTitle: plan.title(name, company),
    eventNature: plan.nature,
    contact: { name, organization: client.organization, address: client.address, mobile: client.mobile, email: client.email },
    emergency: { name: `${pick(r, FIRST)} ${name.split(" ")[1]}`, mobile: mobile() },
    refundAccountName: name,
    days,
    guests: estimateInput.guests,
    cars: { optimum: Math.round(guestsOpt / 4), maximum: Math.round(guestsOpt / 3) },
    layout: plan.type === "corporate" || plan.type === "cultural" || plan.type === "others" ? "theatre" : isExpo || plan.type === "exhibition" ? "exhibition" : "banquet_stage",
    food,
    menus,
    addons,
    decoration,
    discount,
    applyAit: false,
    status,
    closed,
    checklist,
    documents,
    ppm,
    factSheet,
    evaluation,
    damage,
    refund,
    shiftRequest: null,
    acknowledgement: confirmedLike ? { accepted: true, at: meetingAt } : undefined,
    idVerified: confirmedLike ? { mode: "seen", at: meetingAt ?? createdAt, by: repName } : undefined,
    assignedTo,
    referredBy: source === "referral" ? { name: `${pick(r, FIRST)} ${pick(r, LAST)}`, designation: "Former client" } : undefined,
    salesOfficer: assignedTo ? { name: repName, designation: "Customer Representative" } : undefined,
    source,
    tags: client.tags,
    notes: i % 4 === 0 ? "Client prefers WhatsApp communication." : undefined,
    meetingAt,
    firstResponseAt,
    approvedBy: confirmedLike ? "Tanvir Hasan" : undefined,
    approvedAt: confirmedLike ? meetingAt ?? createdAt : undefined,
    completedAt,
    activity: activity.sort((a, b) => a.at.localeCompare(b.at)),
  };
  bookingsSeed.push(booking);

  // Generated documents (version history).
  const received = paymentsSeed.filter((p) => p.bookingId === bookingId).reduce((s, p) => s + p.amount, 0);
  invoicesSeed.push({ ...base(`doc-est-${i + 1}`, { ...S, createdAt }), number: seq("estimate", bookingDate, 5, "EST"), kind: "estimate", bookingId, clientName: name, version: 1, total: est.grandTotal, received: 0, balance: est.grandTotal, createdBy: "System" });
  if (confirmedLike) invoicesSeed.push({ ...base(`doc-bf-${i + 1}`, { ...S, createdAt: meetingAt ?? createdAt }), number: booking.bfNo, kind: "booking_form", bookingId, clientName: name, version: 1, total: est.grandTotal, received, balance: est.grandTotal - received, createdBy: repName });
  for (const p of paymentsSeed.filter((x) => x.bookingId === bookingId)) {
    invoicesSeed.push({ ...base(`doc-mr-${p.id}`, { ...S, createdAt: p.createdAt }), number: p.mrNo, kind: "money_receipt", bookingId, clientName: name, version: 1, total: p.amount, received: p.amount, balance: 0, paymentId: p.id, createdBy: p.receivedBy });
  }
  if (factSheet) invoicesSeed.push({ ...base(`doc-inv-${i + 1}`, { ...S, createdAt: iso(addDays(eventDate, 1)) }), number: seq("invoice", addDays(eventDate, 1) > today ? today : addDays(eventDate, 1), 5, "INV"), kind: "invoice", bookingId, clientName: name, version: 1, total: est.grandTotal, received, balance: est.grandTotal - received, createdBy: "Shirin Akter" });

  // Tasks.
  const task = (id: string, t: Omit<Task, keyof ReturnType<typeof base> | "status"> & { status?: Task["status"] }) =>
    tasksSeed.push({ ...base(`task-${bookingId}-${id}`, { ...S, createdAt }), status: "open", ...t });
  if (!closed && status === "requested" && !firstResponseAt) task("call", { title: `Call ${name} — new booking request`, type: "call", dueAt: iso(addDays(today, 0), 12), assignedTo, bookingId, auto: true });
  if (!closed && status === "requested" && firstResponseAt && !meetingAt) task("meet", { title: `Schedule site visit with ${name}`, type: "meeting", dueAt: iso(addDays(today, int(r, -2, 3)), 15), assignedTo, bookingId, auto: true });
  if (!closed && status === "confirmed" && offset > 0) {
    const due = balanceDueDate(evDate, 15);
    if (!checklist.balance_paid) {
      for (const d of [30, 20, 16]) {
        const at = subDays(eventDate, d);
        task(`bal${d}`, { title: `Balance reminder (${d} days) — ${booking.eventTitle}`, type: "balance_due", dueAt: iso(at, 10), assignedTo, bookingId, auto: true, status: at < today ? "done" : "open", notes: `Full payment due ${due}` });
      }
    }
    if (!ppm) task("ppm", { title: `PPM due — ${booking.eventTitle}`, type: "ppm_due", dueAt: iso(subDays(eventDate, 15), 11), assignedTo, bookingId, auto: true });
  }
  if (refund && !refund.refundedAt) task("refund", { title: `Security refund due — ${name}`, type: "refund_due", dueAt: iso(new Date(refund.dueDate), 11), assignedTo: "u-acc", bookingId, auto: true });
  if (status === "completed" && (plan.type === "corporate" || plan.type === "exhibition" || plan.type === "others")) {
    task("repeat", { title: `Repeat event: ${booking.eventTitle} — reach out for next edition`, type: "repeat_event", dueAt: iso(addDays(eventDate, 300), 10), assignedTo, bookingId, clientId, auto: true });
  }

  // Notifications for a few recent things.
  if (offset > 0 && status === "requested" && !closed && i % 2 === 0) {
    notificationsSeed.push({ ...base(`ntf-${bookingId}`, { ...S, createdAt }), title: "New booking request", body: `${name} requested ${booking.eventTitle} on ${evDate}`, kind: "booking", href: `/dashboard/sales/bookings/${bookingId}`, read: false, userId: null });
  }
  if (discount.approval === "pending") {
    notificationsSeed.push({ ...base(`ntf-disc-${bookingId}`, { ...S, createdAt }), title: "Discount approval needed", body: `৳${discount.value.toLocaleString("en-US")} discount requested on ${booking.bfNo}`, kind: "approval", href: `/dashboard/sales/bookings/${bookingId}`, read: false, roles: ["sales_manager", "admin"] });
  }
}

export const seedCounters = { ...counters, programReg };

/* ═══ Business-feature seeds ═══════════════════════════════════════════════
   Leakage, readiness, client portal, idle-date offers, vendors, collections.
   Runs after the main loop so the base data above stays deterministic.        */

const todayStr = ymd(today);
const nowIso = new Date().toISOString();
const usedIds = new Set<string>();
const live = () => bookingsSeed.filter((b) => !b.closed);
const offsetOf = (b: Booking) => daysBetween(todayStr, firstEventDate(b));
const take = (target: number, pred: (b: Booking) => boolean) => {
  const c = live()
    .filter((b) => !usedIds.has(b.id) && pred(b))
    .sort((a, b) => Math.abs(offsetOf(a) - target) - Math.abs(offsetOf(b) - target))[0];
  if (c) usedIds.add(c.id);
  return c;
};
const moveTo = (b: Booking, toOffset: number) => {
  const delta = toOffset - offsetOf(b);
  if (!delta) return;
  const mv = (d: string) => ymd(addDays(parseYmd(d), delta));
  b.days = b.days.map((d) => ({ ...d, date: mv(d.date) }));
  b.documents = b.documents.map((d) => (d.dueDate ? { ...d, dueDate: mv(d.dueDate) } : d));
  if (b.ppm) b.ppm = { ...b.ppm, date: mv(b.ppm.date) };
  if (b.refund) b.refund = { ...b.refund, dueDate: refundDueDate(lastEventDate(b)) };
};
const dropPayments = (b: Booking, purposes: Payment["purpose"][]) => {
  for (let k = paymentsSeed.length - 1; k >= 0; k--) {
    const p = paymentsSeed[k];
    if (p.bookingId !== b.id || !purposes.includes(p.purpose)) continue;
    paymentsSeed.splice(k, 1);
    const di = invoicesSeed.findIndex((d) => d.paymentId === p.id);
    if (di >= 0) invoicesSeed.splice(di, 1);
    b.activity = b.activity.filter((a) => !a.text.includes(p.mrNo));
  }
  delete b.checklist.balance_paid;
};
const reopenRefund = (b: Booking) => {
  b.status = "confirmed";
  b.completedAt = undefined;
  delete b.checklist.refund;
  b.activity = b.activity.filter((a) => !a.text.includes("Confirmed → Completed"));
  if (b.refund) b.refund = { amount: b.refund.amount, dueDate: b.refund.dueDate, status: "pending" };
};

/* Collections: an overdue balance in every aging bucket (1–7, 8–15, 16–30, 30+). */
for (const [target, future] of [[11, true], [4, true], [-8, false], [-40, false]] as const) {
  const b = take(target, (x) => x.status !== "requested" && (future ? offsetOf(x) > 0 && x.status === "confirmed" : offsetOf(x) < 0));
  if (!b) continue;
  moveTo(b, target);
  dropPayments(b, ["balance", "security"]);
  if (!future && b.status === "completed") reopenRefund(b);
  if (!future) {
    b.refund = undefined;
    b.promiseDate = target === -8 ? ymd(addDays(today, 3)) : undefined;
  }
}

/* Readiness: one event that is fully ready, one that needs attention. */
{
  const ready = take(18, (x) => x.status === "confirmed" && offsetOf(x) > 12);
  if (ready) {
    ready.documents = ready.documents.map((d) => (d.state === "na" ? d : { ...d, state: "yes" }));
    ready.ppm = { ...(ready.ppm ?? { date: ymd(subDays(today, 2)), time: "15:00", venue: "ICCB Sales Office", attendees: `${ready.contact.name} (client)`, agenda: {}, notes: "" }), done: true, agenda: { ...(ready.ppm?.agenda ?? {}), 5: "Alo Sound & Light — line array" }, extras: { chairCovers: 0, chairs: 0, externalLighting: false, archways: 1, foodStalls: 0, soundProvider: "Alo Sound & Light" } };
    ready.decoration = { provider: "iccb" };
  }
  const attention = take(28, (x) => x.status === "confirmed" && offsetOf(x) > 20);
  if (attention) {
    attention.ppm = undefined;
    attention.documents = attention.documents.map((d) => (d.key === "nid" ? { ...d, state: "yes" } : d.state === "na" ? d : { ...d, state: "pending" }));
  }
}

/* Leakage: completed events with unbilled items (one per main rule) + resolved history. */
{
  const past = (x: Booking) => x.status === "completed" && !!x.factSheet && offsetOf(x) < -12;
  const l1 = take(-20, past);
  if (l1?.factSheet) l1.factSheet = { ...l1.factSheet, extraHours: 3 };
  const l2 = take(-30, past);
  if (l2?.factSheet) l2.factSheet = { ...l2.factSheet, actualGuests: Math.round(l2.guests.optimum * 1.25) };
  const l3 = take(-45, past);
  if (l3?.ppm) l3.ppm = { ...l3.ppm, extras: { chairCovers: 400, chairs: 0, externalLighting: true, archways: 3, foodStalls: 0 } };
  const l4 = take(-60, past);
  if (l4?.factSheet) l4.factSheet = { ...l4.factSheet, generatorLog: [{ id: "g1", date: firstEventDate(l4), hours: 2, minutes: 10 }], foodStallQty: 2 };

  // Recovered: extra hours found by the guard and added to the bill this month.
  const l5 = take(-15, past);
  if (l5?.factSheet) {
    const hall = findHall(rates, l5.days[0].hallId);
    const rate = (hall && tariffFor(rates, hall.tariffGroup, l5.days[0].date)?.extraHour) || 15000;
    l5.factSheet = { ...l5.factSheet, extraHours: 2 };
    l5.addons = [...l5.addons, { id: "lk1", kind: "extra", name: "Extra business hour (event day)", unit: "hour", qty: 2, rate, reason: "leakage:EXTRA_HOURS" }];
    const at = iso(subDays(today, 3), 12);
    l5.leakage = [{ id: `${l5.id}:EXTRA_HOURS`, bookingId: l5.id, ruleId: "EXTRA_HOURS", title: "Extra business hours", detail: "Fact sheet: 2 extra hours, 2 not billed", source: "FactSheet", sourceRef: "factSheet.extraHours", expectedAmount: 2 * rate, line: { name: "Extra business hour (event day)", unit: "hour", qty: 2, rate }, status: "added", resolvedBy: "Nusrat Jahan", resolvedAt: at, detectedAt: at }];
  }
  // Waived: extra guests waived as goodwill by the Sales Manager.
  const l6 = take(-25, past);
  if (l6?.factSheet) {
    const actual = Math.round(l6.guests.optimum * 1.2);
    l6.factSheet = { ...l6.factSheet, actualGuests: actual };
    const at = iso(subDays(today, 5), 16);
    l6.leakage = [{ id: `${l6.id}:EXTRA_GUESTS`, bookingId: l6.id, ruleId: "EXTRA_GUESTS", title: "Extra guests (>10%)", detail: `Fact sheet: ${actual} actual vs ${l6.guests.optimum} booked`, source: "FactSheet", sourceRef: "factSheet.actualGuests", expectedAmount: (actual - l6.guests.optimum) * 130, status: "waived", waivedReason: "Repeat VIP client — goodwill", resolvedBy: "Tanvir Hasan", resolvedAt: at, detectedAt: at }];
  }
  // A confirmed event with an outside decorator but no category (fee missing).
  const l7 = take(30, (x) => x.status === "confirmed" && offsetOf(x) > 5 && x.decoration.provider !== "outside");
  if (l7) l7.decoration = { provider: "outside", firm: "Golden Touch Decor" };
}

/* Offers: one booking won by an ended idle-date offer. */
{
  const won = take(25, (x) => x.status === "confirmed" && offsetOf(x) > 15);
  if (won) {
    const offer = offersSeed.find((o) => o.id === OFFER_ENDED_ID)!;
    won.offerId = offer.id;
    won.offerCode = offer.code;
    won.addons = [...won.addons, { id: "offer", kind: "custom", name: `Offer ${offer.code} — ৳50,000 off`, unit: "event", qty: 1, rate: -50000, reason: `offer:${offer.code}` }];
    won.activity.push({ id: "act-offer", at: iso(subDays(today, 30), 12), by: "Nusrat Jahan", type: "change", text: `Offer code ${offer.code} applied` });
    const rc = offerRecipientsSeed.find((x) => x.bookingId === "__ENDED_BOOKING__");
    if (rc) {
      rc.bookingId = won.id;
      rc.contactName = won.contact.name;
      rc.mobile = won.contact.mobile;
    }
  }
}

/* Client portal: two confirmed bookings with live links and client uploads. */
export const portalSeed: PortalAccess[] = [];
{
  const p1 = take(40, (x) => x.status === "confirmed" && offsetOf(x) > 20);
  const p2 = take(55, (x) => x.status === "confirmed" && offsetOf(x) > 20);
  const at = (h: number) => iso(subDays(today, 1), h);
  [p1, p2].forEach((b, k) => {
    if (!b) return;
    const expires = addDays(parseYmd(lastEventDate(b)), 30);
    portalSeed.push({ ...base(`portal-${k + 1}`, { ...S, createdAt: iso(subDays(today, 6)) }), token: `ICCBdemoPortalLink00000${k + 1}`, bookingId: b.id, createdBy: b.salesOfficer?.name ?? "Nusrat Jahan", expiresAt: expires.toISOString(), revoked: false, lastOpenedAt: at(20) });
    b.documents = b.documents.map((d) => {
      if (k === 0 && d.key === "nid") return { ...d, state: "pending", fileName: "nid-front-back.jpg", uploadedVia: "portal", uploadedAt: at(19), review: "pending" };
      if (k === 1 && d.key === "trade_license") return { ...d, state: "yes", fileName: "trade-license-2026.pdf", uploadedVia: "portal", uploadedAt: at(18), review: "accepted" };
      if (k === 1 && d.key === "police" && d.state !== "na") return { ...d, state: "pending", fileName: "police-permission.pdf", uploadedVia: "portal", uploadedAt: at(21), review: "pending" };
      return d;
    });
    b.portalUnread = k === 0 ? 2 : 1;
    if (k === 0) b.portalAnswers = { guests: b.guests.optimum, management: "iccb", setup: "Round tables × 10 chairs", stageSize: "29' × 19'", sound: "ICCB sound system", sofaRows: 2, headTable: 1, banners: "1 hanging banner outside", servingTime: "8:30 pm", driverFood: "packet", vehicles: Math.round(b.guests.optimum / 4), special: "Wheelchair access for grandparents", submittedAt: at(20) };
    b.activity.push({ id: `act-portal-${k}`, at: at(19), by: b.contact.name, type: "document", text: "Uploaded a document through the client portal" });
  });
}

/* Refunds: at least 3 pending, one of them overdue. */
{
  const pending = () => bookingsSeed.filter((b) => b.refund && !b.refund.refundedAt && !b.closed);
  if (!pending().some((b) => b.refund!.dueDate < todayStr)) {
    const b = take(-50, (x) => x.status === "completed" && !!x.refund && offsetOf(x) < -35);
    if (b) reopenRefund(b);
  }
  for (const target of [-14, -20, -26]) {
    if (pending().length >= 3) break;
    const b = take(target, (x) => x.status === "completed" && !!x.refund?.refundedAt);
    if (b) reopenRefund(b);
  }
  const first = pending().sort((a, b) => a.refund!.dueDate.localeCompare(b.refund!.dueDate))[1];
  if (first?.refund) first.refund.status = "cheque_prepared";
}

/* Vendors: link outside decorators and record reviews after completed events. */
export const vendorReviewsSeed: VendorReview[] = [];
{
  const review = (vendorId: string, b: Booking, v: Omit<VendorReview, keyof ReturnType<typeof base> | "vendorId" | "bookingId" | "date" | "reviewedBy">) =>
    vendorReviewsSeed.push({ ...base(`vr-${vendorId}-${b.id}`, { ...S, createdAt: iso(addDays(parseYmd(lastEventDate(b)), 2)) }), vendorId, bookingId: b.id, date: ymd(addDays(parseYmd(lastEventDate(b)), 2)), reviewedBy: "Mahmudul Karim", ...v });
  const PROFILE: Record<string, Omit<VendorReview, keyof ReturnType<typeof base> | "vendorId" | "bookingId" | "date" | "reviewedBy" | "damageAmount">> = {
    "v-shubho": { setupOnTime: true, dismantledWithin24h: true, violations: [], rating: 5, notes: "Clean handover." },
    "v-rongdhonu": { setupOnTime: false, dismantledWithin24h: false, violations: ["g03"], rating: 3, notes: "Materials left in the loading area for two days." },
    "v-golden": { setupOnTime: true, dismantledWithin24h: true, violations: [], rating: 4, notes: "" },
  };
  for (const b of bookingsSeed) {
    if (b.decoration.provider !== "outside" || !b.decoration.firm) continue;
    const vid = VENDOR_BY_FIRM[b.decoration.firm];
    if (!vid) continue;
    b.decoration = { ...b.decoration, vendorId: vid };
    if (b.status === "completed" && PROFILE[vid]) {
      const damageAmount = (b.damage?.rows ?? []).reduce((s, x) => s + x.qty * x.rate, 0);
      review(vid, b, { ...PROFILE[vid], damageAmount });
    }
  }
  const completed = bookingsSeed.filter((b) => b.status === "completed").sort((a, b) => firstEventDate(a).localeCompare(firstEventDate(b)));
  const at = (k: number) => completed[k % Math.max(1, completed.length)];
  if (completed.length) {
    review("v-utshob", at(0), { setupOnTime: false, dismantledWithin24h: false, damageAmount: 45000, violations: ["g05", "g04"], rating: 1, notes: "Fireworks inside the hall; ceiling hooks damaged." });
    review("v-utshob", at(3), { setupOnTime: false, dismantledWithin24h: true, damageAmount: 22000, violations: ["g01", "g06"], rating: 2, notes: "Nails on stage wall; staff smoking backstage." });
    review("v-rongdhonu", at(1), { setupOnTime: true, dismantledWithin24h: false, damageAmount: 8000, violations: ["g09"], rating: 3, notes: "Tape marks on glass." });
    review("v-alo", at(2), { setupOnTime: true, dismantledWithin24h: true, damageAmount: 0, violations: [], rating: 5, notes: "Sound checks finished early." });
    review("v-nakshi", at(4), { setupOnTime: true, dismantledWithin24h: true, damageAmount: 5000, violations: [], rating: 4, notes: "Minor carpet stain." });
  }
}

/* Readiness log: events that were at risk at D-15 and still went ahead (ROI). */
{
  const recent = bookingsSeed.filter((b) => b.status === "completed" && offsetOf(b) < 0 && offsetOf(b) > -35 && !b.closed);
  recent.slice(0, 2).forEach((b) => (b.readiness = { milestones: ["D-15", "D-7", "D-3"], levelAtD15: "risk" }));
  recent.slice(2, 3).forEach((b) => (b.readiness = { milestones: ["D-15", "D-7", "D-3"], levelAtD15: "attention" }));
}

/* Store live leakage findings on every confirmed / completed booking. */
for (const b of bookingsSeed) {
  if (b.status === "requested" || b.closed) continue;
  b.leakage = mergeFindings(b.id, detectLeakage(b, rates, { discountApprovalThreshold: 25000 }), b.leakage, nowIso);
}
