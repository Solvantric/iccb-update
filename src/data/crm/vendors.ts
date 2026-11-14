import type { Vendor } from "@/types/crm";
import { base } from "./_helpers";

const S = { isSample: true };

/** Fake outside vendors. Names match the decorators used in the generated bookings. */
export const vendorsSeed: Vendor[] = [
  { ...base("v-shubho", S), name: "Shubho Decor", type: "decorator", contactPerson: "Rafiul Islam", mobile: "01811000101", email: "shubho@example.com", tradeLicenseNo: "TRAD/DNCC/0145/2025", status: "active", notes: "Reliable for wedding stages." },
  { ...base("v-rongdhonu", S), name: "Rongdhonu Events", type: "decorator", contactPerson: "Mitu Akter", mobile: "01811000102", email: "rongdhonu@example.com", tradeLicenseNo: "TRAD/DNCC/0388/2024", status: "warning", notes: "Late dismantling twice — warned in writing." },
  { ...base("v-golden", S), name: "Golden Touch Decor", type: "decorator", contactPerson: "Sajib Hossain", mobile: "01811000103", status: "active", notes: "" },
  { ...base("v-alo", S), name: "Alo Sound & Light", type: "sound_light", contactPerson: "Partho Das", mobile: "01811000104", email: "alo@example.com", status: "active", notes: "Line array + moving heads." },
  { ...base("v-tarang", S), name: "Tarang Audio Visual", type: "sound_light", contactPerson: "Nabil Khan", mobile: "01811000105", status: "active", notes: "" },
  { ...base("v-utshob", S), name: "Utshob Event Management", type: "event_firm", contactPerson: "Kamal Uddin", mobile: "01811000106", tradeLicenseNo: "TRAD/DSCC/0921/2023", status: "blacklisted", notes: "Fireworks inside Hall-2 and unpaid damage. Blacklisted by Admin." },
  { ...base("v-mezban", S), name: "Mezban Food Stalls", type: "food_stall", contactPerson: "Jahid Hasan", mobile: "01811000107", status: "active", notes: "Food court operator for fairs." },
  { ...base("v-nakshi", S), name: "Nakshi Stage Craft", type: "decorator", contactPerson: "Shapla Rani", mobile: "01811000108", status: "active", notes: "Thematic ceilings (category A)." },
];

export const VENDOR_BY_FIRM: Record<string, string> = Object.fromEntries(vendorsSeed.map((v) => [v.name, v.id]));
