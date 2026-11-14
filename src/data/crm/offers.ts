import type { Offer, OfferRecipient, OfferSegment } from "@/types/crm";
import { base, daysFromToday, isoFromToday } from "./_helpers";
import { leadsSeed } from "./leads";
import { enquiriesSeed } from "./enquiries";

const S = { isSample: true };

export const OFFER_TEMPLATE_EN =
  "Dear {name}, ICCB has special dates at {hall} on {dates}. Book now and save {discount} with code {code}. Call {repPhone} to hold your date.";
export const OFFER_TEMPLATE_BN =
  "প্রিয় {name}, ICCB-এর {hall}-এ {dates} তারিখে বিশেষ অফার। কোড {code} ব্যবহার করে {discount} সাশ্রয় করুন। তারিখ হোল্ড করতে কল করুন {repPhone}।";

export const OFFER_ENDED_ID = "offer-ended";

export const offersSeed: Offer[] = [
  {
    ...base("offer-draft", { ...S, createdAt: isoFromToday(-1, 11) }),
    code: "ICCB-WKD10",
    name: "Weekday corporate days",
    halls: ["hall-3", "hall-5"],
    dates: [daysFromToday(16), daysFromToday(17), daysFromToday(23), daysFromToday(24)],
    discountType: "percent",
    discountValue: 10,
    validUntil: daysFromToday(14),
    audience: ["past_clients", "radar"],
    messageEn: OFFER_TEMPLATE_EN,
    messageBn: OFFER_TEMPLATE_BN,
    status: "draft",
    createdBy: "u-mkt",
    stats: { sent: 0, responded: 0, booked: 0, revenue: 0 },
  },
  {
    ...base("offer-active", { ...S, createdAt: isoFromToday(-6, 10) }),
    code: "ICCB-WED15",
    name: "Wedding season fill-in",
    halls: ["hall-1", "hall-2"],
    dates: [daysFromToday(9), daysFromToday(10), daysFromToday(30), daysFromToday(31)],
    discountType: "percent",
    discountValue: 15,
    validUntil: daysFromToday(8),
    audience: ["lost_leads", "enquiries"],
    messageEn: OFFER_TEMPLATE_EN,
    messageBn: OFFER_TEMPLATE_BN,
    status: "active",
    createdBy: "u-mkt",
    approvedBy: "Tanvir Hasan",
    stats: { sent: 6, responded: 2, booked: 0, revenue: 0 },
  },
  {
    ...base(OFFER_ENDED_ID, { ...S, createdAt: isoFromToday(-40, 10) }),
    code: "ICCB-MON50K",
    name: "Monsoon weekday ৳50K off",
    halls: ["hall-4"],
    dates: [daysFromToday(-20), daysFromToday(-19), daysFromToday(25)],
    discountType: "amount",
    discountValue: 50000,
    validUntil: daysFromToday(-10),
    audience: ["past_clients", "repeat"],
    messageEn: OFFER_TEMPLATE_EN,
    messageBn: OFFER_TEMPLATE_BN,
    status: "ended",
    createdBy: "u-mkt",
    approvedBy: "Tanvir Hasan",
    stats: { sent: 8, responded: 3, booked: 1, revenue: 0 },
  },
];

const rec = (id: string, offerId: string, name: string, mobile: string, source: OfferSegment, sentAgo?: number, responded?: boolean, bookingId?: string): OfferRecipient => ({
  ...base(id, { ...S, createdAt: isoFromToday(-(sentAgo ?? 0), 10) }),
  offerId,
  contactName: name,
  mobile,
  source,
  sentAt: sentAgo !== undefined ? isoFromToday(-sentAgo, 11) : undefined,
  respondedAt: responded && sentAgo !== undefined ? isoFromToday(-sentAgo + 1, 15) : undefined,
  bookingId,
});

const lost = leadsSeed.filter((l) => l.stage === "lost");
const enq = enquiriesSeed.filter((e) => e.status !== "converted");

export const offerRecipientsSeed: OfferRecipient[] = [
  ...lost.slice(0, 3).map((l, i) => rec(`orc-a${i}`, "offer-active", l.name, l.mobile, "lost_leads", 5, i === 0)),
  ...enq.slice(0, 3).map((e, i) => rec(`orc-b${i}`, "offer-active", e.name, e.mobile, "enquiries", 4, i === 1)),
  ...Array.from({ length: 8 }, (_, i) => rec(`orc-c${i}`, OFFER_ENDED_ID, ["Habib Rahman", "Nabila Karim", "Tariq Ahmed", "Anika Haque", "Rezaul Islam", "Sumaiya Kabir", "Mizanur Sarker", "Tanjila Akter"][i], `0171500${String(1000 + i)}`, i % 2 ? "repeat" : "past_clients", 38, i < 3, i === 0 ? "__ENDED_BOOKING__" : undefined)),
];
