import type { AnalyticsEvent } from "@/types/crm";
import { base, int, isoFromToday, pick, rng } from "./_helpers";

const r = rng(99);
const PAGES = ["/", "/venues", "/venues/gulnaksha", "/venues/noboratri", "/booking", "/menu", "/expo-zone", "/services", "/gallery", "/contact"];
const SOURCES: AnalyticsEvent["source"][] = ["Google", "Google", "Google", "Facebook", "Facebook", "Direct", "Direct", "Instagram", "LinkedIn", "Referral", "Email"];
const COUNTRIES = ["Bangladesh", "Bangladesh", "Bangladesh", "Bangladesh", "India", "UAE", "Saudi Arabia", "USA", "UK", "China", "Malaysia"];
const LANGS: AnalyticsEvent["language"][] = ["en", "en", "bn", "bn", "bn", "ar", "zh"];
const HALLS = ["hall-1", "hall-2", "hall-3", "hall-4", "hall-5", "expo-a", "expo-b"];
const KNOWN = ["Shahriar Alam", "Mithila Rahman", "Kazi Fahim", "Afsana Mimi", "Omar Al-Farsi"];

/** ~1,400 events across 90 days shaped as a funnel. */
export const analyticsEventsSeed: AnalyticsEvent[] = (() => {
  const out: AnalyticsEvent[] = [];
  let n = 0;
  for (let day = 89; day >= 0; day--) {
    const visits = int(r, 9, 18) + (day < 30 ? 4 : 0);
    for (let v = 0; v < visits; v++) {
      const visitorId = `v${day}-${v}`;
      const source = pick(r, SOURCES);
      const device = r() < 0.62 ? "Mobile" : r() < 0.85 ? "Desktop" : "Tablet";
      const country = pick(r, COUNTRIES);
      const language = pick(r, LANGS);
      const known = r() < 0.05 ? pick(r, KNOWN) : undefined;
      const hallCode = pick(r, HALLS);
      const at = isoFromToday(-day, int(r, 8, 23));
      const ev = (type: AnalyticsEvent["type"], page: string): AnalyticsEvent => ({
        ...base(`ae-${++n}`, { isSample: true, createdAt: at }),
        type, page, source, device, country, language, visitorId, leadName: known, hallCode, at,
      });
      out.push(ev("visit", pick(r, PAGES)));
      if (r() < 0.55) out.push(ev("venue_view", `/venues/${hallCode}`));
      else continue;
      if (r() < 0.45) out.push(ev("availability_check", "/booking"));
      else continue;
      if (r() < 0.55) out.push(ev("estimate", "/booking"));
      else continue;
      if (r() < 0.4) out.push(ev("booking_form", "/booking"));
      else continue;
      if (r() < 0.35) out.push(ev("confirmed", "/thank-you"));
    }
  }
  return out;
})();
