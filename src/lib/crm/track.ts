"use client";
import type { AnalyticsEvent } from "@/types/crm";
import { db } from "./db";
import { getVisitorId } from "@/lib/analytics/tracker";

const CONSENT_KEY = "iccb_analytics_consent";

function device(): AnalyticsEvent["device"] {
  const w = window.innerWidth;
  return w < 768 ? "Mobile" : w < 1100 ? "Tablet" : "Desktop";
}

function source(): AnalyticsEvent["source"] {
  const utm = new URLSearchParams(window.location.search).get("utm_source")?.toLowerCase() ?? "";
  const ref = document.referrer.toLowerCase();
  const s = utm || ref;
  if (s.includes("google")) return "Google";
  if (s.includes("facebook") || s.includes("fb.")) return "Facebook";
  if (s.includes("instagram")) return "Instagram";
  if (s.includes("linkedin")) return "LinkedIn";
  if (s.includes("mail")) return "Email";
  if (ref && !ref.includes(window.location.host)) return "Referral";
  return "Direct";
}

/** Map a public venue slug / name to a CRM hall code. */
export function hallCodeFor(slugOrName?: string): string | undefined {
  if (!slugOrName) return undefined;
  const s = slugOrName.toLowerCase().replace(/[^a-z]/g, "");
  return db.halls.all().find((h) => h.name.toLowerCase().replace(/[^a-z]/g, "") === s || h.code === slugOrName)?.code;
}

/**
 * Website → CRM analytics (same browser). Skipped only if the visitor
 * explicitly declined analytics cookies.
 */
export function trackCrm(type: AnalyticsEvent["type"], extra: { hallCode?: string; leadName?: string; page?: string } = {}) {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(CONSENT_KEY) === "false") return;
    const lang = (document.documentElement.lang || "en").slice(0, 2) as AnalyticsEvent["language"];
    db.analytics.create(
      {
        type,
        page: extra.page ?? (window.location.pathname.replace(/^\/(en|bn|ar|zh)(?=\/|$)/, "") || "/"),
        source: source(),
        device: device(),
        country: "Bangladesh",
        language: ["en", "bn", "ar", "zh"].includes(lang) ? lang : "en",
        visitorId: getVisitorId(),
        leadName: extra.leadName,
        hallCode: extra.hallCode,
        at: new Date().toISOString(),
      },
      { silent: true }
    );
  } catch {
    // storage full / blocked — analytics is best-effort
  }
}
