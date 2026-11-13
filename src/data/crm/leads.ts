import type { Lead, LeadStage, Source } from "@/types/crm";
import { base, int, isoFromToday, daysFromToday, pick, rng } from "./_helpers";

const r = rng(7);
const NAMES = ["Meghna Textiles", "Padma Bank PLC", "Dhaka Fashion Week", "Bengal Auto Show", "Green Energy Summit", "Nadia & Arif Wedding", "Royal Pharma AGM", "Teesta Tech Conference", "Education Fair BD", "Sufi Night Live", "Build Bangladesh 2027", "Agro Expo Dhaka", "Rupsha Builders Gala", "Kushiara Telecom Launch", "Shaheen Family Reception", "Global Garments Summit", "Medical Devices Expo", "Startup Dhaka Demo Day", "Hasan Family Wedding", "Coastal Tourism Fair", "Solar Bangladesh Expo", "Jute Products Fair", "IT Career Fair", "Bridal Couture Show"];
const SOURCES: Source[] = ["website", "chatbot", "whatsapp", "phone", "radar", "referral", "walk_in"];
const STAGES: LeadStage[] = ["new", "new", "contacted", "contacted", "meeting", "meeting", "confirmed", "lost"];
const REPS = ["u-se1", "u-se2", "u-se3"];
const LOST = ["Budget too high", "Chose another venue", "Date not available", "Event postponed", "No response"];

export const leadsSeed: Lead[] = NAMES.map((name, i) => {
  const stage = STAGES[i % STAGES.length];
  const ago = int(r, 0, 60);
  const score = stage === "lost" ? int(r, 20, 50) : int(r, 35, 98);
  const source = SOURCES[i % SOURCES.length];
  return {
    ...base(`lead-${i + 1}`, { isSample: true, createdAt: isoFromToday(-ago, 10) }),
    name: `${pick(r, ["Arif", "Nadia", "Kamal", "Sabrina", "Tanim", "Rumana"])} ${pick(r, ["Hossain", "Rahman", "Karim", "Ahmed"])}`,
    organization: name,
    mobile: `017${int(r, 10000000, 99999999)}`,
    email: `contact${i + 1}@example.com`,
    source,
    stage,
    score,
    eventType: pick(r, ["Wedding", "Conference", "Trade Fair", "Concert", "Corporate", "Exhibition"]),
    expectedDate: daysFromToday(int(r, 20, 240)),
    guests: int(r, 2, 60) * 100,
    value: int(r, 4, 60) * 50000,
    assignedTo: stage === "new" && i % 3 === 0 ? undefined : REPS[i % 3],
    lostReason: stage === "lost" ? pick(r, LOST) : undefined,
    firstResponseAt: stage === "new" ? undefined : isoFromToday(-ago, 10 + int(r, 0, 3)),
  };
});
