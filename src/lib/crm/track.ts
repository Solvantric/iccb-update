"use client";
import type { AnalyticsType, TrafficSource } from "@/types/crm";
import { db } from "./db";

const CONSENT_KEY = "iccb_analytics_consent";

function source(): TrafficSource {
  const utm = new URLSearchParams(window.location.search).get("utm_source")?.toLowerCase() ?? "";
  const ref = document.referrer.toLowerCase();
  const s = utm || ref;
  if (s.includes("google")) return "Google";
  if (s.includes("facebook") || s.includes("fb.")) return "Facebook";
  if (s.includes("whatsapp") || s.includes("wa.me")) return "WhatsApp";
  if (ref && !ref.includes(window.location.host)) return "Other";
  return "Direct";
}

/** Website → CRM analytics (same browser). Skipped if the visitor declined analytics cookies. */
export function trackCrm(type: AnalyticsType, page?: string) {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(CONSENT_KEY) === "false") return;
    db.analytics.create({ type, source: source(), page: page ?? (window.location.pathname.replace(/^\/(en|bn|ar|zh)(?=\/|$)/, "") || "/") });
  } catch {
    // best-effort
  }
}
