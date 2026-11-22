/**
 * 50 sample leads for the Leads funnel. Final-stage split is chosen so the
 * funnel reads 50 → 38 → 22 → 15 → 10 (every lead counts in each stage it reached).
 * Dates are relative to "today", like the rest of the CRM seed.
 */
import { addDays, format, subDays, subHours } from "date-fns";
import type { Device, EventType, Lead, LeadActivity, LeadSource, LeadStage, LeadStepLog, LeadTrace, ManualChannel, User } from "@/types/crm";
import { LEAD_STAGES, LEAD_STAGE_LABELS } from "@/types/crm";

const iso = (daysAgo: number, hoursAgo = 0) => subHours(subDays(new Date(), daysAgo), hoursAgo).toISOString();
const day = (offset: number) => format(addDays(new Date(), offset), "yyyy-MM-dd");

/** Extra sales reps so leads can be shared out and compared. */
export const leadTeamSeed = (): User[] => [
  { isSample: true, id: "u-sales2", name: "Rafiq Hasan", email: "rafiq@iccb.example", phone: "01700-000005", role: "sales", active: true, createdAt: iso(200) },
  { isSample: true, id: "u-sales3", name: "Tania Akter", email: "tania@iccb.example", phone: "01700-000006", role: "sales", active: true, createdAt: iso(200) },
];

const OWNERS = ["u-sales", "u-sales2", "u-sales3"] as const;
const OWNER_NAMES: Record<string, string> = { "u-sales": "Nusrat Jahan", "u-sales2": "Rafiq Hasan", "u-sales3": "Tania Akter" };

type Row = [name: string, org: string | undefined, eventName: string, type: EventType, guests: number, hall: string, valueLakh: number];

// prettier-ignore
const ROWS: Row[] = [
  ["Shahriar Kabir", "BASIS", "SoftExpo 2027", "Exhibition", 3000, "noboratri", 18.5],
  ["Tanvir Ahmed", undefined, "Tanvir & Mim Wedding", "Wedding", 1200, "rajdarshan", 9.4],
  ["Abdur Rahim", "Rahim Group", "Rahim Group AGM", "Corporate", 400, "pushpanjali", 3.2],
  ["Dr. Nazma Begum", "Bangladesh Medical Association", "BMA Annual Scientific Conference", "Conference", 1500, "gulnaksha", 12.8],
  ["Mahmud Hasan", "Walton", "Walton Dealers Meet", "Corporate", 1800, "gulnaksha", 14.2],
  ["Farzana Yasmin", undefined, "Yasmin–Rahman Reception", "Reception", 900, "pushpoguchcho", 7.1],
  ["Kazi Saiful", "DCCI", "DCCI Business Summit", "Conference", 1100, "rajdarshan", 9.9],
  ["Rubina Akter", "BGMEA", "Apparel Sourcing Expo", "Exhibition", 2500, "noboratri", 21.0],
  ["Imtiaz Alam", "Grameenphone", "GP Annual Partner Night", "Corporate", 1400, "pushpoguchcho", 13.6],
  ["Sumaiya Islam", undefined, "Sumaiya's Holud", "Wedding", 700, "pushpanjali", 4.6],
  ["Arif Chowdhury", "BRAC Bank", "BRAC Bank Town Hall", "Corporate", 1000, "rajdarshan", 8.3],
  ["Nadia Sultana", "Dhaka University Alumni", "DUAA Reunion 2027", "Other", 2000, "noboratri", 11.4],
  ["Sabbir Hossain", undefined, "Hossain–Karim Wedding", "Wedding", 1500, "pushpoguchcho", 11.2],
  ["Moushumi Das", "Unilever BD", "Unilever Sales Conference", "Conference", 800, "pushpanjali", 6.7],
  ["Rezaul Karim", "Bashundhara Group", "Group Leadership Retreat", "Corporate", 600, "pushpanjali", 5.5],
  ["Tahmina Rahman", "Robi Axiata", "Robi Tech Fest", "Exhibition", 2200, "noboratri", 16.9],
  ["Jahid Hasan", undefined, "Jahid & Nabila Reception", "Reception", 1100, "rajdarshan", 8.8],
  ["Ashraful Islam", "Square Pharma", "Square Doctors' Meet", "Conference", 900, "rajdarshan", 7.9],
  ["Sharmin Nahar", "UNDP Bangladesh", "Climate Action Forum", "Conference", 700, "pushpanjali", 6.1],
  ["Mizanur Rahman", "Akij Group", "Akij Annual Dinner", "Corporate", 1600, "gulnaksha", 13.0],
  ["Laila Arjumand", undefined, "Arjumand Family Wedding", "Wedding", 1800, "gulnaksha", 14.7],
  ["Habibur Rahman", "REHAB", "REHAB Housing Fair", "Exhibition", 3000, "noboratri", 22.5],
  ["Sadia Afrin", "North South University", "NSU Convocation Dinner", "Other", 1300, "pushpoguchcho", 9.6],
  ["Faisal Ahmed", "bKash", "bKash Merchant Awards", "Corporate", 1200, "rajdarshan", 10.4],
  ["Rupa Chakraborty", undefined, "Rupa & Anik Wedding", "Wedding", 1000, "rajdarshan", 8.0],
  ["Nurul Amin", "PRAN-RFL", "PRAN-RFL Distributors Meet", "Corporate", 2000, "noboratri", 15.8],
  ["Afsana Mimi", "Bangla Music Forum", "Winter Live Concert", "Concert", 2500, "noboratri", 19.3],
  ["Kamrul Hasan", "ICT Division", "Digital Bangladesh Expo", "Exhibition", 2800, "noboratri", 20.6],
  ["Shirin Sultana", undefined, "Sultana Reception", "Reception", 600, "pushpanjali", 4.4],
  ["Golam Mostofa", "Beximco", "Beximco Investor Day", "Corporate", 500, "pushpanjali", 4.9],
  ["Rehana Parvin", "Bangladesh Bank", "Banking Conference 2027", "Conference", 1200, "rajdarshan", 10.1],
  ["Sohel Rana", undefined, "Rana–Akter Wedding", "Wedding", 1400, "pushpoguchcho", 10.6],
  ["Mahbuba Haque", "Aarong", "Aarong Eid Showcase", "Exhibition", 1500, "gulnaksha", 12.2],
  ["Ziaul Hoque", "Daraz", "Daraz Seller Summit", "Conference", 1000, "rajdarshan", 8.5],
  ["Nusrat Faria", undefined, "Faria & Rafi Holud", "Wedding", 800, "pushpanjali", 5.3],
  ["Shafiqul Alam", "Meghna Group", "Meghna Group Annual Gala", "Corporate", 1700, "gulnaksha", 13.9],
  ["Anika Tabassum", "AIUB", "AIUB Career Fair", "Exhibition", 2000, "noboratri", 12.7],
  ["Hasan Mahmud", "Bangladesh Cricket Board", "BCB Awards Night", "Other", 1200, "pushpoguchcho", 11.8],
  ["Rokeya Begum", undefined, "Begum Family Reception", "Reception", 1300, "pushpoguchcho", 9.2],
  ["Tariqul Islam", "Pathao", "Pathao Driver Meetup", "Corporate", 900, "rajdarshan", 6.4],
  ["Munira Khan", "Save the Children", "Child Rights Seminar", "Conference", 500, "pushpanjali", 4.2],
  ["Sajjad Hossain", undefined, "Sajjad & Lamia Wedding", "Wedding", 1600, "gulnaksha", 12.4],
  ["Shamima Nasrin", "LankaBangla", "LankaBangla Client Night", "Corporate", 800, "pushpanjali", 6.0],
  ["Ehsanul Haque", "Bangladesh Auto Expo", "Dhaka Motor Show", "Exhibition", 3000, "noboratri", 23.8],
  ["Priya Saha", undefined, "Saha Family Wedding", "Wedding", 1100, "rajdarshan", 8.6],
  ["Mostafizur Rahman", "City Bank", "City Bank Annual Conference", "Conference", 1000, "rajdarshan", 8.9],
  ["Jannatul Ferdous", "Shajgoj", "Beauty & Lifestyle Fair", "Exhibition", 1800, "gulnaksha", 11.0],
  ["Rakibul Hasan", "Banglalink", "Banglalink Brand Launch", "Corporate", 1300, "pushpoguchcho", 12.0],
  ["Farhana Hoque", undefined, "Hoque–Siddiqui Reception", "Reception", 1000, "rajdarshan", 7.6],
  ["Anwar Hossain", "FBCCI", "FBCCI Trade Dialogue", "Conference", 1400, "gulnaksha", 11.6],
];

// Final stage per lead: 12 discover, 16 interested, 7 appraisal, 5 confirmed, 10 customer.
const FINAL: LeadStage[] = [
  ...Array<LeadStage>(10).fill("customer"),
  ...Array<LeadStage>(5).fill("confirmed"),
  ...Array<LeadStage>(7).fill("appraisal"),
  ...Array<LeadStage>(16).fill("interested"),
  ...Array<LeadStage>(12).fill("discover"),
];
// Shuffle deterministically so stages mix with sources and owners.
const ORDER = [7, 22, 3, 41, 15, 0, 33, 28, 11, 46, 19, 36, 5, 26, 44, 13, 30, 9, 39, 2, 24, 48, 17, 35, 6, 42, 20, 31, 12, 47, 1, 27, 38, 16, 45, 8, 23, 34, 4, 49, 14, 29, 10, 40, 21, 37, 18, 32, 25, 43];

const AI_TRACES: LeadTrace[] = [
  { platform: "LinkedIn", query: "annual conference Dhaka 2027", url: "https://www.linkedin.com/posts/example-conference", signal: "Announced a 2027 conference with 1,000+ delegates, venue not yet named." },
  { platform: "Facebook event", query: "expo Dhaka upcoming", url: "https://www.facebook.com/events/example-expo", signal: "Public event page created, location “TBA, Dhaka”." },
  { platform: "News article", query: "trade fair Bangladesh next year", url: "https://www.thedailystar.net/business/example", signal: "News report says the organiser is looking for a larger venue." },
  { platform: "Tender portal", query: "event venue hire Dhaka", url: "https://www.eprocure.gov.bd/example", signal: "Open tender for a 3-day conference venue, bids due in 3 weeks." },
  { platform: "Google search", query: "best wedding venue Dhaka 1500 guests", url: "https://www.google.com/search?q=wedding+venue+dhaka", signal: "Wedding page lists a winter date and ‘looking for a hall’." },
];
const WEB_TRACES: LeadTrace[] = [
  { landingPage: "/venues/noboratri", formPage: "/booking", utmSource: "google", utmMedium: "cpc", utmCampaign: "wedding-winter-26", referrer: "google.com", device: "Mobile" },
  { landingPage: "/", formPage: "/booking", utmSource: "facebook", utmMedium: "paid-social", utmCampaign: "corporate-q1", referrer: "facebook.com", device: "Mobile" },
  { landingPage: "/expo-zone", formPage: "/booking", utmSource: "linkedin", utmMedium: "social", utmCampaign: "expo-2027", referrer: "linkedin.com", device: "Desktop" },
  { landingPage: "/venues", formPage: "/booking", referrer: "Direct visit", device: "Desktop" },
  { landingPage: "/services/catering", formPage: "/booking", utmSource: "google", utmMedium: "organic", referrer: "google.com", device: "Tablet" },
];
const CHANNELS: ManualChannel[] = ["Phone call", "Walk-in", "Referral", "Expo / event", "Social media"];
const REFERRERS = ["Rahim Group", "Past client: Sadia Islam", "Bashundhara HQ", "Event planner: Dream Weavers"];

const NEXT_ACTIONS: Record<LeadStage, string[]> = {
  discover: ["First call to qualify", "Send ICCB brochure", "Find decision maker"],
  interested: ["Share hall options & rates", "Send WhatsApp follow-up", "Book a site visit"],
  appraisal: ["Send quotation", "Site visit with client", "Revise menu & price"],
  confirmed: ["Collect advance payment", "Send contract", "Final PPM call"],
  customer: ["Hand over to operations"],
};

const AREAS = ["Gulshan", "Banani", "Motijheel", "Tejgaon", "Uttara", "Dhanmondi", "Baridhara"];
const HALL_IDS = ["noboratri", "rajdarshan", "gulnaksha", "pushpoguchcho", "pushpanjali"];
type Ctx = { name: string; org?: string; guests: number; hallId: string; value: number; i: number };
type Tpl = Omit<LeadStepLog, "id" | "stage" | "at" | "by" | "byId">;

/** Sample work for each step, so the journey reads like real sales work. */
const STEP_WORK: Record<LeadStage, ((c: Ctx) => Tpl)[]> = {
  discover: [
    (c) => ({ action: "First call", mode: "Phone call", metWith: c.name, outcome: "positive", note: `Introduced ICCB and checked the event plan. Confirmed about ${c.guests.toLocaleString("en-IN")} guests.`, clientSaid: "Still comparing venues, asked us to send details." }),
    (c) => ({ action: "WhatsApp message", mode: "WhatsApp", metWith: c.name, outcome: "neutral", note: "Sent the ICCB brochure and hall photos on WhatsApp." }),
  ],
  interested: [
    (c) => ({ action: c.org ? "Office visit" : "Client meeting", mode: "Visited client", place: c.org ? `${c.org} office, ${AREAS[c.i % AREAS.length]}` : `Client's home, ${AREAS[c.i % AREAS.length]}`, metWith: c.org ? `${c.name} and the events team` : `${c.name} and family`, outcome: "positive", note: "Walked through hall options, packages and catering menus with printed brochure.", clientSaid: "Wants a weekend evening. Asked about parking, stage size and decoration." }),
    () => ({ action: "Shared hall options & rates", mode: "Email", outcome: "neutral", note: "Emailed two hall options with weekend and weekday rates." }),
  ],
  appraisal: [
    (c) => ({ action: "Site visit at ICCB", mode: "Met at ICCB", place: "ICCB, Kuril", hallIds: [c.hallId, HALL_IDS[(HALL_IDS.indexOf(c.hallId) + 1) % HALL_IDS.length]], metWith: c.name, outcome: "positive", note: "Showed the halls, stage, green room, kitchen and parking. Checked the guest flow from the entrance.", clientSaid: "Liked the first hall. Wants to see decoration samples." }),
    (c) => ({ action: "Sent quotation", mode: "Email", amount: c.value, outcome: "neutral", note: "Quotation for hall rent, dinner and service charge sent by email." }),
  ],
  confirmed: [
    (c) => ({ action: "Advance requested", mode: "Phone call", metWith: c.name, amount: Math.round(c.value * 0.3), outcome: "positive", note: "Date is held. Asked for 30% advance to lock the booking." }),
    () => ({ action: "Contract sent", mode: "Email", outcome: "neutral", note: "Sent the booking contract and payment details." }),
  ],
  customer: [
    () => ({ action: "Handed over to operations", mode: "Met at ICCB", place: "ICCB, Kuril · Operations office", outcome: "positive", note: "Advance received. Arranged the PPM meeting with the operations team." }),
  ],
};

function sampleJourney(c: Ctx, stageAt: Lead["stageAt"], reachedUpTo: number, ownerIds: string[], lost: string | undefined): LeadStepLog[] {
  const out: LeadStepLog[] = [];
  const now = Date.now();
  LEAD_STAGES.slice(0, reachedUpTo + 1).forEach((s, k) => {
    const start = new Date(stageAt[s] ?? new Date()).getTime();
    const tpls = STEP_WORK[s];
    // Earlier steps get the full set; the current step one or two updates.
    const n = k < reachedUpTo ? tpls.length : 1 + ((c.i + k) % tpls.length);
    tpls.slice(0, n).forEach((t, j) => {
      const who = ownerIds.length ? ownerIds[(j + k) % ownerIds.length] : "u-admin";
      out.push({ id: `js-${c.i}-${k}-${j}`, stage: s, at: new Date(Math.min(now - 3600_000, start + (j + 1) * 5 * 3600_000)).toISOString(), byId: who, by: OWNER_NAMES[who] ?? "Admin", ...t(c) });
    });
  });
  if (lost) {
    const s = LEAD_STAGES[reachedUpTo];
    const who = ownerIds[0] ?? "u-admin";
    out.push({ id: `js-${c.i}-lost`, stage: s, at: new Date(now - 2 * 86400_000).toISOString(), byId: who, by: OWNER_NAMES[who] ?? "Admin", action: "Follow-up call", mode: "Phone call", metWith: c.name, outcome: "negative", note: `Client is not going ahead: ${lost.toLowerCase()}.` });
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

function sourceFor(i: number): LeadSource {
  return i % 5 < 2 ? "ai" : i % 5 < 4 ? "website" : "manual";
}

export const leadsSeed = (): Lead[] =>
  ROWS.map((r, i) => {
    const [name, org, eventName, eventType, guests, hallId, valueLakh] = r;
    const stage = FINAL[ORDER.indexOf(i)];
    const idx = LEAD_STAGES.indexOf(stage);
    const source = sourceFor(i);
    const createdDays = 6 + ((i * 7) % 55);
    // Lost leads: some that stalled before becoming customers.
    const lost = stage !== "customer" && i % 4 === 1;
    // Some fresh leads have no owner yet; bigger deals are shared by two reps.
    const ownerIds: string[] = stage === "discover" && i % 3 === 0 ? [] : valueLakh >= 15 ? [OWNERS[i % 3], OWNERS[(i + 1) % 3]] : [OWNERS[i % 3]];
    const owner = ownerIds.length ? ownerIds.map((o) => OWNER_NAMES[o]).join(", ") : undefined;

    const trace: LeadTrace =
      source === "ai"
        ? { ...AI_TRACES[i % AI_TRACES.length], score: 62 + ((i * 13) % 36) }
        : source === "website"
          ? { ...WEB_TRACES[i % WEB_TRACES.length], device: (WEB_TRACES[i % WEB_TRACES.length].device ?? "Mobile") as Device, bookingRef: `ICCB-${String(120 + i).padStart(4, "0")}` }
          : { channel: CHANNELS[i % CHANNELS.length], referredBy: CHANNELS[i % CHANNELS.length] === "Referral" ? REFERRERS[i % REFERRERS.length] : undefined, addedBy: ownerIds.length ? OWNER_NAMES[ownerIds[0]] : "Admin" };

    // Stage dates walk forward from creation.
    const stageAt: Lead["stageAt"] = {};
    const activity: LeadActivity[] = [];
    const by0 = source === "website" ? "Website" : source === "ai" ? "AI search" : (trace.addedBy ?? "Admin");
    activity.push({ at: iso(createdDays, 2), by: by0, kind: "created", text: source === "ai" ? `Found on ${trace.platform}` : source === "website" ? "Booking form submitted on the website" : `Added manually (${trace.channel})` });
    let d = createdDays;
    LEAD_STAGES.slice(0, idx + 1).forEach((s, k) => {
      if (k > 0) d = Math.max(1, d - (2 + ((i + k) % 6)));
      stageAt[s] = iso(d, k);
      if (k === 0 && owner) activity.push({ at: iso(d, 1), by: "Admin", kind: "assign", text: `Assigned to ${owner}` });
      if (k > 0) activity.push({ at: iso(d, k), by: ownerIds.length ? OWNER_NAMES[ownerIds[0]] : "Admin", kind: "stage", text: s === "customer" ? "Became a customer: booking marked Booked" : `Moved to ${LEAD_STAGE_LABELS[s]}` });
    });
    if (idx >= 1) activity.push({ at: iso(Math.max(0, d - 1), 3), by: ownerIds.length ? OWNER_NAMES[ownerIds[0]] : "Admin", kind: "call", text: "Called the client — interested in a weekend date." });
    if (lost) activity.push({ at: iso(Math.max(0, d - 1)), by: ownerIds.length ? OWNER_NAMES[ownerIds[0]] : "Admin", kind: "lost", text: "Marked lost: " + ["Price too high", "Chose another venue", "No response", "Date not available"][i % 4] });

    const lostReason = lost ? ["Price too high", "Chose another venue", "No response", "Date not available"][i % 4] : undefined;
    const journey = sampleJourney({ name, org, guests, hallId, value: Math.round(valueLakh * 100_000), i }, stageAt, idx, ownerIds, lostReason);
    const open = !lost && stage !== "customer";
    const nextOffset = ((i * 5) % 9) - 3; // some overdue, some upcoming
    return {
      isSample: true,
      id: `ld-${i + 1}`,
      code: `LD-${String(i + 1).padStart(4, "0")}`,
      createdAt: iso(createdDays, 2),
      name,
      organization: org,
      mobile: `01${7 + (i % 3)}${String(10000000 + i * 1234567).slice(-8)}`.replace(/^(\d{5})/, "$1-"),
      email: org ? `${name.split(" ").slice(-1)[0].toLowerCase()}@${org.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10)}.example` : undefined,
      eventName,
      eventType,
      guests,
      hallId,
      eventDate: day(30 + ((i * 11) % 200)),
      value: Math.round(valueLakh * 100_000),
      source,
      trace,
      stage,
      stageAt,
      ownerIds,
      // Confirmed leads hold a reserved booking; customers' bookings are Booked.
      bookingRef: idx >= 3 ? (trace.bookingRef ?? `ICCB-${String(300 + i).padStart(4, "0")}`) : undefined,
      lost: lost || undefined,
      lostReason,
      nextAt: open ? day(nextOffset) : undefined,
      nextAction: open ? NEXT_ACTIONS[stage][i % NEXT_ACTIONS[stage].length] : undefined,
      activity: activity.reverse(),
      journey,
    };
  });
